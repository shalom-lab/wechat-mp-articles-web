import { useMemo, useState } from "react";
import { categorySelectStyle } from "../lib/categoryColors.js";
import { useData } from "../lib/dataStore.jsx";

export default function Articles() {
  const {
    ready,
    rows,
    enriched,
    busy,
    error,
    info,
    dirty,
    reload,
    patchArticle,
    saveEnriched,
  } = useData();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部");

  const categories = useMemo(
    () => (enriched?.categories || []).map((c) => c.name),
    [enriched]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "全部" && r.content_type_label !== typeFilter) return false;
      if (!needle) return true;
      return (
        r.title.toLowerCase().includes(needle) ||
        r.displayTitle.toLowerCase().includes(needle) ||
        r.category.toLowerCase().includes(needle) ||
        r.content_url.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, typeFilter]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>文章</h1>
          <p className="muted">短标题 / 类目 / 进 TOC</p>
        </div>
        <div className="row">
          <button
            className="btn ghost"
            type="button"
            disabled={!ready || busy}
            onClick={() => reload()}
          >
            {busy ? "加载中…" : "加载"}
          </button>
          <button
            className="btn"
            type="button"
            disabled={!ready || busy || !dirty || !enriched}
            onClick={() => saveEnriched()}
          >
            保存{dirty ? " *" : ""}
          </button>
        </div>
      </div>

      {error ? <p className="banner err">{error}</p> : null}
      {info ? <p className="banner ok">{info}</p> : null}

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
        <span className="muted">显示 {filtered.length} / {rows.length}</span>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>进 TOC</th>
              <th>类型</th>
              <th>日期</th>
              <th>原标题（CSV）</th>
              <th>短标题</th>
              <th>类目</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.content_url} className={r.includeInToc ? "" : "dim"}>
                <td>
                  <input
                    type="checkbox"
                    checked={r.includeInToc}
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
