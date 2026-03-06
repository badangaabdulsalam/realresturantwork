$ErrorActionPreference = 'Stop'

$workspaceRoot = Split-Path -Parent $PSScriptRoot
Set-Location $workspaceRoot

$nodePath = 'C:\Program Files\nodejs\node.exe'
if (-not (Test-Path $nodePath)) {
    throw "Node executable not found at '$nodePath'. Install Node.js LTS first."
}

$existing = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -like '*payment-verification-server.js*' -or $_.CommandLine -like '*frontend-static-server.js*' }

foreach ($proc in $existing) {
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
}

$backend = Start-Process -FilePath $nodePath -ArgumentList '.\server\payment-verification-server.js' -WorkingDirectory $workspaceRoot -PassThru
$frontend = Start-Process -FilePath $nodePath -ArgumentList '.\server\frontend-static-server.js' -WorkingDirectory $workspaceRoot -PassThru

$pids = [ordered]@{
    backendPid = $backend.Id
    frontendPid = $frontend.Id
    startedAt = (Get-Date).ToString('o')
}

$pids | ConvertTo-Json | Set-Content -Path '.\server\local-dev-pids.json' -Encoding UTF8

Write-Output "Backend started: PID=$($backend.Id) | http://localhost:8787"
Write-Output "Frontend started: PID=$($frontend.Id) | http://localhost:8080"
Write-Output 'Tip for phone: open http://<YOUR_PC_LAN_IP>:8080 on same Wi-Fi.'
