// modules/searching.js

// LCG Seeded Random Generator
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

// ── Search Algorithm Steps Generators ────────────────────────────────────────

function runLinearSearch(arr, target) {
    let steps = [];
    let comparisons = 0;
    let found_at = -1;

    for (let i = 0; i < arr.length; i++) {
        comparisons++;
        const val = arr[i];
        
        let isMatch = val === target;
        
        steps.push({
            array: [...arr],
            pointer: i,
            highlights: {
                active: [i],
                found: isMatch ? [i] : [],
                range: Array.from({length: arr.length}, (_, idx) => idx) // all elements in range for linear
            },
            description: `Checking index ${i}: value=${val} ${isMatch ? '== target ✅' : '≠ target'}`
        });

        if (isMatch) {
            found_at = i;
            break;
        }
    }
    
    if (found_at === -1) {
        steps.push({
            array: [...arr],
            pointer: -1,
            highlights: { active: [], found: [], range: [] },
            description: `Target ${target} not found in array.`
        });
    }

    return { steps, comparisons, found_at };
}

function runBinarySearch(arr, target) {
    // Binary Search requires a sorted array
    let sorted_arr = [...arr].sort((x, y) => x - y);
    let steps = [];
    let comparisons = 0;
    let found_at = -1;
    let low = 0, high = sorted_arr.length - 1;

    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        comparisons++;
        let val = sorted_arr[mid];
        
        let isMatch = val === target;
        let actionDesc = isMatch ? '== target ✅' : (val > target ? '> target, search left' : '< target, search right');

        steps.push({
            array: [...sorted_arr],
            pointer: mid,
            highlights: {
                active: [mid],
                range: Array.from({length: high - low + 1}, (_, idx) => low + idx),
                found: isMatch ? [mid] : []
            },
            description: `low=${low}, high=${high}, mid=${mid} → arr[mid]=${val} ${actionDesc}`
        });

        if (isMatch) {
            found_at = mid;
            break;
        } else if (val < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    if (found_at === -1) {
        steps.push({
            array: [...sorted_arr],
            pointer: -1,
            highlights: { active: [], range: [], found: [] },
            description: `Target ${target} not found in array.`
        });
    }

    return { steps, comparisons, found_at, sorted_array: sorted_arr };
}

// ── State Management ─────────────────────────────────────────────────────────

let searchSimulationData = null;
let searchCurrentStepIndex = 0;
let searchAutoPlayInterval = null;
let searchCurrentArray = [];
let searchTargetValue = 34;

// Initialize Visualizer Page Hookups
function initSearchVisualizer() {
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
        generateSearchArray();
    });

    // Start Simulation Button
    document.getElementById('btn-run').addEventListener('click', () => {
        startSearchSimulation();
    });

    // Playback Buttons
    document.getElementById('btn-prev').addEventListener('click', () => {
        searchStepPrev();
    });
    document.getElementById('btn-next').addEventListener('click', () => {
        searchStepNext();
    });
    document.getElementById('btn-play').addEventListener('click', () => {
        searchTogglePlay();
    });

    // Speed Slider
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');
    speedSlider.addEventListener('input', (e) => {
        speedVal.textContent = e.target.value + 'ms';
        if (searchAutoPlayInterval) {
            // Restart timer with new speed
            clearInterval(searchAutoPlayInterval);
            startSearchAutoPlayTimer();
        }
    });

    // Compare tab benchmark run
    document.getElementById('btn-run-benchmark').addEventListener('click', () => {
        runSearchBenchmark();
    });

    // Initial generate
    generateSearchArray();
}

function generateSearchArray() {
    searchStopAutoPlay();
    searchDisablePlaybackButtons();

    const mode = document.querySelector('input[name="input-mode"]:checked').value;
    const algo = document.getElementById('algo-select').value;
    
    let tempArray = [];
    if (mode === 'random') {
        const size = parseInt(document.getElementById('array-size').value);
        const seedEl = document.getElementById('random-seed');
        const seed = seedEl ? (parseInt(seedEl.value) || 42) : 42;
        const rng = new SeededRandom(seed);
        tempArray = rng.sampleRange(5, 195, size);
    } else {
        const raw = document.getElementById('custom-array-input').value;
        try {
            tempArray = raw.split(',').map(x => {
                const parsed = parseInt(x.trim());
                if (isNaN(parsed)) throw new Error();
                return parsed;
            });
        } catch (e) {
            alert("Invalid input. Please use comma-separated integers.");
            return;
        }
    }

    // Binary Search automatically sorts the array
    if (algo === 'binary') {
        searchCurrentArray = tempArray.sort((x, y) => x - y);
    } else {
        searchCurrentArray = tempArray;
    }

    // Auto set target if target value is empty
    if (searchCurrentArray.length > 0) {
        const targetInput = document.getElementById('search-target');
        if (!targetInput.value.trim()) {
            const middleIdx = Math.floor(searchCurrentArray.length / 2);
            targetInput.value = searchCurrentArray[middleIdx];
        }
    }

    renderSearchBlocks(searchCurrentArray, {});
    document.getElementById('stat-steps').textContent = '0/0';
    document.getElementById('stat-compare').textContent = '0';
    document.getElementById('stat-result').textContent = '-';
    document.getElementById('viz-description').textContent = "Array generated. Press START_SEARCH to load steps.";
}

function renderSearchBlocks(arr, highlights) {
    const container = document.getElementById('block-render-container');
    const hudTitle = container.firstElementChild;
    container.innerHTML = '';
    container.appendChild(hudTitle);

    arr.forEach((val, idx) => {
        const block = document.createElement('div');
        block.className = "flex flex-col items-center select-none w-14 transition-all duration-300";
        
        let borderClass = "border-cyber-purple/20 bg-surface-dark/60 opacity-40";
        let glowClass = "";
        let valTextClass = "text-on-surface/50";
        
        const inRange = highlights.range && highlights.range.includes(idx);
        const isActive = highlights.active && highlights.active.includes(idx);
        const isFound = highlights.found && highlights.found.includes(idx);

        if (isFound) {
            borderClass = "border-cyber-cyan bg-cyber-cyan/10 scale-110 shadow-[0_0_15px_rgba(5,255,161,0.3)] z-10";
            glowClass = "glow-text-cyan";
            valTextClass = "text-cyber-cyan font-bold";
        } else if (isActive) {
            borderClass = "border-cyber-pink bg-cyber-pink/10 scale-105 shadow-[0_0_15px_rgba(255,0,230,0.3)] z-10";
            glowClass = "glow-text-pink";
            valTextClass = "text-cyber-pink font-bold";
        } else if (inRange || !highlights.range) {
            borderClass = "border-cyber-purple/40 bg-surface-dark/90 hover:border-cyber-purple";
            valTextClass = "text-on-surface";
        }

        block.innerHTML = `
            <div class="text-[8px] font-mono text-on-surface/40 mb-1">idx_${idx}</div>
            <div class="w-full h-12 flex items-center justify-center border hud-border-purple relative font-headline ${borderClass}">
                 <span class="${valTextClass} ${glowClass} text-sm">${val}</span>
            </div>
        `;
        container.appendChild(block);
    });
}

function startSearchSimulation() {
    searchStopAutoPlay();
    
    const mode = document.querySelector('input[name="input-mode"]:checked').value;
    const algo = document.getElementById('algo-select').value;

    // Sync custom array if in custom mode
    if (mode === 'custom') {
        const raw = document.getElementById('custom-array-input').value;
        try {
            const tempArray = raw.split(',').map(x => {
                const parsed = parseInt(x.trim());
                if (isNaN(parsed)) throw new Error();
                return parsed;
            });
            if (algo === 'binary') {
                searchCurrentArray = tempArray.sort((x, y) => x - y);
            } else {
                searchCurrentArray = tempArray;
            }
            renderSearchBlocks(searchCurrentArray, {});
        } catch (e) {
            alert("Invalid custom array. Please use comma-separated integers.");
            return;
        }
    }

    searchTargetValue = parseInt(document.getElementById('search-target').value);
    if (isNaN(searchTargetValue)) {
        alert("Please enter a valid target integer.");
        return;
    }

    const algoMap = {
        'linear': runLinearSearch,
        'binary': runBinarySearch
    };
    
    const titleMap = {
        'linear': 'LINEAR SEARCH',
        'binary': 'BINARY SEARCH'
    };

    document.getElementById('viz-algo-title').textContent = titleMap[algo];
    
    searchSimulationData = algoMap[algo](searchCurrentArray, searchTargetValue);
    
    // For Binary search, the array might have been sorted, update our array representation
    if (algo === 'binary' && searchSimulationData.sorted_array) {
        searchCurrentArray = searchSimulationData.sorted_array;
    }

    searchCurrentStepIndex = 0;
    
    searchEnablePlaybackButtons();
    renderSearchStep(0);
}

function renderSearchStep(idx) {
    if (!searchSimulationData) return;
    const step = searchSimulationData.steps[idx];
    if (!step) return;

    renderSearchBlocks(step.array, step.highlights);
    
    // Update labels
    document.getElementById('stat-steps').textContent = `${idx + 1}/${searchSimulationData.steps.length}`;
    document.getElementById('stat-compare').textContent = idx + 1; // standard count is steps checked
    document.getElementById('viz-description').textContent = step.description;

    const resultSpan = document.getElementById('stat-result');
    if (searchSimulationData.found_at >= 0 && idx === searchSimulationData.steps.length - 1) {
        resultSpan.textContent = `Found at idx_${searchSimulationData.found_at}`;
        resultSpan.className = "text-cyber-cyan font-bold";
    } else if (idx === searchSimulationData.steps.length - 1) {
        resultSpan.textContent = "Not Found";
        resultSpan.className = "text-cyber-pink font-bold";
    } else {
        resultSpan.textContent = "Searching...";
        resultSpan.className = "text-on-surface/50";
    }

    // Button states
    document.getElementById('btn-prev').disabled = (idx === 0);
    document.getElementById('btn-next').disabled = (idx === searchSimulationData.steps.length - 1);
}

function searchStepPrev() {
    if (searchCurrentStepIndex > 0) {
        searchCurrentStepIndex--;
        renderSearchStep(searchCurrentStepIndex);
    }
}

function searchStepNext() {
    if (searchSimulationData && searchCurrentStepIndex < searchSimulationData.steps.length - 1) {
        searchCurrentStepIndex++;
        renderSearchStep(searchCurrentStepIndex);
    } else {
        searchStopAutoPlay();
    }
}

function searchTogglePlay() {
    if (searchAutoPlayInterval) {
        searchStopAutoPlay();
    } else {
        searchStartAutoPlay();
    }
}

function searchStartAutoPlay() {
    const playBtn = document.getElementById('btn-play');
    const playIcon = document.getElementById('play-icon');
    const playText = document.getElementById('play-text');
    
    playBtn.classList.remove('cyber-btn-purple');
    playBtn.classList.add('cyber-btn');
    playBtn.style.color = '#ff00e6';
    playBtn.style.borderColor = 'rgba(255,0,230,0.3)';
    playIcon.textContent = 'pause';
    playText.textContent = 'PAUSE';

    startSearchAutoPlayTimer();
}

function startSearchAutoPlayTimer() {
    const delay = parseInt(document.getElementById('speed-slider').value);
    searchAutoPlayInterval = setInterval(() => {
        searchStepNext();
    }, delay);
}

function searchStopAutoPlay() {
    if (searchAutoPlayInterval) {
        clearInterval(searchAutoPlayInterval);
        searchAutoPlayInterval = null;
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

function searchEnablePlaybackButtons() {
    document.getElementById('btn-prev').disabled = false;
    document.getElementById('btn-play').disabled = false;
    document.getElementById('btn-next').disabled = false;
}

function searchDisablePlaybackButtons() {
    document.getElementById('btn-prev').disabled = true;
    document.getElementById('btn-play').disabled = true;
    document.getElementById('btn-next').disabled = true;
}

// ── Tab Navigation ───────────────────────────────────────────────────────────

function switchSearchTab(tabName) {
    searchStopAutoPlay();
    
    const tabs = ['visualize', 'compare', 'complexity'];
    tabs.forEach(t => {
        const div = document.getElementById(`search-tab-${t}`);
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

function runSearchBenchmark() {
    const size = parseInt(document.getElementById('comp-size').value) || 500;
    const seed = parseInt(document.getElementById('comp-seed').value) || 42;
    
    const rng = new SeededRandom(seed);
    const unsortedArray = rng.sampleRange(1, size * 10, size);
    
    // Sort array for binary search
    const sortedArray = [...unsortedArray].sort((x, y) => x - y);
    // Find target
    const targetIdx = Math.floor(size / 2);
    const target = sortedArray[targetIdx];
    
    const results = {};
    
    // 1. Linear Search Benchmark
    const t0 = performance.now();
    const lsResult = runLinearSearch(unsortedArray, target);
    const t1 = performance.now();
    results['Linear Search'] = {
        time: t1 - t0,
        comparisons: lsResult.comparisons,
        found_at: lsResult.found_at
    };

    // 2. Binary Search Benchmark
    const t2 = performance.now();
    const bsResult = runBinarySearch(sortedArray, target);
    const t3 = performance.now();
    results['Binary Search'] = {
        time: t3 - t2,
        comparisons: bsResult.comparisons,
        found_at: bsResult.found_at
    };

    renderSearchBenchmarkCharts(results);
    renderSearchBenchmarkTable(results);
    renderSearchRecommendation(results, size);
    
    document.getElementById('benchmark-results-container').classList.remove('hidden');
}

function renderSearchBenchmarkCharts(results) {
    const times = {};
    const ops = {};
    
    for (const [name, data] of Object.entries(results)) {
        times[name] = data.time;
        ops[name] = data.comparisons;
    }
    
    const maxTime = Math.max(...Object.values(times), 0.001);
    const maxOps = Math.max(...Object.values(ops), 1);
    
    renderSearchComparisonChart('chart-time-container', times, maxTime, 'ms');
    renderSearchComparisonChart('chart-ops-container', ops, maxOps, ' ops');
}

function renderSearchComparisonChart(containerId, dataMap, maxVal, unit) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const colors = {
        'Linear Search': '#ff00e6', // cyber-pink
        'Binary Search': '#05ffa1'  // cyber-cyan
    };
    
    for (const [name, val] of Object.entries(dataMap)) {
        const heightPercent = maxVal > 0 ? (val / maxVal) * 85 : 0;
        
        const barCol = document.createElement('div');
        barCol.className = "flex flex-col items-center flex-grow h-full justify-end group relative text-center";
        
        barCol.innerHTML = `
            <div class="text-[8px] font-mono text-cyber-cyan mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ${val.toFixed(unit.includes('ms') ? 3 : 0)}${unit}
            </div>
            <div class="w-14 border border-cyber-purple/20 bg-surface-dark transition-all duration-300 hover:border-cyber-cyan relative" 
                 style="height: ${heightPercent}%; background-color: ${colors[name]}20; border-color: ${colors[name]}50; box-shadow: inset 0 2px 4px rgba(255,255,255,0.01)">
            </div>
            <div class="text-[8px] font-headline tracking-tighter mt-2 text-on-surface/50 truncate w-14 text-center">
                ${name.split(' ')[0]}
            </div>
        `;
        container.appendChild(barCol);
    }
}

function renderSearchBenchmarkTable(results) {
    const tbody = document.getElementById('benchmark-table-body');
    tbody.innerHTML = '';
    
    for (const [name, data] of Object.entries(results)) {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/2 transition-colors";
        tr.innerHTML = `
            <td class="py-3 text-on-surface font-headline font-bold">${name}</td>
            <td class="py-3 font-mono text-cyber-cyan">${data.time.toFixed(4)} ms</td>
            <td class="py-3 font-mono text-on-surface/75">${data.comparisons}</td>
            <td class="py-3 font-mono text-cyber-pink">${data.found_at >= 0 ? `idx_${data.found_at}` : 'Not found'}</td>
        `;
        tbody.appendChild(tr);
    }
}

function renderSearchRecommendation(results, size) {
    const recText = document.getElementById('recommendation-text');
    
    const lsOps = results['Linear Search'].comparisons;
    const bsOps = results['Binary Search'].comparisons;
    
    let report = `At array size N = ${size}, **Linear Search** required **${lsOps} comparisons** while **Binary Search** only required **${bsOps} comparisons**. `;
    
    report += `<br/><br/>This showcases the huge performance benefits of logarithmic time complexity O(log n) over linear complexity O(n). While Linear Search checks every node one-by-one, Binary Search halves the workspace at each step. `;
    report += `However, remember that Binary Search **requires the array to be sorted**. If the array is unsorted, the sorting step takes O(n log n), which is slower than a single Linear Search O(n) unless multiple searches are performed.`;
    
    recText.innerHTML = report;
}

// Hook tab changer globally
window.switchSearchTab = switchSearchTab;

// Start module initialization
initSearchVisualizer();
