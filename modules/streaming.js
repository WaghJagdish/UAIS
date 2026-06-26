// modules/streaming.js

// Seeded random for deterministic behaviors
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }
    randint(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}

// ── Streaming Presets ────────────────────────────────────────────────────────
const PRESETS = {
    letters: (() => {
        const base = ["A", "B", "C", "D", "E", "A", "B", "C", "A", "B", "D", "A", "E", "A"];
        let result = [];
        for (let i = 0; i < 3; i++) result = result.concat(base);
        return result;
    })(),
    numbers: [1, 5, 2, 4, 3, 1, 2, 5, 4, 3, 2, 1, 5, 3, 4, 2, 1, 5, 4, 3, 1, 2, 4, 5, 3, 1, 2, 5, 4, 3, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
    words: (() => {
        const base = "apple banana apple cherry banana apple cherry apple banana cherry apple".split(" ");
        return base.concat(base);
    })()
};

// ── State Variables ──────────────────────────────────────────────────────────
let activeStream = [];
let streamStepIndex = -1;
let streamAutoPlayInterval = null;

// Pre-computed steps for the visualizer
let exactSteps = [];
let reservoirSteps = [];
let cmsSteps = [];

// Hash function for CMS
function getCMSHash(item, row, width) {
    const seed = (row + 1) * 31;
    let hash = 0;
    const str = String(item);
    for (let i = 0; i < str.length; i++) {
        hash = (hash * seed + str.charCodeAt(i)) % 1000000007;
    }
    return Math.abs(hash) % width;
}

// ── Algorithm Runs ───────────────────────────────────────────────────────────

function generateExactSteps(stream) {
    const freq = {};
    const steps = [];
    for (let i = 0; i < stream.length; i++) {
        const item = stream[i];
        freq[item] = (freq[item] || 0) + 1;
        steps.push({
            position: i,
            item: item,
            freq: { ...freq },
            description: `Stream position ${i}: processed item '${item}' &rarr; count = ${freq[item]}.`
        });
    }
    return steps;
}

function generateReservoirSteps(stream, k, seed = 42) {
    const rng = new SeededRandom(seed);
    const reservoir = [];
    const steps = [];

    for (let i = 0; i < stream.length; i++) {
        const item = stream[i];
        if (i < k) {
            reservoir.push(item);
            steps.push({
                position: i,
                item: item,
                reservoir: [...reservoir],
                action: 'fill',
                slotIndex: i,
                description: `Fill reservoir slot [${i}] = '${item}'.`
            });
        } else {
            const j = rng.randint(0, i);
            if (j < k) {
                const replaced = reservoir[j];
                reservoir[j] = item;
                steps.push({
                    position: i,
                    item: item,
                    reservoir: [...reservoir],
                    action: 'replace',
                    slotIndex: j,
                    replacedItem: replaced,
                    description: `Replace reservoir slot [${j}] ('${replaced}' &rarr; '${item}') with probability ${k}/${i+1}.`
                });
            } else {
                steps.push({
                    position: i,
                    item: item,
                    reservoir: [...reservoir],
                    action: 'skip',
                    description: `Threw away item '${item}' (random choice j=${j} &ge; reservoir size k=${k}).`
                });
            }
        }
    }
    return steps;
}

function generateCMSSteps(stream, w, d) {
    // Initialize w x d table
    const table = Array.from({ length: d }, () => Array(w).fill(0));
    const steps = [];

    for (let i = 0; i < stream.length; i++) {
        const item = stream[i];
        const positions = [];

        // Add
        for (let row = 0; row < d; row++) {
            const col = getCMSHash(item, row, w);
            table[row][col]++;
            positions.push({ row, col });
        }

        // Query approximate count
        let approx = Infinity;
        for (let row = 0; row < d; row++) {
            const col = getCMSHash(item, row, w);
            if (table[row][col] < approx) {
                approx = table[row][col];
            }
        }

        // Deep copy table
        const tableCopy = table.map(r => [...r]);

        steps.push({
            position: i,
            item: item,
            positions: positions,
            approx_count: approx,
            table: tableCopy,
            description: `CMS Row Hash Map: Item '${item}' mapped to cells. Approximate count &asymp; ${approx}.`
        });
    }

    return steps;
}

// ── Rendering View State ─────────────────────────────────────────────────────

function renderExactCountView(stepIndex) {
    if (stepIndex < 0 || stepIndex >= exactSteps.length) return;
    const step = exactSteps[stepIndex];

    document.getElementById('stat-pos').textContent = `${stepIndex + 1}/${exactSteps.length}`;
    document.getElementById('stat-item').textContent = `'${step.item}'`;
    document.getElementById('exact-description').innerHTML = step.description;

    // Render Stream Flow List
    const flowContainer = document.getElementById('flow-items');
    flowContainer.innerHTML = '';
    
    // Draw sliding window of items around stepIndex
    const startIdx = Math.max(0, stepIndex - 4);
    const endIdx = Math.min(activeStream.length - 1, stepIndex + 6);

    for (let idx = startIdx; idx <= endIdx; idx++) {
        const itemEl = document.createElement('div');
        if (idx === stepIndex) {
            itemEl.className = "w-10 h-10 flex items-center justify-center border-2 border-cyber-pink bg-cyber-pink/20 text-cyber-pink font-black text-sm relative";
            itemEl.innerHTML = `
                ${activeStream[idx]}
                <span class="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[7px] font-headline text-cyber-pink">ACTIVE</span>
            `;
        } else {
            const isProcessed = idx < stepIndex;
            itemEl.className = `w-8 h-8 flex items-center justify-center border ${isProcessed ? 'border-cyber-purple/20 text-on-surface/40 bg-surface-dark' : 'border-white/5 text-on-surface/60 bg-onyx'}`;
            itemEl.textContent = activeStream[idx];
        }
        flowContainer.appendChild(itemEl);
    }

    // Render Exact Frequency Table
    const tbody = document.getElementById('exact-table-body');
    tbody.innerHTML = '';
    const sorted = Object.entries(step.freq).sort((a, b) => b[1] - a[1]);

    sorted.forEach(([item, count]) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/2 transition-colors";
        const fraction = ((count / (stepIndex + 1)) * 100).toFixed(1);
        tr.innerHTML = `
            <td class="py-2.5 text-on-surface font-bold text-xs">${item}</td>
            <td class="py-2.5 font-mono text-cyber-cyan">${count}</td>
            <td class="py-2.5 font-mono text-on-surface/60">${fraction}%</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderReservoirView(stepIndex) {
    if (stepIndex < 0 || stepIndex >= reservoirSteps.length) return;
    const step = reservoirSteps[stepIndex];
    const k = parseInt(document.getElementById('reservoir-k').value);

    // Render slots
    const slotsContainer = document.getElementById('reservoir-slots-container');
    slotsContainer.innerHTML = '';

    for (let slot = 0; slot < k; slot++) {
        const item = step.reservoir[slot];
        const isSlotActive = (step.action === 'fill' && step.slotIndex === slot) || (step.action === 'replace' && step.slotIndex === slot);

        const slotEl = document.createElement('div');
        if (item !== undefined) {
            slotEl.className = `w-16 h-16 flex flex-col items-center justify-center border text-xs font-bold transition-all relative ${
                isSlotActive ? 'border-cyber-cyan bg-cyber-cyan/15 text-cyber-cyan glow-text-cyan scale-110' : 'border-cyber-purple/30 bg-surface-dark/90 text-on-surface'
            }`;
            slotEl.innerHTML = `
                <span class="text-[7px] font-mono text-on-surface/40 absolute top-1 left-2">SLOT_${slot}</span>
                <span class="text-sm pt-1">${item}</span>
            `;
        } else {
            slotEl.className = "w-16 h-16 flex flex-col items-center justify-center border border-white/5 bg-onyx/40 text-xs font-bold text-on-surface/30 relative";
            slotEl.innerHTML = `
                <span class="text-[7px] font-mono text-on-surface/20 absolute top-1 left-2">SLOT_${slot}</span>
                <span class="text-[9px] font-headline tracking-tighter">EMPTY</span>
            `;
        }
        slotsContainer.appendChild(slotEl);
    }

    document.getElementById('reservoir-step-details').innerHTML = step.description;

    // Render Log List
    const logBox = document.getElementById('reservoir-history-log');
    logBox.innerHTML = '';
    
    // Slice last 15 history logs up to stepIndex
    const startLog = Math.max(0, stepIndex - 14);
    for (let idx = startLog; idx <= stepIndex; idx++) {
        const histStep = reservoirSteps[idx];
        const logItem = document.createElement('div');
        
        let actionIcon = "⏭️";
        let colorClass = "text-on-surface/50";
        if (histStep.action === 'fill') {
            actionIcon = "✅";
            colorClass = "text-cyber-cyan font-semibold";
        } else if (histStep.action === 'replace') {
            actionIcon = "🔄";
            colorClass = "text-cyber-purple font-semibold";
        }

        logItem.className = `py-1 border-b border-white/5 flex gap-2 items-center ${colorClass}`;
        logItem.innerHTML = `
            <span>${actionIcon}</span>
            <span class="text-[9px] font-headline">POS_${histStep.position}:</span>
            <span>${histStep.description}</span>
        `;
        logBox.appendChild(logItem);
    }
}

function renderCMSView(stepIndex) {
    if (stepIndex < 0 || stepIndex >= cmsSteps.length) return;
    const step = cmsSteps[stepIndex];
    const exactStep = exactSteps[stepIndex];

    const w = parseInt(document.getElementById('cms-w').value);
    const d = parseInt(document.getElementById('cms-d').value);

    // Draw Heatmap Grid
    const gridContainer = document.getElementById('cms-grid-container');
    gridContainer.innerHTML = '';

    for (let r = 0; r < d; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = "flex gap-1.5 items-center w-full";

        // Row prefix label
        const rowLabel = document.createElement('div');
        rowLabel.className = "w-14 text-[9px] font-headline text-on-surface/40 uppercase text-right pr-2 select-none";
        rowLabel.textContent = `HASH_${r}`;
        rowDiv.appendChild(rowLabel);

        // Render cells
        for (let c = 0; c < w; c++) {
            const cellVal = step.table[r][c];
            const isHashedCell = step.positions.some(pos => pos.row === r && pos.col === c);

            const cellEl = document.createElement('div');
            
            // Neon opacity based on cell value
            const maxVal = Math.max(...step.table.flat(), 1);
            const intensity = cellVal > 0 ? 0.15 + (cellVal / maxVal) * 0.7 : 0.03;

            let borderStyle = "border-white/5";
            let colorBg = `rgba(188, 19, 254, ${intensity})`; // Purple scale
            let textCol = cellVal > 0 ? "text-on-surface/80" : "text-on-surface/20";

            if (isHashedCell) {
                borderStyle = "border-cyber-cyan shadow-[0_0_4px_#05ffa1]";
                colorBg = `rgba(5, 255, 161, ${Math.max(0.5, intensity)})`; // Cyan scale
                textCol = "text-onyx font-black";
            }

            cellEl.className = `w-7 h-7 flex items-center justify-center border text-[9px] font-mono transition-all ${borderStyle} ${textCol}`;
            cellEl.style.backgroundColor = colorBg;
            cellEl.textContent = cellVal;
            rowDiv.appendChild(cellEl);
        }
        gridContainer.appendChild(rowDiv);
    }

    // Render exact vs approx table
    const tbody = document.getElementById('cms-compare-body');
    tbody.innerHTML = '';

    const uniqueItems = Object.keys(exactStep.freq).sort();
    
    uniqueItems.forEach(item => {
        const exact = exactStep.freq[item];
        
        // Query CMS count from table at current step index
        let approx = Infinity;
        for (let r = 0; r < d; r++) {
            const c = getCMSHash(item, r, w);
            if (step.table[r][c] < approx) {
                approx = step.table[r][c];
            }
        }

        const err = approx - exact;
        const errPercent = ((err / exact) * 100).toFixed(1);

        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/2 transition-colors";
        tr.innerHTML = `
            <td class="py-2.5 text-on-surface font-bold text-xs">${item}</td>
            <td class="py-2.5 font-mono text-cyber-cyan">${exact}</td>
            <td class="py-2.5 font-mono text-cyber-pink">${approx}</td>
            <td class="py-2.5 font-mono text-on-surface/75 ${err > 0 ? 'text-cyber-pink' : ''}">${err}</td>
            <td class="py-2.5 font-mono text-on-surface/50">${errPercent}%</td>
        `;
        tbody.appendChild(tr);
    });
}

function streamRenderStep() {
    renderExactCountView(streamStepIndex);
    renderReservoirView(streamStepIndex);
    renderCMSView(streamStepIndex);

    // Toggle disabled status for Prev/Next
    document.getElementById('btn-prev').disabled = streamStepIndex === 0;
    document.getElementById('btn-next').disabled = streamStepIndex === activeStream.length - 1;
}

function streamStepPrev() {
    streamStopAutoPlay();
    if (streamStepIndex > 0) {
        streamStepIndex--;
        streamRenderStep();
    }
}

function streamStepNext() {
    if (streamStepIndex < activeStream.length - 1) {
        streamStepIndex++;
        streamRenderStep();
    } else {
        streamStopAutoPlay();
    }
}

function streamTogglePlay() {
    if (streamAutoPlayInterval) {
        streamStopAutoPlay();
    } else {
        if (streamStepIndex === activeStream.length - 1) {
            streamStepIndex = 0; // restart
        }
        
        const playBtn = document.getElementById('btn-play');
        playBtn.className = "cyber-btn px-6 py-1.5 text-[10px] font-headline text-cyber-cyan border-cyber-cyan flex items-center gap-1";
        playBtn.style.color = '#05ffa1';
        playBtn.style.borderColor = '#05ffa1';
        document.getElementById('play-icon').textContent = 'pause';
        document.getElementById('play-text').textContent = 'PAUSE';

        const delay = parseInt(document.getElementById('speed-slider').value);
        streamAutoPlayInterval = setInterval(() => {
            streamStepNext();
        }, delay);
    }
}

function streamStopAutoPlay() {
    if (streamAutoPlayInterval) {
        clearInterval(streamAutoPlayInterval);
        streamAutoPlayInterval = null;
    }
    const playBtn = document.getElementById('btn-play');
    if (playBtn) {
        playBtn.className = "cyber-btn-purple px-6 py-1.5 text-[10px] font-headline text-white flex items-center gap-1";
        playBtn.style.color = '';
        playBtn.style.borderColor = '';
        document.getElementById('play-icon').textContent = 'play_arrow';
        document.getElementById('play-text').textContent = 'PLAY';
    }
}

function switchStreamingTab(tabName) {
    streamStopAutoPlay();

    const tabs = ['exact', 'reservoir', 'cms', 'compare', 'reference'];
    tabs.forEach(t => {
        const div = document.getElementById(`stream-tab-${t}`);
        const btn = document.getElementById(`tab-btn-${t}`);
        if (t === tabName) {
            div.classList.remove('hidden');
            btn.className = "py-2 px-6 font-headline text-xs tracking-wider border border-cyber-cyan bg-cyber-purple/10 text-cyber-cyan glow-text-cyan hover:border-cyber-cyan transition-all";
        } else {
            div.classList.add('hidden');
            btn.className = "py-2 px-6 font-headline text-xs tracking-wider border border-transparent text-on-surface/60 hover:text-on-surface hover:border-cyber-purple/40 transition-all";
        }
    });
}

// ── Benchmark Suite ──────────────────────────────────────────────────────────

function runScaleBenchmark() {
    const streamSize = parseInt(document.getElementById('comp-stream-n').value) || 5000;
    const vocabSize = parseInt(document.getElementById('comp-vocab').value) || 100;

    // Generate Zipfian skewed stream
    const vocab = [];
    for (let i = 1; i <= vocabSize; i++) {
        const freq = Math.max(1, Math.floor(100 / i));
        for (let f = 0; f < freq; f++) {
            vocab.push(`Item_${i}`);
        }
    }

    const stream = [];
    const rng = new SeededRandom(42);
    for (let i = 0; i < streamSize; i++) {
        const idx = Math.floor(rng.next() * vocab.length);
        stream.push(vocab[idx]);
    }

    // Exact count benchmark
    const t0 = performance.now();
    const exactFreq = {};
    for (let i = 0; i < stream.length; i++) {
        exactFreq[stream[i]] = (exactFreq[stream[i]] || 0) + 1;
    }
    const t1 = performance.now();
    const timeExact = t1 - t0;

    // Count-Min Sketch benchmark
    const w = 50;
    const d = 5;
    const t2 = performance.now();
    const table = Array.from({ length: d }, () => Array(w).fill(0));
    for (let i = 0; i < stream.length; i++) {
        const item = stream[i];
        for (let row = 0; row < d; row++) {
            const col = getCMSHash(item, row, w);
            table[row][col]++;
        }
    }
    // Query exact frequencies approx
    const cmsFreq = {};
    const uniqueKeys = Object.keys(exactFreq);
    uniqueKeys.forEach(item => {
        let approx = Infinity;
        for (let row = 0; row < d; row++) {
            const col = getCMSHash(item, row, w);
            if (table[row][col] < approx) {
                approx = table[row][col];
            }
        }
        cmsFreq[item] = approx;
    });
    const t3 = performance.now();
    const timeCMS = t3 - t2;

    // Update time indicators
    document.getElementById('comp-time-exact').textContent = `${timeExact.toFixed(2)} ms`;
    document.getElementById('comp-time-cms').textContent = `${timeCMS.toFixed(2)} ms`;

    // Render comparison chart of top 12 items
    const sortedExact = Object.entries(exactFreq).sort((a, b) => b[1] - a[1]).slice(0, 12);
    
    const chartContainer = document.getElementById('comp-bars-container');
    chartContainer.innerHTML = '';

    const maxVal = Math.max(...sortedExact.map(e => cmsFreq[e[0]]), 1);

    sortedExact.forEach(([item, exactVal]) => {
        const approxVal = cmsFreq[item] || 0;
        
        const exactHeight = (exactVal / maxVal) * 85;
        const approxHeight = (approxVal / maxVal) * 85;

        const barGroup = document.createElement('div');
        barGroup.className = "flex flex-col items-center flex-grow h-full justify-end group relative text-center";

        barGroup.innerHTML = `
            <!-- Tooltip -->
            <div class="absolute -top-8 text-[7px] font-mono text-on-surface/80 bg-onyx border border-white/5 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 w-24">
                Exact: ${exactVal}<br/>CMS: ${approxVal}
            </div>
            <!-- Dual bars side-by-side -->
            <div class="flex items-end gap-1 h-[140px] items-end justify-center w-full">
                <div class="w-4 bg-cyber-cyan border border-cyber-cyan/30" style="height: ${exactHeight}%;"></div>
                <div class="w-4 bg-cyber-pink border border-cyber-pink/30" style="height: ${approxHeight}%;"></div>
            </div>
            <div class="text-[7px] font-mono text-on-surface/40 mt-1 truncate w-12 text-center" title="${item}">
                ${item.replace('Item_', 'I')}
            </div>
        `;
        chartContainer.appendChild(barGroup);
    });
}

// ── Initializer & Config bindings ────────────────────────────────────────────

function initStreamingVisualizer() {
    // Generate stream based on inputs
    function buildActiveStream() {
        streamStopAutoPlay();
        const preset = document.getElementById('stream-preset').value;
        
        if (preset === 'custom') {
            document.getElementById('custom-stream-container').classList.remove('hidden');
            const customRaw = document.getElementById('custom-stream-input').value;
            activeStream = customRaw.split(',').map(item => item.trim()).filter(item => item.length > 0);
        } else {
            document.getElementById('custom-stream-container').classList.add('hidden');
            activeStream = PRESETS[preset] || [];
        }

        // Generate Steps
        const k = parseInt(document.getElementById('reservoir-k').value);
        const w = parseInt(document.getElementById('cms-w').value);
        const d = parseInt(document.getElementById('cms-d').value);

        exactSteps = generateExactSteps(activeStream);
        reservoirSteps = generateReservoirSteps(activeStream, k);
        cmsSteps = generateCMSSteps(activeStream, w, d);

        // Update counts
        const unique = new Set(activeStream);
        document.getElementById('stat-stream-length').textContent = activeStream.length;
        document.getElementById('stat-stream-vocab').textContent = unique.size;

        // Reset step
        streamStepIndex = 0;
        document.getElementById('btn-prev').disabled = true;
        document.getElementById('btn-play').disabled = activeStream.length === 0;
        document.getElementById('btn-next').disabled = activeStream.length <= 1;

        streamRenderStep();
    }

    // Bind slider events
    const kSlider = document.getElementById('reservoir-k');
    const kVal = document.getElementById('k-val');
    kSlider.addEventListener('input', () => {
        kVal.textContent = kSlider.value;
        buildActiveStream();
    });

    const wSlider = document.getElementById('cms-w');
    const wVal = document.getElementById('cms-w-val');
    wSlider.addEventListener('input', () => {
        wVal.textContent = wSlider.value;
        buildActiveStream();
    });

    const dSlider = document.getElementById('cms-d');
    const dVal = document.getElementById('cms-d-val');
    dSlider.addEventListener('input', () => {
        dVal.textContent = dSlider.value;
        buildActiveStream();
    });

    // Speed slider UI updates
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');
    speedSlider.addEventListener('input', () => {
        speedVal.textContent = `${speedSlider.value}ms`;
        if (streamAutoPlayInterval) {
            // Restart
            streamStopAutoPlay();
            streamTogglePlay();
        }
    });

    // Preset selection change
    document.getElementById('stream-preset').addEventListener('change', buildActiveStream);

    // Hook Form Control buttons
    document.getElementById('btn-generate').addEventListener('click', buildActiveStream);
    document.getElementById('btn-run').addEventListener('click', () => {
        streamStopAutoPlay();
        streamStepIndex = 0;
        streamTogglePlay();
    });

    // Playback Buttons
    document.getElementById('btn-prev').addEventListener('click', streamStepPrev);
    document.getElementById('btn-play').addEventListener('click', streamTogglePlay);
    document.getElementById('btn-next').addEventListener('click', streamStepNext);

    // Benchmark Run
    document.getElementById('btn-run-benchmark').addEventListener('click', runScaleBenchmark);

    // Make switchStreamingTab globally accessible
    window.switchStreamingTab = switchStreamingTab;

    // Build initial preset stream
    buildActiveStream();
}

// Auto-run init
initStreamingVisualizer();
