import { HashRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { DataProvider, useData } from "./lib/dataStore.jsx";
import Articles from "./pages/Articles.jsx";
import Categories from "./pages/Categories.jsx";
import Settings from "./pages/Settings.jsx";
import Toc from "./pages/Toc.jsx";
import "./App.css";

function useTabStatus() {
  const { pathname } = useLocation();
  const { ready, dirty, busy, error, info, account, rows, enriched, hasEnrichedFile } =
    useData();

  if (!ready) return { text: "未配置仓库连接", tone: "muted" };
  if (busy) return { text: "加载中…", tone: "muted" };
  if (error) return { text: error, tone: "err" };

  const tab =
    pathname.startsWith("/categories")
      ? "categories"
      : pathname.startsWith("/toc")
        ? "toc"
        : pathname.startsWith("/settings")
          ? "settings"
          : "articles";

  if (tab === "settings") {
    return { text: dirty ? "有未保存的本地设置改动" : "密钥仅存本机", tone: "muted" };
  }

  if (!enriched && !info) {
    return { text: `${account} · 点加载拉取数据`, tone: "muted" };
  }

  if (tab === "categories") {
    const n = enriched?.categories?.length || 0;
    const on = (enriched?.categories || []).filter((c) => c.includeInToc !== false).length;
    return {
      text: `${account} · 类目 ${n} · TOC 显示 ${on}${dirty ? " · 有改动" : ""}`,
      tone: dirty ? "warn" : "ok",
    };
  }

  if (tab === "toc") {
    const news = (enriched?.articles || []).filter(
      (a) => a.includeInToc !== false && a.content_type_label === "图文"
    ).length;
    const pic = (enriched?.articles || []).filter(
      (a) => a.includeInToc !== false && a.content_type_label === "贴图"
    ).length;
    return {
      text: `${account} · 图文 ${news} · 贴图 ${pic}`,
      tone: "ok",
    };
  }

  // articles
  if (info) return { text: info, tone: hasEnrichedFile === false ? "warn" : "ok" };
  return {
    text: `${account} · ${rows.length} 条${dirty ? " · 有改动" : ""}`,
    tone: dirty ? "warn" : "ok",
  };
}

function Shell() {
  const { ready, dirty, account, accounts, switchAccount, busy } = useData();
  const status = useTabStatus();

  return (
    <div className="app">
      <header className="top">
        <NavLink to="/" className="brand" title="往期文章工作台">
          <img className="brand-logo" src="./wechat-oa.svg" alt="微信公众号" width="28" height="28" />
        </NavLink>
        <nav>
          <NavLink to="/">文章</NavLink>
          <NavLink to="/categories">类目</NavLink>
          <NavLink to="/toc">TOC</NavLink>
          <NavLink to="/settings">设置</NavLink>
        </nav>
        <div className={`top-status tone-${status.tone}`} title={status.text}>
          {status.text}
        </div>
        <div className="top-meta">
          <label className="account-switch">
            <span>账号</span>
            <select
              value={account}
              disabled={!ready || busy}
              onChange={(e) => switchAccount(e.target.value)}
            >
              {(accounts.length ? accounts : [{ id: account, hasEnriched: true }]).map(
                (a) => (
                  <option key={a.id} value={a.id}>
                    {a.id}
                    {a.hasEnriched === false ? "（无 enriched）" : ""}
                  </option>
                )
              )}
            </select>
          </label>
          <span className={ready ? "pill ok" : "pill"}>{ready ? "BYOK" : "未配置"}</span>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Articles />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/toc" element={<Toc />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <DataProvider>
        <Shell />
      </DataProvider>
    </HashRouter>
  );
}
