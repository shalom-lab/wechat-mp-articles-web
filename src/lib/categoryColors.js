/** 类目 → 配色（与 TOC 类目大致对应，未命中走默认） */
const MAP = {
  R语言基础篇: { bg: "#e8f4fc", fg: "#0b6e99", border: "#b7d9eb" },
  R项目与代码管理: { bg: "#eef6ea", fg: "#3d7a2e", border: "#c5dfb8" },
  流行病学: { bg: "#f3eef8", fg: "#6b4ea3", border: "#d4c6e8" },
  R语言作图: { bg: "#fff4e8", fg: "#b45f12", border: "#f0d0a8" },
  Shiny应用开发: { bg: "#e9f7f4", fg: "#0f7a68", border: "#b5ddd4" },
  其他: { bg: "#f1f3f5", fg: "#5c6770", border: "#d5dbe0" },
};

const FALLBACK = { bg: "#f8fafc", fg: "#445566", border: "#dce3ea" };

export function categoryStyle(name) {
  return MAP[String(name || "").trim()] || FALLBACK;
}

export function categorySelectStyle(name) {
  const c = categoryStyle(name);
  return {
    backgroundColor: c.bg,
    color: c.fg,
    borderColor: c.border,
  };
}
