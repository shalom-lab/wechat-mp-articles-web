/**
 * 类目配色：按「类目列表中的位置」循环取色，不绑死类目名。
 * 改名后仍在同一序号 → 颜色不变。
 */

const PALETTE = [
  { bg: "#e8f4fc", fg: "#0b6e99", border: "#b7d9eb" },
  { bg: "#eef6ea", fg: "#3d7a2e", border: "#c5dfb8" },
  { bg: "#f3eef8", fg: "#6b4ea3", border: "#d4c6e8" },
  { bg: "#fff4e8", fg: "#b45f12", border: "#f0d0a8" },
  { bg: "#e9f7f4", fg: "#0f7a68", border: "#b5ddd4" },
  { bg: "#fdeef2", fg: "#a13d5c", border: "#efc2d0" },
  { bg: "#eef3ff", fg: "#3d5a9a", border: "#c5d0ef" },
  { bg: "#f1f3f5", fg: "#5c6770", border: "#d5dbe0" },
];

const FALLBACK = { bg: "#f8fafc", fg: "#445566", border: "#dce3ea" };

function uniqueNames(orderedNames) {
  const out = [];
  const seen = new Set();
  for (const raw of orderedNames || []) {
    const n = String(raw || "").trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

/** 名不在列表里时，用稳定哈希落进色板（避免临时名没颜色） */
function hashIndex(name) {
  let h = 0;
  const s = String(name);
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h % PALETTE.length;
}

/**
 * @param {string} name 类目名
 * @param {string[]} [orderedNames] 类目顺序（通常来自 enriched.categories）
 */
export function categoryStyle(name, orderedNames) {
  const n = String(name || "").trim();
  if (!n) return FALLBACK;
  const list = uniqueNames(orderedNames);
  let idx = list.indexOf(n);
  if (idx < 0) idx = hashIndex(n);
  return PALETTE[idx % PALETTE.length];
}

export function categorySelectStyle(name, orderedNames) {
  const c = categoryStyle(name, orderedNames);
  return {
    backgroundColor: c.bg,
    color: c.fg,
    borderColor: c.border,
  };
}
