/** 简易 RFC4180 CSV 解析 / 序列化 */

export function parseCsv(text) {
  const raw = String(text || "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;
  while (i < raw.length) {
    const c = raw[i];
    if (inQuotes) {
      if (c === '"') {
        if (raw[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }
    if (c === "\r") {
      i += 1;
      continue;
    }
    if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i += 1;
      continue;
    }
    cell += c;
    i += 1;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((x) => String(x || "").trim()))
    .map((r) => {
      const obj = {};
      header.forEach((h, idx) => {
        obj[h] = r[idx] ?? "";
      });
      return obj;
    });
}

function escCell(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows, columns) {
  const cols =
    columns ||
    (rows[0] ? Object.keys(rows[0]) : []);
  const lines = [cols.join(",")];
  for (const row of rows) {
    lines.push(cols.map((c) => escCell(row[c])).join(","));
  }
  return `${lines.join("\n")}\n`;
}
