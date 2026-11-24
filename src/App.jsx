import { HashRouter, NavLink, Route, Routes } from "react-router-dom";
import { DataProvider, useData } from "./lib/dataStore.jsx";
import Articles from "./pages/Articles.jsx";
import Categories from "./pages/Categories.jsx";
import Settings from "./pages/Settings.jsx";
import Toc from "./pages/Toc.jsx";
import "./App.css";

function Shell() {
  const { ready, dirty, account, accounts, switchAccount, busy } = useData();
  return (
    <div className="app">
      <header className="top">
        <div className="brand">往期文章工作台</div>
        <nav>
          <NavLink to="/">文章</NavLink>
          <NavLink to="/categories">类目</NavLink>
          <NavLink to="/toc">TOC</NavLink>
          <NavLink to="/settings">设置</NavLink>
        </nav>
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
          <span className={ready ? "pill ok" : "pill"}>{ready ? "已配置 BYOK" : "未配置"}</span>
          {dirty ? <span className="pill warn">未保存</span> : null}
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
