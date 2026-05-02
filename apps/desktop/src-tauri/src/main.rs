#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::{
    fs,
    io::{Read, Write},
    net::{TcpListener, TcpStream},
    path::PathBuf,
    sync::Mutex,
    thread,
    time::{Duration, Instant},
};
use tauri::async_runtime::Receiver;
use tauri::{AppHandle, Emitter, Manager, RunEvent};
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

const BACKEND_HOST: &str = "127.0.0.1";
const BACKEND_READY_EVENT: &str = "backend-ready";
const BACKEND_STATUS_CHANGED_EVENT: &str = "backend-status-changed";

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopBackendStatus {
    generation: u64,
    sidecar_spawned: bool,
    pid: Option<u32>,
    base_url: String,
    port: u16,
    db_path: String,
    token_available: bool,
    health: String,
    diagnostic: String,
    uptime_ms: Option<u64>,
    last_start_error: Option<String>,
    last_health_error: Option<String>,
    last_exit_code: Option<i32>,
}

impl Default for DesktopBackendStatus {
    fn default() -> Self {
        Self {
            generation: 0,
            sidecar_spawned: false,
            pid: None,
            base_url: format!("http://{BACKEND_HOST}:3001"),
            port: 3001,
            db_path: String::new(),
            token_available: false,
            health: "unknown".to_string(),
            diagnostic: "not_started".to_string(),
            uptime_ms: None,
            last_start_error: None,
            last_health_error: None,
            last_exit_code: None,
        }
    }
}

#[derive(Default)]
struct BackendSidecarState {
    child: Mutex<Option<CommandChild>>,
    auth_token: Mutex<Option<String>>,
    status: Mutex<DesktopBackendStatus>,
    generation: Mutex<u64>,
}

fn start_backend_sidecar(app: &AppHandle) -> Result<(), String> {
    let backend_db_path = resolve_backend_db_path(app)?;
    let backend_auth_token = generate_backend_auth_token()?;
    let (port, preferred_port_occupied) = pick_backend_port()?;
    let base_url = format!("http://{BACKEND_HOST}:{port}");
    let state = app.state::<BackendSidecarState>();
    let generation = next_backend_generation(&state)?;
    log_desktop_event(
        app,
        &format!(
            "event=start_requested generation={generation} base_url={base_url} db_path={backend_db_path}"
        ),
    );

    {
        let mut status = state
            .status
            .lock()
            .map_err(|_| "failed to lock backend status state".to_string())?;
        *status = DesktopBackendStatus {
            generation,
            sidecar_spawned: false,
            pid: None,
            base_url: base_url.clone(),
            port,
            db_path: backend_db_path.clone(),
            token_available: true,
            health: "starting".to_string(),
            diagnostic: if preferred_port_occupied {
                "port_occupied".to_string()
            } else {
                "starting".to_string()
            },
            uptime_ms: Some(0),
            last_start_error: None,
            last_health_error: if preferred_port_occupied {
                Some("preferred port 3001 was occupied; selected another local port".to_string())
            } else {
                None
            },
            last_exit_code: None,
        };
    }
    emit_backend_status_changed(app);

    let command = app
        .shell()
        .sidecar("personalnews-backend")
        .map_err(|e| {
            let message = format!("failed to resolve backend sidecar: {e}");
            set_backend_start_error(app, &message, classify_spawn_error(&message));
            message
        })?
        .env("BACKEND_HOST", BACKEND_HOST)
        .env("BACKEND_PORT", port.to_string())
        .env("BACKEND_DEFAULT_MODE", "on")
        .env("BACKEND_AUTH_TOKEN", backend_auth_token.clone())
        .env("BACKEND_DB_PATH", backend_db_path);

    let (rx, child) = command.spawn().map_err(|e| {
        let message = format!("failed to start backend sidecar: {e}");
        set_backend_start_error(app, &message, classify_spawn_error(&message));
        message
    })?;
    let pid = child.pid();

    let mut guard = state
        .child
        .lock()
        .map_err(|_| "failed to lock backend sidecar state".to_string())?;
    *guard = Some(child);
    let mut token_guard = state
        .auth_token
        .lock()
        .map_err(|_| "failed to lock backend auth token state".to_string())?;
    *token_guard = Some(backend_auth_token);

    {
        let mut status = state
            .status
            .lock()
            .map_err(|_| "failed to lock backend status state".to_string())?;
        status.sidecar_spawned = true;
        status.pid = Some(pid);
    }
    emit_backend_status_changed(app);

    log_desktop_event(
        app,
        &format!("event=spawn_succeeded generation={generation} pid={pid} base_url={base_url}"),
    );
    let process_started_at = Instant::now();
    monitor_backend_process(app.clone(), pid, generation, process_started_at, rx);
    monitor_backend_readiness(app.clone(), base_url, pid, generation);
    Ok(())
}

fn next_backend_generation(state: &BackendSidecarState) -> Result<u64, String> {
    let mut guard = state
        .generation
        .lock()
        .map_err(|_| "failed to lock backend generation state".to_string())?;
    *guard = guard.saturating_add(1);
    Ok(*guard)
}

fn is_current_backend_generation(
    app: &AppHandle,
    expected_pid: u32,
    expected_generation: u64,
) -> bool {
    let state = app.state::<BackendSidecarState>();
    state
        .status
        .lock()
        .map(|status| status.pid == Some(expected_pid) && status.generation == expected_generation)
        .unwrap_or(false)
}

fn is_current_backend_ready(app: &AppHandle, expected_pid: u32, expected_generation: u64) -> bool {
    let state = app.state::<BackendSidecarState>();
    state
        .status
        .lock()
        .map(|status| {
            status.pid == Some(expected_pid)
                && status.generation == expected_generation
                && status.health == "ready"
        })
        .unwrap_or(false)
}

fn classify_spawn_error(message: &str) -> &str {
    let lower = message.to_lowercase();
    if lower.contains("not found")
        || lower.contains("no such file")
        || lower.contains("failed to resolve")
        || lower.contains("sidecar")
    {
        "binary_missing"
    } else if lower.contains("access is denied")
        || lower.contains("permission")
        || lower.contains("blocked")
    {
        "spawn_blocked"
    } else {
        "spawn_blocked"
    }
}

fn set_backend_start_error(app: &AppHandle, message: &str, diagnostic: &str) {
    let state = app.state::<BackendSidecarState>();
    if let Ok(mut status) = state.status.lock() {
        status.sidecar_spawned = false;
        status.pid = None;
        status.health = "failed".to_string();
        status.diagnostic = diagnostic.to_string();
        status.last_start_error = Some(message.to_string());
    }
    log_desktop_event(app, message);
    emit_backend_status_changed(app);
}

fn monitor_backend_process(
    app: AppHandle,
    pid: u32,
    generation: u64,
    process_started_at: Instant,
    mut rx: Receiver<CommandEvent>,
) {
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            if !is_current_backend_generation(&app, pid, generation) {
                log_desktop_event(
                    &app,
                    &format!("event=stale_monitor_ignored generation={generation} pid={pid} source=process"),
                );
                break;
            }
            match event {
                CommandEvent::Stdout(line) => {
                    let text = String::from_utf8_lossy(&line);
                    log_backend_event(&app, "stdout", &text);
                    if text.contains("PERSONALNEWS_BACKEND_READY") {
                        mark_backend_ready_from_stdout(&app, pid, generation, process_started_at);
                    }
                }
                CommandEvent::Stderr(line) => {
                    log_backend_event(&app, "stderr", &String::from_utf8_lossy(&line));
                }
                CommandEvent::Error(error) => {
                    log_backend_event(&app, "error", &error);
                }
                CommandEvent::Terminated(payload) => {
                    let message = format!(
                        "backend terminated code={:?} signal={:?}",
                        payload.code, payload.signal
                    );
                    log_backend_event(&app, "terminated", &message);
                    let state = app.state::<BackendSidecarState>();
                    if let Ok(mut status) = state.status.lock() {
                        if status.pid != Some(pid) || status.generation != generation {
                            break;
                        }
                        status.sidecar_spawned = false;
                        status.pid = None;
                        status.health = "failed".to_string();
                        status.diagnostic = "crashed".to_string();
                        status.last_exit_code = payload.code;
                        status.last_health_error = Some(message);
                    }
                    emit_backend_status_changed(&app);
                    let _ = app.emit("backend-failed", get_backend_status_snapshot(&app));
                    break;
                }
                _ => {}
            }
        }
    });
}

fn mark_backend_ready_from_stdout(
    app: &AppHandle,
    pid: u32,
    generation: u64,
    process_started_at: Instant,
) {
    let state = app.state::<BackendSidecarState>();
    let mut base_url: Option<String> = None;
    let uptime_ms = process_started_at.elapsed().as_millis() as u64;

    if let Ok(mut status) = state.status.lock() {
        if status.pid != Some(pid) || status.generation != generation || status.health == "ready" {
            return;
        }
        status.health = "ready".to_string();
        status.diagnostic = "ready".to_string();
        status.uptime_ms = Some(uptime_ms);
        status.last_health_error = None;
        base_url = Some(status.base_url.clone());
    }

    if let Some(base_url) = base_url {
        log_desktop_event(
            app,
            &format!(
                "event=stdout_ready_seen generation={generation} pid={pid} base_url={base_url} uptime_ms={uptime_ms}"
            ),
        );
        emit_backend_status_changed(app);
        let _ = app.emit(BACKEND_READY_EVENT, get_backend_status_snapshot(app));
    }
}

fn monitor_backend_readiness(app: AppHandle, base_url: String, pid: u32, generation: u64) {
    thread::spawn(move || {
        let started = Instant::now();
        let deadline = Duration::from_secs(90);
        let interval = Duration::from_millis(300);
        let mut last_error: Option<String> = None;
        let mut attempt: u64 = 0;

        while started.elapsed() < deadline {
            if !is_current_backend_generation(&app, pid, generation) {
                log_desktop_event(
                    &app,
                    &format!(
                        "event=stale_monitor_ignored generation={generation} pid={pid} source=health"
                    ),
                );
                return;
            }
            if is_current_backend_ready(&app, pid, generation) {
                log_desktop_event(
                    &app,
                    &format!(
                        "event=health_monitor_completed generation={generation} pid={pid} source=already_ready"
                    ),
                );
                return;
            }
            attempt += 1;
            let timeout = Duration::from_millis((300 + attempt * 150).min(1_500));
            if attempt == 1 || attempt % 10 == 0 {
                log_desktop_event(
                    &app,
                    &format!(
                        "event=health_probe_attempt generation={generation} pid={pid} attempt={attempt} base_url={base_url} elapsed_ms={}",
                        started.elapsed().as_millis()
                    ),
                );
            }
            match probe_backend_health(&base_url, timeout) {
                Ok(()) => {
                    let uptime_ms = started.elapsed().as_millis() as u64;
                    set_backend_health(
                        &app,
                        &base_url,
                        pid,
                        generation,
                        "ready",
                        "ready",
                        Some(uptime_ms),
                        None,
                    );
                    log_desktop_event(
                        &app,
                        &format!(
                            "event=health_ready generation={generation} pid={pid} base_url={base_url} uptime_ms={uptime_ms} attempts={attempt}"
                        ),
                    );
                    let _ = app.emit(BACKEND_READY_EVENT, get_backend_status_snapshot(&app));
                    return;
                }
                Err(error) => {
                    last_error = Some(error.clone());
                    set_backend_health(
                        &app,
                        &base_url,
                        pid,
                        generation,
                        "starting",
                        "starting",
                        Some(started.elapsed().as_millis() as u64),
                        Some(error),
                    );
                    thread::sleep(interval);
                }
            }
        }

        let message =
            last_error.unwrap_or_else(|| "backend health did not become ready".to_string());
        set_backend_health(
            &app,
            &base_url,
            pid,
            generation,
            "failed",
            "health_failed",
            Some(started.elapsed().as_millis() as u64),
            Some(message.clone()),
        );
        log_desktop_event(
            &app,
            &format!(
                "event=health_timeout generation={generation} pid={pid} base_url={base_url} error={message}"
            ),
        );
    });
}

fn set_backend_health(
    app: &AppHandle,
    expected_base_url: &str,
    expected_pid: u32,
    expected_generation: u64,
    health: &str,
    diagnostic: &str,
    uptime_ms: Option<u64>,
    last_health_error: Option<String>,
) {
    let state = app.state::<BackendSidecarState>();
    let mut changed = false;
    if let Ok(mut status) = state.status.lock() {
        if status.base_url != expected_base_url
            || status.pid != Some(expected_pid)
            || status.generation != expected_generation
        {
            return;
        }
        if status.health == "ready" && health != "ready" {
            return;
        }
        let next_diagnostic = if status.diagnostic != "port_occupied"
            || diagnostic == "ready"
            || diagnostic == "health_failed"
        {
            diagnostic.to_string()
        } else {
            status.diagnostic.clone()
        };
        changed = status.health != health
            || status.diagnostic != next_diagnostic
            || status.last_health_error != last_health_error;
        status.health = health.to_string();
        status.diagnostic = next_diagnostic;
        status.uptime_ms = uptime_ms;
        status.last_health_error = last_health_error;
    };
    if changed {
        emit_backend_status_changed(app);
    }
}

fn probe_backend_health(base_url: &str, timeout: Duration) -> Result<(), String> {
    let address = base_url
        .strip_prefix("http://")
        .ok_or_else(|| "unsupported backend base url".to_string())?;
    let mut stream = TcpStream::connect_timeout(
        &address
            .parse()
            .map_err(|e| format!("invalid backend socket address: {e}"))?,
        timeout,
    )
    .map_err(|e| format!("connect failed: {e}"))?;
    let _ = stream.set_read_timeout(Some(timeout));
    let _ = stream.set_write_timeout(Some(timeout));
    stream
        .write_all(b"GET /health HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n")
        .map_err(|e| format!("health request failed: {e}"))?;

    let mut response = String::new();
    stream
        .read_to_string(&mut response)
        .map_err(|e| format!("health response failed: {e}"))?;

    if response.starts_with("HTTP/1.1 200") || response.starts_with("HTTP/1.0 200") {
        Ok(())
    } else {
        Err("health returned non-200 status".to_string())
    }
}

fn pick_backend_port() -> Result<(u16, bool), String> {
    let preferred_available = TcpListener::bind((BACKEND_HOST, 3001)).is_ok();
    if preferred_available {
        return Ok((3001, false));
    }

    for port in 3001..=3015 {
        if TcpListener::bind((BACKEND_HOST, port)).is_ok() {
            return Ok((port, true));
        }
    }

    let listener = TcpListener::bind((BACKEND_HOST, 0))
        .map_err(|e| format!("failed to allocate backend port: {e}"))?;
    listener
        .local_addr()
        .map(|addr| (addr.port(), true))
        .map_err(|e| format!("failed to read allocated backend port: {e}"))
}

fn desktop_log_path(app: &AppHandle) -> Option<PathBuf> {
    let dir = app.path().app_local_data_dir().ok()?;
    let _ = fs::create_dir_all(&dir);
    Some(dir.join("personalnews-desktop.log"))
}

fn log_desktop_event(app: &AppHandle, message: &str) {
    eprintln!("[desktop] {message}");
    if let Some(path) = desktop_log_path(app) {
        let line = format!("{} {message}\n", chrono_like_now());
        let _ = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)
            .and_then(|mut file| file.write_all(line.as_bytes()));
    }
}

fn backend_log_path(app: &AppHandle) -> Option<PathBuf> {
    let dir = app.path().app_local_data_dir().ok()?;
    let _ = fs::create_dir_all(&dir);
    Some(dir.join("personalnews-backend.log"))
}

fn log_backend_event(app: &AppHandle, stream: &str, message: &str) {
    let safe_message = message.trim();
    if safe_message.is_empty() {
        return;
    }
    if let Some(path) = backend_log_path(app) {
        let line = format!("{} [{stream}] {safe_message}\n", chrono_like_now());
        let _ = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)
            .and_then(|mut file| file.write_all(line.as_bytes()));
    }
}

fn frontend_log_path(app: &AppHandle) -> Option<PathBuf> {
    let dir = app.path().app_local_data_dir().ok()?;
    let _ = fs::create_dir_all(&dir);
    Some(dir.join("personalnews-frontend.log"))
}

fn log_frontend_event(app: &AppHandle, message: &str, payload: Option<&str>) {
    if let Some(path) = frontend_log_path(app) {
        let safe_payload = payload.unwrap_or("").replace('\n', "\\n");
        let line = format!("{} message={} payload={}\n", chrono_like_now(), message, safe_payload);
        let _ = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)
            .and_then(|mut file| file.write_all(line.as_bytes()));
    }
}

fn chrono_like_now() -> String {
    format!("{:?}", std::time::SystemTime::now())
}

fn generate_backend_auth_token() -> Result<String, String> {
    let mut bytes = [0_u8; 32];
    getrandom::getrandom(&mut bytes)
        .map_err(|e| format!("failed to generate backend auth token: {e}"))?;
    Ok(bytes.iter().map(|byte| format!("{byte:02x}")).collect())
}

fn resolve_backend_db_path(app: &AppHandle) -> Result<String, String> {
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("failed to resolve app data dir: {e}"))?;
    let backend_data_dir = app_data_dir.join("backend");
    fs::create_dir_all(&backend_data_dir)
        .map_err(|e| format!("failed to create backend data dir: {e}"))?;
    let db_path = backend_data_dir.join("personalnews.db");
    Ok(db_path.to_string_lossy().into_owned())
}

fn stop_backend_sidecar(app: &AppHandle) {
    let state = app.state::<BackendSidecarState>();
    let generation = next_backend_generation(&state).ok();
    let previous_pid = state.status.lock().ok().and_then(|status| status.pid);
    log_desktop_event(
        app,
        &format!(
            "event=stop_requested generation={} pid={}",
            generation.unwrap_or_default(),
            previous_pid
                .map(|pid| pid.to_string())
                .unwrap_or_else(|| "none".to_string())
        ),
    );

    if let Ok(mut status) = state.status.lock() {
        if let Some(generation) = generation {
            status.generation = generation;
        }
        status.health = "restarting".to_string();
        status.diagnostic = "starting".to_string();
        status.last_health_error = None;
        status.last_start_error = None;
    }
    emit_backend_status_changed(app);

    let child = match state.child.lock() {
        Ok(mut guard) => guard.take(),
        Err(_) => None,
    };

    if let Some(child) = child {
        let _ = child.kill();
    }

    if let Ok(mut status) = state.status.lock() {
        status.sidecar_spawned = false;
        status.pid = None;
    };
    log_desktop_event(
        app,
        &format!(
            "event=stop_completed generation={} pid={}",
            generation.unwrap_or_default(),
            previous_pid
                .map(|pid| pid.to_string())
                .unwrap_or_else(|| "none".to_string())
        ),
    );
    emit_backend_status_changed(app);
}

#[tauri::command]
fn set_window_style(app: AppHandle, style: String) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;

    match style.as_str() {
        "frameless_thin" => {
            window
                .set_decorations(false)
                .map_err(|e| format!("failed to set frameless window: {e}"))?;
            let _ = window.set_resizable(true);
            let _ = window.set_shadow(true);
        }
        _ => {
            window
                .set_decorations(true)
                .map_err(|e| format!("failed to set native window: {e}"))?;
            let _ = window.set_shadow(true);
        }
    }

    let _ = window.eval(
        "document.documentElement.style.setProperty('--desktop-window-border-width', '1px');",
    );

    Ok(())
}

#[tauri::command]
fn open_external_url(app: AppHandle, url: String) -> Result<(), String> {
    let parsed = url
        .parse::<url::Url>()
        .map_err(|e| format!("invalid url: {e}"))?;

    let scheme = parsed.scheme();
    if scheme != "http" && scheme != "https" && scheme != "mailto" && scheme != "tel" {
        return Err("unsupported external url scheme".to_string());
    }

    app.opener()
        .open_url(parsed.to_string(), None::<String>)
        .map_err(|e| format!("failed to open external url: {e}"))?;
    Ok(())
}

#[tauri::command]
fn get_backend_auth_token(app: AppHandle) -> Result<Option<String>, String> {
    let state = app.state::<BackendSidecarState>();
    let guard = state
        .auth_token
        .lock()
        .map_err(|_| "failed to lock backend auth token state".to_string())?;
    Ok(guard.clone())
}

fn get_backend_status_snapshot(app: &AppHandle) -> DesktopBackendStatus {
    let state = app.state::<BackendSidecarState>();
    state
        .status
        .lock()
        .map(|status| status.clone())
        .unwrap_or_default()
}

fn emit_backend_status_changed(app: &AppHandle) {
    let _ = app.emit(
        BACKEND_STATUS_CHANGED_EVENT,
        get_backend_status_snapshot(app),
    );
}

#[tauri::command]
fn get_backend_status(app: AppHandle) -> Result<DesktopBackendStatus, String> {
    Ok(get_backend_status_snapshot(&app))
}

#[tauri::command]
fn append_frontend_log(
    app: AppHandle,
    message: String,
    payload: Option<String>,
) -> Result<(), String> {
    log_frontend_event(&app, &message, payload.as_deref());
    Ok(())
}

#[tauri::command]
fn restart_backend_sidecar(app: AppHandle) -> Result<DesktopBackendStatus, String> {
    log_desktop_event(&app, "event=restart_requested");
    stop_backend_sidecar(&app);
    thread::sleep(Duration::from_millis(500));
    start_backend_sidecar(&app)?;
    Ok(get_backend_status_snapshot(&app))
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .manage(BackendSidecarState::default())
        .setup(|app| {
            if !cfg!(debug_assertions) {
                if let Err(error) = start_backend_sidecar(app.handle()) {
                    if let Ok(mut status) =
                        app.handle().state::<BackendSidecarState>().status.lock()
                    {
                        status.health = "failed".to_string();
                        status.last_start_error = Some(error.clone());
                    }
                    emit_backend_status_changed(app.handle());
                    eprintln!("[desktop] backend sidecar start failed: {error}");
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_window_style,
            open_external_url,
            get_backend_auth_token,
            get_backend_status,
            append_frontend_log,
            restart_backend_sidecar
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| match event {
        RunEvent::Ready => {
            emit_backend_status_changed(app_handle);
            let status = get_backend_status_snapshot(app_handle);
            if status.health == "ready" {
                let _ = app_handle.emit(BACKEND_READY_EVENT, status);
            }
        }
        RunEvent::Exit | RunEvent::ExitRequested { .. } => {
            stop_backend_sidecar(app_handle);
        }
        _ => {}
    });
}
