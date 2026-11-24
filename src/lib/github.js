/** GitHub Contents API（浏览器直连，BYOK token） */

function splitRepo(repo) {
  const [owner, name] = String(repo || "").trim().split("/");
  if (!owner || !name) throw new Error("仓库格式应为 owner/name");
  return { owner, name };
}

function authHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function testConnection({ repo, token }) {
  const { owner, name } = splitRepo(repo);
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
    headers: authHeaders(token),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error("认证失败：请检查 PAT 权限（需 repo 内容读写）与仓库名");
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`连接失败 ${res.status}：${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function getFile({ repo, token, path }) {
  const { owner, name } = splitRepo(repo);
  const url = `https://api.github.com/repos/${owner}/${name}/contents/${encodeURI(path)}`;
  const res = await fetch(url, { headers: authHeaders(token) });
  if (res.status === 404) {
    const err = new Error(`文件不存在：${path}`);
    err.code = "NOT_FOUND";
    throw err;
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error("读取失败：PAT 无权限或已失效");
  }
  if (!res.ok) throw new Error(`读取失败 ${res.status}`);
  const data = await res.json();
  if (data.encoding !== "base64" || !data.content) {
    throw new Error("无法解析文件内容");
  }
  const text = decodeURIComponent(
    escape(atob(data.content.replace(/\n/g, "")))
  );
  return { text, sha: data.sha, path: data.path };
}

/** 列出 data/ 下可用账号实例（有 articles_*.csv 即可） */
export async function listAccounts({ repo, token }) {
  const { owner, name } = splitRepo(repo);
  const url = `https://api.github.com/repos/${owner}/${name}/contents/data`;
  const res = await fetch(url, { headers: authHeaders(token) });
  if (res.status === 404) return [];
  if (res.status === 401 || res.status === 403) {
    throw new Error("列出账号失败：PAT 无权限或已失效");
  }
  if (!res.ok) throw new Error(`列出 data/ 失败 ${res.status}`);
  const items = await res.json();
  if (!Array.isArray(items)) return [];
  const csvIds = new Set();
  const enrichedIds = new Set();
  for (const it of items) {
    const n = String(it.name || "");
    const mCsv = n.match(/^articles_(.+)\.csv$/);
    if (mCsv) csvIds.add(mCsv[1]);
    const mEn = n.match(/^enriched_articles_(.+)\.json$/);
    if (mEn) enrichedIds.add(mEn[1]);
  }
  return [...csvIds].sort().map((id) => ({
    id,
    hasCsv: true,
    hasEnriched: enrichedIds.has(id),
  }));
}

export async function putFile({ repo, token, path, content, sha, message }) {
  const { owner, name } = splitRepo(repo);
  const url = `https://api.github.com/repos/${owner}/${name}/contents/${encodeURI(path)}`;
  const body = {
    message: message || `chore: update ${path}`,
    content: btoa(unescape(encodeURIComponent(content))),
  };
  // 新建文件不传 sha；更新必须带当前 sha
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error("写入失败：PAT 需有 contents:write");
  }
  if (res.status === 409) {
    throw new Error("写入冲突：远端已更新，请先重新加载再保存");
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`写入失败 ${res.status}：${t.slice(0, 240)}`);
  }
  return res.json();
}

export function enrichedPath(account) {
  return `data/enriched_articles_${account}.json`;
}

export function csvPath(account) {
  return `data/articles_${account}.csv`;
}
