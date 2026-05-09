// Type：列車型態（1=定期 2=加開 3=郵輪 4=專列）
const TRAIN_TYPE_MAP = {
    '1': '定期', '2': '加開', '3': '郵輪', '4': '專列'
};

// CarClass：列車種類代碼表（V1.5）
const CAR_CLASS_MAP = {
    '1100': '自強',           '1101': '自強(太,障)',    '1102': '自強(腳,障)',
    '1103': '自強(障)',        '1104': '自強(專)',       '1105': '自強(郵)',
    '1106': '自強(商專)',      '1107': '自強(普,障)',    '1108': '自強(PP障)',
    '1109': '自強(PP親)',      '110A': '自強(PP障12)',   '110B': '自強(E12)',
    '110C': '自強(E3)',        '110D': '自強(D28)',      '110E': '自強(D29)',
    '110F': '自強(D31)',       '110G': '自強(3000障)',   '110H': '自強(3000親障)',
    '1110': '莒光',            '1111': '莒光(障)',       '1112': '莒光(專)',
    '1113': '莒光(郵)',        '1114': '莒光(腳)',       '1115': '莒光(腳,障)',
    '1120': '復興',            '1121': '復興(專)',       '1122': '復興(郵)',
    '1130': '電車(專)',        '1131': '區間車',         '1132': '區間快',
    '1133': '電車(郵)',        '1134': '兩鐵(專)',       '1135': '區間車(腳,障)',
    '1140': '普快車',          '1141': '柴快車',
    '1150': '普通車(專)',      '1151': '普通車',         '1152': '行包專車',
    '1154': '柴客(專)',        '1155': '柴客(郵)',       '110K': '自強',
    '1270': '普通貨車',        '1280': '客迴',           '1281': '柴迴',
    '1282': '臨時客迴',        '12A0': '調車列車',       '12A1': '單機迴送',
    '12B0': '試運轉',          '4200': '特種(戰)',        '5230': '特種(警)'
};

// LineDir / Line 對照
const LINE_DIR_MAP = { '1': '順行', '2': '逆行' };
const LINE_MAP = { '0': '不經山海線', '1': '山線', '2': '海線', '3': '成追線', '4': '山海線' };

const CATEGORY_ORDER = ['新自強', '太魯閣', '普悠瑪', '自強', '柴聯自強', '莒光', '區間車', '區間快', '普快車', '專列', '其他'];

const CAR_CLASS_CATEGORY = {
    // 新自強
    '110G': '新自強', '110H': '新自強',
    // 太魯閣
    '1101': '太魯閣',
    // 普悠瑪
    '1107': '普悠瑪',
    // 自強
    '1100': '自強',  '1102': '自強',  '1103': '自強',
    '1105': '自強',  '1106': '自強',  '1108': '自強',  '1109': '自強',
    '110A': '自強',  '110B': '自強',  '110C': '自強',  '110D': '自強',
    '110E': '自強',  '110K': '自強',
    // 柴聯自強
    '110F': '柴聯自強',
    // 莒光
    '1110': '莒光',  '1111': '莒光',
    '1113': '莒光',  '1114': '莒光',  '1115': '莒光',
    // 區間車
    '1131': '區間車', '1135': '區間車',
    // 區間快
    '1132': '區間快',
    // 普快車
    '1140': '普快車', '1141': '普快車', '1150': '普快車',
    // 專列
    '1104': '專列',  '1112': '專列',  '1121': '專列',
    '1130': '專列',  '1134': '專列',  '1154': '專列',
};

function getTrainCategory(carClass) {
    return CAR_CLASS_CATEGORY[carClass] || '其他';
}

const KEYS_ZH = {
    Type: '列車型態', Train: '車次', BreastFeed: '哺(集)乳室',
    Route: '路線', Package: '行李(託運)服務', OverNightStn: '跨日車站代碼',
    LineDir: '行駛方向', Line: '經由路線', Dinning: '餐車',
    FoodSrv: '訂餐(便當)服務', Cripple: '輪椅座', CarClass: '列車種類',
    Bike: '攜帶自行車', ExtraTrain: '加班車', Everyday: '每日行駛',
    Note: '備註', NoteEng: '英文備註'
};

const YN_KEYS = new Set(['BreastFeed', 'Package', 'Dinning', 'FoodSrv', 'Cripple', 'Bike', 'ExtraTrain', 'Everyday']);

let Route = {};


function setYN(td, v) {
    if (v === 'Y') { td.innerHTML = '<span class="badge badge-green">是</span>'; return; }
    if (v === 'N') { td.innerHTML = '<span class="badge badge-red">否</span>'; return; }
    if (v) { td.innerHTML = `<span class="badge badge-gray">${v}</span>`; return; }
    td.innerHTML = '<span style="color:#cbd5e1">—</span>';
}

function fillInfoVal(td, key, val) {
    if (key === 'Type') {
        const label = TRAIN_TYPE_MAP[val] || val;
        td.innerHTML = `<span style="color:#94a3b8;font-size:0.78rem">${val}</span> ${label}`;
    } else if (key === 'CarClass') {
        const label = CAR_CLASS_MAP[val] || val;
        td.innerHTML = `<span style="color:#94a3b8;font-size:0.78rem">${val}</span> ${label}`;
    } else if (key === 'LineDir') {
        td.textContent = LINE_DIR_MAP[val] || val;
    } else if (key === 'Line') {
        td.textContent = LINE_MAP[val] || val;
    } else if (YN_KEYS.has(key)) {
        setYN(td, val);
    } else if (val && val !== '') {
        td.textContent = val;
    } else {
        td.innerHTML = '<span style="color:#cbd5e1">—</span>';
    }
}

function tpl(id) {
    return document.getElementById(id).content.cloneNode(true);
}

function renderDetail(train) {
    const detail = document.getElementById('detail');
    detail.innerHTML = '';

    const card = tpl('tpl-detail-card');
    card.querySelector('.train-num').textContent = train.Train;
    card.querySelector('.type-badge').textContent = CAR_CLASS_MAP[train.CarClass] || train.CarClass || '';
    const infoTbody = card.querySelector('tbody');
    Object.entries(train)
        .filter(([k]) => k !== 'TimeInfos')
        .forEach(([k, v]) => {
            const row = tpl('tpl-info-row');
            row.querySelector('.info-key').textContent = KEYS_ZH[k] || k;
            fillInfoVal(row.querySelector('.info-val'), k, v);
            infoTbody.appendChild(row);
        });
    detail.appendChild(card);

    const section = tpl('tpl-time-section');
    section.querySelector('.section-title').textContent =
        `TimeInfos — 時刻表（${(train.TimeInfos || []).length} 站）`;
    const timeTbody = section.querySelector('tbody');
    (train.TimeInfos || []).forEach(t => {
        const row = tpl('tpl-time-row');
        row.querySelector('.order').textContent = t.Order;
        row.querySelector('.station').textContent = Route[t.Station]?.DSC ?? t.Station;
        row.querySelector('.arr').textContent = t.ARRTime || '—';
        row.querySelector('.dep').textContent = t.DEPTime || '—';
        row.querySelector('.route').textContent = t.Route || '—';
        timeTbody.appendChild(row);
    });
    detail.appendChild(section);
}

const cache = {};
let activeFile = null;
let activeTrain = null;
let selectedType = null;
let currentTrains = [];

async function loadFile(filename) {
    if (cache[filename]) return cache[filename];
    const res = await fetch(`https://raw.githubusercontent.com/billy1125/billy1125.github.io/main/data/${filename}`);
    const data = await res.json();
    cache[filename] = data.TrainInfos || [];
    return cache[filename];
}

function selectTrain(train, itemEl) {
    document.querySelectorAll('.train-item').forEach(el => el.classList.remove('active'));
    itemEl.classList.add('active');
    activeTrain = train.Train;
    document.getElementById('placeholder').style.display = 'none';
    const detail = document.getElementById('detail');
    detail.style.display = 'block';
    renderDetail(train);
    document.getElementById('detail-scroll').scrollTop = 0;
}

function renderFilterPanel(trains) {
    const filterEl = document.getElementById('type-filter');
    filterEl.innerHTML = '';

    const counts = {};
    trains.forEach(t => {
        const cat = getTrainCategory(t.CarClass);
        counts[cat] = (counts[cat] || 0) + 1;
    });

    const allFrag = tpl('tpl-filter-item');
    const allEl = allFrag.firstElementChild;
    allEl.querySelector('.f-name').textContent = '全部';
    allEl.querySelector('.f-count').textContent = trains.length;
    if (selectedType === null) allEl.classList.add('active');
    allEl.addEventListener('click', () => {
        selectedType = null;
        renderFilterPanel(currentTrains);
        renderTrainList(currentTrains);
    });
    filterEl.appendChild(allEl);

    CATEGORY_ORDER.filter(cat => counts[cat]).forEach(cat => {
        const frag = tpl('tpl-filter-item');
        const el = frag.firstElementChild;
        el.querySelector('.f-name').textContent = cat;
        el.querySelector('.f-count').textContent = counts[cat];
        if (selectedType === cat) el.classList.add('active');
        el.addEventListener('click', () => {
            selectedType = cat;
            renderFilterPanel(currentTrains);
            renderTrainList(currentTrains);
        });
        filterEl.appendChild(el);
    });
}

function renderTrainList(trains) {
    const listEl = document.getElementById('train-list');
    const filtered = selectedType
        ? trains.filter(t => getTrainCategory(t.CarClass) === selectedType)
        : trains;
    if (!filtered.length) {
        listEl.innerHTML = '<div class="panel-empty">無資料</div>';
        return;
    }
    listEl.innerHTML = '';
    [...filtered].sort((a, b) => Number(a.Train) - Number(b.Train)).forEach(train => {
        const frag = tpl('tpl-train-item');
        const el = frag.firstElementChild;
        el.querySelector('.t-num').textContent = train.Train;
        el.querySelector('.t-meta').textContent =
            `${CAR_CLASS_MAP[train.CarClass] || train.CarClass || TRAIN_TYPE_MAP[train.Type] || ''} · ${(train.TimeInfos || []).length}站`;
        if (train.Train === activeTrain) el.classList.add('active');
        el.addEventListener('click', () => selectTrain(train, el));
        listEl.appendChild(el);
    });
}

async function selectFile(filename, itemEl) {
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    itemEl.classList.add('active');
    activeFile = filename;
    activeTrain = null;

    document.getElementById('train-list').innerHTML = '<div class="panel-empty"><span class="loading-dots">載入中</span></div>';
    document.getElementById('type-filter').innerHTML = '<div class="panel-empty">—</div>';
    document.getElementById('placeholder').style.display = 'flex';
    document.getElementById('detail').style.display = 'none';

    selectedType = null;
    currentTrains = await loadFile(filename);
    itemEl.querySelector('.file-count').textContent = `${currentTrains.length} 車次`;
    document.getElementById('status').textContent = `${filename} — ${currentTrains.length} 筆`;
    renderFilterPanel(currentTrains);
    renderTrainList(currentTrains);
}

async function listJsonFiles() {
    const url = 'https://api.github.com/repos/billy1125/billy1125.github.io/contents/data';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        const data = await response.json();
        return data
            .map(item => item.name)
            .filter(name => /^\d{8}\.json$/.test(name))
            .sort();
    } catch (error) {
        console.error('Error fetching GitHub files:', error);
        return [];
    }
}

async function init() {
    const [files, routeData] = await Promise.all([
        listJsonFiles(),
        fetch('js/references/Route.json').then(r => r.json())
    ]);
    Route = routeData;

    const listEl = document.getElementById('file-list');
    listEl.innerHTML = '';

    files.forEach(filename => {
        const dateStr = filename.replace('.json', '');
        const formatted = `${dateStr.slice(0, 4)}/${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`;
        const el = document.createElement('div');
        el.className = 'file-item';
        el.innerHTML = `<span class="file-date">${formatted}</span><span class="file-count">— 車次</span>`;
        el.addEventListener('click', () => selectFile(filename, el));
        listEl.appendChild(el);
    });

    document.getElementById('status').textContent = `${files.length} 個日期檔案`;
}

init().catch(err => {
    document.getElementById('file-list').innerHTML = `<div class="panel-empty">載入失敗：${err.message}</div>`;
});
