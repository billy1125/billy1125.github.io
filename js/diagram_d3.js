// D3.js 版本的 SVG 渲染模組
// 提供與 diagram.js 完全相同的公開 API：draw_diagram_background / draw_train_path
//
// 互動功能：
//   一、縮放與平移 (d3.zoom)：滾輪縮放、拖曳平移，取代橫向捲動
//   二、懸停提示框 (tooltip)：滑鼠移到車次線時顯示車次、車種、最近車站、時刻

// ── 模組層級狀態（集中管理，透過 _resetState() 清除） ──
const _state = {
    trainDataMap:    new Map(), // pathId → { train_no, train_kind, style, stationPoints }
    allPathEls:      new Map(), // pathId → 視覺路徑的 D3 selection（供高亮使用）
    selectedPathId:  null,      // 目前選取的車次 pathId（null = 無選取）
    wasDragged:      false,     // 區分點擊與拖曳，避免 pan 後誤觸取消選取
    tooltipEl:       null,
    svg:             null,
    g:               null,      // 內層 <g>，zoom 時轉換此群組
    zoom:            null,      // d3.zoom 實例，供外部（如鍵盤捷徑）使用
    searchItems:     new Map(), // pathId → DOM element（搜尋結果快取，避免整列重建）
    lastSearchQuery: null,      // 上次渲染搜尋結果的 query
};

// 清除所有模組狀態，供 execute() 重新呼叫時重置
function _resetState() {
    _state.trainDataMap.clear();
    _state.allPathEls.clear();
    _state.selectedPathId  = null;
    _state.wasDragged      = false;
    if (_state.tooltipEl) {
        _state.tooltipEl.remove();
        _state.tooltipEl = null;
    }
    const panel = document.getElementById('d3-search-panel');
    if (panel) panel.remove();
    _state.svg             = null;
    _state.g               = null;
    _state.zoom            = null;
    _state.searchItems.clear();
    _state.lastSearchQuery = null;
}

// 高亮指定車次（含 -End 分段），其餘全部淡化
function _highlight(pathId) {
    _state.selectedPathId = pathId;
    const endId = pathId + '-End';
    _state.allPathEls.forEach((el, id) => {
        if (id === pathId || id === endId) {
            el.style('opacity', '1').style('stroke-width', '5');
        } else {
            el.style('opacity', '0.1').style('stroke-width', null);
        }
    });
    if (_state.g) {
        _state.g.selectAll('text.d3-train-label').style('opacity', '0.05');
        [pathId, endId].forEach(id => {
            _state.g.selectAll(`textPath[href="#${id}"]`).each(function () {
                d3.select(this.parentNode).style('opacity', '1');
            });
        });
    }
    _refreshSearchResults();
}

// 取消所有高亮，恢復預設外觀
function _clearHighlight() {
    _state.selectedPathId = null;
    _state.allPathEls.forEach((el) => el.style('opacity', null).style('stroke-width', null));
    if (_state.g) _state.g.selectAll('text.d3-train-label').style('opacity', null);
    _refreshSearchResults();
}

// 平移視角到指定車次的中間點（保持目前縮放比例）
function _panToTrain(pathId) {
    const data = _state.trainDataMap.get(pathId);
    if (!data || !_state.svg || !_state.zoom || data.stationPoints.length === 0) return;
    const pts = data.stationPoints;
    const ox = pts[Math.floor(pts.length / 2)].x;
    const oy = pts[Math.floor(pts.length / 2)].y;
    const k  = d3.zoomTransform(_state.svg.node()).k;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    _state.svg.transition().duration(600).call(
        _state.zoom.transform,
        d3.zoomIdentity.scale(k).translate(vw / (2 * k) - ox, vh / (2 * k) - oy)
    );
}

// 刷新搜尋結果列表的選取狀態（_state.selectedPathId 改變後呼叫）
function _refreshSearchResults() {
    const inp  = document.getElementById('d3-search-input');
    const cont = document.getElementById('d3-search-results');
    if (!inp || !cont) return;
    _renderSearchResults(inp.value.trim(), cont);
}

// 渲染搜尋結果到指定容器
// 只在 query 改變時重建 DOM；選取狀態改變時只更新各項目的背景色，避免整列重建
function _renderSearchResults(query, container) {
    const q = query.toLowerCase();

    if (_state.lastSearchQuery !== q) {
        _state.lastSearchQuery = q;
        _state.searchItems.clear();
        container.innerHTML = '';
        let count = 0;

        for (const [pathId, data] of _state.trainDataMap) {
            if (data.train_no.endsWith('-End')) continue;
            if (q && !data.train_no.toLowerCase().includes(q)) continue;
            if (++count > 40) break;

            const item = document.createElement('div');
            Object.assign(item.style, {
                padding: '5px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background 0.15s',
                userSelect: 'none',
            });
            const kindLabel = _carKindLabel[data.style] || data.style;
            item.innerHTML = `<b>${data.train_no}</b><span style="color:#aaa;font-size:11px">${kindLabel}</span>`;

            item.addEventListener('mouseenter', () => {
                if (_state.selectedPathId !== pathId) item.style.background = 'rgba(255,255,255,0.1)';
            });
            item.addEventListener('mouseleave', () => {
                if (_state.selectedPathId !== pathId) item.style.background = 'transparent';
            });
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (_state.selectedPathId === pathId) {
                    _clearHighlight();
                } else {
                    _highlight(pathId);
                    _panToTrain(pathId);
                }
            });

            _state.searchItems.set(pathId, item);
            container.appendChild(item);
        }

        if (count === 0) {
            const empty = document.createElement('div');
            Object.assign(empty.style, { color: '#888', padding: '4px 8px' });
            empty.textContent = '找不到符合的車次';
            container.appendChild(empty);
        }
    }

    // 只更新選取高亮樣式（不重建 DOM）
    _state.searchItems.forEach((item, pathId) => {
        item.style.background = (_state.selectedPathId === pathId)
            ? 'rgba(26,115,232,0.7)' : 'transparent';
    });
}

// 建立浮動搜尋面板（預設收合為圓形按鈕，點開放大）
function _init_search_panel() {
    if (document.getElementById('d3-search-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'd3-search-panel';
    Object.assign(panel.style, {
        position: 'fixed', bottom: '24px', right: '24px',
        zIndex: '1500', display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', gap: '8px', pointerEvents: 'all',
    });

    const body = document.createElement('div');
    Object.assign(body.style, {
        background: 'rgba(18,18,18,0.93)',
        color: '#fff', borderRadius: '10px', padding: '12px',
        width: '220px', boxShadow: '0 4px 20px rgba(0,0,0,0.55)',
        display: 'none', flexDirection: 'column', gap: '8px',
        fontFamily: 'Tahoma, Verdana, sans-serif', fontSize: '13px',
        opacity: '0', transform: 'translateY(8px)',
        transition: 'opacity 0.2s, transform 0.2s',
    });

    const input = document.createElement('input');
    input.id = 'd3-search-input';
    input.type = 'text';
    input.placeholder = '搜尋車次號…';
    Object.assign(input.style, {
        width: '100%', padding: '6px 8px', borderRadius: '5px',
        border: '1px solid #555', background: '#2a2a2a',
        color: '#fff', fontSize: '13px', boxSizing: 'border-box', outline: 'none',
    });

    const results = document.createElement('div');
    results.id = 'd3-search-results';
    Object.assign(results.style, {
        maxHeight: '260px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '2px',
    });

    body.appendChild(input);
    body.appendChild(results);

    const btn = document.createElement('button');
    btn.id = 'd3-search-btn';
    btn.title = '搜尋車次';
    btn.textContent = '🔍';
    Object.assign(btn.style, {
        width: '44px', height: '44px', borderRadius: '50%',
        border: 'none', background: '#1a73e8', color: '#fff',
        fontSize: '18px', cursor: 'pointer', lineHeight: '44px',
        textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
        transition: 'background 0.2s', flexShrink: '0',
    });

    panel.appendChild(body);
    panel.appendChild(btn);
    document.body.appendChild(panel);

    let isOpen = false;
    function openPanel() {
        isOpen = true;
        body.style.display = 'flex';
        requestAnimationFrame(() => {
            body.style.opacity = '1';
            body.style.transform = 'translateY(0)';
        });
        btn.textContent = '✕';
        btn.style.background = '#c5221f';
        input.focus();
        _renderSearchResults('', results);
    }
    function closePanel() {
        isOpen = false;
        body.style.opacity = '0';
        body.style.transform = 'translateY(8px)';
        setTimeout(() => { body.style.display = 'none'; }, 200);
        btn.textContent = '🔍';
        btn.style.background = '#1a73e8';
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        isOpen ? closePanel() : openPanel();
    });
    panel.addEventListener('click', (e) => e.stopPropagation());

    input.addEventListener('input', () => _renderSearchResults(input.value.trim(), results));
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });
}

// 車種 CSS class → 中文顯示名稱
const _carKindLabel = {
    taroko:           '太魯閣',
    puyuma:           '普悠瑪',
    tze_chiang:       '自強號',
    tze_chiang_diesel:'自強（柴）',
    emu1200:          '自強 EMU1200',
    emu300:           '自強 EMU300',
    emu3000:          '自強 EMU3000',
    kuaimu:           '快哩慕',
    zhongxing:        '中興號',
    direct:           '直快',
    chu_kuang:        '莒光號',
    chushan1:         '曙山（早）',
    chushan2:         '曙山（晚）',
    local:            '區間車',
    local_express:    '區間快',
    fu_hsing:         '復興號',
    ordinary:         '普快',
    skip_stop:        '跳停',
    alishan:          '阿里山',
    alishan_local:    '阿里山區間',
    all_stop:         '普通車',
    theme:            '主題列車',
    special:          '特殊',
    others:           '其他',
};

// ax1 值（每格 30 秒）轉 HH:MM 字串
function _ax1_to_timestr(ax1) {
    const isNextDay = ax1 >= NEXT_DAY_AX1;
    const a = isNextDay ? ax1 - NEXT_DAY_AX1 : ax1;
    const totalSec = a * 30;
    const h = Math.floor(totalSec / 3600) % 24;
    const m = Math.floor((totalSec % 3600) / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}${isNextDay ? ' (隔日)' : ''}`;
}

// 建立懸停提示框 DOM（只建立一次）
function _init_tooltip() {
    if (_state.tooltipEl) return;
    _state.tooltipEl = document.createElement('div');
    _state.tooltipEl.id = 'd3-tooltip';
    Object.assign(_state.tooltipEl.style, {
        position: 'fixed',
        padding: '6px 12px',
        background: 'rgba(15,15,15,0.85)',
        color: '#fff',
        borderRadius: '5px',
        fontSize: '13px',
        lineHeight: '1.75',
        fontFamily: 'Tahoma, Verdana, sans-serif',
        pointerEvents: 'none',
        zIndex: '2000',
        display: 'none',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
    });
    document.body.appendChild(_state.tooltipEl);
}

// ── 公開 API ──

// 繪製運行圖底圖（背景時間格線與車站線）— D3 版本
function draw_diagram_background(line_kind, date) {
    Object.entries(OperationLines).forEach(([key, value]) => {
        if (key !== line_kind) return;

        const totalWidth  = PX_PER_HOUR * (DiagramHours.length - 1) + 2 * MARGIN;
        const totalHeight = value['MAX_X_AXIS'];
        const text_spacing_factor = 500;
        const draw_date = Date().toLocaleString();
        const now_time_x_axis = get_now_time_x_axis(0);
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        _init_tooltip();
        _init_search_panel();

        // ── 一、建立 SVG 與縮放群組 ──
        const svg = d3.select('body')
            .append('svg')
            .attr('class', 'd3-diagram-svg')
            .attr('width', vw)
            .attr('height', vh);

        _state.svg = svg;

        // 所有圖形元素附加在內層 <g>；d3.zoom 轉換此群組即可
        const g = svg.append('g').attr('class', 'diagram-root');
        _state.g = g;

        // ── d3.zoom 設定 ──
        const zoom = d3.zoom()
            .scaleExtent([0.05, 10])
            .translateExtent([[-MARGIN, -MARGIN], [totalWidth + MARGIN, totalHeight + 125]])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        _state.zoom = zoom;
        svg.call(zoom);

        // 點擊空白背景取消選取；區分拖曳（pan）與點擊，避免 pan 後誤觸
        svg.on('mousedown.dragtrack', () => { _state.wasDragged = false; })
           .on('mousemove.dragtrack', () => { _state.wasDragged = true; })
           .on('click.deselect', () => { if (!_state.wasDragged) _clearHighlight(); });

        // X 軸定位在現在時刻（若有 scrollToCurrentTime），Y 軸定位到指定車站（若有 stationAxisY）
        const initialScale = 1;
        let initDx = 0;
        let initDy = 0;
        if (typeof scrollToCurrentTime !== 'undefined' && scrollToCurrentTime) {
            initDx = vw / (2 * initialScale) - now_time_x_axis;
        }
        if (typeof stationAxisY !== 'undefined' && stationAxisY !== null) {
            initDy = vh / (2 * initialScale) - (parseInt(stationAxisY) + MARGIN);
        }
        svg.call(
            zoom.transform,
            d3.zoomIdentity.scale(initialScale).translate(initDx, initDy)
        );

        // ── 繪製標題 ──
        const title = `${value['NAME']} ，日期：${date}，運行圖繪製完成時間：${draw_date}`;
        add_text(g, title, 5, 0, null);

        // ── 繪製小時線與分鐘線 ──
        for (let i = 0; i < DiagramHours.length; i++) {
            let x = MARGIN + i * PX_PER_HOUR;
            let y = 0;
            add_line(g, x, MARGIN, x, totalHeight + MARGIN, 'hour_line');

            while (true) {
                const hour = DiagramHours[i];
                const hour_text = hour.toString().padStart(2, '0');
                let after_midnight, css;
                if (hour === 24) {
                    after_midnight = '隔日';
                    css = 'hour_midnight';
                } else {
                    after_midnight = '';
                    css = 'hour';
                }
                if (y <= totalHeight)
                    add_text(g, `${hour_text}00 ${after_midnight}`, x, y + 30, css);
                else
                    break;
                y += text_spacing_factor;
            }

            if (i !== DiagramHours.length - 1) {
                for (let j = 0; j < 5; j++) {
                    x = MARGIN + i * PX_PER_HOUR + (j + 1) * PX_PER_10MIN;
                    const lineClass = (j !== 2) ? 'min10_line' : 'min30_line';
                    const textClass = (j !== 2) ? 'min10' : 'min30';
                    add_line(g, x, MARGIN, x, totalHeight + MARGIN, lineClass);

                    y = 0;
                    while (true) {
                        if (y <= totalHeight)
                            add_text(g, `${j + 1}0`, x, y + 30, textClass);
                        else
                            break;
                        y += text_spacing_factor;
                    }
                }
            }
        }

        // ── 繪製車站線 ──
        const stations = LinesStationsForBackground[key];
        Object.entries(stations).forEach(([, stn]) => {
            const sy = stn['SVGYAXIS'] + MARGIN;
            const isServed = stn['ID'] !== 'NA';
            add_line(g, MARGIN, sy, totalWidth - MARGIN, sy, isServed ? 'station_line' : 'station_noserv_line');
            for (let i = 0; i < 31; i++) {
                add_text(g, stn['DSC'], 5 + i * PX_PER_HOUR, sy - 20, isServed ? 'station' : 'station_noserv');
            }
        });

        diagram_objects[key] = g;
        add_line(g, now_time_x_axis, MARGIN, now_time_x_axis, totalHeight + MARGIN, 'now_time_line');
    });
}

// 繪製每一個車次線 — D3 版本
function draw_train_path(all_trains_data, realtime_trains) {
    for (const train_data of all_trains_data) {
        for (const [lk, train_no, train_kind, , line_dir, value] of train_data) {
            if (value.length <= 2) continue;

            const split = find_uncontinuous_index(value);
            const section_start = value.slice(0, split);
            const section_end = value.slice(split);

            let realtime_data;
            if (realtime_trains != null) realtime_data = realtime_trains.get(train_no);

            if (section_start.length > 1)
                set_path(lk, train_no, train_kind, section_start);
            if (typeof realtime_data !== 'undefined')
                mark_realtime_train_position(section_start, line_dir, train_kind, realtime_data);

            if (section_end.length > 3)
                set_path(lk, train_no + '-End', train_kind, section_end);
            if (typeof realtime_data !== 'undefined')
                mark_realtime_train_position(section_end, line_dir, train_kind, realtime_data);
        }
    }
}

// ── 內部渲染函式 ──

function find_uncontinuous_index(value) {
    let order_next = value[0][5];
    let index = 0;
    for (const [, , , , , order] of value) {
        if (order === order_next) { order_next += 1; index += 1; }
        else break;
    }
    return index;
}

// 純計算：將 value 陣列轉換為 SVG path 字串、座標陣列、車站點（供 tooltip 使用）
function _buildPathData(value, lk) {
    let pathData = 'M';
    const coordinates = [];
    const stationPoints = [];
    const diagram_need_stop = find_diagram_need_to_stop(lk);

    for (const [dsc, id, time, loc, stop] of value) {
        let x = time * PX_PER_AX1 - PX_PER_HOUR * DiagramHours[0] + MARGIN;
        let y = loc + MARGIN;
        x = Math.round((x + Number.EPSILON) * 100) / 100;
        y = Math.round((y + Number.EPSILON) * 100) / 100;
        if (stop !== -1 || diagram_need_stop.includes(id)) {
            pathData += `${x},${y} `;
            coordinates.push([x, y]);
            stationPoints.push({ x, y, dsc, time });
        }
    }
    return { pathData, coordinates, stationPoints };
}

function set_path(lk, train_no, train_kind, value) {
    const style = CarKind[train_kind] || 'others';
    const { pathData, coordinates, stationPoints } = _buildPathData(value, lk);
    const pathId = lk + train_no;
    _state.trainDataMap.set(pathId, { train_no, train_kind, style, stationPoints });
    const text_position = calculate_text_position(coordinates, style);
    add_path(diagram_objects[lk], lk, train_no, pathData, text_position, style);
}

function calculate_text_position(coordinates, color) {
    const pairs = [];
    const distances = [];

    for (const pt of coordinates) {
        if (pairs.length === 2) {
            distances.push(calculate_distance(pairs[0], pairs[1]));
            pairs[0] = pairs[1];
            pairs[1] = pt;
        } else {
            pairs.push(pt);
        }
    }
    if (pairs.length === 2) distances.push(calculate_distance(pairs[0], pairs[1]));

    let text_position = [];
    let acc = 0;

    if (color === 'local') {
        const all = [];
        for (const d of distances) {
            if (d > 60) all.push(acc + d / 4);
            acc += d;
        }
        text_position = all.filter((_, i) => i % 2 === 0);
    } else {
        for (const d of distances) {
            if (d > 60 && d < 100) {
                text_position.push(0);
            } else if (d >= 100 && d <= 500) {
                text_position.push(acc + d / 2);
            } else if (d > 500) {
                text_position.push(acc + d / 3);
                text_position.push(acc + 2 * d / 3);
            }
            acc += d;
        }
    }
    return text_position;
}

function mark_realtime_train_position(value, line_dir, train_kind, realtime_data) {
    const diagram_need_stop = find_diagram_need_to_stop(line_kind);
    const style = (CarKind[train_kind] || 'special') + '_mark';
    let now_time_x_axis = null;
    const coords = [];

    if (realtime_data.StationID > 0)
        now_time_x_axis = get_now_time_x_axis(realtime_data.DelayTime);

    for (const [, id, time, loc, stop] of value) {
        let x = time * PX_PER_AX1 - PX_PER_HOUR * DiagramHours[0] + MARGIN;
        let y = loc + MARGIN;
        x = Math.round((x + Number.EPSILON) * 100) / 100;
        y = Math.round((y + Number.EPSILON) * 100) / 100;
        if (stop !== -1 || diagram_need_stop.includes(id)) coords.push([x, y]);
    }

    for (let i = 1; i < coords.length; i++) {
        if (coords[i][0] >= now_time_x_axis && coords[0][0] <= now_time_x_axis) {
            const axis_x = [coords[i - 1][0], now_time_x_axis, coords[i][0]];
            const axis_y = [coords[i - 1][1], NaN, coords[i][1]];
            if (axis_x[0] <= axis_x[1] && axis_x[1] <= axis_x[2]) {
                const interp = interpolateArray(axis_x, axis_y);
                diagram_objects[line_kind].append('circle')
                    .attr('cx', axis_x[1]).attr('cy', interp[1]).attr('r', 5)
                    .attr('class', style);
            }
            break;
        }
    }
}

// ── D3 繪圖輔助函式 ──

function add_line(g, x1, y1, x2, y2, style) {
    const el = g.append('line')
        .attr('x1', x1).attr('y1', y1)
        .attr('x2', x2).attr('y2', y2);
    if (style) el.attr('class', style);
}

// y 指向文字頂部（dominant-baseline: hanging），與 SVG.js .move() 行為一致
function add_text(g, text_string, x, y, style) {
    const el = g.append('text')
        .attr('x', x).attr('y', y)
        .attr('dominant-baseline', 'hanging')
        .text(text_string);
    if (style) el.attr('class', style);
}

function add_path(g, lk, train_id, path_string, text_position, style) {
    const pathId = lk + train_id;

    // 視覺路徑：不接收滑鼠事件，由下方透明路徑代理
    const pathEl = g.append('path')
        .attr('d', path_string)
        .attr('class', style)
        .attr('id', pathId)
        .style('pointer-events', 'none');

    _state.allPathEls.set(pathId, pathEl);

    // 透明加寬感應路徑：疊在視覺路徑上，stroke-width 16px 擴大觸發範圍
    const hitEl = g.append('path')
        .attr('d', path_string)
        .style('fill', 'none')
        .style('stroke', 'transparent')
        .style('stroke-width', '16')
        .style('pointer-events', 'stroke')
        .style('cursor', 'crosshair');

    // -End 分段車次的 basePathId 為主段 ID，與 _state.selectedPathId 比較時需正規化
    const basePathId = pathId.replace(/-End$/, '');

    hitEl
        .on('mouseenter', () => {
            if (_state.selectedPathId !== basePathId) pathEl.style('stroke-width', '6');
        })
        .on('mouseleave', () => {
            if (_state.selectedPathId !== basePathId) pathEl.style('stroke-width', null);
            if (_state.tooltipEl) _state.tooltipEl.style.display = 'none';
        });

    hitEl.on('click', function (event) {
        event.stopPropagation();
        if (_state.selectedPathId === basePathId) {
            _clearHighlight();
        } else {
            _highlight(basePathId);
        }
    });

    // ── 二、懸停提示事件（附加在透明感應路徑上）──
    hitEl.on('mousemove', function (event) {
        const data = _state.trainDataMap.get(pathId);
        if (!data || !_state.tooltipEl || data.stationPoints.length === 0) return;

        // d3.pointer 對 _state.g 取座標，自動套用 zoom transform 的逆向
        const [mx] = d3.pointer(event, _state.g.node());

        let nearest = data.stationPoints[0];
        let minDist = Infinity;
        for (const pt of data.stationPoints) {
            const dist = Math.abs(pt.x - mx);
            if (dist < minDist) { minDist = dist; nearest = pt; }
        }

        const kindLabel = _carKindLabel[data.style] || data.style;
        const timeStr = _ax1_to_timestr(nearest.time);
        const displayNo = data.train_no.replace(/-End$/, '');

        _state.tooltipEl.innerHTML =
            `<b>車次 ${displayNo}</b><br>` +
            `車種：${kindLabel}<br>` +
            `<hr style="margin:3px 0;border-color:#555">` +
            `車站：${nearest.dsc}<br>` +
            `時刻：${timeStr}`;

        _state.tooltipEl.style.display = 'block';

        const tipW = _state.tooltipEl.offsetWidth || 160;
        const left = (event.clientX + 16 + tipW > window.innerWidth)
            ? event.clientX - tipW - 8
            : event.clientX + 16;
        _state.tooltipEl.style.left = left + 'px';
        _state.tooltipEl.style.top = (event.clientY - 10) + 'px';
    });

    // textPath 車次標號（加 d3-train-label 供高亮批次操作識別用）
    const hrefTarget = '#' + pathId;
    for (const offset of text_position) {
        const textEl = g.append('text').attr('class', style).classed('d3-train-label', true);
        textEl.append('textPath')
            .attr('href', hrefTarget)
            .attr('startOffset', offset)
            .append('tspan').attr('dy', -3)
            .text(train_id);
    }
}

// ── 純計算輔助函式（自給自足，不依賴 diagram.js） ──

function calculate_distance(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    return Math.sqrt(dx * dx + dy * dy);
}

function interpolateArray(A, B) {
    const result = [];
    for (let i = 0; i < A.length; i++) {
        if (!isNaN(B[i])) {
            result[i] = B[i];
        } else {
            let pi = i - 1, ni = i + 1;
            while (pi >= 0 && isNaN(B[pi])) pi--;
            while (ni < A.length && isNaN(B[ni])) ni++;
            const pv = B[pi], nv = B[ni];
            const pd = A[i] - A[pi], nd = A[ni] - A[i];
            result[i] = Math.round(((pv * nd + nv * pd) / (pd + nd) + Number.EPSILON) * 100) / 100;
        }
    }
    return result;
}

function get_now_time_x_axis(minus_time) {
    const t = new Date();
    t.setMinutes(t.getMinutes() - minus_time);
    const hh = t.getHours().toString().padStart(2, '0');
    const mm = t.getMinutes().toString().padStart(2, '0');
    const ss = Math.round(t.getSeconds() / 30) * 30;
    const ssStr = ss === 60 ? '00' : ss.toString().padStart(2, '0');
    return SVG_X_Axis[`${hh}:${mm}:${ssStr}`].ax1 * PX_PER_AX1 - PX_PER_HOUR * DiagramHours[0] + MARGIN;
}

function find_diagram_need_to_stop(lk) {
    return LinesStationsForBackground[lk]
        .filter(item => item['TERMINAL'] === 'Y')
        .map(item => item['ID']);
}
