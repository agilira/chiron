# ============================================
# Replace --primary-* with --color-accent
# ============================================
# Strategy: Replace all --primary-* with --color-accent
# This completes the neutral-first color system

param(
    [switch]$DryRun
)

Write-Host "=== Replace --primary-* Colors ===" -ForegroundColor Cyan
Write-Host ""

$files = Get-ChildItem -Path "styles" -Filter "*.scss" -Recurse | 
    Where-Object { $_.Name -ne "_colors.scss" -and $_.Name -ne "_variables.scss" }

Write-Host "Found $($files.Count) SCSS files to process" -ForegroundColor Cyan
Write-Host ""

# Map all --primary-* to --color-accent (neutral approach)
$replacements = @{
    'var\(--primary-50\)' = 'var(--neutral-50)'
    'var\(--primary-100\)' = 'var(--neutral-100)'
    'var\(--primary-200\)' = 'var(--neutral-200)'
    'var\(--primary-300\)' = 'var(--neutral-300)'
    'var\(--primary-400\)' = 'var(--color-accent)'
    'var\(--primary-500\)' = 'var(--color-accent)'
    'var\(--primary-600\)' = 'var(--color-accent)'
    'var\(--primary-700\)' = 'var(--color-accent-hover)'
    'var\(--primary-800\)' = 'var(--neutral-800)'
    'var\(--primary-900\)' = 'var(--neutral-900)'
}

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
    Write-Host "Run: npm run build:css" -ForegroundColor White
}
