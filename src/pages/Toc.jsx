import { useMemo, useState } from "react";
import { useData } from "../lib/dataStore.jsx";
import {
  buildNewsHtml,
  buildNewsInject,
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

export default function Toc() {
  const { enriched, ready, reload, busy } = useData();
  const [status, setStatus] = useState("");

  const newsHtml = useMemo(
    () => (enriched ? buildNewsHtml(enriched) : ""),
    [enriched]
  );
  const newsInject = useMemo(
    () => (newsHtml ? buildNewsInject(newsHtml) : ""),
    [newsHtml]
  );
  const picInject = useMemo(
    () => (enriched ? buildPicInject(enriched) : ""),
    [enriched]
  );
  const picGroups = useMemo(
    () => (enriched ? buildPicPreviewGroups(enriched) : []),
    [enriched]
  );

  async function copy(kind) {
    try {
      const text = kind === "news-html" ? newsHtml : kind === "news" ? newsInject : picInject;
      await copyText(text);
      setStatus(
        kind === "news-html"
          ? "已复制 HTML"
          : kind === "news"
            ? "已复制图文脚本"
            : "已复制贴图脚本"
      );
    } catch (e) {
      setStatus(`复制失败：${e}`);
    }
  }

  return (
    <div className="page">
      <div className="toolbar">
        <span className="muted">{status || "预览并复制注入脚本"}</span>
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
          <section className="panel">
            <div className="badge">图文</div>
            <h2>径向渐变 · 等宽双列</h2>
            <div className="row">
              <button type="button" className="btn sm" onClick={() => copy("news")}>
                复制脚本
              </button>
              <button type="button" className="btn ghost sm" onClick={() => copy("news-html")}>
                复制 HTML
              </button>
            </div>
            <div className="phone">
              <div className="article" dangerouslySetInnerHTML={{ __html: newsHtml }} />
            </div>
          </section>

          <section className="panel">
            <div className="badge pic">贴图</div>
            <h2>引导语单列</h2>
            <div className="row">
              <button type="button" className="btn sm" onClick={() => copy("pic")}>
                复制脚本
              </button>
            </div>
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
          </section>
        </div>
      )}
    </div>
  );
}
