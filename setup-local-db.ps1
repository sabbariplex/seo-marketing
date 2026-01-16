# Local Database Setup Script

Write-Host "`n=== Setting Up Local PostgreSQL Database ===" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "`n[1/4] Checking Docker..." -ForegroundColor Yellow
$dockerCheck = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    Write-Host "Error: $dockerCheck" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker is running" -ForegroundColor Green

# Start PostgreSQL container
Write-Host "`n[2/4] Starting PostgreSQL container..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start container" -ForegroundColor Red
    exit 1
}

# Wait for database to be ready
Write-Host "`n[3/4] Waiting for database to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    Start-Sleep -Seconds 2
    $attempt++
    $result = docker exec seo-marketing-db pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
        Write-Host "✓ Database is ready!" -ForegroundColor Green
    } else {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

if (-not $ready) {
    Write-Host "`n✗ Database failed to start. Check Docker logs:" -ForegroundColor Red
    Write-Host "docker logs seo-marketing-db" -ForegroundColor Yellow
    exit 1
}

# Update .env file with local database URL
Write-Host "`n[4/4] Updating .env file..." -ForegroundColor Yellow
$localDbUrl = "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/seo_marketing"
$envContent = Get-Content .env -ErrorAction SilentlyContinue

if ($envContent) {
    # Replace existing DATABASE_URL or add if not exists
    $updated = $false
    $newContent = $envContent | ForEach-Object {
        if ($_ -match "^DATABASE_URL=") {
            $updated = $true
            $localDbUrl
        } else {
            $_
        }
    }
    
    if (-not $updated) {
        $newContent += $localDbUrl
    }
    
    $newContent | Out-File -FilePath .env -Encoding utf8
} else {
    $localDbUrl | Out-File -FilePath .env -Encoding utf8
}

Write-Host "✓ .env file updated with local database URL" -ForegroundColor Green

# Run Prisma migrations
Write-Host "`n=== Running Database Migrations ===" -ForegroundColor Cyan
Write-Host "`n[1/2] Pushing schema to database..." -ForegroundColor Yellow
npx prisma db push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database schema created successfully!" -ForegroundColor Green
    
    Write-Host "`n[2/2] Generating Prisma Client..." -ForegroundColor Yellow
    npx prisma generate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Prisma Client generated!" -ForegroundColor Green
    }
} else {
    Write-Host "✗ Failed to push schema" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "`nYour local database is running at:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 5432" -ForegroundColor White
Write-Host "  Database: seo_marketing" -ForegroundColor White
Write-Host "  User: postgres" -ForegroundColor White
Write-Host "  Password: postgres" -ForegroundColor White

Write-Host "`nUseful commands:" -ForegroundColor Yellow
Write-Host "  Stop database: docker-compose down" -ForegroundColor White
Write-Host "  Start database: docker-compose up -d" -ForegroundColor White
Write-Host "  View logs: docker logs seo-marketing-db" -ForegroundColor White
Write-Host "  Open Prisma Studio: npx prisma studio" -ForegroundColor White
