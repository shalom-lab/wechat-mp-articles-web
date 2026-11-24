import { useData } from "../lib/dataStore.jsx";

export default function Categories() {
  const {
    ready,
    enriched,
    busy,
    dirty,
    error,
    info,
    reload,
    setCategories,
    saveEnriched,
  } = useData();

  const cats = enriched?.categories || [];

  function move(idx, dir) {
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

  function rename(idx, name) {
    const next = cats.map((c, i) => (i === idx ? { ...c, name } : c));
    setCategories(next);
  }

  function add() {
    setCategories([...cats, { name: "新类目", includeInToc: true }]);
  }

  function remove(idx) {
    if (!confirm(`删除类目「${cats[idx].name}」？`)) return;
    setCategories(cats.filter((_, i) => i !== idx));
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>类目与 TOC 顺序</h1>
          <p className="muted">
            数组顺序即 TOC 展示顺序；关闭「进 TOC」则整类不出现。enrich Action
            会保留你的顺序与开关，只把代码里新增的默认类目追加到末尾。
          </p>
        </div>
        <div className="row">
          <button className="btn ghost" type="button" disabled={!ready || busy} onClick={reload}>
            加载
          </button>
          <button className="btn ghost" type="button" disabled={!enriched} onClick={add}>
            新增类目
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
      {error ? <p className="err">{error}</p> : null}
      {info ? <p className="ok">{info}</p> : null}

      <div className="card">
        <ol className="cat-list">
          {cats.map((c, idx) => (
            <li key={`${c.name}-${idx}`}>
              <input
                type="checkbox"
                checked={c.includeInToc !== false}
                onChange={(e) => toggle(idx, e.target.checked)}
                title="进 TOC"
              />
              <input
                className="cell-input"
                value={c.name}
                onChange={(e) => rename(idx, e.target.value)}
              />
              <button type="button" className="btn ghost sm" onClick={() => move(idx, -1)}>
                上移
              </button>
              <button type="button" className="btn ghost sm" onClick={() => move(idx, 1)}>
                下移
              </button>
              <button type="button" className="btn ghost sm danger" onClick={() => remove(idx)}>
                删
              </button>
            </li>
          ))}
        </ol>
        {!cats.length ? <p className="muted">暂无数据，先加载 enriched JSON</p> : null}
      </div>
    </div>
  );
}
