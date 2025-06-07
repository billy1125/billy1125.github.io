const today_date = getFormattedDate();

function getFormattedDate() {
    const today = new Date();
    const year = today.getFullYear().toString().padStart(4, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');

    return year + month + day;
}

// 在SVG搜尋車次
function QueryTrainNo(_TrainNo, _Kind) {
    let trainNo = parseInt(_TrainNo);
    let val = "#" + _TrainNo;
    let target_top = 0;

    if ((trainNo % 2) === 0)
        target_top = document.body.scrollHeight;

    // console.log(val)
    if ($("svg").find(val).length > 0) {
        $("svg").find(val).each(function () {
            let $body = (window.opera) ? (document.compatMode == "CSS1Compat" ? $('html') : $('body')) : $('html,body');

            let target_left = $("svg").find(val).offset().left;
            let target_top = $("svg").find(val).offset().top;
            // console.log(target_left)
            // console.log(target_top1)
            $body.animate({
                scrollLeft: target_left - 100
            }, 100);
            $body.animate({
                scrollTop: target_top - 50
            }, 100);
        });
    } else {
        alert("無此車次！")
        if (_Kind == 0)
            $('input[name="TrainNoSearchText"]').val("");
    }
}

function leftpad(str, len, pad) {
    str = String(str);
    pad = String(pad || ' ');
    while (str.length < len) {
        str = pad + str;
    }
    return str;
}

// 滾動到指定位置
function scrollToPosition(xPostion, yPosition) {
    window.scrollTo(xPostion, yPosition);
}
