/**
 * BYOK（密钥）：仅 localStorage
 *   gh-wma-repo   → owner/name
 *   gh-wma-token  → PAT
 *
 * 业务选项（不是密钥）：
 *   wma-account   → 数据文件后缀，如 epi-stats
 */
export const APP = "wma";
export const KEY_REPO = `gh-${APP}-repo`;
export const KEY_TOKEN = `gh-${APP}-token`;
export const KEY_ACCOUNT = `${APP}-account`;

const LEGACY_ACCOUNT = `gh-${APP}-account`;

function cleanAccount(raw) {
  const s = String(raw || "").trim();
  if (!s || s === "[object Object]") return "epi-stats";
  return s;
}

export function loadByok() {
  const account = cleanAccount(
    localStorage.getItem(KEY_ACCOUNT) || localStorage.getItem(LEGACY_ACCOUNT)
  );
  return {
    repo: localStorage.getItem(KEY_REPO) || "",
    token: localStorage.getItem(KEY_TOKEN) || "",
    account,
  };
}

export function saveByok({ repo, token, account }) {
  localStorage.setItem(KEY_REPO, String(repo || "").trim());
  localStorage.setItem(KEY_TOKEN, String(token || "").trim());
  localStorage.setItem(KEY_ACCOUNT, String(account || "epi-stats").trim());
  localStorage.removeItem(LEGACY_ACCOUNT);
}

export function clearByok() {
  localStorage.removeItem(KEY_REPO);
  localStorage.removeItem(KEY_TOKEN);
  // 保留 wma-account
}

export function maskToken(token) {
  const t = String(token || "");
  if (t.length <= 4) return t ? "****" : "";
  return `****${t.slice(-4)}`;
}
