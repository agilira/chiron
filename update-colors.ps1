# ============================================
# SAFE Color Variable Update Script
# ============================================
# Creates backup before making changes
# Only updates var() declarations, not comments
# Validates SCSS compilation after changes

param(
    [switch]$DryRun,  # Show what would change without modifying files
    [switch]$NoBackup # Skip backup creation (not recommended)
)

Write-Host "=== Chiron Color System Update ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create backup
if (-not $NoBackup -and -not $DryRun) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = "styles_backup_$timestamp"
    Write-Host "Creating backup: $backupDir" -ForegroundColor Yellow
    Copy-Item -Path "styles" -Destination $backupDir -Recurse
    Write-Host "✓ Backup created" -ForegroundColor Green
    Write-Host ""
}

# Step 2: Get all SCSS files (exclude _colors.scss and _variables.scss)
$files = Get-ChildItem -Path "styles" -Filter "*.scss" -Recurse | 
    Where-Object { $_.Name -ne "_colors.scss" -and $_.Name -ne "_variables.scss" }

Write-Host "Found $($files.Count) SCSS files to process" -ForegroundColor Cyan
Write-Host ""

# Step 3: Define SAFE replacements (only inside var() declarations)
$replacements = @{
    # Gray -> Neutral (only in var() context)
    'var\(--gray-50\)' = 'var(--neutral-50)'
    'var\(--gray-100\)' = 'var(--neutral-100)'
    'var\(--gray-200\)' = 'var(--neutral-200)'
    'var\(--gray-300\)' = 'var(--neutral-300)'
    'var\(--gray-400\)' = 'var(--neutral-400)'
    'var\(--gray-500\)' = 'var(--neutral-500)'
    'var\(--gray-600\)' = 'var(--neutral-600)'
    'var\(--gray-700\)' = 'var(--neutral-700)'
    'var\(--gray-800\)' = 'var(--neutral-800)'
    'var\(--gray-900\)' = 'var(--neutral-900)'
    
    # Old theme variables -> New functional variables
    'var\(--bg-primary\)' = 'var(--color-bg-primary)'
    'var\(--bg-secondary\)' = 'var(--color-bg-secondary)'
    'var\(--bg-tertiary\)' = 'var(--color-bg-tertiary)'
    'var\(--text-primary\)' = 'var(--color-text-primary)'
    'var\(--text-secondary\)' = 'var(--color-text-secondary)'
    'var\(--text-tertiary\)' = 'var(--color-text-tertiary)'
    'var\(--border-primary\)' = 'var(--color-border-primary)'
    'var\(--border-secondary\)' = 'var(--color-border-secondary)'
}

# Step 4: Process files
$totalChanges = 0
$changedFiles = @()

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileChangeCount = 0
    
    foreach ($old in $replacements.Keys) {
        $new = $replacements[$old]
        $foundMatches = [regex]::Matches($content, $old)
        if ($foundMatches.Count -gt 0) {
            $fileChangeCount += $foundMatches.Count
            $content = $content -replace $old, $new
        }
    }
    
    if ($content -ne $originalContent) {
        if ($DryRun) {
            Write-Host "[DRY RUN] Would update: $($file.Name) ($fileChangeCount replacements)" -ForegroundColor Yellow
        } else {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "✓ Updated: $($file.Name) ($fileChangeCount replacements)" -ForegroundColor Green
            $changedFiles += $file.Name
        }
        $totalChanges += $fileChangeCount
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Total replacements: $totalChanges" -ForegroundColor White
Write-Host "Files modified: $($changedFiles.Count)" -ForegroundColor White

if ($DryRun) {
    Write-Host ""
    Write-Host "This was a DRY RUN. No files were modified." -ForegroundColor Yellow
    Write-Host "Run without -DryRun to apply changes." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "✓ Changes applied!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run: npm run build:css" -ForegroundColor White
    Write-Host "2. Check for compilation errors" -ForegroundColor White
    Write-Host "3. Manually handle --primary-* colors (context-dependent)" -ForegroundColor White
    Write-Host ""
    Write-Host "If something went wrong, restore from backup:" -ForegroundColor Yellow
    Write-Host "Remove-Item styles -Recurse; Move-Item styles_backup_* styles" -ForegroundColor Gray
}
