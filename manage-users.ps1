# HRA User Management PowerShell Script
# Quick tool for managing users in the HRA application

param(
    [string]$Action = "menu",
    [string]$Username,
    [string]$Password,
    [string]$Role
)

$DatabasePath = ".\hogrisk.db"
$ValidRoles = @("underhall", "supervisor", "superintendent", "arbetsledare", "admin")

function Show-Menu {
    Write-Host "`n🔐 HRA User Management Tool" -ForegroundColor Cyan
    Write-Host "===============================" -ForegroundColor Cyan
    Write-Host "1. View all users"
    Write-Host "2. Create new user"
    Write-Host "3. Update user role"
    Write-Host "4. View users by role"
    Write-Host "5. Create sample test users"
    Write-Host "6. Quick admin creation"
    Write-Host "7. Exit"
    Write-Host "===============================" -ForegroundColor Cyan
}

function Test-SQLite {
    if (-not (Get-Command sqlite3 -ErrorAction SilentlyContinue)) {
        Write-Host "❌ SQLite3 not found. Please install SQLite3 or use the Node.js script instead." -ForegroundColor Red
        Write-Host "Download from: https://sqlite.org/download.html" -ForegroundColor Yellow
        return $false
    }
    return $true
}

function Invoke-SQLiteQuery {
    param([string]$Query)
    
    if (-not (Test-Path $DatabasePath)) {
        Write-Host "❌ Database not found: $DatabasePath" -ForegroundColor Red
        return
    }
    
    $result = sqlite3 $DatabasePath $Query 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ SQL Error: $result" -ForegroundColor Red
    } else {
        return $result
    }
}

function Show-AllUsers {
    Write-Host "`n📋 All Users:" -ForegroundColor Green
    $query = "SELECT username, role, created_at FROM users ORDER BY role, username;"
    $results = Invoke-SQLiteQuery -Query $query
    
    if ($results) {
        Write-Host "Username`t`tRole`t`t`tCreated" -ForegroundColor Yellow
        Write-Host "--------`t`t----`t`t`t-------" -ForegroundColor Yellow
        foreach ($line in $results) {
            $parts = $line -split '\|'
            if ($parts.Length -eq 3) {
                Write-Host "$($parts[0])`t`t$($parts[1])`t`t$($parts[2])"
            }
        }
    }
}

function New-User {
    $Username = Read-Host "Enter username"
    $Password = Read-Host "Enter temporary password"
    
    Write-Host "`nAvailable roles:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $ValidRoles.Length; $i++) {
        Write-Host "$($i + 1). $($ValidRoles[$i])"
    }
    
    $roleChoice = Read-Host "Select role (1-5)"
    $roleIndex = [int]$roleChoice - 1
    
    if ($roleIndex -ge 0 -and $roleIndex -lt $ValidRoles.Length) {
        $Role = $ValidRoles[$roleIndex]
        $query = "INSERT INTO users (username, password, role) VALUES ('$Username', '$Password', '$Role');"
        Invoke-SQLiteQuery -Query $query
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ User created: $Username with role: $Role" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Invalid role selection" -ForegroundColor Red
    }
}

function Update-UserRole {
    $Username = Read-Host "Enter username to update"
    
    Write-Host "`nAvailable roles:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $ValidRoles.Length; $i++) {
        Write-Host "$($i + 1). $($ValidRoles[$i])"
    }
    
    $roleChoice = Read-Host "Select new role (1-5)"
    $roleIndex = [int]$roleChoice - 1
    
    if ($roleIndex -ge 0 -and $roleIndex -lt $ValidRoles.Length) {
        $Role = $ValidRoles[$roleIndex]
        $query = "UPDATE users SET role = '$Role' WHERE username = '$Username';"
        Invoke-SQLiteQuery -Query $query
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ User $Username updated to role: $Role" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Invalid role selection" -ForegroundColor Red
    }
}

function Show-UsersByRole {
    Write-Host "`nSelect role to view:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $ValidRoles.Length; $i++) {
        Write-Host "$($i + 1). $($ValidRoles[$i])"
    }
    
    $roleChoice = Read-Host "Select role (1-5)"
    $roleIndex = [int]$roleChoice - 1
    
    if ($roleIndex -ge 0 -and $roleIndex -lt $ValidRoles.Length) {
        $Role = $ValidRoles[$roleIndex]
        $query = "SELECT username, created_at FROM users WHERE role = '$Role' ORDER BY username;"
        $results = Invoke-SQLiteQuery -Query $query
        
        Write-Host "`n👥 Users with role '$Role':" -ForegroundColor Green
        if ($results) {
            foreach ($line in $results) {
                $parts = $line -split '\|'
                if ($parts.Length -eq 2) {
                    Write-Host "  $($parts[0]) (created: $($parts[1]))"
                }
            }
        } else {
            Write-Host "  No users found with role '$Role'" -ForegroundColor Yellow
        }
    }
}

function New-SampleUsers {
    Write-Host "`n🔧 Creating sample users..." -ForegroundColor Yellow
    
    $sampleUsers = @(
        @{ username = "admin.test"; password = "admin123"; role = "admin" },
        @{ username = "supervisor.test"; password = "temp123"; role = "supervisor" },
        @{ username = "superintendent.test"; password = "temp123"; role = "superintendent" },
        @{ username = "arbetsledare.test"; password = "temp123"; role = "arbetsledare" },
        @{ username = "underhall.test"; password = "temp123"; role = "underhall" }
    )
    
    foreach ($user in $sampleUsers) {
        $query = "INSERT INTO users (username, password, role) VALUES ('$($user.username)', '$($user.password)', '$($user.role)');"
        Invoke-SQLiteQuery -Query $query
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Created: $($user.username) ($($user.role))" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to create: $($user.username)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n✅ Sample users creation complete!" -ForegroundColor Green
}

function New-QuickAdmin {
    $Username = Read-Host "Enter admin username (e.g., admin.yourname)"
    $Password = Read-Host "Enter admin password"
    
    $query = "INSERT INTO users (username, password, role) VALUES ('$Username', '$Password', 'admin');"
    Invoke-SQLiteQuery -Query $query
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Admin user created: $Username" -ForegroundColor Green
        Write-Host "🔐 You can now login with these credentials" -ForegroundColor Yellow
    }
}

# Main script logic
if (-not (Test-SQLite)) {
    Write-Host "`n🔧 Alternative: Use the Node.js script instead:" -ForegroundColor Yellow
    Write-Host "   node manage-users.js" -ForegroundColor Cyan
    exit 1
}

if ($Action -eq "menu") {
    do {
        Show-Menu
        $choice = Read-Host "`nEnter your choice (1-7)"
        
        switch ($choice) {
            "1" { Show-AllUsers }
            "2" { New-User }
            "3" { Update-UserRole }
            "4" { Show-UsersByRole }
            "5" { New-SampleUsers }
            "6" { New-QuickAdmin }
            "7" { 
                Write-Host "👋 Goodbye!" -ForegroundColor Green
                exit 0 
            }
            default { 
                Write-Host "❌ Invalid choice. Please enter 1-7." -ForegroundColor Red 
            }
        }
        
        if ($choice -ne "7") {
            Read-Host "`nPress Enter to continue..."
        }
    } while ($choice -ne "7")
}

# Command line usage examples:
# .\manage-users.ps1 -Action create -Username "john.doe" -Password "temp123" -Role "supervisor"
# .\manage-users.ps1 -Action view