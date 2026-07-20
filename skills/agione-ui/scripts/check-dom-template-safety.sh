#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# AGIOne UI Skill · DOM Template Safety Check (v2.0)
#
# Scans a single-file HTML prototype for the shared shell/template landmines
# documented in references/base-spec.md.
#
# Usage:
#   bash scripts/check-dom-template-safety.sh <output-file.html>
#
# Exit code 0 = clean; non-zero = violations found.
# -----------------------------------------------------------------------------
set -u

FILE="${1:-}"
if [[ -z "$FILE" ]]; then
  echo "Usage: $0 <html-file>"
  exit 2
fi
if [[ ! -f "$FILE" ]]; then
  echo "Error: file not found: $FILE"
  exit 2
fi

FAIL=0
pass() { printf "  \033[32m✓\033[0m %s\n" "$1"; }
fail() { printf "  \033[31m✗\033[0m %s\n" "$1"; FAIL=$((FAIL+1)); }
note() { printf "    %s\n" "$1"; }

echo "Checking: $FILE"
echo "-----------------------------------------------------"

# P1: Element Plus CDN must use full browser build path with pinned version
echo "[P1] Element Plus CDN pinned + full path"
if grep -nE 'unpkg\.com/element-plus(@[0-9][^/]*)?(/index\.js|")' "$FILE" | grep -v 'index\.full\.min\.js' | grep -v '/dist/index\.css' >/dev/null; then
  fail "Element Plus CDN uses bare/CJS path — must be /dist/index.full.min.js"
  grep -nE 'unpkg\.com/element-plus(@[0-9][^/]*)?(/index\.js|")' "$FILE" | head -5 | sed 's/^/    /'
elif ! grep -qE 'element-plus@[0-9]+\.[0-9]+\.[0-9]+/dist/index\.full\.min\.js' "$FILE"; then
  fail "Missing pinned element-plus@x.y.z/dist/index.full.min.js"
else
  pass "Element Plus CDN OK"
fi

# P2: No Google Fonts domains
echo "[P2] No Google Fonts domains"
if grep -nE 'fonts\.(googleapis|gstatic)\.(com|cn)' "$FILE" >/dev/null; then
  fail "Google Fonts domain found — use jsdelivr + fontsource instead"
  grep -nE 'fonts\.(googleapis|gstatic)\.(com|cn)' "$FILE" | head -5 | sed 's/^/    /'
else
  pass "No Google Fonts domains"
fi

# P3: No :deep() / ::v-deep / /deep/ in plain HTML
echo "[P3] No :deep() / ::v-deep / /deep/"
if grep -nE ':deep\(|::v-deep|/deep/' "$FILE" >/dev/null; then
  fail ":deep / ::v-deep / /deep/ only work in Vue SFC scoped styles"
  grep -nE ':deep\(|::v-deep|/deep/' "$FILE" | head -5 | sed 's/^/    /'
else
  pass "No scoped-style deep selectors"
fi

# P4: Element Plus Icons must be registered
echo "[P4] Element Plus Icons registered"
if grep -qE 'icons-vue@[0-9]+\.[0-9]+' "$FILE"; then
  if grep -qE 'Object\.entries\(ElementPlusIconsVue\)' "$FILE" || grep -qE 'for *\([^)]*ElementPlusIconsVue' "$FILE"; then
    pass "Icons library loaded and registered"
  else
    fail "icons-vue loaded but not registered — add Object.entries(ElementPlusIconsVue) loop"
  fi
else
  note "icons-vue not used (skipped)"
fi

# P5: No chained createApp (must store app ref)
echo "[P5] No chained Vue.createApp(...).use(...).mount(...)"
if grep -nE 'Vue\.createApp\([^)]*\)[[:space:]]*\.(use|component|mount)' "$FILE" >/dev/null; then
  fail "createApp chained — store app ref first, then .use / .mount separately"
  grep -nE 'Vue\.createApp\([^)]*\)[[:space:]]*\.' "$FILE" | head -5 | sed 's/^/    /'
else
  pass "createApp not chained"
fi

# P6: All prototype CDN dependencies must pin an exact x.y.z version.
# This intentionally covers the complete canonical dependency set rather than
# consulting a mutable online "latest" alias.
echo "[P6] All CDN deps pin exact semver"
TARGET_CDNS=$(grep -nE 'https://(unpkg\.com/(vue|element-plus|@element-plus/icons-vue|lucide)|cdn\.tailwindcss\.com|cdn\.jsdelivr\.net/npm/@fontsource/(manrope|inter|ibm-plex-mono))' "$FILE" || true)
UNPINNED=$(printf '%s\n' "$TARGET_CDNS" | grep -vE '(unpkg\.com/vue@[0-9]+\.[0-9]+\.[0-9]+/|unpkg\.com/element-plus@[0-9]+\.[0-9]+\.[0-9]+/|unpkg\.com/@element-plus/icons-vue@[0-9]+\.[0-9]+\.[0-9]+/|unpkg\.com/lucide@[0-9]+\.[0-9]+\.[0-9]+/|cdn\.tailwindcss\.com/[0-9]+\.[0-9]+\.[0-9]+(["/]|$)|cdn\.jsdelivr\.net/npm/@fontsource/(manrope|inter|ibm-plex-mono)@[0-9]+\.[0-9]+\.[0-9]+/)' || true)
if [[ -n "$UNPINNED" ]]; then
  fail "Unpinned or non-exact CDN dependency detected — use an x.y.z code-baseline version"
  echo "$UNPINNED" | head -5 | sed 's/^/    /'
else
  pass "All prototype CDNs use exact semver"
fi

# P7: No \uXXXX unicode escapes inside templates
echo "[P7] No \\uXXXX unicode escapes in HTML body"
if grep -nE '\\u[0-9a-fA-F]{4}' "$FILE" >/dev/null; then
  fail "\\uXXXX escape found — use real UTF-8 characters instead"
  grep -nE '\\u[0-9a-fA-F]{4}' "$FILE" | head -5 | sed 's/^/    /'
else
  pass "No \\uXXXX unicode escapes"
fi

# P8 (v2.1): No hard-coded hex colors outside :root blocks in CSS (theme safety)
echo "[P8] Colors via CSS variables (no hard-coded hex outside :root)"
# Extract only the <style> block; JS darkVars/lightVars theme maps intentionally hold raw
# color values and are not business CSS. Within CSS, allow :root / [data-theme] token
# declarations and flag remaining #rgb/#rrggbb literals.
HARDCODED=$(awk '
  BEGIN{instyle=0; inroot=0; incomment=0}
  /^[[:space:]]*<style([[:space:]>]|$)/ {instyle=1; next}
  /^[[:space:]]*<\/style>/ {instyle=0}
  !instyle {next}
  incomment {
    if (/\*\//) incomment=0
    next
  }
  /\/\*/ {
    if ($0 !~ /\/\*.*\*\//) incomment=1
    next
  }
  /:root *\{|\[data-theme[^]]*\] *\{/ {inroot=1}
  inroot && /^[[:space:]]*\}/ {inroot=0}
  !inroot && !/html[.]dark [.]el-button[.]el-button--(primary|success|danger)/ && /#[0-9a-fA-F]{3,8}([^0-9a-fA-F]|$)/ && !/^[[:space:]]*\/\// && !/^[[:space:]]*<!--/ {
    print NR": "$0
  }
' "$FILE" | grep -vE 'rgba?\(' | grep -vE '(url\(|href=|src=|content=)' | head -5)
if [[ -n "$HARDCODED" ]]; then
  fail "Hard-coded hex color outside :root / [data-theme] — use var(--ui-*)"
  echo "$HARDCODED" | sed 's/^/    /'
else
  pass "No obvious hard-coded hex colors outside theme blocks"
fi

# Extra 1: No self-closing custom components (el-*, PascalCase icon tags)
echo "[X1] No self-closing custom components"
# Match <el-xxx ... /> or <Xxx ... /> but exclude void HTML (br, hr, img, input, meta, link, source, area, col, embed, wbr)
BAD=$(grep -nE '<(el-[a-zA-Z0-9-]+|[A-Z][a-zA-Z0-9]*)[^>]*/>' "$FILE" | grep -vE '^[0-9]+:[[:space:]]*(//|\*|<!--)' || true)
if [[ -n "$BAD" ]]; then
  fail "Self-closing custom component tag — must use explicit closing tag"
  echo "$BAD" | head -5 | sed 's/^/    /'
else
  pass "All custom components explicitly closed"
fi

# Extra 2: No mustache inside HTML attribute literals
echo "[X2] No {{ ... }} inside attribute literals"
# Rough heuristic: attribute="... {{ ... }} ..."
BAD=$(grep -nE '[a-zA-Z-]+="[^"]*\{\{[^"]*\}\}[^"]*"' "$FILE" || true)
if [[ -n "$BAD" ]]; then
  fail "Mustache inside attribute literal — use :prop binding instead"
  echo "$BAD" | head -5 | sed 's/^/    /'
else
  pass "No mustache-in-attribute violations"
fi

echo "-----------------------------------------------------"
if [[ "$FAIL" -eq 0 ]]; then
  echo "RESULT: CLEAN ✓"
  exit 0
else
  echo "RESULT: $FAIL violation(s) ✗"
  exit 1
fi
