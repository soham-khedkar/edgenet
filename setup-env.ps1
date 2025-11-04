# EdgeNet - Environment Setup Script

Write-Host "🚀 EdgeNet Environment Setup" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

$envFile = "d:\testnet\.env"

if (Test-Path $envFile) {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Cancelled." -ForegroundColor Gray
        exit
    }
}

Write-Host "Please enter your configuration details:" -ForegroundColor Green
Write-Host ""

# Supabase
Write-Host "Supabase Configuration" -ForegroundColor Magenta
$supabaseUrl = Read-Host "Supabase URL"
$supabaseKey = Read-Host "Supabase Anon Key"

Write-Host ""
Write-Host "Router Configuration" -ForegroundColor Magenta
$routerIp = Read-Host "Router IP Address (default: 192.168.0.1)"
if ([string]::IsNullOrWhiteSpace($routerIp)) {
    $routerIp = "192.168.0.1"
}

$routerUser = Read-Host "Router Username (default: admin)"
if ([string]::IsNullOrWhiteSpace($routerUser)) {
    $routerUser = "admin"
}

$routerPass = Read-Host "Router Password" -AsSecureString
$routerPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($routerPass)
)

$pollingInterval = Read-Host "Polling Interval in seconds (default: 30)"
if ([string]::IsNullOrWhiteSpace($pollingInterval)) {
    $pollingInterval = "30"
}

Write-Host ""
Write-Host "📝 Creating .env file..." -ForegroundColor Yellow

$envContent = @"
# Supabase Configuration
SUPABASE_URL=$supabaseUrl
SUPABASE_KEY=$supabaseKey

# Router Configuration
ROUTER_IP=$routerIp
ROUTER_USERNAME=$routerUser
ROUTER_PASSWORD=$routerPassPlain

# Polling Interval (seconds)
POLLING_INTERVAL=$pollingInterval
"@

Set-Content -Path $envFile -Value $envContent

Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run:" -ForegroundColor Cyan
Write-Host "  docker-compose up -d" -ForegroundColor White
Write-Host ""
