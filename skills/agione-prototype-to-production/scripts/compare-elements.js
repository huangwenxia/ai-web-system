/**
 * 原型 vs 实现 逐元素 computed-style 比对工具
 * ──────────────────────────────────────────────────────────────
 * 用法：把需要的函数整段贴进浏览器执行环境（Claude: preview_eval / Codex: chrome.eval /
 *      通用: DevTools console），在【原型页】和【实现页】各跑一次，把两份 JSON 输出并排对比。
 *
 * 为什么需要它：字号差 2px、字重差一档、圆角 12 vs 8、字体 mono/Inter 混排、
 *      图标 path 变体、缺 box-shadow、间距错 20px —— 这些肉眼看截图全看不出，
 *      必须读 computed style 数值。这是把"还原原型"从 8 轮压到 2-3 轮的关键。
 *
 * 三个函数：
 *   dumpTextLeaves(rootSelector)  —— 遍历容器内所有文字叶子：文案 + 字体/字号/字重/颜色
 *                                    （一次性抓出 文案差异 + 字体混排是否正确）
 *   dumpBoxModel(selectorList)    —— 一组元素的 shadow/border/radius/padding/margin/gap/宽高
 *                                    （抓 阴影、圆角、间距、卡片尺寸）
 *   dumpIcons(rootSelector)       —— 容器内每个 svg 的 尺寸/color/path/相邻文案
 *                                    （抓 图标尺寸、语义色、变体差异）
 *
 * 注意：实现页常是 dark 模式 + 需登录；原型页是静态 HTML、可能要先切语言态。
 *      跑之前先确认两边在同一主题/语言下，否则颜色对不上是正常的。
 */

// ── 1. 文字叶子全量 dump：抓文案 + 字体混排 ──────────────────────
function dumpTextLeaves(rootSelector) {
  const root = document.querySelector(rootSelector)
  if (!root) return { error: "not found: " + rootSelector, url: location.href }
  const ff = (cs) => cs.fontFamily.split(",")[0].replace(/["']/g, "")
  const out = []
  const walk = (el) => {
    for (const node of el.childNodes) {
      if (node.nodeType === 3) {
        const t = node.textContent.trim()
        if (t) {
          const cs = getComputedStyle(el)
          out.push({ text: t.slice(0, 40), font: ff(cs), size: cs.fontSize, weight: cs.fontWeight, color: cs.color })
        }
      } else if (node.nodeType === 1) {
        walk(node)
      }
    }
  }
  walk(root)
  return { url: location.href, count: out.length, elements: out }
}

// ── 2. 盒模型 dump：抓阴影/边框/圆角/间距 ────────────────────────
function dumpBoxModel(selectorList) {
  const box = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return { selector: sel, error: "not found" }
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      selector: sel,
      w: Math.round(r.width),
      h: Math.round(r.height),
      boxShadow: cs.boxShadow === "none" ? "none" : cs.boxShadow,
      border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
      radius: cs.borderRadius,
      padding: cs.padding,
      margin: cs.margin,
      gap: cs.gap !== "normal" ? cs.gap : undefined,
      bg: cs.backgroundColor,
      bgImage: cs.backgroundImage === "none" ? "none" : cs.backgroundImage,
    }
  }
  return { url: location.href, boxes: (Array.isArray(selectorList) ? selectorList : [selectorList]).map(box) }
}

// ── 3. 图标 dump：抓尺寸/语义色/path 变体 ───────────────────────
function dumpIcons(rootSelector) {
  const root = document.querySelector(rootSelector)
  if (!root) return { error: "not found: " + rootSelector, url: location.href }
  const icons = [...root.querySelectorAll("svg")].map((svg) => {
    const cs = getComputedStyle(svg)
    // 原型 lucide 是 data-lucide 名；实现是 inline svg，靠 path 区分变体
    const firstPath = svg.querySelector("path")?.getAttribute("d") || ""
    return {
      lucide: svg.getAttribute("data-lucide") || undefined,
      w: cs.width,
      h: cs.height,
      color: cs.color,
      pathStart: firstPath.slice(0, 40),
      near: (svg.parentElement?.textContent || "").trim().slice(0, 16),
    }
  })
  return { url: location.href, count: icons.length, icons }
}

/* ──────────────────────────────────────────────────────────────
 * 典型调用示例（贴进 preview_eval / chrome.eval / DevTools console 时把函数定义 + 调用一起放进 IIFE）：
 *
 *   (() => {
 *     <把上面三个函数粘进来>
 *     return dumpTextLeaves(".pr-revenue-hero")   // 实现页 hero
 *     // return dumpBoxModel([".pr-revenue-hero", ".card-box", ".pr-rank-row"])
 *     // return dumpIcons(".pr-revenue-hero")
 *   })()
 *
 * 原型页对应 selector 换成原型的 class（如 .pr-v3-cockpit）。
 * 把原型输出和实现输出贴在一起，逐行对比 size/weight/font/color/shadow/radius/path，
 * 不一致的就是要修的点 —— 每处都用原型实测值，不要凭感觉。
 * ────────────────────────────────────────────────────────────── */
