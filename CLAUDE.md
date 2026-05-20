# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

台灣鐵路/軌道運行圖 — 純靜態 GitHub Pages 網站，將台灣鐵路時刻表資料轉換為 SVG 時間空間運行圖。無建置步驟、無套件管理器、無前端框架。

## 慣用語言

- 台灣繁體中文
- 台灣習慣工程用語

## 本地開發

`docker-compose up` 以 bind-mount 模式（不重新建置 image）啟動 nginx，對外埠號 8080：

```
docker-compose up
```

開啟 `http://localhost:8080` 即可瀏覽網站（檔案即時反映，無需重啟）。

> **注意**：所有資料載入（`readJSONFile` 使用 XHR，`index.js` 使用 `fetch`）必須在 HTTP 伺服器下執行，不可直接以 `file://` 協定開啟 HTML 檔案。

若需正式打包：
```
docker build -t taiwan-railway .
docker run -p 8080:80 taiwan-railway
```

## 外部函式庫

| 函式庫 | 來源 | 使用頁面 |
|---|---|---|
| D3.js v7 | CDN | `diagram_output.html` |
| jQuery | CDN | `index.html`、`lines.html`（業務邏輯需要） |
| Bootstrap 5.3 | CDN | `index.html`、`lines.html`、`about.html`、`privacy.html`、`terms.html` |
| Font Awesome 6.5 | CDN | 同上 |
| SweetAlert2 | CDN | `index.html`（免責聲明對話框、搜尋結果彈窗） |
| SVG.js | 本地 vendored（`js/svg.js/`） | `diagram_output_old.html`（legacy 路徑） |

`diagram_output.html` 刻意極簡：只載入 D3.js CDN 與 `diagram_output.js`，不引入 jQuery 或 Bootstrap。

## CSS 檔案範圍

| 檔案 | 套用頁面 |
|---|---|
| `css/web.css` | `index.html`、`lines.html`、`about.html`、`privacy.html`、`terms.html` 等一般頁面 |
| `css/diagram.css` | `diagram_output.html`、`diagram_output_old.html` |
| `css/style.css` | `diagram_output.html`（同上，含 popup 與車次路徑樣式） |
| `css/trains.css` | `trains.html` |

## 架構

### 資料流

1. 每日時刻表資料存放於 `data/YYYYMMDD.json`（來源：政府資料開放平臺）。
2. `js/references/` 內的靜態參考檔案定義了鐵路路網（路由、車站、SVG 軸座標）。
3. 運行圖頁面（`diagram_output.html`）由 `js/diagram_output.js` 動態依序載入 JS 相依，再讀取參考檔與當日資料 JSON，最終渲染 SVG。

### 核心渲染流程（`js/`）

| 檔案 | 功能 |
|---|---|
| `config.js` | 全域共用變數（`Route`、`SVG_X_Axis`、`LinesStations` 等）、路線代碼（`dict_line`）、`DiagramHours`、參考 JSON 路徑，以及版面配置常數（`MARGIN`、`PX_PER_HOUR`、`PX_PER_10MIN`、`PX_PER_AX1`、`NEXT_DAY_AX1`） |
| `util.js` | `readJSONFile`、`initial_line_data`、`download_file`、`getTodayFormattedDate` |
| `time_space.js` | 核心演算法 — 將 JSON 時刻表轉換為 SVG (x, y) 座標：`json_to_trains_data` → `calculate_space_time` → `find_passing_stations` → `estimate_timeSpace` → `time_space_to_operation_lines` |
| `diagram.js` | 以 SVG.js 為基礎的渲染器（legacy）— `draw_diagram_background`、`draw_train_path` |
| `diagram_d3.js` | 以 D3.js 為基礎的主要渲染器，提供相同公開 API（`draw_diagram_background`、`draw_train_path`）。模組狀態集中於 `_state` 物件，可透過 `_resetState()` 重置；`_buildPathData()` 負責純計算；內建縮放平移（d3.zoom）、懸停提示框（tooltip）與浮動車次搜尋面板 |
| `diagram_output.js` | `diagram_output.html` 的頁面控制器：讀取 URL 參數、依 `_useD3Renderer` 旗標選擇渲染器、依序載入腳本，呼叫 `execute()`（執行前先呼叫 `_resetState()` 確保可重入） |
| `index.js` | `index.html` 的頁面控制器：首次造訪免責聲明對話框（SweetAlert2）、站名搜尋、車次號碼搜尋 |
| `trains.js` | `trains.html` 的車次瀏覽器 — 透過 GitHub API 取得可用日期清單，渲染車次列表與詳細資訊面板 |

### 渲染器選擇

`diagram_output.html` 在載入 `diagram_output.js` 前設定 `window._useD3Renderer = true`，因此目前固定使用 D3 渲染（`diagram_d3.js`）。舊版 SVG.js 路徑（`diagram.js` + `svg.js/svg.min.js`）仍保留於 `diagram_output_old.html`，僅在 `_useD3Renderer` 為 falsy 時啟用。

### 參考 JSON 檔案（`js/references/`）

| 檔案 | 內容 |
|---|---|
| `Route.json` | 完整車站路網圖：每站含 `CW`/`CCW`（順/逆行下一站 ID）、`CW_KM`/`CCW_KM`，以及山線/海線/支線的分支欄位 |
| `SVG_X_Axis.json` | 將每個 `HH:MM:SS` 時間字串對應至 `{ ax1: number }` 物件（ax1 為 30 秒單位；1 分鐘 = 2 ax1，1 小時 = 120 ax1） |
| `SVG_Y_Axis.json` | 將每條路線代碼對應至各站的 `SVGYAXIS` 像素值陣列 |
| `OperationLines.json` | 各路線的元資料：顯示名稱、SVG 最大高度（`MAX_X_AXIS`） |
| `Station.json` | 車站與路線的對應關係（用於搜尋：站名 → 路線代碼） |
| `StationNoLines.json` | 車站 ID → `{ KIND, DSC }`，用於識別無所屬路線的特殊車站 |
| `CarKind.json` | 車種代碼（`CarClass` 欄位值）→ CSS class 名稱（如 `'taroko'`、`'local'`），供路徑樣式渲染使用；中文顯示名稱則在 `diagram_d3.js` 的 `_carKindLabel` 字典 |

### 每日資料格式（`data/YYYYMMDD.json`）

最上層鍵值 `TrainInfos` 為車次物件陣列，每筆包含：
- `Train`（車次）、`CarClass`、`Type`、`LineDir`（1=順行、2=逆行）、`Line`（0=不經山海線、1=山線、2=海線、3=成追線、4=山海線）
- `TimeInfos`：`{ Station, ARRTime, DEPTime, Order }` 的陣列 — 僅列出停靠車站，通過車站由路由演算法插補

### `diagram_output.html` 的 URL 參數

| 參數 | 範例 | 說明 |
|---|---|---|
| `lineKind` | `LINE_WN` | 要渲染的營運路線 |
| `formattedDate` | `20260516` | 資料日期（預設為今日） |
| `scrollToCurrentTime` | `true` | 載入後自動捲動至當前時刻 |
| `trainNo` | `131` | 反白並移動視角至指定車次 |
| `stationAxisY` | `350` | 依 SVG Y 座標捲動至指定車站 |

### 共用 Web Components（`js/components/`）

| 檔案 | 自訂標籤 | 說明 |
|---|---|---|
| `site-navbar.js` | `<site-navbar>` | 導覽列（Light DOM，依賴 Bootstrap + Font Awesome） |
| `site-footer.js` | `<site-footer>` | 頁腳免責聲明 + CC 授權（純內容，Bootstrap class 寫在 HTML） |

使用方式（各頁面 `</body>` 前）：
```html
<site-navbar></site-navbar>
...
<site-footer class="alert alert-warning d-block" role="alert"></site-footer>

<script type="module" src="js/components/site-navbar.js"></script>
<script type="module" src="js/components/site-footer.js"></script>
```

`type="module"` 自動 defer，不擋頁面渲染。Bootstrap 下拉選單透過事件委派運作，動態插入的 navbar 內容仍可正常觸發。

### 各頁面

- `index.html` — 路線選擇卡片 + 搜尋（支援站名或車次號碼）
- `diagram_output.html` — 運行圖檢視器（所有運行圖的進入頁，使用 D3 渲染器）
- `diagram_output_old.html` — 舊版運行圖檢視器（SVG.js 渲染器，保留備用）
- `lines.html` — 歷史運行圖的日曆選擇器；透過 GitHub Contents API 取得可用日期
- `trains.html` — 車次資料瀏覽器；同樣使用 GitHub Contents API
- `about.html` — 關於本站頁面
- `privacy.html` — 隱私權保護政策
- `terms.html` — 使用者條款

### localStorage

| 鍵值 | 格式 | 說明 |
|---|---|---|
| `is_confirmed` | `'ok'` / `'nook'` | 首次造訪免責聲明是否已確認 |
| `user_styles` | `{ fills: {...}, strokes: {...} }` | 使用者自訂車種色系，由 `set_user_styles()` 套用至 SVG 元素 |

### `initial_line_data` 的雙重全域變數

`util.js` 的 `initial_line_data(svgYAxisData)` 從同一份 `SVG_Y_Axis.json` 資料填入兩個形狀不同的全域變數：

- `LinesStations[lineKey]`：`{ [stationId]: { DSC, SVGYAXIS } }` — 鍵值對映，供渲染時快速查詢單一車站的 Y 座標
- `LinesStationsForBackground[lineKey]`：`[{ ID, DSC, SVGYAXIS, TERMINAL }]` — 保留順序的陣列，`TERMINAL: true` 標記端點站，供 `draw_diagram_background` 繪製水平站線時迭代使用

### 搜尋路由（`index.js`）

`searchStation(query)` 依輸入自動分派：
- 純數字 → `searchByTrainNumber(trainNo)`：查當日 JSON，找出該車次行經路線，以 SweetAlert2 按鈕列出，點選後跳轉 `diagram_output.html?trainNo=...`
- 含文字 → `searchByStationName(query)`：從 `Station.json` 模糊比對站名（`STATIONNAME.includes(query)`），解析對應 `SVGYAXIS` 後跳轉 `diagram_output.html?stationAxisY=...`

### 路由演算法說明

`time_space.js` 中的 `find_passing_stations` 以 `Route.json` 路網圖從起站走訪至終站，並依特殊車站 ID 處理山線/海線、平溪、內灣、集集、沙崙等支線的分岔決策。對於時刻表中未列出的通過車站，`estimate_timeSpace` 以線性插補計算其預估通過時間。

跨午夜車次處理：`estimate_timeSpace` 偵測到 SVG x 值減少（時間跨越午夜歸零）時，對午夜後的各筆資料加上 `NEXT_DAY_AX1`（= 2880，即 24h × 120 ax1/h），使其在 x 軸上繼續向右延伸。

### ax1 到像素座標轉換

SVG x 軸像素公式：`x = time_ax1 * PX_PER_AX1 - PX_PER_HOUR * DiagramHours[0] + MARGIN`

其中 `DiagramHours[0] = 4`（運行圖從凌晨 4 點開始），`MARGIN = 50`，`PX_PER_AX1 = 10`，`PX_PER_HOUR = 1200`。

### `diagram_objects` 全域字典

`config.js` 宣告的 `diagram_objects = {}`，在 `draw_diagram_background` 寫入 `diagram_objects[lineKey] = g`（D3 `<g>` 群組），在 `draw_train_path` 的 `set_path` 讀取，作為兩函式間的渲染目標橋梁。

### 車次路徑分段機制

`draw_train_path` 呼叫 `find_uncontinuous_index(value)` 判斷 `Order` 是否連續，將車次切為 `section_start`（連續段）與 `section_end`（非連續段），後者以 `train_no + '-End'` 為 ID 繪製，避免跨路段的虛假連線。

### 腳本循序載入

`diagram_output.js` 的 `loadDependencies()` 以 `for...of await` 逐一載入 `config.js → util.js → time_space.js → diagram_d3.js`，不可並行。原因：後一支腳本（如 `time_space.js`）依賴前一支（`config.js`）所設定的全域變數（`Route`、`SVG_X_Axis` 等），並行載入會因 `undefined` 全域而失敗。
