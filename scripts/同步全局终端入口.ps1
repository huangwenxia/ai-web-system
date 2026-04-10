# 简化版同步脚本 - 同步 commands 和 skills 到各智能体终端目录

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
Write-Host " AI Web System - 快速同步脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "源目录: $root" -ForegroundColor Gray
Write-Host ""

Write-Host "[1/2] 同步 Commands 到各智能体终端..." -ForegroundColor Yellow

$commandFiles = Get-ChildItem -Path $commandsDir -Filter "*.md" | Where-Object { $_.Name -ne "README.md" }

foreach ($file in $commandFiles) {
 try {
 $target = Join-Path $targets.ClaudeCommands $file.Name
 Copy-FileSafe -Source $file.FullName -Target $target
 Write-Host " ✓ Claude: $($file.Name)" -ForegroundColor Green
 } catch {
 Write-Host " ✗ Claude: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
 }

 try {
 $target = Join-Path $targets.CursorCommands $file.Name
 Copy-FileSafe -Source $file.FullName -Target $target
 Write-Host " ✓ Cursor: $($file.Name)" -ForegroundColor Green
 } catch {
 Write-Host " ✗ Cursor: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
 }

 try {
 $target = Join-Path $targets.RooCommands $file.Name
 Copy-FileSafe -Source $file.FullName -Target $target
 Write-Host " ✓ Roo: $($file.Name)" -ForegroundColor Green
 } catch {
 Write-Host " ✗ Roo: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
 }
}

Write-Host ""
Write-Host "[2/2] 同步 Skills 到各智能体终端..." -ForegroundColor Yellow

$skillDirs = Get-ChildItem -Path $skillsDir -Directory | Where-Object { $_.Name -like "*-skill" }

foreach ($dir in $skillDirs) {
 try {
 $target = Join-Path $targets.CursorSkills $dir.Name
 Copy-DirectorySafe -Source $dir.FullName -Target $target
 Write-Host " ✓ Cursor: $($dir.Name)" -ForegroundColor Green
 } catch {
 Write-Host " ✗ Cursor: $($dir.Name) - $($_.Exception.Message)" -ForegroundColor Red
 }

 try {
 $target = Join-Path $targets.CodexSkills $dir.Name
 Copy-DirectorySafe -Source $dir.FullName -Target $target
 Write-Host " ✓ Codex: $($dir.Name)" -ForegroundColor Green
 } catch {
 Write-Host " ✗ Codex: $($dir.Name) - $($_.Exception.Message)" -ForegroundColor Red
 }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 同步完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "目标目录:" -ForegroundColor Gray
Write-Host " Claude Code: $($targets.ClaudeCommands)" -ForegroundColor Gray
Write-Host " Cursor: $($targets.CursorCommands)" -ForegroundColor Gray
Write-Host " CursorSkill: $($targets.CursorSkills)" -ForegroundColor Gray
Write-Host " Roo Code: $($targets.RooCommands)" -ForegroundColor Gray
Write-Host " Codex: $($targets.CodexSkills)" -ForegroundColor Gray
Write-Host ""