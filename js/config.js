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
const description = "本站利用政府資料公開資料集，設計並轉換成為以時間與空間描述的鐵路運行圖，可運用於台灣鐵路研究與嗜好用途。由呂卓勳所設計與營運。";
const keywords = "鐵路運行圖,列車位置,台灣鐵路管理局,台鐵,台灣高鐵,阿里山森林鐵路,台湾鉄道ダイヤグラム,ダイヤグラム,台湾鉄道,台湾高鉄,阿里山森林鉄路,鐵道,鐵路,Railway Time Space Diagram,Railway,Taiwan Railway,Taiwan Hish Speed Railway,Alishan Forest Railway";

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

// 版面配置常數
const MARGIN      = 50;    // SVG 邊距（px）
const PX_PER_HOUR = 1200;  // 每小時寬度（px）
const PX_PER_10MIN = 200;  // 每 10 分鐘寬度（px）
const PX_PER_AX1  = 10;    // 每 ax1 單位（30 秒）寬度（px）
const NEXT_DAY_AX1 = 2880; // 隔日 ax1 起始值（24h × 120 ax1/h）

// 資料檔路徑
const file1 = "js/references/Route.json";
const file2 = "js/references/SVG_X_Axis.json";
const file3 = "js/references/SVG_Y_Axis.json";
const file4 = "js/references/OperationLines.json";
const file5 = "js/references/CarKind.json";
