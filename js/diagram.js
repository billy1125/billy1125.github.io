// 繪製運行圖底圖(基礎時間與車站線)
function draw_diagram_background(line_kind, date) {
    Object.entries(OperationLines).forEach(([key, value]) => {
        if (key == line_kind) {
            const width = 1200 * (DiagramHours.length - 1) + 100;                // 運行圖長寬
            const height = value['MAX_X_AXIS'];
            const draw = SVG().addTo('body').size(width, height + 75);           // 設定SVG物件
            const text_spacing_factor = 500;
            const draw_date = Date().toLocaleString();
            const now_time_x_axis = get_now_time_x_axis(0);

            const title = `${value['NAME']} ，日期：${date}，運行圖繪製完成時間：${draw_date}`;        // 運行圖標題文字設定
            add_text(draw, title, 5, 0, null);

            // 小時線
            for (let i = 0; i < DiagramHours.length; i++) {
                let x = 50 + i * 1200;
                let y = 0;
                add_line(draw, x, 50, x, height + 50, "hour_line");

                while (true) {
                    let hour = DiagramHours[i];
                    let hour_text = padStart(hour.toString(), 2, "0");
                    if (hour == 24) {
                        after_midnight = "隔日";
                        css = "hour_midnight";
                    }
                    else {
                        after_midnight = "";
                        css = "hour";
                    }
                    if (y <= height)
                        add_text(draw, `${hour_text}00 ${after_midnight}`, x, y + 30, css);
                    else
                        break;
                    y += text_spacing_factor;
                }
                // 十分鐘線
                if (i != DiagramHours.length - 1) {
                    for (let j = 0; j < 5; j++) {
                        x = 50 + i * 1200 + (j + 1) * 200;
                        if (j != 2)
                            add_line(draw, x, 50, x, height + 50, "min10_line");
                        else
                            add_line(draw, x, 50, x, height + 50, "min30_line");

                        y = 0
                        while (true) {
                            if (y <= height) {
                                if (j != 2)
                                    add_text(draw, `${j + 1}0`, x, y + 30, "min10");
                                else
                                    add_text(draw, `${j + 1}0`, x, y + 30, "min30");
                            }
                            else
                                break;
                            y += text_spacing_factor;
                        }

                    }
                }
            }
            // 車站線
            const stations = LinesStationsForBackground[key];
            Object.entries(stations).forEach(([key1, value1]) => {
                y = value1['SVGYAXIS'] + 50;
                if (value1['ID'] != 'NA')
                    add_line(draw, 50, y, width - 50, y, "station_line");
                else
                    add_line(draw, 50, y, width - 50, y, "station_noserv_line");
                for (let i = 0; i < 31; i++) {
                    if (value1['ID'] != 'NA')
                        add_text(draw, value1['DSC'], 5 + i * 1200, y - 20, "station");
                    else
                        add_text(draw, value1['DSC'], 5 + i * 1200, y - 20, "station_noserv");
                }
            })

            diagram_objects[key] = draw;
            add_line(draw, now_time_x_axis, 50, now_time_x_axis, height + 50, "now_time_line");
        }
    })
}

// 繪製每一個車次線與車次標註文字
function draw_train_path(all_trains_data, realtime_trains) {
    for (let train_data of all_trains_data) {
        for (let [line_kind, train_no, train_kind, line, line_dir, value] of train_data) {
            if (value.length > 2) {
                // 某些路線車次線分成兩段，找出那些不連續的資料，將車次資料分成兩段分別繪製
                const uncontinuous_index = find_uncontinuous_index(value);
                const section_start_value = value.slice(0, uncontinuous_index);
                const section_end_value = value.slice(uncontinuous_index, value.length);
                let realtime_data;
                if (typeof (realtime_trains) != "undefined" && realtime_trains != null) {
                    realtime_data = realtime_trains.get(train_no);
                }

                if (section_start_value.length > 1)
                    set_path(line_kind, train_no, train_kind, section_start_value);
                if (typeof (realtime_data) != "undefined")
                    mark_realtime_train_position(section_start_value, line_dir, train_kind, realtime_data);

                if (section_end_value.length > 3)
                    set_path(line_kind, train_no + "-End", train_kind, section_end_value);
                if (typeof (realtime_data) != "undefined")
                    mark_realtime_train_position(section_end_value, line_dir, train_kind, realtime_data);
            }
        }
    }
}

// 找出不連續資料的函式
function find_uncontinuous_index(value) {
    let order_next = value[0][5];
    let index = 0;

    for (const [dsc, id, time, loc, stop, order] of value) {
        if (order == order_next) {
            order_next += 1;
            index += 1;
        }
        else {
            break
        }
    }
    return index;
}

// 車次線資料處理
function set_path(line_kind, train_no, train_kind, value) {
    let path = "M";
    let coordinates = [];
    let style = CarKind[train_kind];
    const diagram_need_stop = find_diagram_need_to_stop(line_kind);

    if (typeof (style) == "undefined") {
        style = "others";
    }

    for (const [dsc, id, time, loc, stop, order] of value) {
        let x = time * 10 - 1200 * DiagramHours[0] + 50;
        let y = loc + 50;
        x = Math.round((x + Number.EPSILON) * 100) / 100;
        y = Math.round((y + Number.EPSILON) * 100) / 100;
        if (stop != -1 || diagram_need_stop.includes(id)) {
            path += x.toString() + ',' + y.toString() + ' ';
            coordinates.push([x, y]);
        }
    }

    let text_position = calculate_text_position(coordinates, style);
    add_path(diagram_objects[line_kind], line_kind, train_no, path, text_position, style);
}

// 計算車次號標註的位置
function calculate_text_position(coordinates, color) {
    let coordinates_pairs_temp = [];
    let coordinates_distance = []; // 用來置放每一個轉折點之間的長度

    for (const iterator of coordinates) {
        if (coordinates_pairs_temp.length === 2) {
            let distance = calculate_distance(coordinates_pairs_temp[0], coordinates_pairs_temp[1]);
            coordinates_distance.push(distance);
            coordinates_pairs_temp[0] = coordinates_pairs_temp[1];
            coordinates_pairs_temp[1] = iterator;
        } else if (coordinates_pairs_temp.length === 1) {
            coordinates_pairs_temp.push(iterator);
        } else if (coordinates_pairs_temp.length === 0) {
            coordinates_pairs_temp.push(iterator);
        }
    }

    if (coordinates_pairs_temp.length == 2) {
        coordinates_distance.push(calculate_distance(coordinates_pairs_temp[0], coordinates_pairs_temp[1]));
    }

    // 標號邏輯，區間車：各段長度長於60，偶數位的進行標註，其他車種：100-500的長度在中間標註，大於500則是在中間標註兩次
    let text_position = []; // 用來置放標號定位點
    let accumulate_dist = 0; // 所有轉折點的長度累進

    if (color === "local") {
        let new_text_position = [];
        for (let item of coordinates_distance) {
            if (item > 60) {
                const pos = accumulate_dist + item / 4;
                text_position.push(pos);
            }
            accumulate_dist += item;
        }

        for (let i = 0; i < text_position.length; i++) {
            if (i % 2 === 0) {
                new_text_position.push(text_position[i]);
            }
        }

        text_position = new_text_position;
    } else {
        for (let item of coordinates_distance) {
            if (item > 60 && item < 100) {
                text_position.push(0);
            } else if (item >= 100 && item <= 500) {
                const pos = accumulate_dist + item / 2;
                text_position.push(pos);
            } else if (item > 500) {
                for (let i = 1; i <= 2; i++) {
                    const pos = accumulate_dist + i * (item / 3);
                    text_position.push(pos);
                }
            }
            accumulate_dist += item;
        }
    }
    return text_position;
}

// 標註列車即時位置
function mark_realtime_train_position(value, line_dir, train_kind, realtime_data) {
    let now_time_x_axis = null;
    let coordinates_all_station = [];
    let style = CarKind[train_kind] + "_mark";
    const diagram_need_stop = find_diagram_need_to_stop(line_kind);

    if (typeof (style) == "undefined") {
        style = "special_mark";
    }

    if (realtime_data.StationID > 0)
        now_time_x_axis = get_now_time_x_axis(realtime_data.DelayTime);

    

    // 將所有車站的位置找出，如果是不會停靠的車站，X軸的點設定NaN缺值
    for (const [dsc, id, time, loc, stop, order] of value) {
        let x = time * 10 - 1200 * DiagramHours[0] + 50;
        let y = loc + 50;
        x = Math.round((x + Number.EPSILON) * 100) / 100;
        y = Math.round((y + Number.EPSILON) * 100) / 100;

        if (stop != -1 || diagram_need_stop.includes(id))
            coordinates_all_station.push([x, y]);
    }

    let start_index = -1;
    let end_index = -1;
    for (let i = 1; i < coordinates_all_station.length; i++) {
        if (coordinates_all_station[i][0] >= now_time_x_axis && coordinates_all_station[0][0] <= now_time_x_axis) {
            end_index = i;
            start_index = end_index - 1;

            axis_x = [coordinates_all_station[start_index][0], now_time_x_axis, coordinates_all_station[end_index][0]];
            axis_y = [coordinates_all_station[start_index][1], NaN, coordinates_all_station[end_index][1]];

            if (axis_x[0] <= axis_x[1] && axis_x[1] <= axis_x[2]) {
                const interpolatedArray = interpolateArray(axis_x, axis_y);
                // console.log(interpolatedArray);

                let mark = diagram_objects[line_kind].circle(10).move(axis_x[1] - 5, interpolatedArray[1] - 5);
                mark.attr({ class: style });
            }
            break;
        }
    }
}

// 增加線條函式，用於直線
function add_line(draw_object, x1, x2, y1, y2, style) {
    const line = draw_object.line(x1, x2, y1, y2);
    line.attr({ class: style });
}

// 增加文字函式
function add_text(draw_object, text_string, x, y, style) {
    const text = draw_object.text(text_string).move(x, y);
    text.attr({ class: style });
}

// 增加折線與文字函式，用於車次線
function add_path(draw_object, line_kind, train_id, path_string, text_position, style) {
    const train_id_text = '#' + line_kind + train_id; // SVG.js 會檢查屬性是不是顏色，故不能單純只是用 #283 用車次號做 ID

    const path = draw_object.path(path_string);
    path.attr({ class: style, id: line_kind + train_id });

    // 車次線文字標註(SVG path文字)
    for (const iterator of text_position) {
        const text = draw_object.text(function (add) {
            add.tspan(train_id).dy(-3)
        })
        const textpath = text.path();
        textpath.attr({ href: train_id_text, startOffset: iterator, class: style });
    }
}

// 填充文字函式
function padStart(string, targetLength, padString) {
    return padString.repeat(Math.max(0, targetLength - string.length)) + string;
}

// 計算平面上兩點距離函式
function calculate_distance(start, end) {
    const deltaX = end[0] - start[0];
    const deltaY = end[1] - start[1];
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    return distance;
}

// 計算插補資料
function interpolateArray(A, B) {
    const result = [];

    for (let i = 0; i < A.length; i++) {
        if (!isNaN(B[i])) {
            result[i] = B[i];
        } else {
            const referenceValue = A[i];
            let prevIndex = i - 1;
            let nextIndex = i + 1;

            while (isNaN(B[prevIndex]) && prevIndex >= 0) {
                prevIndex--;
            }

            while (isNaN(B[nextIndex]) && nextIndex < A.length) {
                nextIndex++;
            }

            const prevValue = B[prevIndex];
            const nextValue = B[nextIndex];
            const prevDiff = referenceValue - A[prevIndex];
            const nextDiff = A[nextIndex] - referenceValue;
            const totalDiff = prevDiff + nextDiff;

            const value = (prevValue * nextDiff + nextValue * prevDiff) / totalDiff;
            result[i] = Math.round((value + Number.EPSILON) * 100) / 100;
        }
    }

    return result;
}

// 取得現在時間，轉換成X軸
function get_now_time_x_axis(minus_time) {    
    let currentTime = new Date();
    currentTime.setMinutes(currentTime.getMinutes() - minus_time);

    // 取得減去10分鐘後的台北時間
    var options = { timeZone: 'Asia/Taipei', hour12: false };
    var newTime = currentTime.toLocaleString('en-US', options);

    let hours = currentTime.getHours().toString().padStart(2, '0');
    let minutes = currentTime.getMinutes().toString().padStart(2, '0');
    let seconds = currentTime.getSeconds().toString().padStart(2, '0');

    // 將秒調整為最接近的 00 或 30
    seconds = Math.round(seconds / 30) * 30;
    seconds = seconds === 60 ? '00' : seconds.toString().padStart(2, '0');

    const x = SVG_X_Axis[`${hours}:${minutes}:${seconds}`].ax1 * 10 - 1200 * DiagramHours[0] + 50;
    // const x = SVG_X_Axis["15:30:00"].ax1 * 10 - 1200 * DiagramHours[0] + 50;
    return x;
}

// 找出運行圖中必須標註的車站
function find_diagram_need_to_stop(line_kind) {
    let diagram_need_stop = [];
    for (item of LinesStationsForBackground[line_kind]) {
        if (item['TERMINAL'] == 'Y')
            diagram_need_stop.push(item['ID']);
    }
    return diagram_need_stop;
}