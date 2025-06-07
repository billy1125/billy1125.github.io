const url = new URL(location.href);
const line_kind = url.searchParams.get('lineKind');
const btn_download = document.getElementById("btn_download");

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
    Promise.all([
        readJSONFile(file1),
        readJSONFile(file2),
        readJSONFile(file3),
        readJSONFile(file4),
        readJSONFile(file5)
    ])
        .then(function (results) {
            Route = results[0];
            SVG_X_Axis = results[1];
            initial_line_data(results[2]);
            OperationLines = results[3];
            CarKind = results[4];
            // 在基本檔案載入完成後執行的函式
            execute();
        })
        .catch(function (error) {
            console.error(error);
        });
}

// 轉圖函式
function execute() {
    btn_download.addEventListener("click", download_file);

    // 清除已有的運行圖    
    const svg = document.querySelectorAll("svg");
    svg.forEach(function (svg) {
        svg.remove();
    });
    
    try {
        let data = localStorage.getItem('diagram_data');

        if (typeof (data) != "undefined") {
            data = JSON.parse(data);
            const all_trains_data = json_to_trains_data(data, '', line_kind);   // 將JSON檔案轉換成時間空間資料
            draw_diagram_background(line_kind);                                 // 繪製運行圖底圖(基礎時間與車站線)
            draw_train_path(all_trains_data);                                   // 繪製每一個車次線
        }
    }
    catch (error) {
        console.log(error);
        window.alert("無法繪製，請檢查您的資料！\n可能的原因包括：部分車次沒有安排車站停靠或經過、經過的車站不合理(順逆行設定錯誤、山海線設定錯誤等)、時間格式錯誤...");
        window.close();
    }
    finally {
        finish_draw();
    }
}

function finish_draw() {
    // 移除讀取中的文字標示
    var popup = document.getElementById("popup");
    const parentObj = popup.parentNode;
    parentObj.removeChild(popup);

    btn_download.disabled = false;
}
