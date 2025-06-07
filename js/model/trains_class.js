class TrainsClass {
    constructor() {
        this.trains_map = new Map();         // 列車資料集
        this.master_train_info = [];     // 主表資料：列車基本資訊
        this.detail_time_info = [];      // 副表資料：列車時刻表
        this.selected_train = {};
        this.selected_train_no = -1;
        this.last_selected_train_no = -1;
    }

    fetchData(url) {
        return new Promise((resolve, reject) => {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        resolve(JSON.parse(this.responseText));
                    } else {
                        reject(new Error("Error fetching data"));
                    }
                }
            };
            xmlhttp.open("GET", url, true);
            xmlhttp.send();
        });
    }

    // 資料初始化
    initial_trains(jsonData) {
        if (this.trains_map !== 0)
            this.trains_map.clear();

        for (const iterator of jsonData.TrainInfos) {
            this.trains_map.set(iterator.Train, { "Train": iterator.Train, "LineDir": iterator.LineDir, "Line": iterator.Line, "CarClass": iterator.CarClass, "TimeInfos": iterator.TimeInfos });
        }

        this.update_tables();
    }

    // 清除所有資料
    clear_all_data() {
        this.trains_map = new Map();
        this.master_train_info = [];
        this.detail_time_info = [];
        this.selected_train = {};
    }

    // 資料轉為主副表
    update_tables() {
        this.master_train_info.length = 0;
        this.detail_time_info.length = 0;

        for (const iterator of this.trains_map.values())
            this.master_train_info.push({ "Train": iterator.Train, "LineDir": iterator.LineDir, "Line": iterator.Line, "CarClass": iterator.CarClass });

        // 排序車次資料
        this.master_train_info.sort(function (a, b) {
            return a["Train"] - b["Train"];
        });

        for (const iterator of this.trains_map.values())
            this.detail_time_info.push({ "Train": iterator.Train, "TimeTable": iterator.TimeInfos });
    }

    // 刪除資料
    delete_train_map(train_no) {
        if (this.trains_map.has(train_no)) {
            this.trains_map.delete(train_no)
            this.update_tables();
            return true;
        } else
            return false;
    }

    // 新增車次
    add_train_map(train_no, data) {
        if (!this.trains_map.has(train_no)) {
            this.trains_map.set(train_no, data);
            this.update_tables();
            return true;
        } else
            return false;

    }

    // 更新資料
    update_train_map(train_no, data) {
        if (this.trains_map.has(train_no)) {
            const train_data = this.trains_map.get(train_no);

            this.trains_map.set(train_no, {
                "Train": train_data.Train,
                "LineDir": train_data.LineDir,
                "Line": train_data.Line,
                "CarClass": train_data.CarClass,
                "TimeInfos": data
            });
            this.update_tables();
            return true;
        } else
            return false;
    }

    // 更新車次
    update_train(train_no, line_dir, line, car_class) {
        if (this.trains_map.has(train_no)) {
            const train_data = this.trains_map.get(train_no);

            this.trains_map.set(train_no, {
                "Train": train_data.Train,
                "LineDir": line_dir,
                "Line": line,
                "CarClass": car_class,
                "TimeInfos": train_data.TimeInfos
            });
            this.update_tables();
            return true;
        } else
            return false;
    }

    // 更新車次(修改車次號)
    update_train_number(train_no, new_train_no, line_dir, line, car_class) {
        if (this.trains_map.has(train_no)) {
            const train_data = this.trains_map.get(train_no);
            this.trains_map.set(new_train_no, {
                "Train": new_train_no,
                "LineDir": line_dir,
                "Line": line,
                "CarClass": car_class,
                "TimeInfos": train_data.TimeInfos
            });
            this.delete_train_map(train_no);
            this.update_tables();
            return true;
        } else
            return false;
    }

    delete_station(id) {
        this.selected_train.TimeTable.splice(id, 1);
    }

    // 下載檔案的函式
    download(content, fileName, contentType) {
        var a = document.createElement("a");
        var file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }
}




