import { useMemo, useState } from "react";
import { categorySelectStyle } from "../lib/categoryColors.js";
import { useData } from "../lib/dataStore.jsx";

const SORT_KEYS = {
  toc: "includeInToc",
  type: "content_type_label",
  date: "publishedDate",
  title: "title",
  displayTitle: "displayTitle",
  category: "category",
};

function cmpStr(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""), "zh");
}

function SortTh({ id, label, sortKey, sortDir, onSort, className }) {
  const active = sortKey === id;
  return (
    <th className={"sortable" + (className ? ` ${className}` : "")}>
      <button
        type="button"
        className={"sort-btn" + (active ? " is-active" : "")}
        onClick={() => onSort(id)}
      >
        <span>{label}</span>
        <span className="sort-ind" aria-hidden="true">
          {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

export default function Articles() {
  const {
    ready,
    rows,
    enriched,
    busy,
    dirty,
    reload,
    patchArticle,
    saveEnriched,
  } = useData();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部");
  const [tocFilter, setTocFilter] = useState("全部");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  const categories = useMemo(
    () => (enriched?.categories || []).map((c) => c.name),
    [enriched]
  );

  function onSort(id) {
    if (sortKey === id) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(id);
    setSortDir(id === "date" || id === "toc" ? "desc" : "asc");
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (typeFilter !== "全部" && r.content_type_label !== typeFilter) return false;
      if (tocFilter === "开" && !r.includeInToc) return false;
      if (tocFilter === "关" && r.includeInToc) return false;
      if (!needle) return true;
      return (
        r.title.toLowerCase().includes(needle) ||
        r.displayTitle.toLowerCase().includes(needle) ||
        r.category.toLowerCase().includes(needle) ||
        r.content_url.toLowerCase().includes(needle)
      );
    });

    const field = SORT_KEYS[sortKey];
    const dir = sortDir === "asc" ? 1 : -1;
    list = list.slice().sort((a, b) => {
      let r = 0;
      if (sortKey === "toc") {
        r = Number(Boolean(a.includeInToc)) - Number(Boolean(b.includeInToc));
      } else if (sortKey === "date") {
        r = cmpStr(a.publishedDate, b.publishedDate);
      } else {
        r = cmpStr(a[field], b[field]);
      }
      if (r !== 0) return r * dir;
      return cmpStr(a.publishedDate, b.publishedDate) * -1;
    });
    return list;
  }, [rows, q, typeFilter, tocFilter, sortKey, sortDir]);

  return (
    <div className="page">
      <div className="toolbar">
        <input
          className="search"
          placeholder="搜索标题 / 短标题 / 类目 / URL"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option>全部</option>
          <option>图文</option>
          <option>贴图</option>
        </select>
        <select
          value={tocFilter}
          onChange={(e) => setTocFilter(e.target.value)}
          title="按 TOC 开关筛选"
        >
          <option value="全部">TOC 全部</option>
          <option value="开">TOC 开</option>
          <option value="关">TOC 关</option>
        </select>
        <span className="muted nowrap">显示 {filtered.length} / {rows.length}</span>
        <div className="row toolbar-actions">
          <button
            className="btn ghost sm"
            type="button"
            disabled={!ready || busy}
            onClick={() => reload()}
          >
            {busy ? "…" : "加载"}
          </button>
          <button
            className="btn sm"
            type="button"
            disabled={!ready || busy || !dirty || !enriched}
            onClick={() => saveEnriched()}
          >
            保存
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <SortTh id="toc" label="TOC" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortTh id="type" label="类型" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortTh id="date" label="日期" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortTh id="title" label="原标题（CSV）" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortTh id="displayTitle" label="短标题" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortTh id="category" label="类目" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.content_url} className={r.includeInToc ? "" : "dim"}>
                <td>
                  <input
                    type="checkbox"
                    checked={r.includeInToc}
                    title="是否进 TOC"
                    onChange={(e) =>
                      patchArticle(r.content_url, { includeInToc: e.target.checked })
                    }
                  />
                </td>
                <td>
                  <span
                    className={
                      "type-chip" +
                      (r.content_type_label === "贴图"
                        ? " is-pic"
                        : r.content_type_label === "图文"
                          ? " is-news"
                          : "")
                    }
                  >
                    {r.content_type_label || "—"}
                  </span>
                </td>
                <td className="nowrap">{r.publishedDate || "—"}</td>
                <td className="title-cell" title={r.content_url}>
                  <a href={r.content_url} target="_blank" rel="noreferrer">
                    {r.title || r.content_url}
                  </a>
                </td>
                <td>
                  <input
                    className="cell-input"
                    value={r.displayTitle}
                    onChange={(e) =>
                      patchArticle(r.content_url, { displayTitle: e.target.value })
                    }
                  />
                </td>
                <td>
                  <select
                    className="cat-select"
                    value={r.category}
                    style={categorySelectStyle(r.category)}
                    onChange={(e) =>
                      patchArticle(r.content_url, { category: e.target.value })
                    }
                  >
                    <option value="">（未分类）</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? (
          <div className="empty">暂无行数据。先点「加载」，或换账号实例再试。</div>
        ) : null}
      </div>
    </div>
  );
}
