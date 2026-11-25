/**
 * 与 wechat-mp-articles/scripts/build-wechat-toc.mjs 对齐的 TOC 渲染（浏览器端）。
 * 数据源：enriched JSON；人工字段 includeInToc / emoji / caption。
 */

/** 缺省装饰；JSON 里有 emoji/caption 时优先用数据 */
export const CATEGORY_META = {
  R语言基础篇: { emoji: "📋", caption: "R语言基础篇" },
  R项目与代码管理: { emoji: "🛠️", caption: "R项目与代码管理" },
  流行病学: { emoji: "👥", caption: "流行病学" },
  R语言作图: { emoji: "📊", caption: "数据可视化" },
  Shiny应用开发: { emoji: "🌐", caption: "Shiny应用" },
  其他: { emoji: "📎", caption: "其他" },
};

function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(s) {
  return escHtml(s).replace(/'/g, "&#39;");
}

export function defaultCategoryMeta(name) {
  const n = String(name || "").trim();
  return CATEGORY_META[n] || { emoji: "📁", caption: n || "未命名" };
}

export function normalizeCategories(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const out = [];
  const seen = new Set();
  for (const c of list) {
    let name = "";
    let includeInToc = true;
    let emoji = "";
    let caption = "";
    if (typeof c === "string") name = c.trim();
    else if (c && typeof c === "object") {
      name = String(c.name || "").trim();
      includeInToc = c.includeInToc !== false;
      emoji = String(c.emoji || "").trim();
      caption = String(c.caption || "").trim();
    }
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const d = defaultCategoryMeta(name);
    out.push({
      name,
      includeInToc,
      emoji: emoji || d.emoji,
      caption: caption || d.caption,
    });
  }
  return out;
}

/** TOC 开启的类目（含 emoji/caption） */
export function resolveTocCategories(categories) {
  return normalizeCategories(categories).filter((c) => c.includeInToc);
}

function sortArticles(list) {
  return list.slice().sort((a, b) =>
    String(a.publishedAt || a.publishedDate || "").localeCompare(
      String(b.publishedAt || b.publishedDate || "")
    )
  );
}

function groupByCategory(articles, categories) {
  const groups = [];
  for (const cat of categories) {
    const name = typeof cat === "string" ? cat : cat.name;
    const meta =
      typeof cat === "object" && cat
        ? cat
        : { name, ...defaultCategoryMeta(name) };
    const items = sortArticles(articles.filter((a) => a.category === name));
    if (items.length) groups.push({ category: meta, items });
  }
  return groups;
}

function splitTwoColumns(items) {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

/** 图文类目标题：emoji + caption */
export function categoryLabel(cat) {
  const name = typeof cat === "string" ? cat : cat?.name;
  const d = defaultCategoryMeta(name);
  const emoji =
    (typeof cat === "object" && String(cat.emoji || "").trim()) || d.emoji;
  const caption =
    (typeof cat === "object" && String(cat.caption || "").trim()) || d.caption;
  return `${emoji}${caption}`;
}

/** 贴图类目标题：caption（无 emoji） */
function categoryLabelPic(cat) {
  if (typeof cat === "object" && cat) {
    return String(cat.caption || cat.name || "").trim();
  }
  return String(cat || "").trim();
}

function filterArticles(all, type) {
  return (all || []).filter(
    (a) =>
      a?.includeInToc !== false &&
      String(a.content_type_label || "").trim() === type &&
      String(a.displayTitle || "").trim() &&
      String(a.content_url || "").trim()
  );
}

function renderLink(article) {
  const href = escAttr(String(article.content_url || "").trim());
  const display = escHtml(article.displayTitle || article.title || "未命名");
  const textvalue = escAttr(article.title || article.displayTitle || "");
  const showType =
    article.item_show_type == null || article.item_show_type === ""
      ? "0"
      : String(article.item_show_type);
  return (
    `<span leaf=""><a class="normal_text_link mp_article_text_link news-class" target="_blank" ` +
    `style="text-decoration: underline;white-space: normal;word-break: break-word;overflow-wrap: anywhere;" ` +
    `href="${href}" textvalue="${textvalue}" ` +
    `data-itemshowtype="${escAttr(showType)}" linktype="text" data-linktype="2">${display}</a></span>`
  );
}

function renderColumn(items) {
  return (
    `<td width="50%" valign="top" style="border: none;width: 50%;overflow: visible;word-break: break-word;` +
    `overflow-wrap: anywhere;background-color: rgb(255, 255, 255);padding: 0 4px;vertical-align: top;">` +
    `<ul style="list-style-type: none;list-style: none;margin: 0;padding-left: 0;overflow: visible;">` +
    items.map((a) => `<li><p>${renderLink(a)}</p></li>`).join("") +
    `</ul></td>`
  );
}

function renderCategoryBlock({ category, items }) {
  const [left, right] = splitTwoColumns(items);
  const title = escHtml(categoryLabel(category));
  const titleBg =
    `background-image: radial-gradient(ellipse 70% 100% at 50% 50%, ` +
    `rgba(0, 122, 170, 0.22) 0%, rgba(0, 122, 170, 0.10) 45%, ` +
    `rgba(0, 122, 170, 0) 100%);background-color: transparent;`;
  return (
    `<section class="news-class" style="border: none;padding: 0;margin: 0;box-sizing: border-box;">` +
    `<p style="text-align: center;margin: 0 0 2px;padding: 6px 4px;${titleBg}">` +
    `<strong><span style="color: rgb(0, 122, 170);"><span leaf="">${title}</span></span></strong></p>` +
    `<table class="news-class" cellpadding="0" cellspacing="0" border="0" ` +
    `style="border: none;border-collapse: collapse;border-width: 0;width: 100%;table-layout: fixed;margin: 0;">` +
    `<colgroup><col style="width: 50%;" /><col style="width: 50%;" /></colgroup>` +
    `<tbody><tr>${renderColumn(left)}${renderColumn(right)}</tr></tbody></table></section>`
  );
}

export function buildNewsHtml(enriched) {
  const cats = resolveTocCategories(enriched.categories);
  const groups = groupByCategory(filterArticles(enriched.articles, "图文"), cats);
  const spacer = `<p style="margin-bottom: 0px;"><span leaf=""><br></span></p>`;
  const footer =
    `<p style="margin-bottom: 0px;"><span style="font-size: var(--articleFontsize);letter-spacing: 0.034em;"></span></p>` +
    `<section><span leaf=""><br></span></section>` +
    `<p style="display: none;"><mp-style-type data-value="3"></mp-style-type></p>`;
  return groups.map(renderCategoryBlock).join(spacer) + footer + "\n";
}

export function buildNewsInject(html) {
  return (
    `var content = ${JSON.stringify(html)};\n` +
    `window.__MP_Editor_JSAPI__.invoke({\n` +
    `  apiName: 'mp_editor_set_content',\n` +
    `  apiParam: { content: content },\n` +
    `  sucCb: (res) => { console.log('设置成功', res) },\n` +
    `  errCb: (err) => { console.log('设置失败', err) }\n` +
    `});\n`
  );
}

export function buildPicInject(enriched) {
  const cats = resolveTocCategories(enriched.categories);
  const groups = groupByCategory(filterArticles(enriched.articles, "贴图"), cats).map(
    ({ category, items }) => ({
      category: categoryLabelPic(category),
      items: items.map((a) => ({
        title: String(a.displayTitle || a.title || "未命名").trim(),
        href: String(a.content_url || "").trim(),
        itemShowType: String(
          a.item_show_type == null || a.item_show_type === "" ? 8 : a.item_show_type
        ),
      })),
    })
  );

  return (
    `(() => {\n` +
    `  const groups = ${JSON.stringify(groups, null, 2)};\n\n` +
    `  const guide = document.querySelector('#guide_words_main');\n` +
    `  if (!guide) throw new Error('未找到 #guide_words_main（请确认在贴图编辑页）');\n` +
    `  const pm = document.querySelector('.share-text__input .ProseMirror');\n` +
    `  if (pm) pm.style.lineHeight = '1.35';\n\n` +
    `  const vue = guide.__vue__;\n` +
    `  if (!vue || !vue.$children || !vue.$children[0] || !vue.$children[0].getView) {\n` +
    `    throw new Error('guide_words Vue/ProseMirror 未就绪');\n` +
    `  }\n` +
    `  const view = vue.$children[0].getView();\n` +
    `  const { schema } = view.state;\n` +
    `  const br = () => schema.nodes.hardbreak.create();\n` +
    `  const uid = () => 'id' + Math.random().toString(36).slice(2, 10);\n` +
    `  const linkText = (it) =>\n` +
    `    schema.text(it.title, [\n` +
    `      schema.marks.link.create({\n` +
    `        href: it.href,\n` +
    `        itemShowType: String(it.itemShowType),\n` +
    `        uniqueId: uid(),\n` +
    `      }),\n` +
    `    ]);\n\n` +
    `  const nodes = [];\n` +
    `  groups.forEach((g, gi) => {\n` +
    `    if (gi) nodes.push(br(), br());\n` +
    `    nodes.push(schema.text(g.category));\n` +
    `    g.items.forEach((it) => {\n` +
    `      nodes.push(br(), linkText(it));\n` +
    `    });\n` +
    `  });\n` +
    `  nodes.push(br());\n\n` +
    `  view.dispatch(view.state.tr.replaceWith(0, view.state.doc.content.size, nodes));\n` +
    `  const content = vue.getContent ? vue.getContent() : null;\n` +
    `  console.log('贴图引导语已写入', { groups: groups.length, content });\n` +
    `  return content;\n` +
    `})();\n`
  );
}

export function buildPicPreviewGroups(enriched) {
  const cats = resolveTocCategories(enriched.categories);
  return groupByCategory(filterArticles(enriched.articles, "贴图"), cats).map(
    ({ category, items }) => ({
      category: categoryLabelPic(category),
      items: items.map((a) => ({
        title: String(a.displayTitle || a.title || "未命名").trim(),
        href: String(a.content_url || "").trim(),
      })),
    })
  );
}
