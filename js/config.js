// 公用let變數
let Route = null;
let SVG_X_Axis = null;
let LinesStations = {};
let LinesStationsForBackground = {};
let OperationLines = {};
let CarKind = {};
let diagram_objects = {};

// 公用const變數
const DiagramHours = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 1, 2, 3, 4, 5, 6];
const web_name = "台灣鐵路/軌道運行圖";
const description = "本站利用政府資料開放平臺與TDX交通部公共運輸整合資訊流通服務平臺所提供之公開資料集，設計並轉換成為以時間與空間描述的鐵路運行圖，可運用於台灣鐵路研究與嗜好用途。由呂卓勳所設計與營運。";
const keywords = "鐵路運行圖,列車位置,台灣鐵路管理局,台鐵,台灣高鐵,阿里山森林鐵路,台湾鉄道ダイヤグラム,ダイヤグラム,台湾鉄道,台湾高鉄,阿里山森林鉄路,鐵道,鐵路,Railway Time Space Diagram,Railway,Taiwan Railway,Taiwan Hish Speed Railway,Alishan Forest Railway";
const footer = "<p><strong>本站所提供的資料，均由<a href='https://data.gov.tw/'>政府資料開放平臺</a>與<a href='https://tdx.transportdata.tw/'>TDX交通部公共運輸整合資訊流通服務平臺</a>所提供之公開資料集所分析整理繪製，僅供參考。</p><p>實際鐵路運行情況請以現場、各鐵路與軌道系統的管理單位所公布資訊為準。</strong></p><p><a href='https://tradiagram.com/privacy.html'>隱私權保護政策</a> <img src='https://tw.creativecommons.net/wp-content/uploads/sites/20/2020/11/by-nc-nd-300x105.png' width='100'></p>";

const dict_line = {
    'LINE_WN': '西部幹線北段',
    'LINE_WS': '西部幹線南段',
    'LINE_WM': '西部幹線山線',
    'LINE_WSEA': '西部幹線海線',
    'LINE_P': '屏東線',
    'LINE_S': '南迴線',
    'LINE_T': '台東線',
    'LINE_PX': '平溪線',
    'LINE_NW': '內灣線',
    'LINE_LJ': '六家線',
    'LINE_J': '集集線',
    'LINE_SL': '沙崙線',
    'LINE_I': '宜蘭線',
    'LINE_N': '北迴線'
};

// 資料檔路徑
const file1 = "js/references/Route.json";
const file2 = "js/references/SVG_X_Axis.json";
const file3 = "js/references/SVG_Y_Axis.json";
const file4 = "js/references/OperationLines.json";
const file5 = "js/references/CarKind.json";
