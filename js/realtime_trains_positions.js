
var $body = (window.opera) ? (document.compatMode == "CSS1Compat" ? $('html') : $('body')) : $('html,body');

$(document).ready(function () {
    $('#web_name').append(web_name)
    $("meta[name='description']").attr("content", description)
    $("meta[name='keywords']").attr("content", keywords)
    $('footer').append(footer)
    $("#navbar").load("../navbar.html")

    $.when(
        // 建立車站清單
        $.ajax({
            url: "data/realtime_trains_positions/stations.json",
            type: "GET",
            dataType: "json",
            cache: true,
            success: function (data) {
                StationsOnDOM(data)
            },
            error: function () {
                alert("讀取車站資料清單有錯誤!!!");
            }
        })
    ).then(function () {
        // 將各車次資料塞進車站間
        $.ajax({
            url: "data/realtime_trains.json",
            type: "GET",
            dataType: "json",
            cache: false, // 避免前端讀取列車位置快取資料
            success: function (data) {
                TrainsOnDOM(data)
            },
            error: function () {
                alert("讀取列車位置有錯誤!!!");
            }
        });
    });
})

function roundToTwo(num) {
    return +(Math.round(num + "e+1") + "e-1");
}

function StationsOnDOM(_data) {
    var li = ""
    for (let i = 0; i < _data.StationOfLines.length; i++) {
        let lineID = _data.StationOfLines[i].LineID
        li = ""
        if (lineID == "EL") { // 東部幹線車站順序要倒過來，基本上以逆時針方向為主
            for (let j = _data.StationOfLines[i].Stations.length - 1; j >= 0; j--) {
                let stationID = _data.StationOfLines[i].Stations[j].StationID
                let stationName = _data.StationOfLines[i].Stations[j].StationName.Zh_tw
                li += "<li class='list-group-item active' id='" + stationID + "''>" + stationName + "</li>"
                if (stationID == "7000") {
                    $('#TL').append(li)
                    li = "<li class='list-group-item active' id='" + stationID + "''>" + stationName + "</li>"
                }
                else if (stationID == "7130") {
                    $('#NL').append(li)
                    li = "<li class='list-group-item active' id='" + stationID + "''>" + stationName + "</li>"
                }
            }
            $('#EL').append(li)
        }
        else if (lineID == "WL") {
            for (let j = 0; j < _data.StationOfLines[i].Stations.length; j++) {
                let stationID = _data.StationOfLines[i].Stations[j].StationID
                let stationName = _data.StationOfLines[i].Stations[j].StationName.Zh_tw
                li += "<li class='list-group-item active' id='" + stationID + "''>" + stationName + "</li>"
                if (stationID == "1250") {
                    $('#' + lineID).append(li)
                    li = "<li class='list-group-item active' id='" + stationID + "''>" + stationName + "</li>"
                }
                else if (stationID == "3350") {
                    $('#WL-N').append(li)
                    li = "<li class='list-group-item active' id='" + stationID + "''>" + stationName + "</li>"
                }
            }
            $('#WL-S').append(li)
        }
        else {
            for (let j = 0; j < _data.StationOfLines[i].Stations.length; j++)
                li += "<li class='list-group-item active' id='" + _data.StationOfLines[i].Stations[j].StationID + "''>" + _data.StationOfLines[i].Stations[j].StationName.Zh_tw + "</li>"
            $('#' + lineID).append(li)
        }
    }
}

function TrainsOnDOM(_data) {
    let DataUpdateTime = new Date(_data.UpdateTime).toLocaleString()
    $('#UpdateTime').append("更新時間: ", DataUpdateTime)
    var currentTime = Date.parse(_data.UpdateTime)
    // let currentTime = Date.now()
    // console.log(currentTime)
    var li = ""
    for (var i = 0; i < _data.TrainLiveBoards.length; i++) {
        let TrainUpdateTime = Date.parse(_data.TrainLiveBoards[i].UpdateTime)
        let updateTime = roundToTwo((currentTime - TrainUpdateTime) / 60000)
        if (updateTime < 10) {
            let delytime = ""
            let trainNo = _data.TrainLiveBoards[i].TrainNo
            let trainTypeName = _data.TrainLiveBoards[i].TrainTypeName.Zh_tw
            let stationID = _data.TrainLiveBoards[i].StationID
            let num = parseInt(trainNo)
            // 處理誤點資訊
            if (_data.TrainLiveBoards[i].DelayTime != "0")
                delytime = "<span class='badge'>晚" + _data.TrainLiveBoards[i].DelayTime + "分</span> <span class='badge alert-info'>" + updateTime + "分前更新</span>"
            else
                delytime = "<span class='badge alert-success'>準時</span> <span class='badge alert-info'>" + updateTime + "分前更新</span>"
            // 如果該車次為順時針方向，資料放在車站項目之上
            if ((num % 2) === 0)
                $('#' + stationID).before("<li class='list-group-item list-group-item-info' id='" + trainNo + "'>⬆️ " + trainNo + "次 - " + trainTypeName + delytime + "</li>")
            else
                $('#' + stationID).after("<li class='list-group-item list-group-item-info' id='" + trainNo + "'>⬇️ " + trainNo + "次 - " + trainTypeName + delytime + "</li>")
        }
    }
}

$.ajax({
    url: "data/realtime_trains_positions/lines.json",
    type: "GET",
    dataType: "json",
    cache: true,
    success: function (data) {
        for (let i = 0; i < data.Lines.length; i++) {
            let option = document.createElement("option")
            option.innerHTML = data.Lines[i].LineName.Zh_tw
            option.value = data.Lines[i].LineID
            $('#LinesSelect').append(option)
        }
    },
    error: function () {
        alert("讀取車站資料清單有錯誤!!!");
    }
});

$("#LinesSelect").change(function () {
    var value = $(this).val();
    if (value != "路線選擇") {
        window.location.href = "#" + value
        let target_top = $("#" + value).offset().top
        $body.animate({
            scrollTop: target_top - 150
        }, 800);
    }
});

$("#TrainNoSearch").click(function () {
    var value = $("#TrainNoSearchText").val()
    if ($("#" + value).length) {
        window.location.href = "#" + value
        let target_top = $("#" + value).offset().top
        $body.animate({
            scrollTop: target_top - 150
        }, 500);
    }
    else {
        alert("目前沒有該車次!")
    }
});

$("#GoTop").click(function () {
    let target_top = $body.offset().top
    $body.animate({
        scrollTop: target_top - 150
    }, 100);
});