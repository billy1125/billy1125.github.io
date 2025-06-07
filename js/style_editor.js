let fills = {
    hour: ["小時文字", ""],
    min10: ["10分鐘文字", ""],
    min30: ["30分鐘文字", ""],
    station: ["車站文字", ""],
    station_noserv: ["未服務車站文字", ""],
    hour_midnight: ["午夜12點文字", ""],
    taroko_mark: ["太魯閣號", ""],
    puyuma_mark: ["普悠瑪號", ""],
    tze_chiang_mark: ["PP自強號", ""],
    tze_chiang_diesel_mark: ["柴油自強號", ""],
    emu3000_mark: ["EMU3000", ""],
    chu_kuang_mark: ["莒光號", ""],
    local_mark: ["區間車", ""],
    local_express_mark: ["區間快", ""],
    ordinary_mark: ["普快車", ""],
    special_mark: ["專列、自由座", ""],
    others_mark: ["其他", ""]
};

let strokes = {
    hour_line: ["小時線", ""],
    min10_line: ["10分鐘線", ""],
    min30_line: ["30分鐘線", ""],
    station_line: ["車站線", ""],
    station_noserv_line: ["未服務車站線", ""],
    taroko: ["太魯閣號", ""],
    puyuma: ["普悠瑪號", ""],
    tze_chiang: ["PP自強號", ""],
    tze_chiang_diesel: ["柴油自強號", ""],
    emu3000: ["EMU3000", ""],
    chu_kuang: ["莒光號", ""],
    local: ["區間車", ""],
    local_express: ["區間快", ""],
    ordinary: ["普快車", ""],
    special: ["專列、自由座", ""],
    others: ["其他", ""],
    zhongxing: ["中興號", ""],
    alishan_local: ["區間車", ""],
    theme: ["主題式列車", ""],
    alishan: ["阿里山號", ""],
    chushan1: ["祝客(祝山線)", ""],
    kuaimu: ["檜木車廂", ""],
    direct: ["直達車次", ""],
    skip_stop: ["間格停靠車次(跳蛙車次)", ""],
    all_stop: ["每站皆停車次", ""]
};

initial_style_editor();

// 頁面初始化
function initial_style_editor() {
    if (localStorage.getItem("user_styles") !== null) {
        const user_data = JSON.parse(localStorage.getItem("user_styles"));
        strokes = user_data["strokes"];
        fills = user_data["fills"];
    }
    else {
        load_default_css(strokes, "stroke");
        load_default_css(fills, "fill");
    }
    set_color_legend(strokes, "stroke");
    set_color_legend(fills, "fill");
}

// 讀取預設運行圖CSS的樣式設定
function load_default_css(data, kind) {
    Object.entries(data).forEach(([key, value]) => {
        const style = document.getElementsByClassName(key);
        const color_lengend = window.getComputedStyle(style[0]);

        if (kind == "fill")
            color_setting = rgbToHex(color_lengend.fill);
        else if (kind == "stroke")
            color_setting = rgbToHex(color_lengend.stroke);

        value[1] = color_setting;
    })
}

// 將顏色設定到按鍵中
function set_color_legend(data, kind) {
    Object.entries(data).forEach(([key, value]) => {
        const button = document.getElementById(key);
        const picker = new Picker({
            parent: button,
            color: value[1],
            alpha: false,
            popup: 'bottom',
            onChange: function (color) {
                button.style.backgroundColor = color.rgbaString();
            },
            onClose: function (color) {
                button.textContent = `${value[0]} ${rgbToHex(color.rgbString())}`;
                value[1] = rgbToHex(color.rgbString());
            },
        });
        button.textContent = `${value[0]} ${value[1]}`;
    })
}

// RGB色碼轉HEX色碼
function rgbToHex(rgb) {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) {
        return "";
    }
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    const hex = "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
    return hex;
}

// 儲存個人的樣式設定
function save_to_localStorage() {
    let output = {};
    output["fills"] = fills;
    output["strokes"] = strokes;

    var jsonText = JSON.stringify(output);
    window.localStorage.setItem("user_styles", jsonText);

    if (localStorage.getItem("user_styles") !== null) {
        window.alert("儲存成功！");
        window.location.reload();
    }
}

// 恢復原來的樣式設定
function set_default() {
    const results = window.confirm('您確定要恢復預設的樣式設定嗎？');
    if (results == true) {
        window.localStorage.removeItem("user_styles");
        window.location.reload();
    }
}

// 檔案存檔按鍵
function save_to_file() {
    save_to_localStorage();
    let json_object = JSON.parse(localStorage.getItem("user_styles"));
    const json = JSON.stringify(json_object);
    download(json, 'user_styles.json', 'text/plain');
}

// 下載檔案的函式
function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

// 使用者操作與上傳檔案按鍵
function file_upload() {
    const file_input = document.getElementById("file_input");
    const file = file_input.files[0];

    if (typeof file !== "undefined") {
        const reader = new FileReader();
        reader.onload = function (event) {
            const contents = event.target.result;
            var jsonText = JSON.stringify(JSON.parse(contents));
            window.localStorage.setItem("user_styles", jsonText);
            initial_style_editor();
        };
        reader.readAsText(file);
    } else {
        window.alert("請選擇正確的JSON格式檔案！");
    }
}
