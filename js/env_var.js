let Route = null;
let SVG_X_Axis = null;
let LinesStations = {};
let LinesStationsForBackground = {};
let OperationLines = {};
let CarKind = {};
let DiagramHours = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 1, 2, 3, 4, 5, 6];
let diagram_objects = {};

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

// 四个 JSON 文件的路径
let file1 = "data/diagram_js/Route.json";
let file2 = "data/diagram_js/SVG_X_Axis.json";
let file3 = "data/diagram_js/SVG_Y_Axis.json";
let file4 = "data/diagram_js/OperationLines.json";
let file5 = "data/diagram_js/CarKind.json";

// 读取四个 JSON 文件，并将它们存储在一个数组中
Promise.all([
    readJSONFile(file1),
    readJSONFile(file2),
    readJSONFile(file3),
    readJSONFile(file4),
    readJSONFile(file5)
])
    .then(function (results) {
        // 在这里执行后续的代码
        // console.log("All JSON files loaded!");
        // console.log(results[0]); // 第一个 JSON 文件的数据
        // console.log(results[1]); // 第二个 JSON 文件的数据
        // console.log(results[2]); // 第三个 JSON 文件的数据
        // console.log(results[3]); // 第四个 JSON 文件的数据
        Route = results[0];
        SVG_X_Axis = results[1];
        initial_line_data(results[2]);
        OperationLines = results[3];
        CarKind = results[4];   
    })
    .catch(function (error) {
        // 处理错误
        console.error(error);
    });


function initial_line_data(file) {
    Object.entries(file).forEach(([key, value]) => {
        let stations_loc = {};
        let stations_loc_for_background = {};
        for (let i = 0; i < value.length; i++) {
            if (value[i]['ID'] != 'NA')
                stations_loc[value[i]['ID']] = { 'DSC': value[i]['DSC'], 'SVGYAXIS': value[i]['SVGYAXIS'] };

            stations_loc_for_background[value[i]['ID']] = { 'DSC': value[i]['DSC'], 'SVGYAXIS': value[i]['SVGYAXIS'], 'TERMINAL': value[i]['TERMINAL'] };
        }
        LinesStations[key] = stations_loc;
        LinesStationsForBackground[key] = stations_loc_for_background;
    })
}
