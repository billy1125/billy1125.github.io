const web_name = "台灣鐵路/軌道運行圖";
const description = "本站利用政府資料開放平臺與TDX交通部公共運輸整合資訊流通服務平臺所提供之公開資料集，設計並轉換成為以時間與空間描述的鐵路運行圖，可運用於台灣鐵路研究與嗜好用途。由呂卓勳所設計與營運。";
const keywords = "鐵路運行圖,列車位置,台灣鐵路管理局,台鐵,台灣高鐵,阿里山森林鐵路,台湾鉄道ダイヤグラム,ダイヤグラム,台湾鉄道,台湾高鉄,阿里山森林鉄路,鐵道,鐵路,Railway Time Space Diagram,Railway,Taiwan Railway,Taiwan Hish Speed Railway,Alishan Forest Railway";
const footer = "<p><strong>本站所提供的資料，均由<a href='https://data.gov.tw/'>政府資料開放平臺</a>與<a href='https://tdx.transportdata.tw/'>TDX交通部公共運輸整合資訊流通服務平臺</a>所提供之公開資料集所分析整理繪製，僅供參考。</p><p>實際鐵路運行情況請以現場、各鐵路與軌道系統的管理單位所公布資訊為準。</strong></p><p><a href='https://tradiagram.com/privacy.html'>隱私權保護政策</a> <img src='https://tw.creativecommons.net/wp-content/uploads/sites/20/2020/11/by-nc-nd-300x105.png' width='100'></p>";

const dict_line = {
    'west_link_north': ['/WESTNORTH_', '西部幹線北段', 'LINE_WN'],
    'west_link_south': ['/WESTSOUTH_', '西部幹線南段', 'LINE_WS'],
    'west_link_moutain': ['/WESTMOUNTAIN_', '西部幹線山線', 'LINE_WM'],
    'west_link_sea': ['/WESTSEA_', '西部幹線海線', 'LINE_WSEA'],
    'pingtung': ['/PINGTUNG_', '屏東線', 'LINE_P'],
    'south_link': ['/SOUTHLINK_', '南迴線', 'LINE_S'],
    'taitung': ['/TAITUNG_', '台東線', 'LINE_T'],
    'pingxi': ['/PINGXI_', '平溪線', 'LINE_PX'],
    'neiwan': ['/NEIWAN_', '內灣線', 'LINE_NW'],
    'liujia': ['/LIUJIA_', '六家線', 'LINE_LJ'],
    'jiji': ['/JIJI_', '集集線', 'LINE_J'],
    'shalun': ['/SHALUN_', '沙崙線', 'LINE_SL'],
    'yilan': ['/YILAN_', '宜蘭線', 'LINE_I'],
    'north_link': ['/NORTHLINK_', '北迴線', 'LINE_N'],
    'thsr': ['/THSR_', '台灣高鐵', 'LINE_THSR'],
    'alishan_m1': ['/ALISHANM1_', '阿里山線', 'LINE_ALISHAN_M1'],
    'alishan_b2': ['/ALISHANB2_', '沼平/祝山線', 'LINE_ALISHAN_B2' ]
};
