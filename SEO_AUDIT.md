# SEO / GEO 盤點與進度（SEO_AUDIT.md）

> 對應 `GEO_AEO_PLAN.md`。盤點基準日：2026-06-20。
> 狀態：`[x]` 已完成、`[~]` 部分完成、`[ ]` 待做。

## 一、站台基礎檔案

| 項目 | 狀態 | 說明 |
|---|---|---|
| robots.txt | `[~]` | 已有 `Allow: /` + Sitemap；待補明列 AI 爬蟲（Phase 1.1） |
| sitemap.xml | `[~]` | 已有 30 筆；缺 terms / 基準 URL / 內容頁，lastmod 偏舊（Phase 1.2） |
| CNAME | `[x]` | tradiagram.com |
| Google Search Console 驗證檔 | `[x]` | googlec7d6b3a25f42721b.html |
| ads.txt | `[x]` | AdSense |
| llms.txt | `[ ]` | 待建（Phase 4） |

## 二、逐頁 head 盤點

| 頁面 | title | description | OG/Twitter | canonical | JSON-LD | 需修正 |
|---|---|---|---|---|---|---|
| index.html | ✅唯一 | ✅ | ✅ | ✅ | ❌ | 加 Organization+WebSite（2.1） |
| diagram_output.html | ✅ | ✅ | ✅ | ✅ | ❌ | （有 noscript fallback，OK） |
| lines.html | ✅唯一 | ✅ | ✅ | ✅(動態) | ❌ | 補靜態 fallback（3.4） |
| trains.html | ✅唯一 | ✅ | ✅ | ✅ | ❌ | 補靜態 fallback（3.4） |
| about.html | ⚠️通用 | ✅ | ✅ | ✅ | ❌ | 修 title（1.3）。註：App 已下架，不加 SoftwareApplication |
| privacy.html | ⚠️通用 | ✅ | ✅ | ✅ | ❌ | 修 title（1.3） |
| terms.html | ⚠️通用 | ✅ | ✅ | ✅ | ❌ | 修 title（1.3）+ 加入 sitemap（1.2） |
| diagram_output_old.html | ❌無 | ❌ | ❌ | ❌ | ❌ | 加 noindex（1.4） |

## 三、內容缺口（最高優先，Phase 3）

| 頁面 | 狀態 | 說明 |
|---|---|---|
| about-diagram.html「運行圖怎麼看」 | `[ ]` | 全站目前無判讀教學文字 |
| glossary.html 名詞表 | `[ ]` | 待建 |
| faq.html 常見問題 | `[ ]` | 待建，套 FAQPage |

## 四、可索引性（無 JS）

| 頁面 | 無 JS 可讀文字 | 風險 |
|---|---|---|
| index.html | ✅ 14 線 + 區間靜態卡片 | 低 |
| diagram_output.html | ✅ noscript 列全線 | 低 |
| lines.html / trains.html | ❌ 純 JS 渲染 | 中 → 補 fallback（3.4） |

## 五、進度紀錄

- 2026-06-20：完成 Phase 0（重寫計劃 + 本盤點檔）。

## 六、驗證清單（上線後可重複執行）

- [ ] Google Rich Results Test 驗證各頁 JSON-LD 無錯誤。
- [ ] `curl -s https://tradiagram.com/about-diagram.html` 能看到 `<h1>` / 說明文字。
- [ ] sitemap.xml、robots.txt、llms.txt 皆可存取、連結正確。
- [ ] Google Search Console 重新提交 sitemap。
- [ ] 於 ChatGPT / Perplexity / Google AI Overview 實測：「台灣鐵路運行圖」「tradiagram」「某車次運行圖怎麼查」，記錄是否被引用。
- [ ] 以 server log / Cloudflare Analytics 觀察 GPTBot、ClaudeBot、PerplexityBot 是否來爬。
