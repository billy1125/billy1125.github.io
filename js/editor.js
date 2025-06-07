let currentPage = 1;                // 現在的頁碼
let trains_data = null;
let date = null;

// 定義基本檔案相依性
const dependencies = [
    'js/configure/config.js',
    // 'js/configure/env_var.js',
    'js/configure/editor_var.js',
    'js/utilties/util.js',
    'js/model/trains_class.js',
    'js/editor_control.js'
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
    initial_editor();
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

// 其他函式
function initial_data() {
    // 讀取所有資料檔
    Promise.all([
        readJSONFile(`data/realtime_diagram/${date}.json`)
    ])
        .then(function (results) {
            // 在基本檔案載入完成後執行的函式
            trains_data.initial_trains(results[0]);
            display_master();
        })
        .catch(function (error) {
            window.alert(`直接讀取今日時刻表資料錯誤，錯誤資訊：${error}`)
        });
}

// 編輯器初始化
function initial_editor() {
    trains_data = new TrainsClass();
    date = getFormattedDate();

    set_select("line_dir", line_dir_kind);
    set_select("line", line_kind);
    set_select("car_class", car_kind);
    set_select("stations", stations_kind);
    set_select("operation_lines", operation_lines);
}

// 顯示主表
function display_master() {

    mainTableContainer.innerHTML = '';   // 清空主表内容
    detailTableContainer.innerHTML = ''; // 清空副表

    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;

    // 顯示特定頁面的資料
    if (trains_data.master_train_info.length > 0) {
        let currentPageData = trains_data.master_train_info.slice(startIndex, endIndex);
        currentPageData.forEach(function (item) {
            let row = document.createElement('tr');
            row.setAttribute('id', item.Train);
            // row.innerHTML = item.Train;
            row.addEventListener('click', function () {
                const train_no = this.getAttribute("id"); // 取得點擊行的ID
                trains_data.selected_train_no = train_no;

                select_hightlight(train_no, row);

                display_detail(train_no);

            });
            mainTableContainer.appendChild(row);

            // 刪除欄位
            add_button_td(row, "刪除", item.Train, true);

            // 車次欄位
            add_textbox_td(row, item.Train, "input-train-" + item.Train, "train_no");
            // add_text_td(row, item.Train);

            // 順逆行欄位
            add_td_selection(row, line_dir_kind, "sel-dir-" + item.Train, true);
            select_update("sel-dir-" + item.Train, item.LineDir);

            // 經由路線
            add_td_selection(row, line_kind, "sel-line-" + item.Train, true);
            select_update("sel-line-" + item.Train, item.Line);

            // 車種欄位
            add_td_selection(row, car_kind, "sel-car-" + item.Train, true);
            select_update("sel-car-" + item.Train, item.CarClass);
        });
    }
    // 更新頁碼
    updatePagination();
}

// 顯示副表
function display_detail(id) {
    let row_index = 0;
    detailTableContainer.innerHTML = ''; // 清空副表

    if (id != -1) {
        var select_train_no = document.getElementById("select-train-no");
        select_train_no.innerHTML = id;

        // 以車次號查詢副表內容
        let details = trains_data.detail_time_info.find(function (item) {
            return item.Train === id;
        });

        trains_data.selected_train = details;
    }

    trains_data.selected_train.TimeTable.forEach(function (item) {
        let row = document.createElement('tr');
        detailTableContainer.appendChild(row);
        row_index += 1;

        // 順序
        add_text_td(row, row_index);
        // 刪除欄位
        add_button_td(row, "刪除", row_index, false);
        // add_text_td(row, item.Station);
        // 車站
        add_td_selection(row, stations_kind, "sel-station-" + row_index, false);
        select_update("sel-station-" + row_index, item.Station);
        // 到站時間
        add_textbox_td(row, item.ARRTime, "input-arrtime-" + row_index, "time");
        // 離站時間
        add_textbox_td(row, item.DEPTime, "input-deptime-" + row_index, "time");
    });
}

// 更新頁碼
function updatePagination() {
    pagination.innerHTML = "";

    var totalPages = Math.ceil(trains_data.master_train_info.length / itemsPerPage);

    var startPage = 1;
    var endPage = totalPages;

    if (totalPages > 5) {
        if (currentPage <= 3) {
            endPage = 5;
        } else if (currentPage >= totalPages - 2) {
            startPage = totalPages - 4;
        } else {
            startPage = currentPage - 2;
            endPage = currentPage + 2;
        }
    }

    // 頁碼1
    if (startPage > 1) {
        var firstPageLink = document.createElement('a');
        firstPageLink.href = '#';
        firstPageLink.textContent = '1';
        firstPageLink.dataset.page = 1;
        firstPageLink.addEventListener('click', function (e) {
            e.preventDefault();
            currentPage = parseInt(this.dataset.page);
            display_master();
        });
        pagination.appendChild(firstPageLink);

        if (startPage > 0) {
            var ellipsis = document.createElement('span');
            ellipsis.textContent = '.....';
            pagination.appendChild(ellipsis);
        }
    }

    // 中間頁碼
    for (var i = startPage; i <= endPage; i++) {
        var pageLink = document.createElement('a');
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.dataset.page = i;

        if (i === currentPage) {
            pageLink.style.backgroundColor = "#a9d4b5";
        }

        pageLink.addEventListener('click', function (e) {
            e.preventDefault();
            currentPage = parseInt(this.dataset.page);
            display_master();
        });

        pagination.appendChild(pageLink);

        // if (i < endPage) {
        //     var spacing = document.createElement('span');
        //     spacing.textContent = ' ';
        //     pagination.appendChild(spacing);
        // }
    }

    // 最後頁碼
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            var ellipsis = document.createElement('span');
            ellipsis.textContent = '......';
            pagination.appendChild(ellipsis);
        }

        var lastPageLink = document.createElement('a');
        lastPageLink.href = '#';
        lastPageLink.textContent = totalPages;
        lastPageLink.dataset.page = totalPages;
        lastPageLink.addEventListener('click', function (e) {
            e.preventDefault();
            currentPage = parseInt(this.dataset.page);
            display_master();
        });
        pagination.appendChild(lastPageLink);
    }
}

// 將選擇的車次標為紅色
function select_hightlight(id, row) {
    let last_row = document.getElementById(trains_data.last_selected_train_no);

    if (last_row != null)
        if (last_row.id != id) {
            // check_is_update(last_row.id);
            last_row.setAttribute('style', '');
        }

    row.setAttribute('style', 'background-color:#FFD700');
    trains_data.last_selected_train_no = id;
}

// 更新選項
function select_update(id, select_value) {
    var selection = document.getElementById(id);

    for (var i = 0; i < selection.options.length; i++) {
        if (selection.options[i].value === select_value) {
            selection.options[i].selected = true;
            break;
        }
    }
}

// 增加文字型態儲存格
function add_text_td(row_element, inner_text, dom_id) {
    let td = document.createElement('td');
    td.innerHTML = inner_text;
    row_element.appendChild(td);
}

// 增加按鍵型態儲存格(刪除)
function add_button_td(row_element, inner_text, id, is_master) {
    let td = document.createElement('td');
    row_element.appendChild(td);

    let button = document.createElement("button");
    button.innerHTML = inner_text;
    if (id !== '')
        button.setAttribute('id', "del-" + id);
    td.appendChild(button);

    button.addEventListener('click', function () {
        if (is_master) {
            let check = window.confirm(`您確定要刪除第 ${id} 車次？`);
            if (check == true) {
                trains_data.delete_train_map(id);
                display_master();
            }
        }
        else {
            let check = window.confirm(`您確定要刪除這個車站？`);
            if (check == true) {
                trains_data.delete_station(id - 1);
                display_detail(-1);
            }
        }
    });
}

// 增加選項儲存格
function add_td_selection(row_element, selection_kind, dom_id, is_master) {
    const td = document.createElement('td');
    row_element.appendChild(td);

    const select = document.createElement("select");
    if (dom_id !== '')
        select.setAttribute('id', dom_id);

    selection_kind.forEach(function (optionData) {
        const option = document.createElement("option");
        option.value = optionData.id;
        option.text = optionData.id + " - " + optionData.dsc;
        select.appendChild(option);
    });

    td.appendChild(select);

    select.addEventListener('change', function () {
        if (is_master)
            check_is_update(trains_data.selected_train_no, "master");
        else
            check_is_update(trains_data.selected_train_no, "detail");
    });
}

// 增加編輯文字框儲存格
function add_textbox_td(row_element, input_text, dom_id, kind) {
    const td = document.createElement('td');
    row_element.appendChild(td);

    const input = document.createElement("input");
    if (dom_id !== '')
        input.setAttribute('id', dom_id);
    input.setAttribute('type', 'text');
    input.setAttribute('value', input_text);
    if (kind == "time") {
        input.addEventListener('focusout', function () {
            const input_value = input.value;
            var regex = /^([01]\d|2[0-3]):([0-5]\d):(00|30)$/;
            if (regex.test(input_value) === true)
                check_is_update(trains_data.selected_train_no, "detail");
            else
                window.alert("請輸入24小時制的時間，例如：12:39:30、18:56:00，並且秒僅能設定為00或30");
        });
    }
    else if (kind == "train_no") {
        input.addEventListener('focusout', function () {
            const input_value = input.value;
            check_is_update(input_value, "master");
        });
    }
    td.appendChild(input);
}

// 設定新增車次的選單
function set_select(id, data) {
    const select = document.getElementById(id);

    data.forEach(function (optionData) {
        var option = document.createElement("option");
        option.value = optionData.id;
        option.text = optionData.id + " - " + optionData.dsc;
        select.appendChild(option);
    });
}

// 更新資料
function check_is_update(train_no, kind) {

    if (kind == "master") {
        const train_data = trains_data.trains_map.get(train_no);
        const data_in_class = {
            "Train": train_data.Train,
            "LineDir": train_data.LineDir,
            "Line": train_data.Line,
            "CarClass": train_data.CarClass
        };

        const data_on_ui = {
            "Train": document.getElementById("input-train-" + train_no).value,
            "LineDir": document.getElementById("sel-dir-" + train_no).value,
            "Line": document.getElementById("sel-line-" + train_no).value,
            "CarClass": document.getElementById("sel-car-" + train_no).value
        };
        if (train_no == data_on_ui.Train) {
            if (deepCompare(data_in_class, data_on_ui) == false) {
                trains_data.update_train(train_no, data_on_ui.LineDir, data_on_ui.Line, data_on_ui.CarClass);
            }
        }
        else {
            trains_data.update_train_number(train_no, data_on_ui.Train, data_on_ui.LineDir, data_on_ui.Line, data_on_ui.CarClass);
            document.getElementById("input-train-" + train_no).id = "input-train-" + data_on_ui.Train;
            document.getElementById("sel-dir-" + train_no).id = "input-train-" + data_on_ui.Train;
            document.getElementById("sel-line-" + train_no).id = "input-train-" + data_on_ui.Train;
            document.getElementById("sel-car-" + train_no).id = "input-train-" + data_on_ui.Train;
        }
    }
    else if (kind == "detail") {
        let time_infos = [];
        const rows = detailTableContainer.getElementsByTagName("tr");

        for (var i = 1; i < rows.length + 1; i++) {
            time_infos.push({
                "Station": document.getElementById("sel-station-" + i).value,
                "Order": i.toString(),
                "DEPTime": document.getElementById("input-deptime-" + i).value,
                "ARRTime": document.getElementById("input-arrtime-" + i).value
            })
        }

        if (time_infos.length > 0) {
            trains_data.selected_train.TimeTable = time_infos;
            trains_data.update_train_map(trains_data.selected_train_no, time_infos);
        }
    }
}

// 比較兩個物件的屬性數量
function deepCompare(obj1, obj2) {
    if (Object.keys(obj1).length !== Object.keys(obj2).length) {
        return false;
    }

    // 遞迴比較兩個物件的屬性和值
    for (let prop in obj1) {
        if (obj1.hasOwnProperty(prop)) {
            if (!obj2.hasOwnProperty(prop)) {
                return false;
            }
            if (typeof obj1[prop] === "object" && typeof obj2[prop] === "object") {
                if (!deepCompare(obj1[prop], obj2[prop])) {
                    return false;
                }
            } else if (obj1[prop] !== obj2[prop]) {
                return false;
            }
        }
    }

    return true;
}
