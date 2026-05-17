// GRT參數取得
const url = new URL(location.href);
const line_kind = url.searchParams.get('lineKind');
const formattedDate = url.searchParams.get('formattedDate');
const scrollToCurrentTimeParam = url.searchParams.get('scrollToCurrentTime');
const stationAxisY = url.searchParams.get('stationAxisY');
const trainNoParam = url.searchParams.get('trainNo');

// 渲染器選擇：diagram_output.html 會在載入本檔案前設定 window._useD3Renderer = true
const _useD3 = (typeof window._useD3Renderer !== 'undefined' && window._useD3Renderer === true);

// 公用變數
let date = null;
let scrollToCurrentTime = scrollToCurrentTimeParam === 'true';

// 讀取中小數點動畫
const _dotsEl = document.getElementById("loading-dots");
let _dotsCount = 1;
const _dotsInterval = setInterval(function () {
    _dotsCount = (_dotsCount % 4) + 1;
    _dotsEl.textContent = '.'.repeat(_dotsCount);
}, 400);

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
        date = formattedDate ? formattedDate : getTodayFormattedDate('nodash');

        const [routeData, xAxisData, lineData, opLinesData, carKindData, trainData] =
            await Promise.all([
                readJSONFile(file1),
                readJSONFile(file2),
                readJSONFile(file3),
                readJSONFile(file4),
                readJSONFile(file5),
                readJSONFile(`data/${date}.json`),
            ]);

        Route = routeData;
        SVG_X_Axis = xAxisData;
        initial_line_data(lineData);
        OperationLines = opLinesData;
        CarKind = carKindData;

        execute(trainData, date);
    } catch (err) {
        console.error("初始化資料時發生錯誤:", err);
    }
}

// 程式執行函式
function execute(json_data, date) {
    if (typeof _resetState === 'function') _resetState();

    document.querySelectorAll("svg").forEach(s => s.remove());

    try {
        const all_trains_data = json_to_trains_data(json_data, '', line_kind);
        draw_diagram_background(line_kind, date);
        draw_train_path(all_trains_data, null);
        set_user_styles();
    } catch (error) {
        console.log(error);
    } finally {
        finish_draw();
    }
}

function finish_draw() {
    clearInterval(_dotsInterval);

    const popup = document.getElementById("popup");
    popup.parentNode.removeChild(popup);

    if (trainNoParam && typeof _state !== 'undefined' && _state.trainDataMap) {
        for (const [pathId, data] of _state.trainDataMap) {
            if (data.train_no === String(trainNoParam)) {
                _highlight(pathId);
                _panToTrain(pathId);
                break;
            }
        }
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
            });
        });
    }
}
