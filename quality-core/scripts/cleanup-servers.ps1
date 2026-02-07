# quality-core/scripts/cleanup-servers.ps1
# Mata processos do Vite e do Dashboard que ficaram rodando

$processes = Get-Process bun -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like '*vite*' -or 
    $_.CommandLine -like '*dashboard-server*' 
}

if ($processes) {
    Write-Host "Encerrando $($processes.Count) processos de servidor..." -ForegroundColor Yellow
    $processes | Stop-Process -Force
    Write-Host "Servidores encerrados com sucesso." -ForegroundColor Green
} else {
    Write-Host "Nenhum servidor em execução encontrado." -ForegroundColor Gray
}
