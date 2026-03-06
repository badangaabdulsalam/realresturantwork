$ErrorActionPreference = 'Stop'

$workspaceRoot = Split-Path -Parent $PSScriptRoot
Set-Location $workspaceRoot

$pidsFile = '.\server\local-dev-pids.json'
if (Test-Path $pidsFile) {
    $pids = Get-Content $pidsFile -Raw | ConvertFrom-Json
    foreach ($pidValue in @($pids.backendPid, $pids.frontendPid)) {
        if ($pidValue) {
            Stop-Process -Id ([int]$pidValue) -Force -ErrorAction SilentlyContinue
            Write-Output "Stopped PID=$pidValue"
        }
    }
    Remove-Item $pidsFile -ErrorAction SilentlyContinue
}

$extra = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -like '*payment-verification-server.js*' -or $_.CommandLine -like '*frontend-static-server.js*' }

foreach ($proc in $extra) {
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Output "Stopped PID=$($proc.ProcessId)"
}

Write-Output 'Local dev servers stopped.'
