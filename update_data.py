import os
import requests
import json
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime, timedelta

def download_and_optimize():
    base_url = "https://ods.railway.gov.tw"
    list_url = "https://ods.railway.gov.tw/tra-ods-web/ods/download/dataResource/railway_schedule/JSON/list/"
    save_dir = "data"
    retention_days = 60 # 設定只保留最近 60 天的檔案

    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    # 1. 下載並壓縮
    print("正在獲取最新時刻表...")
    try:
        response = requests.get(list_url, timeout=30)
        soup = BeautifulSoup(response.text, 'html.parser')
        links = soup.find_all('a')

        for link in links:
            file_name = link.text.strip()
            if file_name.endswith('.json'):
                download_url = urljoin(base_url, link.get('href'))
                
                # 取得檔案內容
                file_res = requests.get(download_url, timeout=30)
                if file_res.status_code == 200:
                    try:
                        # --- 壓縮關鍵步驟 ---
                        data = file_res.json() # 解析 JSON
                        file_path = os.path.join(save_dir, file_name)
                        with open(file_path, 'w', encoding='utf-8') as f:
                            # separators=(',', ':') 會移除所有的空白與換行
                            json.dump(data, f, separators=(',', ':'), ensure_ascii=False)
                        print(f"已儲存並壓縮: {file_name}")
                    except Exception as je:
                        print(f"JSON 處理失敗 {file_name}: {je}")

        # 2. 清理過期檔案 (防止 Repo 爆炸)
        print("清理舊檔案中...")
        now = datetime.now()
        for filename in os.listdir(save_dir):
            if filename.endswith(".json"):
                # 假設檔名是 20260222.json，取前 8 碼轉為日期
                try:
                    file_date_str = filename[:8]
                    file_date = datetime.strptime(file_date_str, "%Y%m%d")
                    # 如果檔案日期早於 (今天 - retention_days)，就刪除
                    if file_date < (now - timedelta(days=retention_days)):
                        os.remove(os.path.join(save_dir, filename))
                        print(f"刪除過期檔案: {filename}")
                except:
                    pass # 若檔名格式不符則跳過

    except Exception as e:
        print(f"執行發生錯誤: {e}")
        exit(1)

if __name__ == "__main__":
    download_and_optimize()