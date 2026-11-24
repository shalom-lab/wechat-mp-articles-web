import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadByok, saveByok } from "./byok.js";
import {
  csvPath,
  enrichedPath,
  getFile,
  listAccounts,
  putFile,
} from "./github.js";
import { parseCsv } from "./csv.js";
import { normalizeCategories } from "./toc.js";

const DataCtx = createContext(null);

function emptyEnriched(account) {
  return {
    updatedAt: null,
    account,
    categories: [],
    article_count: 0,
    enriched_count: 0,
    articles: [],
  };
}

function normalizeEnriched(data, account) {
  const next = data && typeof data === "object" ? { ...data } : emptyEnriched(account);
  next.account = next.account || account;
  next.categories = normalizeCategories(next.categories);
  next.articles = (next.articles || []).map((a) => ({
    ...a,
    includeInToc: a.includeInToc !== false,
  }));
  return next;
}

export function DataProvider({ children }) {
  const [byok, setByok] = useState(() => loadByok());
  const [accounts, setAccounts] = useState([]);
  const [enriched, setEnriched] = useState(null);
  const [enrichedSha, setEnrichedSha] = useState("");
  const [hasEnrichedFile, setHasEnrichedFile] = useState(false);
  const [csvRows, setCsvRows] = useState([]);
  const [csvSha, setCsvSha] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setByok(loadByok());
  }, []);

  const ready = Boolean(byok.repo && byok.token);
  const account = byok.account || "epi-stats";

  async function refreshAccountList() {
    if (!ready) {
      setAccounts([]);
      return [];
    }
    const list = await listAccounts({ repo: byok.repo, token: byok.token });
    setAccounts(list);
    return list;
  }

  async function reload(nextAccount) {
    setError("");
    setInfo("");
    if (!ready) {
      setError("请先在设置页配置仓库与 Token");
      return;
    }
    setBusy(true);
    try {
      const list = await refreshAccountList();
      // 只接受字符串 id；避免 onClick={reload} 把事件对象当成账号
      const raw =
        typeof nextAccount === "string" && nextAccount.trim()
          ? nextAccount.trim()
          : String(account || "").trim();
      let id = raw || list[0]?.id || "epi-stats";
      if (id !== account) {
        const next = { ...byok, account: id };
        saveByok(next);
        setByok(next);
      }

      // CSV 是实例主清单；没有 CSV 才算硬失败
      let csvFile;
      try {
        csvFile = await getFile({
          repo: byok.repo,
          token: byok.token,
          path: csvPath(id),
        });
      } catch (e) {
        if (e && e.code === "NOT_FOUND") {
          setCsvRows([]);
          setCsvSha("");
          setEnriched(emptyEnriched(id));
          setEnrichedSha("");
          setHasEnrichedFile(false);
          setDirty(false);
          setInfo(`账号 ${id}：尚未有 articles_*.csv（filter 后再来）`);
          return;
        }
        throw e;
      }

      const rows = parseCsv(csvFile.text);
      setCsvRows(rows);
      setCsvSha(csvFile.sha);

      // enriched 可缺：多实例里有的号还没跑 enrich，不报错
      let enFile = null;
      try {
        enFile = await getFile({
          repo: byok.repo,
          token: byok.token,
          path: enrichedPath(id),
        });
      } catch (e) {
        if (!(e && e.code === "NOT_FOUND")) throw e;
      }

      if (enFile) {
        const data = normalizeEnriched(JSON.parse(enFile.text), id);
        setEnriched(data);
        setEnrichedSha(enFile.sha);
        setHasEnrichedFile(true);
        setDirty(false);
        setInfo(
          `已加载 ${id}：CSV ${rows.length} 条 · enriched ${data.articles?.length || 0} 条`
        );
      } else {
        // 用 CSV 搭空壳，便于先看库存；保存时会新建 enriched 文件
        const shell = emptyEnriched(id);
        shell.articles = rows.map((r) => ({
          content_url: String(r.content_url || "").trim(),
          title: r.title || "",
          publishedDate: r.publishedDate || null,
          publishedAt: r.publishedAt || null,
          content_type_label: r.content_type_label || "",
          item_show_type: r.item_show_type || null,
          category: "",
          displayTitle: "",
          includeInToc: true,
          enrichedAt: null,
        }));
        shell.article_count = shell.articles.length;
        setEnriched(shell);
        setEnrichedSha("");
        setHasEnrichedFile(false);
        setDirty(false);
        setInfo(
          `已加载 ${id}：CSV ${rows.length} 条 · 尚无 enriched（可先微调，保存会新建）`
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function switchAccount(id) {
    if (!id || id === account) return;
    if (dirty && !confirm("当前有未保存修改，切换账号将丢弃，继续？")) return;
    reload(id);
  }

  function patchArticle(url, patch) {
    setEnriched((prev) => {
      if (!prev) return prev;
      const articles = prev.articles.map((a) =>
        a.content_url === url ? { ...a, ...patch } : a
      );
      return { ...prev, articles };
    });
    setDirty(true);
  }

  function setCategories(categories) {
    setEnriched((prev) => (prev ? { ...prev, categories } : prev));
    setDirty(true);
  }

  async function saveEnriched(message) {
    if (!enriched || !ready) return;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const id = account;
      const payload = {
        ...enriched,
        account: id,
        updatedAt: new Date().toISOString(),
        article_count: enriched.articles?.length || 0,
        enriched_count: (enriched.articles || []).filter(
          (a) =>
            String(a.category || "").trim() && String(a.displayTitle || "").trim()
        ).length,
      };
      const text = `${JSON.stringify(payload, null, 2)}\n`;
      const res = await putFile({
        repo: byok.repo,
        token: byok.token,
        path: enrichedPath(id),
        content: text,
        sha: enrichedSha || undefined,
        message:
          message ||
          `chore(data): manual tune enriched_articles_${id} via wma-web`,
      });
      setEnriched(payload);
      setEnrichedSha(res.content?.sha || enrichedSha);
      setHasEnrichedFile(true);
      setDirty(false);
      setInfo(
        hasEnrichedFile
          ? `已写回 ${id} 的 enriched（Action 不会覆盖人工字段）`
          : `已为 ${id} 新建 enriched 文件`
      );
      await refreshAccountList();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const rows = useMemo(() => {
    if (!enriched) return [];
    const byUrl = new Map(
      (enriched.articles || []).map((a) => [a.content_url, a])
    );
    const seen = new Set();
    const list = [];
    for (const c of csvRows) {
      const url = String(c.content_url || "").trim();
      if (!url) continue;
      seen.add(url);
      const en = byUrl.get(url) || {};
      list.push({
        content_url: url,
        title: c.title || en.title || "",
        publishedDate: c.publishedDate || en.publishedDate || "",
        content_type_label: c.content_type_label || en.content_type_label || "",
        category: en.category || "",
        displayTitle: en.displayTitle || "",
        includeInToc: en.includeInToc !== false,
        enrichedAt: en.enrichedAt || "",
      });
    }
    for (const a of enriched.articles || []) {
      const url = String(a.content_url || "").trim();
      if (!url || seen.has(url)) continue;
      list.push({
        content_url: url,
        title: a.title || "",
        publishedDate: a.publishedDate || "",
        content_type_label: a.content_type_label || "",
        category: a.category || "",
        displayTitle: a.displayTitle || "",
        includeInToc: a.includeInToc !== false,
        enrichedAt: a.enrichedAt || "",
      });
    }
    return list;
  }, [enriched, csvRows]);

  const value = {
    byok,
    setByok,
    ready,
    account,
    accounts,
    enriched,
    hasEnrichedFile,
    csvRows,
    csvSha,
    rows,
    busy,
    error,
    info,
    dirty,
    setError,
    setInfo,
    reload,
    switchAccount,
    patchArticle,
    setCategories,
    saveEnriched,
  };

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error("useData outside provider");
  return ctx;
}
