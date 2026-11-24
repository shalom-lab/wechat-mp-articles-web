import { useState } from "react";
import { clearByok, loadByok, maskToken, saveByok } from "../lib/byok.js";
import { testConnection } from "../lib/github.js";
import { useData } from "../lib/dataStore.jsx";

export default function Settings() {
  const { setByok, setError, reload } = useData();
  const initial = loadByok();
  const [repo, setRepo] = useState(initial.repo);
  const [token, setToken] = useState(initial.token);
  const [account, setAccount] = useState(initial.account || "epi-stats");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const dirty =
    repo !== initial.repo ||
    token !== initial.token ||
    account !== (initial.account || "epi-stats");

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setError("");
    try {
      await testConnection({ repo, token });
      saveByok({ repo, token, account });
      setByok(loadByok());
      setMsg("已保存");
      await reload(account);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function onClear() {
    if (!confirm("清除本机仓库与 Token？")) return;
    clearByok();
    setRepo("");
    setToken("");
    setByok(loadByok());
    setMsg("已清除");
  }

  return (
    <div className="page settings-page">
      <form className="card form settings-card" onSubmit={onSave}>
        <label>
          仓库
          <input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="owner/wechat-mp-articles"
            required
            autoComplete="off"
          />
        </label>
        <label>
          Token
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="GitHub PAT"
            required
            autoComplete="off"
          />
        </label>
        <label>
          默认账号
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="epi-stats"
            autoComplete="off"
          />
        </label>

        <div className="settings-actions">
          <div className="row">
            <button type="submit" className="btn sm" disabled={saving || !dirty}>
              {saving ? "验证中…" : "保存"}
            </button>
            <button type="button" className="btn ghost sm" onClick={onClear}>
              清除
            </button>
          </div>
          <p className="settings-status">
            {initial.token ? `Token ${maskToken(initial.token)}` : "未配置 Token"}
            {msg ? ` · ${msg}` : ""}
          </p>
        </div>
      </form>
    </div>
  );
}
