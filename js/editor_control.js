// 建立新時刻表按鍵
function open_new_timetable() {
    const results = window.confirm('您確定要清除所有資料嗎？');
    if (results == true) {
        file_input.value = '';
        trains_data.clear_all_data();
        mainTableContainer.innerHTML = '';
        detailTableContainer.innerHTML = '';
        pagination.innerHTML = '';
    }
}

// 新增車次按鍵
function add_new_train() {
    const train_no = document.getElementById('train_no');

    if (train_no.value !== "") {
        const line_dir = document.getElementById('line_dir');
        const line = document.getElementById('line');
        const car_class = document.getElementById('car_class');

        const results = trains_data.add_train_map(train_no.value, {
            "Train": train_no.value,
            "LineDir": line_dir.value,
            "Line": line.value,
            "CarClass": car_class.value,
            "TimeInfos": []
        });

        if (results) 
            to_last_Page();
        else 
            window.alert("目前資料中已經有這個車次號！");
    }
    else 
        window.alert("請輸入一個新的車次號！");
}

// 新增車站按鍵
function add_new_station() {
    if (trains_data.selected_train_no != "-1") {
        const stations = document.getElementById('stations');
        const rows = detailTableContainer.getElementsByTagName("tr");
        const new_row_index = rows.length + 1;

        const row = document.createElement('tr');
        detailTableContainer.appendChild(row);

        // 順序
        add_text_td(row, new_row_index);
        // 刪除欄位
        add_button_td(row, "刪除", new_row_index);
        // 車站欄位
        add_td_selection(row, stations_kind, "sel-station-" + new_row_index);
        // 到站時間
        add_textbox_td(row, "12:00:00", "input-arrtime-" + new_row_index);
        // 離站時間
        add_textbox_td(row, "12:00:00", "input-deptime-" + new_row_index);

        select_update("sel-station-" + new_row_index, stations.value);

        check_is_update(trains_data.selected_train_no, "detail");
    }
    else {
        window.alert("目前您沒有選擇一個車次！");
    }
}

// 使用者操作與上傳檔案按鍵
function file_upload() {
    // 擷取使用者選擇的檔案、車次號與路線
    const file_input = document.getElementById("file_input");
    const file = file_input.files[0];

    if (typeof file !== "undefined") {

        const reader = new FileReader();
        reader.onload = function (event) {
            const contents = event.target.result;
            trains_data.initial_trains(JSON.parse(contents));
            display_master();
        };
        reader.readAsText(file);
    } else {
        window.alert("請選擇正確的JSON格式檔案！");
    }
}

// 檔案存檔按鍵
function file_save() {
    check_is_update(trains_data.selected_train_no, "detail");
    let json_object = { TrainInfos: [] };

    trains_data.trains_map.forEach(function (value, key) {
        json_object.TrainInfos.push(value);
    });

    const json = JSON.stringify(json_object);
    trains_data.download(json, 'export.json', 'text/plain');

    trains_data.update_tables();
}

// 直接轉運行圖按鍵
function open_in_diagram() {
    var obj = [];
    trains_data.trains_map.forEach(function (value, key) {
        obj.push(value);
    });

    const option = document.getElementById("operation_lines");

    let data = {};
    data["TrainInfos"] = obj;

    var jsonText = JSON.stringify(data);
    window.localStorage.setItem("diagram_data", jsonText);
    window.open('export.html?lineKind=' + option.value, '_blank');
}

// 上一頁連結
function move_last_page() {
    if (currentPage > 1) {
        currentPage--;
        display_master();
    }
}

// 下一頁連結
function move_next_page() {
    var totalPages = Math.ceil(trains_data.master_train_info.length / itemsPerPage);

    if (currentPage < totalPages) {
        currentPage++;
        display_master();
    }
}

// 到最後一頁
function to_last_Page() {
    currentPage = Math.ceil(trains_data.master_train_info.length / itemsPerPage);
    display_master();
}

// 讀取測試檔案
function read_sample() {
    initial_data();
}