$ErrorActionPreference = 'Stop'

$tests = @()

function Add-TestResult($name, $passed, $details) {
    $script:tests += [pscustomobject]@{
        Test = $name
        Passed = $passed
        Details = $details
    }
}

try {
    $health = Invoke-RestMethod -Method Get -Uri 'http://localhost:8787/health' -TimeoutSec 12
    Add-TestResult 'GET /health' ($health.ok -eq $true) ("stateBackend={0}" -f $health.stateBackend)
} catch {
    Add-TestResult 'GET /health' $false $_.Exception.Message
}

$authEmail = ('smoke-{0}@example.com' -f [DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
$authPassword = 'smoke1234'

try {
    $registerPayload = @{
        name = 'Smoke Test User'
        email = $authEmail
        password = $authPassword
    } | ConvertTo-Json
    $register = Invoke-RestMethod -Method Post -Uri 'http://localhost:8787/auth/register' -ContentType 'application/json' -Body $registerPayload -TimeoutSec 12
    Add-TestResult 'POST /auth/register' ($register.ok -eq $true) ("email={0}" -f $authEmail)
} catch {
    Add-TestResult 'POST /auth/register' $false $_.Exception.Message
}

try {
    $loginPayload = @{
        email = $authEmail
        password = $authPassword
    } | ConvertTo-Json
    $login = Invoke-RestMethod -Method Post -Uri 'http://localhost:8787/auth/login' -ContentType 'application/json' -Body $loginPayload -TimeoutSec 12
    Add-TestResult 'POST /auth/login' ($login.ok -eq $true) ("userId={0}" -f $login.user.id)
} catch {
    Add-TestResult 'POST /auth/login' $false $_.Exception.Message
}

try {
    $resetPayload = @{ email = $authEmail } | ConvertTo-Json
    $reset = Invoke-RestMethod -Method Post -Uri 'http://localhost:8787/auth/request-password-reset' -ContentType 'application/json' -Body $resetPayload -TimeoutSec 12
    Add-TestResult 'POST /auth/request-password-reset' ($reset.ok -eq $true) ($reset.message)
} catch {
    Add-TestResult 'POST /auth/request-password-reset' $false $_.Exception.Message
}

$tests | Format-Table -AutoSize | Out-String | Write-Output

if (($tests | Where-Object { -not $_.Passed }).Count -gt 0) {
    exit 1
}

Write-Output 'Smoke tests passed.'
