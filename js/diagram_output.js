// GRT參數取得
const url = new URL(location.href);
const line_kind = url.searchParams.get('lineKind');
const formattedDate = url.searchParams.get('formattedDate');
const loadRealtimeParam = url.searchParams.get('realtime');
const scrollToCurrentTimeParam = url.searchParams.get('scrollToCurrentTime');

// 渲染器選擇：diagram_output_new.htm 會在載入本檔案前設定 window._useD3Renderer = true
const _useD3 = (typeof window._useD3Renderer !== 'undefined' && window._useD3Renderer === true);

// 公用變數
let date = null;
let circle_blink = null;
let scrollToCurrentTime = scrollToCurrentTimeParam === 'true';

// 讀取中小數點動畫
const _dotsEl = document.getElementById("loading-dots");
let _dotsCount = 1;
const _dotsInterval = setInterval(function () {
    _dotsCount = (_dotsCount % 4) + 1;
    _dotsEl.textContent = '.'.repeat(_dotsCount);
}, 400);

// console.log('Line Kind:', line_kind);
// console.log('Formatted Date:', formattedDate);
// console.log('Scroll To Current Time:', scrollToCurrentTime);

// 定義基本檔案相依性（D3 模式不載入 svg.js 與 diagram.js，改用 diagram_d3.js）
const dependencies = _useD3
    ? ['js/config.js', 'js/util.js', 'js/time_space.js', 'js/diagram_d3.js']
    : ['js/svg.js/svg.min.js', 'js/config.js', 'js/util.js', 'js/time_space.js', 'js/diagram.js'];

// 開始載入基本檔案
loadDependencies();

// 載入所有相依並初始化資料
async function loadDependencies() {
    try {
        for (const dep of dependencies) {
            await loadScript(dep);
        }
        await initial_data();
    } catch (err) {
        console.error("載入腳本時發生錯誤:", err);
    }
}

// 載入 JavaScript 檔案的函式
function loadScript(file) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = file;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 讀取所有資料檔
async function initial_data() {
    try {
        date = formattedDate ? formattedDate : getTodayFormattedDate('nodash'); // 如果 URL 中有指定日期則使用，否則用今天

        const baseFiles = [
            readJSONFile(file1),
            readJSONFile(file2),
            readJSONFile(file3),
            readJSONFile(file4),
            readJSONFile(file5),
            readJSONFile(`data/${date}.json`)
        ];

        const results = await Promise.all(baseFiles);

        Route = results[0];
        SVG_X_Axis = results[1];
        initial_line_data(results[2]);
        OperationLines = results[3];
        CarKind = results[4];

        const realtimeDiagram = results[5];
        const realtimeTrains = results[6]; // 可能是 undefined（如果沒載）

        execute(realtimeDiagram, realtimeTrains, date, _useD3 ? 'd3' : 'svgjs');
    } catch (err) {
        console.error("初始化資料時發生錯誤:", err);
    }
}


// 程式執行函式
// renderer: 'svgjs'（預設，使用 diagram.js）或 'd3'（使用 diagram_d3.js）
function execute(json_data, live_json_data, date, renderer = 'svgjs') {
    // 清除已有的運行圖    
    const svg = document.querySelectorAll("svg");
    svg.forEach(function (svg) {
        svg.remove();
    });

    try {
        const all_trains_data = json_to_trains_data(json_data, '', line_kind);  // 將JSON轉換成時間空間資料
        let realtime_trains = null

        draw_diagram_background(line_kind, date);                         // 繪製運行圖底圖
        draw_train_path(all_trains_data, realtime_trains);          // 繪製每一個車次線
        set_user_styles();

        if (realtime_trains) {
            // 開始閃動效果
            circle_blink = document.getElementsByTagName("circle");
            for (const iterator of circle_blink) {
                iterator.setAttribute("opacity", "1");
            }
            setInterval(blink, 500);
        }
    }
    catch (error) {
        console.log(error);
    }
    finally {
        finish_draw();
    }
}

function finish_draw() {
    clearInterval(_dotsInterval);

    // 移除讀取中的文字標示
    let popup = document.getElementById("popup");
    const parentObj = popup.parentNode;
    parentObj.removeChild(popup);

    // 依照現在的時間，將視窗滾動到整點時間，方便使用者閱讀
    if (scrollToCurrentTime) {
        scroll_current_time();
    }
}

// 設定使用者自訂色系
function set_user_styles() {
    const user_data = JSON.parse(localStorage.getItem("user_styles"));

    if (user_data != null) {
        Object.entries(user_data).forEach(([key, value]) => {
            Object.entries(value).forEach(([k, v]) => {
                const elements = document.getElementsByClassName(k);
                for (const iterator of elements) {
                    if (key == "fills")
                        iterator.style.fill = v[1];
                    else if (key == "strokes")
                        iterator.style.stroke = v[1];
                }

            })
        })
    }
}

// 列車位置閃動
function blink() {
    for (const iterator of circle_blink) {
        if (iterator.getAttribute("opacity") === "0") {
            iterator.setAttribute("opacity", "1");
        } else if (iterator.getAttribute("opacity") === "1") {
            iterator.setAttribute("opacity", "0");
        }
    }
}

// 捲動圖片到現在的時間
function scroll_current_time() {
    let now = new Date();
    let min = screen.width >= 1000 ? 0 : (now.getMinutes() - 10) / 60;
    let hour_position = now.getHours() + Math.round(min * 100) / 100 - 4;
    if (hour_position > 0) {
        hour_position *= 1200;
        window.scrollTo(hour_position, 0);
    }
}