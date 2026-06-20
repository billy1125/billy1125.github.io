# tradiagram.com — GEO / AEO 優化執行計劃（對齊現況版）

> 本檔已依實際盤點重寫。原版以「全新網站」假設撰寫，但盤點後發現 robots/sitemap/meta/OG
> 多半已完成，因此本版改為標記狀態並聚焦真正缺口。
> 狀態標記：`[x]` 已完成、`[~]` 部分完成需補、`[ ]` 待做。

---

## 0. 專案背景（Context）

- **網站**：https://tradiagram.com/
- **性質**：以台鐵 / 交通部公共運輸整合資訊平臺 open data，繪製台灣鐵路「列車運行圖」的工具站。
- **核心特徵**：主要價值是**互動式圖形（運行圖）**，由 JavaScript 在前端繪製。
- **對 GEO 的關鍵影響**：**AI 爬蟲讀不到圖裡的資訊**。因此重心是
  1. 讓爬蟲能順利抓到頁面，且
  2. **補上「可被文字索引、可被 AI 引用」的說明性內容**（最大缺口、最高優先）。

### 目標
1. **被動找到**：讓 AI/搜尋爬蟲能爬取、理解網站結構與用途。
2. **主動引用**：當使用者問「台灣鐵路運行圖哪裡看」「什麼是運行圖」「某車次怎麼查」時，AI 會引用本站。

---

## 現況盤點摘要（2026-06，本計劃的依據）

**已完成（原計劃要做、但其實已存在）：**
- `robots.txt`、`sitemap.xml`、`CNAME`（tradiagram.com）、Google Search Console 驗證檔、`ads.txt`
- 所有主要頁面都有獨特 `<title>` / `description` / keywords / `canonical` / 完整 OG / Twitter Card
- `index.html` 把全部 14 條路線 + 區間以**靜態 HTML** 卡片呈現（爬蟲可讀）
- `diagram_output.html` 有豐富的 `<noscript>` fallback，列出全部 14 條路線與資料來源
- `lines.html` 已依 `lineKind` 動態更新 canonical / og:url / og:title

**實際缺口（本計劃要做的）：**
- ❌ 全站無任何 JSON-LD 結構化資料
- ❌ 無 `llms.txt`
- ❌ 無內容說明頁：`about-diagram.html` / `glossary.html` / `faq.html`（**最高優先**）
- ⚠️ `sitemap.xml` 缺 `terms.html`、缺基準 URL、`lastmod` 偏舊、缺即將新增的內容頁
- ⚠️ `privacy.html` / `terms.html` / `about.html` 的 `<title>` 是通用字串
- ⚠️ `lines.html` / `trains.html` 無靜態 fallback 文字
- ⚠️ `diagram_output_old.html` 完全無 meta → 加 `noindex`
- ⚠️ `robots.txt` 極簡，未明列歡迎 AI 爬蟲

詳細逐頁盤點見 `SEO_AUDIT.md`。

---

## Phase 1：技術零碎修正（低風險、快速）

### 1.1 `[~]` robots.txt 明列歡迎 AI 爬蟲
- 在 `User-agent: * / Allow: /` 之外，補上 GPTBot、OAI-SearchBot、ChatGPT-User、ClaudeBot、
  Claude-Web、PerplexityBot、Google-Extended、Bingbot 的 `Allow: /` 段落，保留 Sitemap 行。

### 1.2 `[~]` sitemap.xml 補齊
- 補 `terms.html`、`lines.html` / `diagram_output.html` 的無參數基準 URL。
- 更新 `<lastmod>`；新增內容頁時一併加入。

### 1.3 `[~]` 修正通用 `<title>`
- `privacy.html` → `隱私權政策 | 台灣鐵路/軌道運行圖`
- `terms.html` → `使用者條款 | 台灣鐵路/軌道運行圖`
- `about.html` → `關於本站 | 台灣鐵路/軌道運行圖`

### 1.4 `[ ]` diagram_output_old.html 加 noindex
- `<head>` 加 `<meta name="robots" content="noindex">`，避免舊版渲染器頁產生重複內容。

---

## Phase 2：結構化資料 JSON-LD

> 以 `<script type="application/ld+json">` 注入各頁 `<head>`，純靜態、不依賴 JS。

- 2.1 `[ ]` `index.html`：`Organization` + `WebSite`（含 `SearchAction`，對應站內搜尋）。
- 2.2 `[ ]` `faq.html`：`FAQPage`，與 Q&A 內容一一對應。
- 2.3 `[ ]` 各內容頁：`BreadcrumbList`。

> 註：Android App 已下架，全站不再呈現 App / Google Play 相關資訊，故移除原 `SoftwareApplication` 項目。
- 驗收：Google Rich Results Test 無錯誤。

---

## Phase 3：內容頁（**最高優先**）

> 寫作格式：問句當標題 + 段落開頭 2–3 句先給結論（倒金字塔）+ 清楚 H2/H3 + 用具體資料。
> 新頁沿用版型：`<site-navbar>` / `<site-footer>`、Bootstrap 5.3、`css/web.css`，
> 並補齊 title/description/canonical/OG/Twitter，加入 sitemap、llms.txt、navbar。

- 3.1 `[ ]` `about-diagram.html` —「運行圖是什麼？怎麼看？」（橫軸=時間、縱軸=車站、斜線=列車、斜率=速度、交叉=會車/待避）。
- 3.2 `[ ]` `glossary.html` — 名詞表（西部幹線/山線/海線/東部幹線/區間車/對號列車/車次/運行圖/待避/會車…）。
- 3.3 `[ ]` `faq.html` — Q&A（口語題目，首句直接回答），套 `FAQPage`。
- 3.4 `[ ]` `lines.html` / `trains.html` 補靜態 fallback 說明文字（標題 + 用途 + 路線清單）。

---

## Phase 4：llms.txt
- `[ ]` 根目錄建立 `llms.txt`，Markdown 索引重要頁面，連結指向實際建立的內容頁檔名。

---

## Phase 5：站外曝光與成效追蹤（多為人工，Claude 只產草稿）
- 5.1 `[ ]` 草擬站外簡介文字（維基外部連結、鐵道論壇介紹、FB 粉專置頂）—**只產草稿，不自動發布**。（App 已下架，不含 Google Play 相關曝光。）
- 5.2 `[ ]` 確認 Google Search Console 已提交更新後的 sitemap。
- 5.3 `[ ]` 在 `SEO_AUDIT.md` 補可重複執行的驗證清單（AI 實測查詢、server log 觀察 AI bot）。

---

## 14 條路線對照表（供內容頁與 fallback 文字重用）

來源：`js/config.js`（`dict_line`）+ `js/references/OperationLines.json`。

| 代碼 | 路線 | 區間 |
|---|---|---|
| LINE_WN | 西部幹線北段 | 基隆–竹南 |
| LINE_WM | 西部幹線山線 | 竹南–彰化（經苗栗）|
| LINE_WSEA | 西部幹線海線 | 竹南–彰化（經大甲）|
| LINE_WS | 西部幹線南段 | 彰化–高雄 |
| LINE_P | 屏東線 | 高雄–枋寮 |
| LINE_S | 南迴線 | 枋寮–台東 |
| LINE_T | 台東線 | 花蓮–台東 |
| LINE_N | 北迴線 | 蘇澳新–花蓮 |
| LINE_I | 宜蘭線 | 八堵–蘇澳 |
| LINE_PX | 平溪深澳線 | 八斗子–菁桐 |
| LINE_NW | 內灣線 | 新竹–內灣 |
| LINE_LJ | 六家線 | 新竹–六家 |
| LINE_J | 集集線 | 二水–車埕 |
| LINE_SL | 沙崙線 | 中洲–沙崙 |

---

## 執行原則
0. **開新分支執行**（如 `seo/geo-aeo-content`），完成後開 PR 合併。
1. **不破壞運行圖功能**：改動限於附加文字 / meta / JSON-LD / 新檔，不動 `time_space.js`、`diagram_d3.js` 等繪圖邏輯。
2. **小步提交**：每任務獨立 commit，message 註明計劃編號。
3. **新頁沿用版型**：header / footer / 樣式一致。
4. **對外文字 zh-TW**，技術術語可保留英文。
5. **不要塞關鍵字 / 灌水**；內容要有實際資訊價值。
6. **站外曝光只產草稿**，不自動發布。
7. 每個 Phase 完成後更新 `SEO_AUDIT.md` 進度。

## 不要做的事
- ❌ 不封鎖 AI 爬蟲（除非後台 / 私密頁才精準 Disallow）。
- ❌ 不為 SEO 塞關鍵字或灌水。
- ❌ 不把運行圖改成需登入或擋爬蟲。
- ❌ 不自動對外發布貼文 / 送表單 / 改帳號設定。
