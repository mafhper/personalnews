#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs, sync::Mutex};
use tauri::{AppHandle, Manager, RunEvent};
use tauri_plugin_shell::{process::CommandChild, ShellExt};
use tauri_plugin_opener::OpenerExt;

#[derive(Default)]
struct BackendSidecarState {
    child: Mutex<Option<CommandChild>>,
}

fn start_backend_sidecar(app: &AppHandle) -> Result<(), String> {
    let backend_db_path = resolve_backend_db_path(app)?;
    eprintln!("[desktop] backend db path: {backend_db_path}");
    let command = app
        .shell()
        .sidecar("personalnews-backend")
        .map_err(|e| format!("failed to resolve backend sidecar: {e}"))?
        .env("BACKEND_HOST", "127.0.0.1")
        .env("BACKEND_PORT", "3001")
        .env("BACKEND_DEFAULT_MODE", "on")
        .env("BACKEND_DB_PATH", backend_db_path);

    let (_rx, child) = command
        .spawn()
        .map_err(|e| format!("failed to start backend sidecar: {e}"))?;

    let state = app.state::<BackendSidecarState>();
    let mut guard = state
        .child
        .lock()
        .map_err(|_| "failed to lock backend sidecar state".to_string())?;
    *guard = Some(child);
    Ok(())
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
    let child = match state.child.lock() {
        Ok(mut guard) => guard.take(),
        Err(_) => None,
    };

    if let Some(child) = child {
        let _ = child.kill();
    }
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

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .manage(BackendSidecarState::default())
        .setup(|app| {
            if !cfg!(debug_assertions) {
                if let Err(error) = start_backend_sidecar(app.handle()) {
                    eprintln!("[desktop] backend sidecar start failed: {error}");
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_window_style, open_external_url])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| match event {
        RunEvent::Exit | RunEvent::ExitRequested { .. } => {
            stop_backend_sidecar(app_handle);
        }
        _ => {}
    });
}
