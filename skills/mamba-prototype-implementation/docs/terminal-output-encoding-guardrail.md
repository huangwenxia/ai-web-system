# Terminal Output Encoding Guardrail

Use this guardrail whenever terminal output, especially PowerShell stdout on Windows, appears to show garbled Chinese, replacement glyphs, `UnicodeDecodeError`, `illegal multibyte sequence`, or any other encoding-looking error.

## Core Fact

PowerShell stdout is not disk truth. In this Windows workspace, PowerShell can re-render UTF-8 bytes through the console code page (system ANSI / GBK) before the agent sees them. Garbled terminal text is evidence about terminal rendering first, not evidence that the file on disk is corrupted.

## Required Response

1. Stop before editing.
2. Treat the terminal text as a rendering artifact until proven otherwise.
3. Verify the actual on-disk bytes with a non-rendering check:
   - `Format-Hex`
   - Node `fs.readFileSync(...).toString('hex')`
   - `git diff -- <path>`
   - `git log -p -- <path>`
4. Base any conclusion on bytes or `git diff`, not console-rendered characters.
5. Edit only with `apply_patch` against verified file content.

## Forbidden

- Do not use PowerShell write commands to fix, re-encode, rewrite, append, or recreate a file based only on terminal-rendered text.
- Do not treat `UnicodeDecodeError`, `illegal multibyte sequence`, or mojibake in stdout as proof that the file is broken.
- Do not use `Add-Content`, `Set-Content`, `Out-File`, `New-Item`, redirection, or any PowerShell write path as an encoding repair.

## Reporting

When this guardrail is triggered, report:

- What terminal output looked suspicious.
- Which byte-level or git-level check was used.
- Whether the disk file was actually corrupted or the issue was only terminal rendering.
- Any edit made with `apply_patch`, or that no edit was made because bytes were clean.
