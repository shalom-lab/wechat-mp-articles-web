import { useMemo, useState } from "react";
import { useData } from "../lib/dataStore.jsx";
import {
  buildNewsHtml,
  buildNewsInject,
  buildPicHtml,
  buildPicInject,
  buildPicPreviewGroups,
} from "../lib/toc.js";

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
}

function Panel({
  badge,
  badgeClass,
  title,
  onCopyScript,
  onCopyHtml,
  children,
}) {
  return (
    <section className="panel">
      <div className={"badge" + (badgeClass ? ` ${badgeClass}` : "")}>{badge}</div>
      <h2>{title}</h2>
      <div className="row">
        <button type="button" className="btn sm" onClick={onCopyScript}>
          复制脚本
        </button>
        {onCopyHtml ? (
          <button type="button" className="btn ghost sm" onClick={onCopyHtml}>
            复制 HTML
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function Toc() {
  const { enriched, ready, reload, busy } = useData();
  const [status, setStatus] = useState("");

  const newsDualHtml = useMemo(
    () => (enriched ? buildNewsHtml(enriched, "双列") : ""),
    [enriched]
  );
  const newsSingleHtml = useMemo(
    () => (enriched ? buildNewsHtml(enriched, "单列") : ""),
    [enriched]
  );
  const newsDualInject = useMemo(
    () => (newsDualHtml ? buildNewsInject(newsDualHtml) : ""),
    [newsDualHtml]
  );
  const newsSingleInject = useMemo(
    () => (newsSingleHtml ? buildNewsInject(newsSingleHtml) : ""),
    [newsSingleHtml]
  );

  const picHtml = useMemo(
    () => (enriched ? buildPicHtml(enriched) : ""),
    [enriched]
  );
  const picInject = useMemo(
    () => (enriched ? buildPicInject(enriched) : ""),
    [enriched]
  );
  const picGroups = useMemo(
    () => (enriched ? buildPicPreviewGroups(enriched) : []),
    [enriched]
  );

  async function copy(label, text) {
    try {
      await copyText(text);
      setStatus(`已复制${label}`);
    } catch (e) {
      setStatus(`复制失败：${e}`);
    }
  }

  return (
    <div className="page">
      <div className="toolbar">
        <span className="muted">
          {status || "三列预览：图文双列 / 图文单列 / 贴图单列"}
        </span>
        <div className="row toolbar-actions">
          <button
            className="btn ghost sm"
            type="button"
            disabled={!ready || busy}
            onClick={() => reload()}
          >
            刷新
          </button>
        </div>
      </div>

      {!enriched ? (
        <div className="empty">先加载数据</div>
      ) : (
        <div className="toc-grid">
          <Panel
            badge="图文"
            title="双列 · 径向渐变"
            onCopyScript={() => copy("图文双列脚本", newsDualInject)}
            onCopyHtml={() => copy("图文双列 HTML", newsDualHtml)}
          >
            <div className="phone">
              <div className="article" dangerouslySetInnerHTML={{ __html: newsDualHtml }} />
            </div>
          </Panel>

          <Panel
            badge="图文"
            title="单列 · 径向渐变"
            onCopyScript={() => copy("图文单列脚本", newsSingleInject)}
            onCopyHtml={() => copy("图文单列 HTML", newsSingleHtml)}
          >
            <div className="phone">
              <div className="article" dangerouslySetInnerHTML={{ __html: newsSingleHtml }} />
            </div>
          </Panel>

          <Panel
            badge="贴图"
            badgeClass="pic"
            title="单列 · 引导语"
            onCopyScript={() => copy("贴图脚本", picInject)}
            onCopyHtml={() => copy("贴图 HTML", picHtml)}
          >
            <div className="phone phone-pic">
              <div className="guide">
                {picGroups.map((g, gi) => (
                  <div key={g.category} className={gi ? "pic-group gap" : "pic-group"}>
                    <div className="pic-cat">{g.category}</div>
                    {g.items.map((it) => (
                      <div key={it.href} className="pic-link">
                        <a href={it.href} target="_blank" rel="noreferrer">
                          {it.title}
                        </a>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
