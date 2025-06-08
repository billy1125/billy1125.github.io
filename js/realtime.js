const url = new URL(location.href);
const line_kind = url.searchParams.get('lineKind');
const formattedDate = url.searchParams.get('formattedDate');
let date = null;
let circle_blink = null;
// 檔案路徑設定

const loadRealtimeParam = url.searchParams.get('realtime');
let loadRealtimeData = loadRealtimeParam === 'true';

// 定義基本檔案相依性
const dependencies = [
    'js/svg.js/svg.min.js',
    'js/configure/config.js',
    'js/configure/env_var.js',
    'js/utilties/util.js',
    'js/time_space.js',
    'js/diagram.js'
];

// 開始載入基本檔案
loadDependencies();

// 異步載入函式
async function loadDependencies() {
    // 迭代相依性並載入它們
    for (const dependency of dependencies) {
        await loadScript(dependency);
    }
    // 所有基本檔案載入完成後，執行其他函式    
    initial_data();
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
function initial_data() {
    date = formattedDate ? formattedDate : getFormattedDate(); // 如果 URL 中有指定 'formattedDate'，則使用該日期，否則使用今天的日期

    const baseFiles = [
        readJSONFile(file1),
        readJSONFile(file2),
        readJSONFile(file3),
        readJSONFile(file4),
        readJSONFile(file5),
        readJSONFile("data/realtime_diagram/" + date + ".json")
    ];

    if (loadRealtimeData) {
        baseFiles.push(readJSONFile("data/realtime_trains.json"));
    }

    Promise.all(baseFiles)
        .then(function (results) {
            Route = results[0];
            SVG_X_Axis = results[1];
            initial_line_data(results[2]);
            OperationLines = results[3];
            CarKind = results[4];

            // 等待最後兩個函式完成的Promise物件
            return Promise.all([
                results[5],
                results[6]
            ]);
        })
        .then(function (finalResults) {
            // 在最後兩個函式完成後執行的程式碼
            execute(finalResults[0], finalResults[1]);
        })
        .catch(function (error) {
            console.error(error);
        });
}

// 程式執行函式
function execute(json_data, live_json_data) {
    // 清除已有的運行圖    
    const svg = document.querySelectorAll("svg");
    svg.forEach(function (svg) {
        svg.remove();
    });

    try {
        const all_trains_data = json_to_trains_data(json_data, '', line_kind);  // 將JSON轉換成時間空間資料
        let realtime_trains = null;

        if (loadRealtimeData && live_json_data) {
            realtime_trains = mark_realtime_trains(live_json_data); // 即時列車位置資料轉換
        }

        draw_diagram_background(line_kind);                         // 繪製運行圖底圖
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


// 標記即時列車位置
function mark_realtime_trains(live_json_data) {
    let realtime_trains = new Map();
    for (const iterator of live_json_data.TrainLiveBoards) {
        realtime_trains.set(iterator.TrainNo, iterator);
    }

    return realtime_trains;
}

function finish_draw() {
    // 移除讀取中的文字標示
    var popup = document.getElementById("popup");
    const parentObj = popup.parentNode;
    parentObj.removeChild(popup);

    // 依照現在的時間，將視窗滾動到整點時間，方便使用者閱讀
    let now = new Date();
    let min = screen.width >= 1000 ? 0 : (now.getMinutes() - 10) / 60;
    let hour_position = now.getHours() + Math.round(min * 100) / 100 - 4;
    if (hour_position > 0) {
        hour_position *= 1200;
        window.scrollTo(hour_position, 0);
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
