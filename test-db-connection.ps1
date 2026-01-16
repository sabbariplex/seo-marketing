# Database Connection Test Script
# Run this after updating your .env file with the correct connection string

Write-Host "`n=== Testing Database Connection ===" -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Load .env file
$envContent = Get-Content .env
$dbUrl = $envContent | Where-Object { $_ -match "^DATABASE_URL=" }

if (-not $dbUrl) {
    Write-Host "ERROR: DATABASE_URL not found in .env file!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✓ Found DATABASE_URL in .env" -ForegroundColor Green

# Test 1: Check Prisma can read the schema
Write-Host "`n[1/3] Testing Prisma schema validation..." -ForegroundColor Yellow
try {
    npx prisma validate 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Schema is valid" -ForegroundColor Green
    } else {
        Write-Host "✗ Schema validation failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Try to generate Prisma client
Write-Host "`n[2/3] Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Prisma client generated" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to generate client" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Try to connect to database
Write-Host "`n[3/3] Testing database connection..." -ForegroundColor Yellow
Write-Host "This may take a few seconds..." -ForegroundColor Gray
try {
    $result = npx prisma db pull --print 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database connection successful!" -ForegroundColor Green
        Write-Host "`nYou can now run: npx prisma migrate deploy" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Database connection failed" -ForegroundColor Red
        Write-Host "`nError details:" -ForegroundColor Yellow
        Write-Host $result -ForegroundColor Gray
        Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Verify connection string in Supabase Dashboard" -ForegroundColor White
        Write-Host "2. Check if password needs URL encoding (special characters)" -ForegroundColor White
        Write-Host "3. Try Connection Pooling format instead of direct connection" -ForegroundColor White
        Write-Host "4. Ensure SSL mode is set: ?sslmode=require" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== All tests passed! ===" -ForegroundColor Green
