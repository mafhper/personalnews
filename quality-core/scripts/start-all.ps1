# quality-core/scripts/start-all.ps1
# Workflow Completo: Limpeza -> Verificação -> Build -> Lançamento
# Uso: bun run system:start [dev|preview]

param (
    [string]$Mode = "dev"
)

# Forçar interrupção em erros de cmdlets
$ErrorActionPreference = "Stop"

# Função auxiliar para rodar comandos externos e garantir que o script pare em falhas
function Run-Command {
    param (
        [string]$Command,
        [string]$Label
    )
    Write-Host "   -> $Label..." -ForegroundColor Cyan
    
    # Executa o comando e captura o erro se houver
    Invoke-Expression $Command
    
    # Verifica o código de saída do último comando externo
    if ($LASTEXITCODE -ne 0) {
        throw "O comando '$Label' falhou com código de saída $LASTEXITCODE."
    }
}

try {
    $psExe = if (Get-Command pwsh -ErrorAction SilentlyContinue) { "pwsh" } else { "powershell" }
    $appCommand = if ($Mode -eq "preview") { "bun run preview" } else { "bun run dev" }
    $appLabel = if ($Mode -eq "preview") { "PREVIEW" } else { "DEV" }

    Write-Host "`n🧹 [1/4] Limpando processos antigos..." -ForegroundColor Cyan
    & $psExe -NoProfile -File quality-core/scripts/cleanup-servers.ps1

    Write-Host "`n🔍 [2/4] Verificando integridade do código..." -ForegroundColor Cyan
    # Quiet flags to reduce noise and focus on actual errors
    Run-Command "bun run lint --quiet" "Linting"
    Run-Command "bun run type-check" "Type-checking"
    Run-Command "bun run test:all" "Core Tests"

    Write-Host "`n🏗️ [3/4] Gerando builds de produção..." -ForegroundColor Cyan
    Run-Command "bun run build" "Main App Build"
    Run-Command "bun run build:dashboard" "Dashboard Build"

    Write-Host "`n🚀 [4/4] Lançando servidores em novos terminais ($appLabel)..." -ForegroundColor Cyan

    # Terminal 1: App (Dev ou Preview) - USANDO -NoProfile
    Start-Process $psExe -ArgumentList "-NoProfile", "-NoExit", "-Command", "Write-Host '--- APP $appLabel SERVER ---' -ForegroundColor Green; $appCommand"

    # Terminal 2: Dashboard Server - USANDO -NoProfile
    Start-Process $psExe -ArgumentList "-NoProfile", "-NoExit", "-Command", "Write-Host '--- QUALITY CORE DASHBOARD ---' -ForegroundColor Blue; bun run dashboard"

    Write-Host "`n✅ Sistema pronto! Terminais abertos separadamente." -ForegroundColor Green
    Write-Host "🔗 App: http://localhost:5173"
    Write-Host "🔗 Dashboard: http://localhost:3334`n"

} catch {
    Write-Host "`n❌ ERRO CRÍTICO: O processo foi interrompido." -ForegroundColor Red
    Write-Host "Detalhes: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Corrija os erros acima antes de tentar novamente.`n" -ForegroundColor Gray
    exit 1
}
