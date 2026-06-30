// modules/sorting.js

// LCG Seeded Random Generator for deterministic array creation
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }
    sampleRange(min, max, count) {
        let pool = [];
        for (let i = min; i <= max; i++) pool.push(i);
        let result = [];
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(this.next() * pool.length);
            result.push(pool.splice(idx, 1)[0]);
        }
        return result;
    }
}

// ── Sorting Algorithm Steps Generators ───────────────────────────────────────

function runSelectionSort(arr) {
    let a = [...arr];
    let n = a.length;
    let steps = [];
    let comparisons = 0;
    let swaps = 0;

    for (let i = 0; i < n; i++) {
        let min_idx = i;
        for (let j = i + 1; j < n; j++) {
            comparisons++;
            steps.push({
                array: [...a],
                highlights: { compare: [min_idx, j], sorted: Array.from({length: i}, (_, idx) => idx), active: [i] },
                description: `Comparing indices ${j} (${a[j]}) and min_idx ${min_idx} (${a[min_idx]})`
            });
            if (a[j] < a[min_idx]) {
                min_idx = j;
            }
        }

        if (min_idx !== i) {
            let temp = a[i];
            a[i] = a[min_idx];
            a[min_idx] = temp;
            swaps++;
            steps.push({
                array: [...a],
                highlights: { compare: [], sorted: Array.from({length: i + 1}, (_, idx) => idx), active: [i, min_idx] },
                description: `Swapped index ${i} (${a[i]}) ↔ ${min_idx} (${a[min_idx]})`
            });
        }
    }
    steps.push({
        array: [...a],
        highlights: { compare: [], sorted: Array.from({length: n}, (_, idx) => idx), active: [] },
        description: "Array is fully sorted!"
    });
    return { steps, comparisons, swaps };
}

function runInsertionSort(arr) {
    let a = [...arr];
    let n = a.length;
    let steps = [];
    let comparisons = 0;
    let swaps = 0;

    for (let i = 1; i < n; i++) {
        let key = a[i];
        let j = i - 1;
        steps.push({
            array: [...a],
            highlights: { compare: [i], sorted: Array.from({length: i}, (_, idx) => idx), active: [i] },
            description: `Picking key = ${key} at index ${i}`
        });

        while (j >= 0 && a[j] > key) {
            comparisons++;
            a[j + 1] = a[j];
            swaps++;
            steps.push({
                array: [...a],
                highlights: { compare: [j, j + 1], sorted: Array.from({length: j}, (_, idx) => idx), active: [j + 1] },
                description: `Shifting ${a[j]} right; key=${key}`
            });
            j--;
        }
        if (j >= 0) {
            comparisons++;
        }
        a[j + 1] = key;
        steps.push({
            array: [...a],
            highlights: { compare: [], sorted: Array.from({length: i + 1}, (_, idx) => idx), active: [j + 1] },
            description: `Inserted ${key} at position ${j + 1}`
        });
    }

    steps.push({
        array: [...a],
        highlights: { compare: [], sorted: Array.from({length: n}, (_, idx) => idx), active: [] },
        description: "Array is fully sorted!"
    });
    return { steps, comparisons, swaps };
}

function runMergeSort(arr) {
    let a = [...arr];
    let steps = [];
    let comparisons = 0;

    function merge(arr, left, mid, right) {
        let L = arr.slice(left, mid + 1);
        let R = arr.slice(mid + 1, right + 1);
        let i = 0, j = 0, k = left;

        while (i < L.length && j < R.length) {
            comparisons++;
            if (L[i] <= R[j]) {
                arr[k] = L[i];
                i++;
            } else {
                arr[k] = R[j];
                j++;
            }
            steps.push({
                array: [...arr],
                highlights: { compare: [k], sorted: [], active: Array.from({length: right - left + 1}, (_, idx) => left + idx) },
                description: `Merging [${left}:${right}]: placed ${arr[k]} at index ${k}`
            });
            k++;
        }

        while (i < L.length) {
            arr[k] = L[i];
            steps.push({
                array: [...arr],
                highlights: { compare: [k], sorted: [], active: Array.from({length: right - left + 1}, (_, idx) => left + idx) },
                description: `Merging [${left}:${right}]: placed remainder ${arr[k]} at index ${k}`
            });
            i++; k++;
        }

        while (j < R.length) {
            arr[k] = R[j];
            steps.push({
                array: [...arr],
                highlights: { compare: [k], sorted: [], active: Array.from({length: right - left + 1}, (_, idx) => left + idx) },
                description: `Merging [${left}:${right}]: placed remainder ${arr[k]} at index ${k}`
            });
            j++; k++;
        }

        steps.push({
            array: [...arr],
            highlights: { compare: [], sorted: Array.from({length: right - left + 1}, (_, idx) => left + idx), active: [] },
            description: `Segment [${left}:${right}] merged`
        });
    }

    function mergeSortHelper(arr, left, right) {
        if (left < right) {
            let mid = Math.floor((left + right) / 2);
            mergeSortHelper(arr, left, mid);
            mergeSortHelper(arr, mid + 1, right);
            merge(arr, left, mid, right);
        }
    }

    mergeSortHelper(a, 0, a.length - 1);
    steps.push({
        array: [...a],
        highlights: { compare: [], sorted: Array.from({length: a.length}, (_, idx) => idx), active: [] },
        description: "Array is fully sorted!"
    });
    return { steps, comparisons, swaps: 0 };
}

function runQuickSort(arr) {
    let a = [...arr];
    let steps = [];
    let comparisons = 0;
    let swaps = 0;

    function partition(arr, low, high) {
        let pivot = arr[high];
        let i = low - 1;
        steps.push({
            array: [...arr],
            highlights: { compare: [high], sorted: [], active: Array.from({length: high - low + 1}, (_, idx) => low + idx) },
            description: `Pivot = ${pivot} at index ${high}`
        });

        for (let j = low; j < high; j++) {
            comparisons++;
            steps.push({
                array: [...arr],
                highlights: { compare: [j, high], sorted: [], active: Array.from({length: high - low + 1}, (_, idx) => low + idx) },
                description: `Comparing ${arr[j]} with pivot ${pivot}`
            });

            if (arr[j] <= pivot) {
                i++;
                let temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
                swaps++;
                steps.push({
                    array: [...arr],
                    highlights: { compare: [i, j], sorted: [], active: Array.from({length: high - low + 1}, (_, idx) => low + idx) },
                    description: `Swapped ${arr[j]} ↔ ${arr[i]}`
                });
            }
        }
        let temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        swaps++;
        steps.push({
            array: [...arr],
            highlights: { compare: [], sorted: [i + 1], active: [] },
            description: `Pivot ${pivot} placed at final position ${i + 1}`
        });
        return i + 1;
    }

    function quickSortHelper(arr, low, high) {
        if (low < high) {
            let pi = partition(arr, low, high);
            quickSortHelper(arr, low, pi - 1);
            quickSortHelper(arr, pi + 1, high);
        }
    }

    quickSortHelper(a, 0, a.length - 1);
    steps.push({
        array: [...a],
        highlights: { compare: [], sorted: Array.from({length: a.length}, (_, idx) => idx), active: [] },
        description: "Array is fully sorted!"
    });
    return { steps, comparisons, swaps };
}

// ── State Management ─────────────────────────────────────────────────────────

let simulationData = null;
let currentStepIndex = 0;
let autoPlayInterval = null;
let currentArray = [];

// Initialize Visualizer Page Hookups
function initVisualizer() {
    const inputModeRadios = document.querySelectorAll('input[name="input-mode"]');
    const randomConfig = document.getElementById('random-config');
    const customConfig = document.getElementById('custom-config');
    const arraySizeInput = document.getElementById('array-size');
    const sizeVal = document.getElementById('size-val');
    
    // Toggle Configuration Inputs
    inputModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'random') {
                randomConfig.classList.remove('hidden');
                customConfig.classList.add('hidden');
            } else {
                randomConfig.classList.add('hidden');
                customConfig.classList.remove('hidden');
            }
        });
    });

    arraySizeInput.addEventListener('input', (e) => {
        sizeVal.textContent = e.target.value;
    });

    // Generate Array Button
    document.getElementById('btn-generate').addEventListener('click', () => {
        generateActiveArray();
    });

    // Start Simulation Button
    document.getElementById('btn-run').addEventListener('click', () => {
        startSimulation();
    });

    // Playback Buttons
    document.getElementById('btn-prev').addEventListener('click', () => {
        stepPrev();
    });
    document.getElementById('btn-next').addEventListener('click', () => {
        stepNext();
    });
    document.getElementById('btn-play').addEventListener('click', () => {
        togglePlay();
    });

    // Speed Slider
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');
    speedSlider.addEventListener('input', (e) => {
        speedVal.textContent = e.target.value + 'ms';
        if (autoPlayInterval) {
            // Restart timer with new speed
            clearInterval(autoPlayInterval);
            startAutoPlayTimer();
        }
    });

    // Compare tab benchmark run
    document.getElementById('btn-run-benchmark').addEventListener('click', () => {
        runBenchmark();
    });

    // Initial generate
    generateActiveArray();
}

function generateActiveArray() {
    stopAutoPlay();
    disablePlaybackButtons();

    const mode = document.querySelector('input[name="input-mode"]:checked').value;
    if (mode === 'random') {
        const size = parseInt(document.getElementById('array-size').value);
        const seedEl = document.getElementById('random-seed');
        const seed = seedEl ? (parseInt(seedEl.value) || 42) : 42;
        const rng = new SeededRandom(seed);
        currentArray = rng.sampleRange(5, 95, size);
    } else {
        const raw = document.getElementById('custom-array-input').value;
        try {
            currentArray = raw.split(',').map(x => {
                const parsed = parseInt(x.trim());
                if (isNaN(parsed)) throw new Error();
                return parsed;
            });
        } catch (e) {
            alert("Invalid input. Please use comma-separated integers.");
            return;
        }
    }

    renderBars(currentArray, {});
    document.getElementById('stat-steps').textContent = '0/0';
    document.getElementById('stat-compare').textContent = '0';
    document.getElementById('stat-swaps').textContent = '0';
    document.getElementById('viz-description').textContent = "Array generated. Press START_SIMULATION to load steps.";
}

function renderBars(arr, highlights) {
    const container = document.getElementById('bar-render-container');
    // Clear previous bars keeping the absolute title element
    const hudTitle = container.firstElementChild;
    container.innerHTML = '';
    container.appendChild(hudTitle);

    const maxVal = Math.max(...arr, 1);
    
    arr.forEach((val, idx) => {
        const bar = document.createElement('div');
        bar.className = "h-full flex-grow flex flex-col justify-end items-center relative text-on-surface select-none";
        
        let colorClass = "bg-slate-700/20 border-slate-700/50";
        let barColor = "rgba(70,69,85,0.2)";
        let borderGlow = "rgba(70,69,85,0.4)";
        
        if (highlights.compare && highlights.compare.includes(idx)) {
            colorClass = "bg-cyber-cyan/20 border-cyber-cyan/60 animate-pulse";
            barColor = "rgba(5,255,161,0.2)";
            borderGlow = "rgba(5,255,161,0.6)";
        } else if (highlights.active && highlights.active.includes(idx)) {
            colorClass = "bg-cyber-pink/20 border-cyber-pink/60";
            barColor = "rgba(255,0,230,0.2)";
            borderGlow = "rgba(255,0,230,0.6)";
        } else if (highlights.sorted && highlights.sorted.includes(idx)) {
            colorClass = "bg-emerald-500/20 border-emerald-500/60";
            barColor = "rgba(16,185,129,0.2)";
            borderGlow = "rgba(16,185,129,0.6)";
        }

        const heightPercent = (val / maxVal) * 100;
        
        bar.innerHTML = `
            <span class="text-[9px] font-mono mb-1 text-on-surface/85 z-10">${val}</span>
            <div class="w-full border-t border-x ${colorClass} transition-all duration-300 relative" 
                 style="height: ${heightPercent}%; background-color: ${barColor}; border-color: ${borderGlow}; box-shadow: inset 0 2px 4px rgba(255,255,255,0.02)">
                 <div class="absolute bottom-0 inset-x-0 bg-white/2 opacity-5 pointer-events-none" style="height: 50%;"></div>
            </div>
            <span class="text-[7px] font-mono mt-1.5 text-on-surface/40">${idx}</span>
        `;
        container.appendChild(bar);
    });
}

function startSimulation() {
    stopAutoPlay();
    
    const mode = document.querySelector('input[name="input-mode"]:checked').value;
    const algo = document.getElementById('algo-select').value;

    // Sync custom array if in custom mode
    if (mode === 'custom') {
        const raw = document.getElementById('custom-array-input').value;
        try {
            currentArray = raw.split(',').map(x => {
                const parsed = parseInt(x.trim());
                if (isNaN(parsed)) throw new Error();
                return parsed;
            });
            renderBars(currentArray, {});
        } catch (e) {
            alert("Invalid custom array. Please use comma-separated integers.");
            return;
        }
    }
    
    const algoMap = {
        'selection': runSelectionSort,
        'insertion': runInsertionSort,
        'merge': runMergeSort,
        'quick': runQuickSort
    };
    
    const titleMap = {
        'selection': 'SELECTION SORT',
        'insertion': 'INSERTION SORT',
        'merge': 'MERGE SORT',
        'quick': 'QUICK SORT'
    };

    document.getElementById('viz-algo-title').textContent = titleMap[algo];
    
    simulationData = algoMap[algo](currentArray);
    currentStepIndex = 0;
    
    enablePlaybackButtons();
    renderStep(0);
}

function renderStep(idx) {
    if (!simulationData) return;
    const step = simulationData.steps[idx];
    if (!step) return;

    renderBars(step.array, step.highlights);
    
    // Update labels
    document.getElementById('stat-steps').textContent = `${idx + 1}/${simulationData.steps.length}`;
    document.getElementById('stat-compare').textContent = simulationData.comparisons;
    document.getElementById('stat-swaps').textContent = simulationData.swaps;
    document.getElementById('viz-description').textContent = step.description;

    // Button states
    document.getElementById('btn-prev').disabled = (idx === 0);
    document.getElementById('btn-next').disabled = (idx === simulationData.steps.length - 1);
}

function stepPrev() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        renderStep(currentStepIndex);
    }
}

function stepNext() {
    if (simulationData && currentStepIndex < simulationData.steps.length - 1) {
        currentStepIndex++;
        renderStep(currentStepIndex);
    } else {
        stopAutoPlay();
    }
}

function togglePlay() {
    if (autoPlayInterval) {
        stopAutoPlay();
    } else {
        startAutoPlay();
    }
}

function startAutoPlay() {
    const playBtn = document.getElementById('btn-play');
    const playIcon = document.getElementById('play-icon');
    const playText = document.getElementById('play-text');
    
    playBtn.classList.remove('cyber-btn-purple');
    playBtn.classList.add('cyber-btn');
    playBtn.style.color = '#ff00e6';
    playBtn.style.borderColor = 'rgba(255,0,230,0.3)';
    playIcon.textContent = 'pause';
    playText.textContent = 'PAUSE';

    startAutoPlayTimer();
}

function startAutoPlayTimer() {
    const delay = parseInt(document.getElementById('speed-slider').value);
    autoPlayInterval = setInterval(() => {
        stepNext();
    }, delay);
}

function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
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

function enablePlaybackButtons() {
    document.getElementById('btn-prev').disabled = false;
    document.getElementById('btn-play').disabled = false;
    document.getElementById('btn-next').disabled = false;
}

function disablePlaybackButtons() {
    document.getElementById('btn-prev').disabled = true;
    document.getElementById('btn-play').disabled = true;
    document.getElementById('btn-next').disabled = true;
}

// ── Tab Navigation ───────────────────────────────────────────────────────────

function switchSortTab(tabName) {
    stopAutoPlay();
    
    // Toggle content divs
    const tabs = ['visualize', 'compare', 'complexity'];
    tabs.forEach(t => {
        const div = document.getElementById(`sort-tab-${t}`);
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

function runBenchmark() {
    const size = parseInt(document.getElementById('comp-size').value) || 200;
    const seed = parseInt(document.getElementById('comp-seed').value) || 42;
    
    const rng = new SeededRandom(seed);
    // Generate arrays
    const origArray = rng.sampleRange(5, size * 10, size);
    
    const results = {};
    const algos = {
        'Selection Sort': runSelectionSort,
        'Insertion Sort': runInsertionSort,
        'Merge Sort': runMergeSort,
        'Quick Sort': runQuickSort
    };

    // Benchmark times and steps
    for (const [name, fn] of Object.entries(algos)) {
        const arrCopy = [...origArray];
        
        // Measure execution time cleanly in JS
        const t0 = performance.now();
        const outcome = fn(arrCopy);
        const t1 = performance.now();
        
        results[name] = {
            time: t1 - t0,
            comparisons: outcome.comparisons,
            swaps: outcome.swaps
        };
    }

    renderBenchmarkCharts(results);
    renderBenchmarkTable(results);
    renderRecommendation(results, size);
    
    document.getElementById('benchmark-results-container').classList.remove('hidden');
}

function renderBenchmarkCharts(results) {
    const times = {};
    const ops = {};
    
    for (const [name, data] of Object.entries(results)) {
        times[name] = data.time;
        ops[name] = data.comparisons;
    }
    
    const maxTime = Math.max(...Object.values(times), 0.001);
    const maxOps = Math.max(...Object.values(ops), 1);
    
    renderComparisonChart('chart-time-container', times, maxTime, 'ms');
    renderComparisonChart('chart-ops-container', ops, maxOps, ' ops');
}

function renderComparisonChart(containerId, dataMap, maxVal, unit) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const colors = {
        'Selection Sort': '#05ffa1', // cyber-cyan
        'Insertion Sort': '#ff00e6', // cyber-pink
        'Merge Sort': '#bc13fe',     // cyber-purple
        'Quick Sort': '#ff00e6'      // cyber-pink
    };
    
    for (const [name, val] of Object.entries(dataMap)) {
        const heightPercent = maxVal > 0 ? (val / maxVal) * 85 : 0; // limit height to 85% to save label space
        
        const barCol = document.createElement('div');
        barCol.className = "flex flex-col items-center flex-grow h-full justify-end group relative text-center";
        
        barCol.innerHTML = `
            <div class="text-[8px] font-mono text-cyber-cyan mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ${val.toFixed(unit.includes('ms') ? 3 : 0)}${unit}
            </div>
            <div class="w-10 border border-cyber-purple/20 bg-surface-dark transition-all duration-300 hover:border-cyber-cyan relative" 
                 style="height: ${heightPercent}%; background-color: ${colors[name]}20; border-color: ${colors[name]}50; box-shadow: inset 0 2px 4px rgba(255,255,255,0.01)">
            </div>
            <div class="text-[8px] font-headline tracking-tighter mt-2 text-on-surface/50 truncate w-14 text-center">
                ${name.split(' ')[0]}
            </div>
        `;
        container.appendChild(barCol);
    }
}

function renderBenchmarkTable(results) {
    const tbody = document.getElementById('benchmark-table-body');
    tbody.innerHTML = '';
    
    for (const [name, data] of Object.entries(results)) {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/2 transition-colors";
        tr.innerHTML = `
            <td class="py-3 text-on-surface font-headline font-bold">${name}</td>
            <td class="py-3 font-mono text-cyber-cyan">${data.time.toFixed(4)} ms</td>
            <td class="py-3 font-mono text-on-surface/75">${data.comparisons}</td>
            <td class="py-3 font-mono text-cyber-pink">${data.swaps}</td>
        `;
        tbody.appendChild(tr);
    }
}

function renderRecommendation(results, size) {
    const recText = document.getElementById('recommendation-text');
    
    // Find fastest
    let fastestAlgo = null;
    let minTime = Infinity;
    for (const [name, data] of Object.entries(results)) {
        if (data.time < minTime) {
            minTime = data.time;
            fastestAlgo = name;
        }
    }
    
    let report = `At array size N = ${size}, the fastest algorithm is **${fastestAlgo}** running in **${minTime.toFixed(4)} ms**. `;
    
    if (size < 50) {
        report += `For small datasets, **Insertion Sort** or **Quick Sort** are typically recommended. Insertion Sort has extremely low overhead and runs in O(n) time on nearly-sorted data.`;
    } else {
        report += `For larger datasets (N = ${size}), O(n log n) divide-and-conquer algorithms like **Merge Sort** and **Quick Sort** outclass quadratic O(n²) algorithms like Selection and Insertion Sort by orders of magnitude due to logarithmic reduction in comparison paths.`;
    }
    recText.innerHTML = report;
}

// Expose switchSortTab globally
window.switchSortTab = switchSortTab;

// Start module initialization
initVisualizer();
