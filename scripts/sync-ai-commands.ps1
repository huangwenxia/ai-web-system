# Simplified sync script - Sync commands and skills to AI agent terminals

$ErrorActionPreference = "Stop"

function Get-ProjectRoot {
 $current = Split-Path -Parent $PSScriptRoot
 $skillsDir = Join-Path $current "skills"
 $commandsDir = Join-Path $current "commands"

 if ((Test-Path $skillsDir) -and (Test-Path $commandsDir)) {
 return $current
 }

 return $PSScriptRoot
}

function Ensure-Directory {
 param([string]$Path)

 if (-not (Test-Path $Path)) {
 New-Item -ItemType Directory -Path $Path -Force | Out-Null
 }
}

function Copy-FileSafe {
 param([string]$Source, [string]$Target)

 Ensure-Directory (Split-Path $Target -Parent)
 $content = Get-Content -Path $Source -Raw -Encoding UTF8
 $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
 [System.IO.File]::WriteAllText($Target, $content, $utf8NoBom)
}

function Copy-DirectorySafe {
 param([string]$Source, [string]$Target)

 Ensure-Directory $Target

 if (Test-Path $Target) {
 Remove-Item "$Target\*" -Recurse -Force -ErrorAction SilentlyContinue
 }

 Copy-Item -Path "$Source\*" -Destination $Target -Recurse -Force
}

$root = Get-ProjectRoot
$commandsDir = Join-Path $root "commands"
$skillsDir = Join-Path $root "skills"
$userHome = $HOME

$targets = @{
 ClaudeCommands = Join-Path $userHome ".claude\commands"
 CursorCommands = Join-Path $userHome ".cursor\commands"
 CursorSkills = Join-Path $userHome ".cursor\skills"
 RooCommands = Join-Path $userHome ".roo\commands"
 CodexSkills = Join-Path $userHome ".codex\skills"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " AI Web System - Quick Sync Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Source: $root" -ForegroundColor Gray
Write-Host ""

Write-Host "[1/2] Syncing Commands to AI agents..." -ForegroundColor Yellow

$commandFiles = Get-ChildItem -Path $commandsDir -Filter "*.md" | Where-Object { $_.Name -ne "README.md" }

foreach ($file in $commandFiles) {
 try {
 $target = Join-Path $targets.ClaudeCommands $file.Name
 Copy-FileSafe -Source $file.FullName -Target $target
 Write-Host " [OK] Claude: $($file.Name)" -ForegroundColor Green
 } catch {
 Write-Host " [FAIL] Claude: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
 }

 try {
 $target = Join-Path $targets.CursorCommands $file.Name
 Copy-FileSafe -Source $file.FullName -Target $target
 Write-Host " [OK] Cursor: $($file.Name)" -ForegroundColor Green
 } catch {
 Write-Host " [FAIL] Cursor: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
 }

 try {
 $target = Join-Path $targets.RooCommands $file.Name
 Copy-FileSafe -Source $file.FullName -Target $target
 Write-Host " [OK] Roo: $($file.Name)" -ForegroundColor Green
 } catch {
 Write-Host " [FAIL] Roo: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
 }
}

Write-Host ""
Write-Host "[2/2] Syncing Skills to AI agents..." -ForegroundColor Yellow

$skillDirs = Get-ChildItem -Path $skillsDir -Directory | Where-Object { $_.Name -like "*-skill" }

foreach ($dir in $skillDirs) {
 try {
 $target = Join-Path $targets.CursorSkills $dir.Name
 Copy-DirectorySafe -Source $dir.FullName -Target $target
 Write-Host " [OK] Cursor: $($dir.Name)" -ForegroundColor Green
 } catch {
 Write-Host " [FAIL] Cursor: $($dir.Name) - $($_.Exception.Message)" -ForegroundColor Red
 }

 try {
 $target = Join-Path $targets.CodexSkills $dir.Name
 Copy-DirectorySafe -Source $dir.FullName -Target $target
 Write-Host " [OK] Codex: $($dir.Name)" -ForegroundColor Green
 } catch {
 Write-Host " [FAIL] Codex: $($dir.Name) - $($_.Exception.Message)" -ForegroundColor Red
 }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Sync Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Target directories:" -ForegroundColor Gray
Write-Host " Claude Code: $($targets.ClaudeCommands)" -ForegroundColor Gray
Write-Host " Cursor: $($targets.CursorCommands)" -ForegroundColor Gray
Write-Host " CursorSkill: $($targets.CursorSkills)" -ForegroundColor Gray
Write-Host " Roo Code: $($targets.RooCommands)" -ForegroundColor Gray
Write-Host " Codex: $($targets.CodexSkills)" -ForegroundColor Gray
Write-Host ""