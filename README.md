# 台灣鐵路/軌道運行圖

將台灣鐵路時刻表資料轉換為時間空間運行圖的靜態網站，資料來源為[政府資料開放平臺](https://data.gov.tw/)。

線上版本：[billy1125.github.io](https://billy1125.github.io)

## 支援路線

西部幹線北段、西部幹線南段、西部幹線山線、西部幹線海線、屏東線、南迴線、台東線、宜蘭線、北迴線、平溪線、內灣線、六家線、集集線、沙崙線

## 功能

- 瀏覽各路線每日運行圖，支援縮放、平移與車次懸停提示
- 在運行圖內搜尋車次，直接反白並移動視角至該車次路徑
- 以車站名稱或車次號碼搜尋，跳轉至對應路線與位置
- 依日期查詢歷史運行圖
- 瀏覽各日期的車次詳細資訊

## 本地執行

### 方式一：Python（無需額外安裝）

系統已安裝 Python 3 即可直接使用：

```bash
python -m http.server 8080
```

啟動後開啟 `http://localhost:8080` 即可瀏覽。

若系統預設為 Python 2：

```bash
python -m SimpleHTTPServer 8080
```

### 方式二：Docker

需要預先安裝 [Docker](https://www.docker.com/)。

```bash
docker-compose up
```

啟動後同樣開啟 `http://localhost:8080` 即可瀏覽。

> 資料載入使用 XHR／fetch，須在 HTTP 伺服器下執行，不可直接以 `file://` 開啟 HTML 檔案。

## 作者

呂卓勳 Cho-Hsun Lu — [billy1125@gmail.com](mailto:billy1125@gmail.com)

## 授權

MIT License — 歡迎自行下載、修改或架設於其他伺服器，惟須保留原始版權聲明。

> 作者公務繁忙，恕無法回應問題，煩請自行解決，敬請見諒。
