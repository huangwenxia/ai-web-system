#!/usr/bin/env bash
# claude_review.sh — stable, non-interactive wrapper around `claude -p`.
# Part of the call-claude skill. Designed to fail loudly and avoid silent empty results.
#
# What it does:
#   - Stable invocation: prompt from a regular file on stdin, wall-clock timeout,
#     output capture, auth/error detection, empty-output rejection, and cleanup.
#   - One Claude thread per Codex conversation when CODEX_THREAD_ID is available.
#     The mapping is stored under ~/.claude/.codex-claude-threads/.
#   - Review mode is read-only by default: Claude gets read/search tools only.
#   - Full mode is explicit opt-in: --full / --fix bypasses permissions so Claude
#     may edit files and run commands. Use only when the user asks Claude to change things.
#
# Usage: claude_review.sh [options] [PROMPT]
#   Prompt source priority: --prompt-file > piped stdin > trailing args.
#
# Options:
#   --mode <m>        review (default) | full
#   --full, --fix     shortcut for --mode full
#   --cd <dir>        run Claude from this directory (default: cwd)
#   --fresh           start a new Claude thread for this Codex conversation
#   --ephemeral       stateless one-off: do not resume or persist a thread
#   --conversation <k> override the Codex conversation key (default $CODEX_THREAD_ID)
#   --model <name>    pass --model <name> to Claude
#   --timeout <sec>   hard wall-clock budget; 0 disables (default 1200 = 20m)
#   --retries <n>     retries for transient rate-limit/network failures only (default 1)
#   --max-budget-usd <amount> pass a Claude API spend cap
#   --output <file>   write Claude's final message here (default: temp, printed)
#   --log <file>      write stderr/debug/error details here (default: temp)
#   --raw-json <file> write Claude JSON result here (default: temp)
#   --prompt-file <f> read prompt from file f
#   -q, --quiet       suppress progress notes on stderr
#   -h, --help        show this help
#
# Exit codes: 0 ok | 10 claude missing | 11 auth | 12 usage | 13 empty output
#             | 124 timeout | else Claude error

set -o pipefail

MODE="review"
MODEL=""
WORKDIR=""
TIMEOUT="1200"
RETRIES="1"
MAX_BUDGET_USD=""
OUTFILE=""
LOGFILE=""
RAW_JSON=""
PROMPT_FILE=""
QUIET="0"
EPHEMERAL="0"
FRESH="0"
CONV_KEY="${CODEX_THREAD_ID:-}"
THREAD_DIR="$HOME/.claude/.codex-claude-threads"

EXIT_NO_CLAUDE=10
EXIT_AUTH=11
EXIT_USAGE=12
EXIT_EMPTY_OUTPUT=13
EXIT_TIMEOUT=124

err() { printf 'claude_review: %s\n' "$*" >&2; }
note() { [ "$QUIET" = "1" ] || printf 'claude_review: %s\n' "$*" >&2; }
usage() { awk 'NR==1{next} /^#/{sub(/^# ?/,""); print; next} {exit}' "$0"; }

ARGS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --mode)           MODE="${2:-}"; shift 2 || true ;;
    --full|--fix)     MODE="full"; shift ;;
    --model)          MODEL="${2:-}"; shift 2 || true ;;
    --cd|--repo)      WORKDIR="${2:-}"; shift 2 || true ;;
    --fresh)          FRESH="1"; shift ;;
    --ephemeral)      EPHEMERAL="1"; shift ;;
    --conversation)   CONV_KEY="${2:-}"; shift 2 || true ;;
    --timeout)        TIMEOUT="${2:-}"; shift 2 || true ;;
    --retries)        RETRIES="${2:-}"; shift 2 || true ;;
    --max-budget-usd) MAX_BUDGET_USD="${2:-}"; shift 2 || true ;;
    --output)         OUTFILE="${2:-}"; shift 2 || true ;;
    --log)            LOGFILE="${2:-}"; shift 2 || true ;;
    --raw-json)       RAW_JSON="${2:-}"; shift 2 || true ;;
    --prompt-file)    PROMPT_FILE="${2:-}"; shift 2 || true ;;
    -q|--quiet)       QUIET="1"; shift ;;
    -h|--help)        usage; exit 0 ;;
    --)               shift; while [ $# -gt 0 ]; do ARGS+=("$1"); shift; done ;;
    -*)               err "unknown option: $1"; exit "$EXIT_USAGE" ;;
    *)                ARGS+=("$1"); shift ;;
  esac
done

case "$MODE" in
  review|full) : ;;
  *) err "invalid --mode '$MODE' (use review|full)"; exit "$EXIT_USAGE" ;;
esac
case "$TIMEOUT" in (*[!0-9]*) err "--timeout must be an integer"; exit "$EXIT_USAGE" ;; esac
case "$RETRIES" in (*[!0-9]*) err "--retries must be an integer"; exit "$EXIT_USAGE" ;; esac
[ -n "$WORKDIR" ] && [ ! -d "$WORKDIR" ] && { err "working directory not found: $WORKDIR"; exit "$EXIT_USAGE"; }

if ! command -v claude >/dev/null 2>&1; then
  err "the 'claude' CLI was not found on PATH. Install Claude Code or fall back to a Claude Brief."
  exit "$EXIT_NO_CLAUDE"
fi

TMP="$(mktemp -d "${TMPDIR:-/tmp}/call-claude.XXXXXX")" || { err "mktemp failed"; exit 1; }
PROMPT_TMP="$TMP/prompt.txt"
[ -n "$OUTFILE" ] || OUTFILE="$TMP/last-message.md"
[ -n "$LOGFILE" ] || LOGFILE="$TMP/stderr.log"
[ -n "$RAW_JSON" ] || RAW_JSON="$TMP/result.json"
SESSION_TMP="$TMP/session-id"
WATCH_CHILD=""
WATCH_DOG=""
WATCH_PG=""

cleanup() {
  if [ -n "$WATCH_CHILD" ]; then
    { [ "$WATCH_PG" = "1" ] && kill -- -"$WATCH_CHILD" 2>/dev/null; } || kill "$WATCH_CHILD" 2>/dev/null
  fi
  [ -n "$WATCH_DOG" ] && kill "$WATCH_DOG" 2>/dev/null
  rm -rf "$TMP" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [ -n "$PROMPT_FILE" ]; then
  [ -r "$PROMPT_FILE" ] || { err "prompt file not readable: $PROMPT_FILE"; exit "$EXIT_USAGE"; }
  cat -- "$PROMPT_FILE" >"$PROMPT_TMP"
elif [ "${#ARGS[@]}" -gt 0 ]; then
  printf '%s\n' "${ARGS[*]}" >"$PROMPT_TMP"
elif [ ! -t 0 ]; then
  cat >"$PROMPT_TMP"
else
  err "no prompt given (use --prompt-file, pipe via stdin, or pass a trailing arg)"
  exit "$EXIT_USAGE"
fi
[ -s "$PROMPT_TMP" ] || { err "prompt is empty"; exit "$EXIT_USAGE"; }

CLAUDE_HELP="$(claude --help 2>&1 || true)"
chas() { printf '%s' "$CLAUDE_HELP" | grep -q -- "$1"; }

SESSION_ON="1"
[ "$EPHEMERAL" = "1" ] && SESSION_ON="0"
[ -z "$CONV_KEY" ] && SESSION_ON="0"
chas "--resume" || SESSION_ON="0"

THREAD_FILE=""
RESUME_ID=""
if [ "$SESSION_ON" = "1" ]; then
  mkdir -p "$THREAD_DIR" 2>/dev/null || true
  THREAD_FILE="$THREAD_DIR/$(printf '%s' "$CONV_KEY" | tr -c 'A-Za-z0-9._-' '_')"
  if [ "$FRESH" != "1" ] && [ -s "$THREAD_FILE" ]; then
    RESUME_ID="$(head -1 "$THREAD_FILE" | tr -d '[:space:]')"
  fi
fi

CLAUDE_ARGV=(claude -p --output-format json)
[ -n "$MODEL" ] && CLAUDE_ARGV+=(--model "$MODEL")
[ -n "$MAX_BUDGET_USD" ] && CLAUDE_ARGV+=(--max-budget-usd "$MAX_BUDGET_USD")
[ "$EPHEMERAL" = "1" ] && chas "--no-session-persistence" && CLAUDE_ARGV+=(--no-session-persistence)
[ -n "$RESUME_ID" ] && CLAUDE_ARGV+=(--resume "$RESUME_ID")

if [ "$MODE" = "full" ]; then
  if chas "--dangerously-skip-permissions"; then
    CLAUDE_ARGV+=(--dangerously-skip-permissions)
  elif chas "--permission-mode"; then
    CLAUDE_ARGV+=(--permission-mode bypassPermissions)
  fi
else
  # Read-only review: no Bash/Edit/Write tools. Claude can inspect files, grep, and glob.
  chas "--tools" && CLAUDE_ARGV+=(--tools "Read,Glob,Grep,LS")
  chas "--permission-mode" && CLAUDE_ARGV+=(--permission-mode dontAsk)
fi

TIMEOUT_BIN=""
if command -v timeout >/dev/null 2>&1; then TIMEOUT_BIN="timeout"
elif command -v gtimeout >/dev/null 2>&1; then TIMEOUT_BIN="gtimeout"; fi
[ "$TIMEOUT" != "0" ] && [ -z "$TIMEOUT_BIN" ] && note "no 'timeout'/'gtimeout'; using built-in watchdog for ${TIMEOUT}s cap."

PG_LAUNCH=()
if command -v perl >/dev/null 2>&1; then
  PG_LAUNCH=(perl -e 'setpgrp(0,0); exec @ARGV or die "exec failed: $!\n"' --)
fi

_wd_kill() {
  local sig="$1" pid="$2"
  { [ "$WATCH_PG" = "1" ] && kill -"$sig" -"$pid" 2>/dev/null; } || kill -"$sig" "$pid" 2>/dev/null
}

run_claude_watchdog() {
  local fired="$TMP/watchdog-fired"
  rm -f "$fired"
  "${PG_LAUNCH[@]}" "${CLAUDE_ARGV[@]}" <"$PROMPT_TMP" >"$RAW_JSON" 2>"$LOGFILE" &
  WATCH_CHILD=$!
  [ "${#PG_LAUNCH[@]}" -gt 0 ] && WATCH_PG="1" || WATCH_PG=""
  (
    sleep "$TIMEOUT"
    if kill -0 "$WATCH_CHILD" 2>/dev/null; then
      : >"$fired"
      _wd_kill TERM "$WATCH_CHILD"
      sleep 10
      _wd_kill KILL "$WATCH_CHILD"
    fi
  ) &
  WATCH_DOG=$!
  wait "$WATCH_CHILD" 2>/dev/null
  local rc=$?
  kill "$WATCH_DOG" 2>/dev/null
  wait "$WATCH_DOG" 2>/dev/null
  WATCH_CHILD=""; WATCH_DOG=""; WATCH_PG=""
  [ -f "$fired" ] && rc=124
  return "$rc"
}

run_once() {
  : >"$OUTFILE"
  : >"$RAW_JSON"
  : >"$LOGFILE"
  if [ "$TIMEOUT" = "0" ]; then
    "${CLAUDE_ARGV[@]}" <"$PROMPT_TMP" >"$RAW_JSON" 2>"$LOGFILE"
  elif [ -n "$TIMEOUT_BIN" ]; then
    "$TIMEOUT_BIN" -k 10 "$TIMEOUT" "${CLAUDE_ARGV[@]}" <"$PROMPT_TMP" >"$RAW_JSON" 2>"$LOGFILE"
  else
    run_claude_watchdog
  fi
}

parse_json_result() {
  python3 - "$RAW_JSON" "$OUTFILE" "$SESSION_TMP" <<'PY'
import json
import sys
from pathlib import Path

raw, out, sess = map(Path, sys.argv[1:])
try:
    data = json.loads(raw.read_text())
except Exception as exc:
    print(f"claude JSON result could not be parsed: {exc}", file=sys.stderr)
    sys.exit(1)

sid = data.get("session_id")
if isinstance(sid, str) and sid.strip():
    sess.write_text(sid.strip() + "\n")

errors = data.get("errors") or []
if data.get("is_error"):
    msg = "\n".join(str(e) for e in errors) or data.get("subtype") or "Claude returned an error result"
    print(msg, file=sys.stderr)
    low = msg.lower()
    if any(x in low for x in ("auth", "unauthorized", "api key", "login", "anthropic_api_key")):
        sys.exit(11)
    sys.exit(1)

text = data.get("result")
if isinstance(text, list):
    text = "\n".join(str(x) for x in text)
elif text is None:
    text = data.get("message") or data.get("content") or ""
else:
    text = str(text)

if not text.strip():
    print("Claude exited successfully but produced no usable final message.", file=sys.stderr)
    sys.exit(13)

out.write_text(text)
sys.exit(0)
PY
}

[ -n "$WORKDIR" ] && cd "$WORKDIR" 2>/dev/null || true
if [ -n "$WORKDIR" ] && [ "$(pwd)" != "$(cd "$WORKDIR" 2>/dev/null && pwd)" ]; then
  err "cannot cd into working directory: $WORKDIR"
  exit "$EXIT_USAGE"
fi

if [ "$SESSION_ON" = "1" ]; then
  [ -n "$RESUME_ID" ] && note "conversation: resume Claude session $RESUME_ID (Codex $CONV_KEY)" \
                    || note "conversation: NEW Claude session for this Codex thread ($CONV_KEY)"
else
  note "conversation: one-shot (no shared Claude thread)"
fi
note "claude cwd: ${WORKDIR:-$(pwd)} · mode: $MODE"
[ "$MODE" = "full" ] && note "full access: Claude may modify files and run commands."

attempt=0
max=$(( RETRIES + 1 ))
rc=0
while : ; do
  attempt=$(( attempt + 1 ))
  note "running claude (attempt $attempt/$max, timeout=${TIMEOUT}s)..."
  run_once; rc=$?

  if [ "$rc" -eq 0 ]; then
    parse_err="$TMP/parse.err"
    parse_json_result 2>"$parse_err"
    parse_rc=$?
    if [ "$parse_rc" -eq 0 ]; then
      break
    fi
    rc=$parse_rc
    cat "$parse_err" >>"$LOGFILE"
  fi

  if grep -qiE 'auth|unauthorized|api key|anthropic_api_key|please login|not logged in' "$LOGFILE" "$RAW_JSON" 2>/dev/null; then
    err "claude appears unauthenticated. Run 'claude auth' or set the required API key, then retry."
    exit "$EXIT_AUTH"
  fi

  if [ -n "$RESUME_ID" ] && grep -qiE 'no such session|session.*(not found|does not exist)|could not (find|load|resume)|failed to resume|context.*(overflow|exceeded)|too (long|large)' "$LOGFILE" "$RAW_JSON" 2>/dev/null; then
    note "stored Claude session $RESUME_ID is unusable; starting a fresh session."
    [ -n "$THREAD_FILE" ] && : >"$THREAD_FILE"
    RESUME_ID=""
    NEW_ARGV=()
    skip_next="0"
    for arg in "${CLAUDE_ARGV[@]}"; do
      if [ "$skip_next" = "1" ]; then
        skip_next="0"
        continue
      fi
      if [ "$arg" = "--resume" ]; then
        skip_next="1"
        continue
      fi
      NEW_ARGV+=("$arg")
    done
    CLAUDE_ARGV=("${NEW_ARGV[@]}")
    continue
  fi

  if [ "$rc" -eq 124 ] || [ "$rc" -eq 137 ]; then
    note "claude hit the ${TIMEOUT}s wall-clock budget (rc=$rc)."
  fi

  if [ "$attempt" -lt "$max" ] && [ "$rc" -ne 124 ] && [ "$rc" -ne 137 ] && \
      grep -qiE 'rate limit|429|temporar|timed out|connection (reset|refused)|stream (error|disconnect)|econnreset|etimedout|503|502|network error|overloaded' "$LOGFILE" "$RAW_JSON" 2>/dev/null; then
    backoff=$(( attempt * 5 ))
    note "transient failure (rc=$rc); retrying in ${backoff}s..."
    sleep "$backoff"
    continue
  fi
  break
done

if [ "$SESSION_ON" = "1" ] && [ "$rc" -eq 0 ] && [ -s "$SESSION_TMP" ] && [ -n "$THREAD_FILE" ]; then
  cp "$SESSION_TMP" "$THREAD_FILE" 2>/dev/null || true
fi

if [ -s "$OUTFILE" ]; then
  cat "$OUTFILE"
elif [ "$rc" -eq 0 ]; then
  err "claude exited 0 but produced no final message (empty output)."
  [ -s "$RAW_JSON" ] && { err "--- claude JSON follows (stderr) ---"; cat "$RAW_JSON" >&2; }
  exit "$EXIT_EMPTY_OUTPUT"
elif [ -s "$RAW_JSON" ]; then
  cat "$RAW_JSON"
elif [ -s "$LOGFILE" ]; then
  cat "$LOGFILE"
fi

if [ "$rc" -ne 0 ]; then
  err "claude exited with code $rc after $attempt attempt(s)."
  { [ "$rc" -eq 124 ] || [ "$rc" -eq 137 ]; } && exit "$EXIT_TIMEOUT"
  [ "$rc" -eq 13 ] && exit "$EXIT_EMPTY_OUTPUT"
fi
exit "$rc"
