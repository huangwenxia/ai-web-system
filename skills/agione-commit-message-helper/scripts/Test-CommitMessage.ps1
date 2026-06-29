param(
    [string] $MessageFile,
    [string] $Message,
    [string] $ContextFile
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if ($MessageFile) {
    if (-not (Test-Path -LiteralPath $MessageFile)) {
        Write-Error "Commit message file not found: $MessageFile"
        exit 2
    }
    $Message = Get-Content -LiteralPath $MessageFile -Raw -Encoding UTF8
}

if (-not $Message -or -not $Message.Trim()) {
    Write-Error "Commit message is empty."
    exit 1
}

$lines = @($Message -split '\r?\n' | Where-Object { $_ -notmatch '^\s*#' })
$nonEmpty = @($lines | Where-Object { $_.Trim() })

if ($nonEmpty.Count -eq 0) {
    Write-Error "Commit message is empty."
    exit 1
}

$title = $nonEmpty[0].Trim()
$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]
$allowedTypes = "feat|fix|refactor|perf|config|docs|test|chore"

if ($title -notmatch "^($allowedTypes)\([a-zA-Z0-9][a-zA-Z0-9._-]*\):\s+\S.+$") {
    $errors.Add("Title must match: <type>(<scope>): <clear purpose>. Allowed types: $allowedTypes")
}

# Keep these regexes ASCII-only so Windows PowerShell 5.1 can parse the script
# correctly even when the file is UTF-8 without BOM.
$vagueWords = "\u4F18\u5316|\u8C03\u6574|\u4FEE\u6539|\u66F4\u65B0|\u4FEE\u590D|\u4FEE\u590D\u95EE\u9898|bug fix|\u63D0\u4EA4\u4EE3\u7801|\u4EE3\u7801\u63D0\u4EA4"
$vaguePatterns = @(
    "^(feat|fix|refactor|perf|config|docs|test|chore)\([^)]+\):\s*($vagueWords)\s*$",
    "^($vagueWords)\s*$"
)

foreach ($pattern in $vaguePatterns) {
    if ($title -match $pattern) {
        $errors.Add("Title is too vague. Explain what changed and why.")
        break
    }
}

if ($title.Length -gt 90) {
    $warnings.Add("Title is long; consider keeping it under 90 characters.")
}

$bodyLines = @()
if ($nonEmpty.Count -gt 1) {
    $bodyLines = @($nonEmpty[1..($nonEmpty.Count - 1)])
}

$bulletLines = @($bodyLines | Where-Object { $_.Trim() -match '^[-*]\s+\S' })
if ($bulletLines.Count -lt 2) {
    $errors.Add("Body should contain at least two bullet lines describing impact, purpose, or testing.")
}

$bodyText = ($bodyLines -join "`n")
$testWords = "\u6D4B\u8BD5|\u56DE\u5F52|\u9A8C\u8BC1|\u5F71\u54CD|\u6D41\u7A0B|\u63A5\u53E3|\u914D\u7F6E|\u6743\u9650|\u9875\u9762|\u7528\u6237|\u8D26\u52A1|\u8BA1\u8D39|\u6A21\u578B|\u90E8\u7F72|\u6570\u636E|\u524D\u7AEF|\u540E\u7AEF"
if ($bulletLines.Count -lt 3 -and $bodyText -notmatch $testWords) {
    $warnings.Add("Body does not mention impact or testing cues; add affected flow and regression suggestion.")
}

if ($ContextFile) {
    if (-not (Test-Path -LiteralPath $ContextFile)) {
        $warnings.Add("Context file not found: $ContextFile")
    } else {
        $pythonScript = Join-Path $PSScriptRoot "test_commit_message.py"
        $tmpMessage = [System.IO.Path]::GetTempFileName()
        try {
            Set-Content -LiteralPath $tmpMessage -Value $Message -Encoding UTF8
            $pythonOutput = & python $pythonScript --message-file $tmpMessage --context-file $ContextFile 2>&1
            $pythonExit = $LASTEXITCODE
            foreach ($line in $pythonOutput) {
                if ($line -match "Title scope .* differs|Body does not reference any inferred diff evidence|frontend/backend linked|Context has no staged diff|Context file not found|lacks a clear change summary|lacks a change reason|lacks impact scope|lacks a test suggestion|lacks a risk note|does not clearly describe the core change|does not clearly explain why") {
                    $warnings.Add($line.TrimStart("- ").Trim())
                }
            }
            if ($pythonExit -ne 0 -and $pythonOutput -match "Context file") {
                $warnings.Add("Context check failed; run Python validator directly for details.")
            }
        } finally {
            if (Test-Path -LiteralPath $tmpMessage) {
                Remove-Item -LiteralPath $tmpMessage -Force
            }
        }
    }
}

if ($errors.Count -gt 0) {
    Write-Host "Commit message check failed:" -ForegroundColor Red
    foreach ($item in $errors) {
        Write-Host "- $item" -ForegroundColor Red
    }
    if ($warnings.Count -gt 0) {
        Write-Host "Warnings:" -ForegroundColor Yellow
        foreach ($item in $warnings) {
            Write-Host "- $item" -ForegroundColor Yellow
        }
    }
    exit 1
}

if ($warnings.Count -gt 0) {
    Write-Host "Commit message check passed with warnings:" -ForegroundColor Yellow
    foreach ($item in $warnings) {
        Write-Host "- $item" -ForegroundColor Yellow
    }
    exit 0
}

Write-Host "Commit message check passed." -ForegroundColor Green
exit 0
