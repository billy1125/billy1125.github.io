// 程式碼參考來源：https://surreal.tw:8443/program/note/progessbar-timer
// 起始時間(計時器的啟動時間)。
const startTime = new Date().getTime();

// 目標時間(要倒數幾秒)。
const targetSeconds = 180;

// timer.
var timer = function (startTime) {
    // 當前時間。
    var currentTime = new Date().getTime();

    // 當前時間 - 起始時間 = 經過時間。(因為不需要毫秒，所以將結果除以1000。)
    var diffSec = Math.round((currentTime - startTime) / 1000);

    // 目標時間 - 經過時間 = 剩餘時間。
    var remainingTime = targetSeconds - diffSec;

    // update progess.  
    update(remainingTime);

    if (remainingTime <= 0) {
        // stop the timer.
        clearInterval(timerId);

        // do anything you want to.
        // $(".msg").text("time up!");
        window.location.reload();
    }
}

// start the timer.
var timerId = setInterval(function () { timer(startTime); }, 1000);

// update progess with the timer.
function update(seconds) {
    barRenderer(seconds);
    //textRenderer(seconds);
}

// refresh the bar.
function barRenderer(seconds) {
    var percent = (seconds / targetSeconds) * 100;
    $("#progessbar").css("width", percent + "%");
}

// refresh the text of the bar.
function textRenderer(seconds) {
    var sec = seconds % 60;
    var min = Math.floor(seconds / 60);

    /* 兩種作法都可以 */
    //min = min > 9 ? min : "0" + min;
    //sec = sec > 9 ? sec : "0" + sec;  
    min = min.toString().padStart(2, '0');
    sec = sec.toString().padStart(2, '0');

    $(".text").text(min + ":" + sec);
}