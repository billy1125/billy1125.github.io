const today_date = getTodayFormattedDate();

const _refCache = {};
async function _fetchRef(path) {
    if (!_refCache[path]) _refCache[path] = fetch(path).then(r => r.json());
    return _refCache[path];
}

function initDisclaimer() {
    const confirmed = localStorage.getItem('is_confirmed');
    if (confirmed === 'ok') return;
    Swal.fire({
        title: '本網站聲明',
        icon: 'warning',
        html: `<p>本站所提供的資料，僅供參考，實際鐵路運行情況，請以現場、各鐵路與軌道系統的管理單位所公布資訊或實際鐵路運作為準。</p>
               <p style="margin-top:1em; font-size:0.9em; color:#555;">
                   按下「我同意」即表示您已閱讀並同意本站之
                   <a href="terms.html" target="_blank" rel="noopener">使用者條款</a>
                   及
                   <a href="privacy.html" target="_blank" rel="noopener">隱私權政策</a>。
               </p>`,
        width: 500,
        heightAuto: true,
        padding: '3em',
        backdrop: 'rgba(255, 255, 0, 0.2) no-repeat',
        showDenyButton: true,
        confirmButtonText: '我同意',
        denyButtonText: '我不同意',
    }).then((result) => {
        localStorage.setItem('is_confirmed', result.isConfirmed ? 'ok' : 'nook');
        if (result.isConfirmed) Swal.fire('您將開始瀏覽本網站，本聲明將不再出現', '', 'success');
    });
}

async function searchByTrainNumber(trainNo) {
    const todayFile = `data/${getTodayFormattedDate('nodash')}.json`;
    const [trainRes, stationRes, opLines] = await Promise.all([
        fetch(todayFile).then(r => r.json()),
        _fetchRef('js/references/Station.json'),
        _fetchRef('js/references/OperationLines.json'),
    ]);
    const train = trainRes.TrainInfos.find(t => t.Train === String(trainNo));
    if (!train) {
        Swal.fire({ title: '查無結果', text: `找不到車次 ${trainNo}`, icon: 'info' });
        return;
    }
    const lineCount = {};
    train.TimeInfos.forEach(t => {
        stationRes.filter(s => s.STATIONID === t.Station).forEach(s => {
            lineCount[s.LINE] = (lineCount[s.LINE] || 0) + 1;
        });
    });
    const allLines = Object.keys(lineCount).filter(line => lineCount[line] >= 2);
    if (allLines.length === 0) {
        Swal.fire({ title: '查無路線', text: `車次 ${trainNo} 無法對應到行經路線`, icon: 'info' });
        return;
    }
    const btnHtml = allLines.map(line => {
        const name = opLines[line]?.NAME ?? line;
        return `<button class="swal2-confirm swal2-styled" style="display:block;width:100%;margin:4px 0" data-line="${line}">${name}</button>`;
    }).join('');
    Swal.fire({
        title: `車次 ${train.Train} 行經路線`,
        html: btnHtml,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: '取消',
        didOpen: () => {
            document.querySelectorAll('.swal2-html-container [data-line]').forEach(btn => {
                btn.addEventListener('click', () => {
                    Swal.close();
                    window.location.href = `diagram_output.html?lineKind=${btn.dataset.line}&scrollToCurrentTime=true&trainNo=${trainNo}`;
                });
            });
        }
    });
}

async function searchByStationName(query) {
    const [stations, opLines, svgYAxis] = await Promise.all([
        _fetchRef('js/references/Station.json'),
        _fetchRef('js/references/OperationLines.json'),
        _fetchRef('js/references/SVG_Y_Axis.json'),
    ]);
    const results = stations.filter(s => s.STATIONNAME.includes(query));
    if (results.length === 0) {
        Swal.fire({ title: '查無結果', text: `找不到車站「${query}」`, icon: 'info' });
        return;
    }
    const btnHtml = results.map(s => {
        const name = opLines[s.LINE]?.NAME ?? s.LINE;
        return `<button class="swal2-confirm swal2-styled" style="display:block;width:100%;margin:4px 0" data-line="${s.LINE}" data-stationid="${s.STATIONID}">${name} - ${s.STATIONNAME}</button>`;
    }).join('');
    Swal.fire({
        title: `「${query}」的搜尋結果`,
        html: btnHtml,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: '取消',
        didOpen: () => {
            document.querySelectorAll('.swal2-html-container [data-line]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const line = btn.dataset.line;
                    const stationId = btn.dataset.stationid;
                    const station = (svgYAxis[line] || []).find(s => String(s.ID) === String(stationId));
                    if (!station) return;
                    Swal.close();
                    window.location.href = `diagram_output.html?lineKind=${line}&scrollToCurrentTime=true&stationAxisY=${station.SVGYAXIS}`;
                });
            });
        }
    });
}

function searchStation(query) {
    if (/^\d+$/.test(query)) {
        searchByTrainNumber(query);
    } else {
        searchByStationName(query);
    }
}

$(document).ready(function () {
    $('#web_name').append(web_name);
    $('#today_date').append(today_date);
    $("meta[name='description']").attr("content", description);
    $("meta[name='keywords']").attr("content", keywords);

    initDisclaimer();

    $('#search-btn').on('click', function () {
        const query = $('#search-input').val().trim();
        if (query) searchStation(query);
    });
    $('#search-input').on('keydown', function (e) {
        if (e.key === 'Enter') {
            const query = $(this).val().trim();
            if (query) searchStation(query);
        }
    });
});
