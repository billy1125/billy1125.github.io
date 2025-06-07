let btn_execute = null;
let btn_download = null;

// 定義基本檔案相依性
const dependencies = [
    "js/svg.js/svg.min.js",
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
    initial_ui();
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

        })
        .catch(function (error) {
            console.error(error);
        });
}

function initial_ui() {
    // 取得父元素
    const parentElement = document.getElementById("line_kind");
    const selections = {
        "LINE_WN": "西部幹線北段(基隆-竹南)",
        "LINE_WM": "西部幹線台中線(竹南-彰化，經苗栗)",
        "LINE_WSEA": "西部幹線海岸線(竹南-彰化，經大甲)",
        "LINE_WS": "西部幹線南段(彰化-高雄)",
        "LINE_P": "屏東線(高雄-枋寮)",
        "LINE_S": "南迴線(枋寮-台東)",
        "LINE_T": "台東線(花蓮-台東)",
        "LINE_N": "北迴線(蘇澳新-花蓮)",
        "LINE_I": "宜蘭線(八堵-蘇澳)",
        "LINE_PX": "平溪深澳線(八斗子-菁桐)",
        "LINE_LJ": "內灣線(新竹-內灣)",
        "LINE_NW": "六家線(新竹-六家)",
        "LINE_J": "集集線(二水-車埕)",
        "LINE_SL": "沙崙線(中洲-沙崙)"
    }

    btn_execute = document.getElementById("btn_execute");
    btn_download = document.getElementById("btn_download");
    // btn_download.addEventListener("click", download_file);

    // 建立要新增的子元素
    Object.entries(selections).forEach(([key, value]) => {
        const childElement = document.createElement("option");
        childElement.textContent = value;
        childElement.setAttribute('value', key);

        // 將子元素新增到父元素中
        parentElement.appendChild(childElement);
    })
}

// 使用者操作與上傳檔案
function execute() {
    btn_execute.disabled = true;

    // 清除已有的運行圖    
    const svg = document.querySelectorAll("svg");
    svg.forEach(function (svg) {
        svg.remove();
    });

    // 擷取使用者選擇的檔案、車次號與路線
    const file_input = document.getElementById("file_input");
    const train_no = document.getElementById("train_no").value;
    const line_kind = document.getElementById("line_kind").value;
    const file = file_input.files[0];

    if (typeof file !== "undefined") {
        try {
            const reader = new FileReader();
            reader.onload = function (event) {
                const contents = event.target.result;
                const all_trains_data = json_to_trains_data(JSON.parse(contents), train_no, line_kind);  // 將JSON檔案轉換成時間空間資料
                draw_diagram_background(line_kind);                                                      // 繪製運行圖底圖(基礎時間與車站線)
                draw_train_path(all_trains_data);                                                      // 繪製每一個車次線
                
                set_user_styles();
            };
            reader.readAsText(file);
        }
        catch (error) {
            console.log(error);
        }
        finally {
            btn_execute.disabled = false;
            btn_download.disabled = false;
        }

    } else {
        btn_execute.disabled = false;
        window.alert("請選擇正確的JSON格式檔案！");
    }
}

function set_user_styles(){
    const user_data = JSON.parse(localStorage.getItem("user_styles"));
   
    Object.entries(user_data).forEach(([key, value]) => {
        Object.entries(value).forEach(([k, v]) => {
            const elements = document.getElementsByClassName(k);
            for (const iterator of elements) {
                if (key in ["text_styles", "train_mark_kind"])
                    iterator.style.fill = v;
                else
                    iterator.style.stroke = v;
            }
           
        })
    })
}