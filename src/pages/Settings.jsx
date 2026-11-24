import { useState } from "react";
import {
  KEY_ACCOUNT,
  KEY_REPO,
  KEY_TOKEN,
  clearByok,
  loadByok,
  maskToken,
  saveByok,
} from "../lib/byok.js";
import { testConnection } from "../lib/github.js";
import { useData } from "../lib/dataStore.jsx";

export default function Settings() {
  const { setByok, setInfo, setError } = useData();
  const initial = loadByok();
  const [repo, setRepo] = useState(initial.repo);
  const [token, setToken] = useState(initial.token);
  const [account, setAccount] = useState(initial.account || "epi-stats");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setError("");
    try {
      await testConnection({ repo, token });
      saveByok({ repo, token, account });
      setByok(loadByok());
      setMsg("已保存并验证通过");
      setInfo("设置已更新，可到「文章」页加载数据");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function onClear() {
    if (!confirm("确定清除本机仓库与 Token？")) return;
    clearByok();
    setRepo("");
    setToken("");
    setByok(loadByok());
    setMsg("已清除");
  }

  return (
    <div className="page">
      <h1>设置</h1>
      <p className="muted">
        BYOK：<code>{KEY_REPO}</code> + <code>{KEY_TOKEN}</code>（本机 localStorage）。数据在
        wechat-mp-articles，本站不存业务数据。
      </p>
      <form className="card form" onSubmit={onSave}>
        <label>
          仓库 owner/name
          <input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="owner/wechat-mp-articles"
            required
          />
        </label>
        <label>
          GitHub PAT
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_…"
            required
          />
        </label>
        <label>
          默认账号实例（多实例共用同一套逻辑；顶栏可切换）
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="epi-stats"
          />
        </label>
        <p className="muted">
          每个账号对应独立的 <code>articles_&lt;id&gt;.csv</code> /
          <code>enriched_articles_&lt;id&gt;.json</code>。没有 enriched
          不会报错，可先看 CSV；保存时再新建。
        </p>
        <div className="row">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "验证中…" : "保存"}
          </button>
          <button type="button" className="btn ghost" onClick={onClear}>
            清除
          </button>
        </div>
        {initial.token ? (
          <p className="muted">当前已保存 Token：{maskToken(initial.token)}</p>
        ) : (
          <p className="muted">尚未保存 Token</p>
        )}
        {msg ? <p className={msg.includes("通过") ? "ok" : "err"}>{msg}</p> : null}
      </form>
    </div>
  );
}
