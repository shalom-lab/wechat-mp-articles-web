import { useState } from "react";
import { defaultCategoryMeta } from "../lib/toc.js";
import { useData } from "../lib/dataStore.jsx";

function IconUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 14.5 12 8.5l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9.5 12 15.5l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Categories() {
  const {
    ready,
    enriched,
    busy,
    dirty,
    reload,
    setCategories,
    renameCategory,
    saveEnriched,
  } = useData();
  const [pendingDelete, setPendingDelete] = useState(null);

  const cats = enriched?.categories || [];
  const pendingName =
    pendingDelete == null ? "" : String(cats[pendingDelete]?.name || "");

  function move(idx, dir) {
    setPendingDelete(null);
    const next = [...cats];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setCategories(next);
  }

  function toggle(idx, checked) {
    const next = cats.map((c, i) =>
      i === idx ? { ...c, includeInToc: checked } : c
    );
    setCategories(next);
  }

  function patch(idx, fields) {
    setCategories(cats.map((c, i) => (i === idx ? { ...c, ...fields } : c)));
  }

  function rename(idx, name) {
    renameCategory(idx, name);
  }

  function add() {
    setPendingDelete(null);
    const d = defaultCategoryMeta("新类目");
    setCategories([
      ...cats,
      { name: "新类目", includeInToc: true, emoji: d.emoji },
    ]);
  }

  function askDelete(idx) {
    setPendingDelete(idx);
  }

  function cancelDelete() {
    setPendingDelete(null);
  }

  function confirmDelete() {
    if (pendingDelete == null) return;
    setCategories(cats.filter((_, i) => i !== pendingDelete));
    setPendingDelete(null);
  }

  return (
    <div className="page">
      <div className="toolbar">
        <span className="muted">勾选 = TOC · 改名会同步文章归属 · emoji 用于图文标题</span>
        <div className="row toolbar-actions">
          <button
            className="btn ghost sm"
            type="button"
            disabled={!ready || busy}
            onClick={() => reload()}
          >
            加载
          </button>
          <button className="btn ghost sm" type="button" disabled={!enriched} onClick={add}>
            新增
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

      <div className="card">
        <div className="cat-head muted">
          <span className="cat-head-toc">TOC</span>
          <span className="cat-head-emoji">emoji</span>
          <span className="cat-head-name">类目名</span>
          <span className="cat-head-actions" />
        </div>
        <ol className="cat-list">
          {cats.map((c, idx) => (
            <li key={`cat-row-${idx}`}>
              <input
                type="checkbox"
                checked={c.includeInToc !== false}
                onChange={(e) => toggle(idx, e.target.checked)}
                title="TOC"
              />
              <input
                className="cell-input cat-emoji"
                value={c.emoji || ""}
                title="emoji"
                onChange={(e) => patch(idx, { emoji: e.target.value })}
              />
              <input
                className="cell-input cat-name"
                value={c.name}
                title="类目名（文章归属 + TOC 标题）"
                onChange={(e) => rename(idx, e.target.value)}
              />
              <div className="icon-actions">
                <button
                  type="button"
                  className="icon-btn"
                  title="上移"
                  disabled={idx === 0}
                  onClick={() => move(idx, -1)}
                >
                  <IconUp />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="下移"
                  disabled={idx === cats.length - 1}
                  onClick={() => move(idx, 1)}
                >
                  <IconDown />
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  title="删除"
                  onClick={() => askDelete(idx)}
                >
                  <IconTrash />
                </button>
              </div>
            </li>
          ))}
        </ol>
        {!cats.length ? <p className="muted">暂无类目，先加载数据</p> : null}
      </div>

      {pendingDelete != null ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={cancelDelete}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cat-del-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="cat-del-title">删除类目</h3>
            <p>
              确认删除「{pendingName || "未命名"}」？保存后才会写回仓库；文章里挂的该类目名不会自动清空。
            </p>
            <div className="modal-actions">
              <button type="button" className="btn ghost sm" onClick={cancelDelete}>
                取消
              </button>
              <button type="button" className="btn sm danger" onClick={confirmDelete}>
                删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
