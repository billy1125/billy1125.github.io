import requests
import json
import os
import time
from datetime import datetime
from dotenv import load_dotenv

# 專案路徑設定
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

# 載入 .env 檔案
load_dotenv(os.path.join(BASE_DIR, '.env'))

# 設定您的 TDX 帳號 (從環境變數讀取)
CLIENT_ID = os.getenv('TDX_CLIENT_ID')
CLIENT_SECRET = os.getenv('TDX_CLIENT_SECRET')

if not CLIENT_ID or not CLIENT_SECRET:
    print("警告: 未設定 TDX_CLIENT_ID 或 TDX_CLIENT_SECRET 環境變數")

def get_token():
    auth_url = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token"
    data = {
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }
    try:
        response = requests.post(auth_url, data=data)
        response.raise_for_status()
        return response.json().get('access_token')
    except Exception as e:
        print(f"取得 Token 失敗: {e}")
        return None

# ==========================================
# 推薦的 5 個 API 實作區域
# ==========================================

# [API 1] 臺鐵每日時刻表所有供應日期資料 v3
# 用途：取得目前 TDX 上所有可下載的日期，用來決定要跑哪些日期的迴圈。
def get_available_dates(token):
    url = "https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/DailyTimetable/TrainDates?%24format=JSON"
    headers = {'authorization': f"Bearer {token}"}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data.get('TrainDates', [])
    except Exception as e:
        print(f"取得日期列表失敗: {e}")
        return []

# [API 2] 指定[日期]之臺鐵所有車次時刻表資料 v3
# 用途：這是最核心的 API，下載該日期的所有車次時刻表 (包含停靠站時間)。
def get_daily_timetable(token, date):
    url = f"https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/DailyTimetable/TrainDate/{date}?%24format=JSON"
    headers = {'authorization': f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

# [API 3] 指定[日期]之臺鐵所有車次資料 v2
# 用途：輔助用。當 API 2 的資料缺少 LineID (山海線) 或 Direction (順逆行) 時，可呼叫此 API 來補全資訊。
def get_daily_train_info(token, date):
    url = f"https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/DailyTrainInfo/TrainDate/{date}?%24format=JSON"
    headers = {'authorization': f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

# [API 4] 臺鐵所有車次之定期時刻表資料 v3
# 用途：備案用。如果 API 2 (每日時刻表) 在某天完全抓不到資料，可以改抓這個「定期時刻表」來當作基礎資料。
def get_general_timetable(token):
    url = "https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/GeneralTimetable?%24format=JSON"
    headers = {'authorization': f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

# [API 5] 指定臺鐵[車次]特殊車次時刻表資料 v3
# 用途：特殊用。如果發現某些加班車在 API 2 中遺漏，可針對特定車次 (TrainNo) 查詢此 API。
def get_specific_train_timetable(token, train_no):
    url = f"https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/GeneralTimetable/TrainNo/{train_no}?%24format=JSON"
    headers = {'authorization': f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

# ==========================================

def transform_to_project_format(tdx_data):
    """轉換資料格式以符合專案需求"""
    project_data = {
        "TrainInfos": []
    }
    
    train_list = tdx_data.get('TrainTimetables', []) if isinstance(tdx_data, dict) else tdx_data

    for train in train_list:    
        # 嘗試取得 TrainInfo 或 DailyTrainInfo (API 回傳欄位可能不一致)
        train_info = train.get('TrainInfo', train.get('DailyTrainInfo', {}))
        
        # Debug print for the first train
        if train_list.index(train) == 0:
            # print(f"DEBUG: Train keys: {list(train.keys())}")
            # print(f"DEBUG: First train info keys: {list(train_info.keys())}")
            # print(f"DEBUG: TrainNo value: {train_info.get('TrainNo')}")
            pass
        
        stop_times = train.get('StopTimes', [])
        
        new_time_infos = []
        for stop in stop_times:
            arr_time = stop.get('ArrivalTime', '')
            if len(arr_time) == 5: arr_time += ":00"
            
            dep_time = stop.get('DepartureTime', '')
            if len(dep_time) == 5: dep_time += ":00"

            new_time_infos.append({
                "Route": "", # 原始資料有此欄位，補上空字串
                "Station": stop.get('StationID', ''),
                "Order": str(stop.get('StopSequence', '')),
                "ARRTime": arr_time,
                "DEPTime": dep_time
            })
            
        # 輔助函式：將 0/1 轉為 N/Y
        def flag_to_yn(val):
            if isinstance(val, str):
                return 'Y' if val == '1' else 'N'
            return 'Y' if val == 1 else 'N'

        note = train_info.get('Note', '')
        if isinstance(note, dict):
            note = note.get('Zh_tw', '')

        new_train = {
            "Type": train_info.get('TrainTypeCode', ''), # 對應 Type
            "Train": train_info.get('TrainNo', ''),
            "BreastFeed": flag_to_yn(train_info.get('BreastFeedFlag', 0)),
            "Route": "", 
            "Package": flag_to_yn(train_info.get('PackageServiceFlag', 0)),
            "OverNightStn": "", # API 無此資訊，暫留空
            "LineDir": str(train_info.get('Direction', '')),
            "Line": str(train_info.get('TripLine', '')), # API v3 使用 TripLine
            "Dinning": flag_to_yn(train_info.get('DiningFlag', 0)),
            "FoodSrv": "N", # API 無此資訊，暫設 N
            "Cripple": flag_to_yn(train_info.get('WheelChairFlag', 0)),
            "CarClass": train_info.get('TrainTypeID', ''),
            "Bike": flag_to_yn(train_info.get('BikeFlag', 0)),
            "ExtraTrain": flag_to_yn(train_info.get('ExtraTrainFlag', 0)),
            "Everyday": flag_to_yn(train_info.get('DailyFlag', 0)),
            "Note": note,
            "NoteEng": "",
            "TimeInfos": new_time_infos
        }
        
        project_data["TrainInfos"].append(new_train)
        
    return project_data

def main():
    print("=== 開始自動更新時刻表資料庫 ===")
    
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        print(f"建立資料夾: {DATA_DIR}")

    token = get_token()
    if not token:
        return

    # 使用 API 1 取得日期
    print("正在查詢可用的日期...")
    available_dates = get_available_dates(token)
    print(f"TDX 上共有 {len(available_dates)} 個日期的資料。")

    for date_str in available_dates:
        file_date = date_str.replace('-', '')
        filename = f"{file_date}.json"
        file_path = os.path.join(DATA_DIR, filename)

        if os.path.exists(file_path):
            print(f"[略過] {date_str} 資料已存在 ({filename})")
            continue

        print(f"[下載中] 正在處理 {date_str} ...")
        try:
            # 使用 API 2 下載主要資料
            # 若需要更詳細資訊，可在此處呼叫 API 3 (get_daily_train_info) 並合併資料
            raw_data = get_daily_timetable(token, date_str)
            
            final_json = transform_to_project_format(raw_data)
            
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(final_json, f, ensure_ascii=False, indent=4)
            
            print(f"   -> 成功儲存: {filename}")
            time.sleep(0.5)

        except Exception as e:
            print(f"   -> [錯誤] 處理 {date_str} 時發生錯誤: {e}")
            # 若 API 2 失敗，可在此處嘗試呼叫 API 4 (get_general_timetable) 作為備案

    # 新增：產生 index.json 索引檔
    generate_index_file()
    print("=== 更新完成 ===")

def generate_index_file():
    """掃描 data 資料夾，產生 index.json 索引檔"""
    print("正在建立索引檔案 (index.json)...")
    try:
        files = [f for f in os.listdir(DATA_DIR) if f.endswith('.json') and f.replace('.json', '').isdigit() and len(f) == 13] # 8碼日期 + .json = 13
        # 上述過濾條件：必須是 .json 結尾，且檔名(不含副檔名)必須是數字，且長度為 8 (YYYYMMDD)
        
        # 再次確認長度，避免誤判 (例如 20250901.json 是 13 碼)
        valid_files = []
        for f in files:
            name_part = f.replace('.json', '')
            if len(name_part) == 8 and name_part.isdigit():
                valid_files.append(name_part)
        
        valid_files.sort()
        
        index_path = os.path.join(DATA_DIR, "index.json")
        with open(index_path, "w", encoding="utf-8") as f:
            json.dump(valid_files, f, ensure_ascii=False, indent=4)
            
        print(f"索引建立完成，共 {len(valid_files)} 筆資料。")
        
    except Exception as e:
        print(f"建立索引時發生錯誤: {e}")

if __name__ == "__main__":
    main()
