# wechat-mp-article-web

人工微调控制台：通过 **BYOK** 直连 GitHub 上的 `wechat-mp-articles` 数据仓库。

- **不替代** filter / enrich / toc 自动化；正式 TOC HTML / inject 仍由 articles 仓库 `npm run toc:*` 与 `toc-epi-stats` Action 写到 `out/`
- 本应用方便：表格微调 enriched、调整类目顺序/开关/emoji/显示名、预览并复制注入脚本

## BYOK（localStorage）

密钥只有两项：

| 键 | 含义 |
| --- | --- |
| `gh-wma-repo` | `owner/wechat-mp-articles` |
| `gh-wma-token` | GitHub PAT（需 contents 读写） |

另有业务选项（**不是** BYOK）：`wma-account` = 当前账号实例 id（默认 `epi-stats`）。

- **数据分开**：每个账号独立 `articles_<id>.csv` / `enriched_articles_<id>.json`
- **逻辑共用**：同一套加载 / 微调 / TOC 预览 / 保存
- **无 enriched 不报错**：仅有 CSV 也能进控制台；保存时再创建 enriched

可在「设置」填写密钥，顶栏切换账号；启动会自动读 BYOK。

## 数据约定（与 articles 仓库协调）

| 文件 | 角色 |
| --- | --- |
| `data/articles_<id>.csv` | filter 刷新的库存主清单（标题/日期/类型等） |
| `data/enriched_articles_<id>.json` | enrich + **人工** 层：`category` / `displayTitle` / `includeInToc` / `categories[{ name, includeInToc, emoji }]` |

enrich Action **不会**覆盖已有 `category`、`displayTitle`、`includeInToc`，并保留人工类目顺序、开关、`emoji`。类目改名时 Web 会同步 `articles[].category`。

## 本地开发

```bash
npm install
npm run dev
```

## CI/CD（GitHub Pages）

- Workflow：`.github/workflows/pages.yml`（push `main` / 手动）
- Vite `base`: `/wechat-mp-articles-web/`
- 预计地址：`https://shalom-lab.github.io/wechat-mp-articles-web/`

仓库需：Settings → Pages → Source = **GitHub Actions**。

## 页面

1. **文章**：CSV 清单 + 可编辑短标题/类目/是否进 TOC → 保存写回 enriched JSON  
2. **类目**：TOC 顺序、开关、emoji（图文标题用 `emoji+类目名`；改名同步文章归属）  
3. **TOC**：图文/贴图各有双列与单列预览与复制（对齐 articles 的 build-wechat-toc）  
4. **设置**：BYOK
