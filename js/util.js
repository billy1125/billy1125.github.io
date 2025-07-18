// 讀取 JSON 檔案
function readJSONFile(file) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.overrideMimeType("application/json");
        xhr.open("GET", file, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var json = JSON.parse(xhr.responseText);
                    resolve(json);
                } else {
                    reject(xhr.statusText);
                }
            }
        };
        xhr.send(null);
    });
}

// 初始化線路資料
function initial_line_data(file) {
    Object.entries(file).forEach(([key, value]) => {
        let stations_loc = {};
        let stations_loc_for_background = [];
        for (let i = 0; i < value.length; i++) {
            if (value[i]['ID'] != 'NA')
                stations_loc[value[i]['ID']] = { 'DSC': value[i]['DSC'], 'SVGYAXIS': value[i]['SVGYAXIS'] };
            stations_loc_for_background.push({ 'ID': value[i]['ID'], 'DSC': value[i]['DSC'], 'SVGYAXIS': value[i]['SVGYAXIS'], 'TERMINAL': value[i]['TERMINAL'] });
        }
        LinesStations[key] = stations_loc;
        LinesStationsForBackground[key] = stations_loc_for_background;
    })
}

// 運行圖下載
function download_file() {
    const xmlDoc = document.implementation.createDocument(null, null, null);
    const xmlDeclaration = xmlDoc.createProcessingInstruction("xml", 'version="1.0" encoding="UTF-8"');
    const stylesheet = xmlDoc.createProcessingInstruction("xml-stylesheet", 'type="text/css" href="style.css"');
    const svgElement = document.querySelectorAll("svg");
    xmlDoc.insertBefore(xmlDeclaration, xmlDoc.firstChild);
    xmlDoc.insertBefore(stylesheet, xmlDoc.firstChild.nextSibling);
    xmlDoc.appendChild(svgElement[0]);

    const xmlString = new XMLSerializer().serializeToString(xmlDoc);
    const blob = new Blob([xmlString], { type: 'image/svg+xml' });

    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, `export.svg`);
    } else {
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `export.svg`;
        downloadLink.click();
        URL.revokeObjectURL(downloadLink.href);
    }
}

// 取得今天的日期，格式為 YYYY-MM-DD 或 YYYYMMDD
function getTodayFormattedDate(format = 'dash') {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    if (format === 'dash') {
        return `${year}-${month}-${day}`;
    } else if (format === 'nodash') {
        return `${year}${month}${day}`;
    } else {
        return 'Invalid format. Use "dash" or "nodash".';
    }
}