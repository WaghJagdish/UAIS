// modules/strings.js

// ── String Algorithms Step Generators ────────────────────────────────────────

function runNaiveSearch(text, pattern, generateSteps = true) {
    let steps = [];
    let matches = [];
    let comparisons = 0;
    const n = text.length;
    const m = pattern.length;

    for (let i = 0; i <= n - m; i++) {
        let windowMatch = true;
        let j = 0;
        while (j < m) {
            comparisons++;
            const matchChar = text[i + j] === pattern[j];
            if (generateSteps) {
                steps.push({
                    text: text,
                    pattern: pattern,
                    windowStart: i,
                    charPos: j,
                    match: matchChar,
                    matches: [...matches],
                    description: `Naive slide window index ${i}: text[${i+j}]='${text[i+j]}' vs pattern[${j}]='${pattern[j]}' ${matchChar ? '✅ match' : '❌ mismatch'}`
                });
            }
            if (!matchChar) {
                windowMatch = false;
                break;
            }
            j++;
        }
        if (windowMatch) {
            matches.push(i);
            if (generateSteps) {
                steps.push({
                    text: text,
                    pattern: pattern,
                    windowStart: i,
                    charPos: m,
                    match: true,
                    matches: [...matches],
                    description: `🎉 Pattern match confirmed at index ${i}!`
                });
            }
        }
    }

    return { matches, steps, comparisons };
}

function runKMPSearch(text, pattern, generateSteps = true) {
    function computeLPS(pat) {
        let lps = Array(pat.length).fill(0);
        let len = 0;
        let i = 1;
        while (i < pat.length) {
            if (pat[i] === pat[len]) {
                len++;
                lps[i] = len;
                i++;
            } else {
                if (len !== 0) {
                    len = lps[len - 1];
                } else {
                    lps[i] = 0;
                    i++;
                }
            }
        }
        return lps;
    }

    let steps = [];
    let matches = [];
    let comparisons = 0;
    const n = text.length;
    const m = pattern.length;
    const lps = computeLPS(pattern);
    let i = 0;
    let j = 0;

    while (i < n) {
        comparisons++;
        const matchChar = text[i] === pattern[j];
        if (generateSteps) {
            steps.push({
                text: text,
                pattern: pattern,
                windowStart: i - j,
                charPos: j,
                match: matchChar,
                matches: [...matches],
                description: `KMP cursor i=${i}, j=${j}: text[${i}]='${text[i]}' vs pattern[${j}]='${pattern[j]}' ${matchChar ? '✅' : '❌ → skip using LPS'}`
            });
        }

        if (matchChar) {
            i++;
            j++;
        } else {
            if (j !== 0) {
                j = lps[j - 1];
            } else {
                i++;
            }
        }

        if (j === m) {
            matches.push(i - j);
            if (generateSteps) {
                steps.push({
                    text: text,
                    pattern: pattern,
                    windowStart: i - j,
                    charPos: m,
                    match: true,
                    matches: [...matches],
                    description: `🎉 Pattern match confirmed at index ${i - j}!`
                });
            }
            j = lps[j - 1];
        }
    }

    return { matches, steps, comparisons, lps };
}

function runRabinKarpSearch(text, pattern, base = 256, mod = 101, generateSteps = true) {
    let steps = [];
    let matches = [];
    let comparisons = 0;
    const n = text.length;
    const m = pattern.length;
    if (m > n) return { matches: [], steps: [], comparisons: 0 };

    // Calculate pow(base, m - 1, mod)
    let h = 1;
    for (let k = 0; k < m - 1; k++) {
        h = (h * base) % mod;
    }

    let pHash = 0;
    let tHash = 0;
    for (let k = 0; k < m; k++) {
        pHash = (base * pHash + pattern.charCodeAt(k)) % mod;
        tHash = (base * tHash + text.charCodeAt(k)) % mod;
    }

    for (let i = 0; i <= n - m; i++) {
        comparisons++;
        const hashMatch = (pHash === tHash);
        const actualMatch = hashMatch && text.substring(i, i + m) === pattern;
        
        if (generateSteps) {
            steps.push({
                text: text,
                pattern: pattern,
                windowStart: i,
                charPos: 0,
                match: actualMatch,
                matches: [...matches],
                description: `RK Window [${i}:${i+m}] ('${text.substring(i, i+m)}'): Hash(Text)=${tHash}, Hash(Pattern)=${pHash} → ${hashMatch ? 'Hash Match ✅' : 'Hash Miss ❌'}${hashMatch ? (actualMatch ? ' → String verified ✅' : ' → Spurious Collision ❌') : ''}`
            });
        }

        if (actualMatch) {
            matches.push(i);
        }

        if (i < n - m) {
            tHash = (base * (tHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % mod;
            if (tHash < 0) {
                tHash += mod;
            }
        }
    }

    return { matches, steps, comparisons };
}

function runBoyerMooreSearch(text, pattern, generateSteps = true) {
    function badCharTable(pat) {
        let table = {};
        for (let i = 0; i < pat.length; i++) {
            table[pat[i]] = i;
        }
        return table;
    }

    let steps = [];
    let matches = [];
    let comparisons = 0;
    const n = text.length;
    const m = pattern.length;
    if (m > n) return { matches: [], steps: [], comparisons: 0 };

    const bc = badCharTable(pattern);
    let s = 0;

    while (s <= n - m) {
        let j = m - 1;
        while (j >= 0 && pattern[j] === text[s + j]) {
            comparisons++;
            if (generateSteps) {
                steps.push({
                    text: text,
                    pattern: pattern,
                    windowStart: s,
                    charPos: j,
                    match: true,
                    matches: [...matches],
                    description: `Boyer-Moore matching right-to-left: text[${s+j}]='${text[s+j]}' == pattern[${j}]='${pattern[j]}' ✅`
                });
            }
            j--;
        }

        if (j < 0) {
            matches.push(s);
            if (generateSteps) {
                steps.push({
                    text: text,
                    pattern: pattern,
                    windowStart: s,
                    charPos: -1,
                    match: true,
                    matches: [...matches],
                    description: `🎉 Pattern match confirmed at index ${s}!`
                });
            }
            s += (s + m < n) ? (m - (bc[text[s + m]] !== undefined ? bc[text[s + m]] : -1)) : 1;
        } else {
            comparisons++;
            const charIdx = bc[text[s + j]] !== undefined ? bc[text[s + j]] : -1;
            const skip = Math.max(1, j - charIdx);
            if (generateSteps) {
                steps.push({
                    text: text,
                    pattern: pattern,
                    windowStart: s,
                    charPos: j,
                    match: false,
                    matches: [...matches],
                    description: `Mismatch at text[${s+j}]='${text[s+j]}' vs pattern[${j}]='${pattern[j]}' ❌ → skip ${skip} using bad-char rule`
                });
            }
            s += skip;
        }
    }

    return { matches, steps, comparisons, badChar: bc };
}

// ── State Management ─────────────────────────────────────────────────────────

let strSimulationData = null;
let strCurrentStepIndex = 0;
let strAutoPlayInterval = null;
let strSourceText = "";
let strPattern = "";

function initStringVisualizer() {
    document.getElementById('btn-run').addEventListener('click', () => {
        startStringSimulation();
    });

    document.getElementById('btn-prev').addEventListener('click', () => {
        strStepPrev();
    });
    
    document.getElementById('btn-next').addEventListener('click', () => {
        strStepNext();
    });
    
    document.getElementById('btn-play').addEventListener('click', () => {
        strTogglePlay();
    });

    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');
    speedSlider.addEventListener('input', (e) => {
        speedVal.textContent = e.target.value + 'ms';
        if (strAutoPlayInterval) {
            clearInterval(strAutoPlayInterval);
            startStrAutoPlayTimer();
        }
    });

    document.getElementById('btn-run-benchmark').addEventListener('click', () => {
        runStringBenchmark();
    });

    // Run default simulation on start
    startStringSimulation();
}

function startStringSimulation() {
    strStopAutoPlay();
    strDisablePlaybackButtons();

    strSourceText = document.getElementById('text-input').value.trim();
    strPattern = document.getElementById('pattern-input').value.trim();
    const algo = document.getElementById('algo-select').value;

    if (!strSourceText || !strPattern) {
        alert("Please specify both source text and search pattern.");
        return;
    }
    if (strPattern.length > strSourceText.length) {
        alert("Search pattern cannot be longer than source text.");
        return;
    }

    const algoMap = {
        'naive': runNaiveSearch,
        'rk': runRabinKarpSearch,
        'kmp': runKMPSearch,
        'bm': runBoyerMooreSearch
    };

    const titleMap = {
        'naive': 'NAIVE SEARCH',
        'rk': 'RABIN-KARP',
        'kmp': 'KMP failure function',
        'bm': 'BOYER-MOORE bad character'
    };

    document.getElementById('viz-algo-title').textContent = titleMap[algo].toUpperCase();

    strSimulationData = algoMap[algo](strSourceText, strPattern);
    strCurrentStepIndex = 0;

    // Render helper tables if KMP / BM
    renderHelperTable(algo, strSimulationData);

    strEnablePlaybackButtons();
    renderStringStep(0);
}

function renderHelperTable(algo, result) {
    const helperContainer = document.getElementById('algo-helper-table');
    helperContainer.innerHTML = '';
    
    if (algo === 'kmp' && result.lps) {
        helperContainer.classList.remove('hidden');
        helperContainer.innerHTML = `
            <h4 class="font-headline text-[10px] text-cyber-purple tracking-widest mb-3 uppercase">KMP Failure Function (LPS Table):</h4>
            <div class="flex gap-1.5 font-mono text-xs">
                ${result.lps.map((val, idx) => `
                    <div class="border border-cyber-purple/20 bg-onyx flex flex-col items-center w-10 p-1">
                        <span class="text-[8px] text-on-surface/40">pat[${idx}]</span>
                        <span class="text-cyber-cyan font-bold">${strPattern[idx]}</span>
                        <span class="text-[9px] text-cyber-purple mt-1 font-bold">${val}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (algo === 'bm' && result.badChar) {
        helperContainer.classList.remove('hidden');
        let html = `
            <h4 class="font-headline text-[10px] text-cyber-purple tracking-widest mb-3 uppercase">Bad Character Table (Last Index):</h4>
            <div class="flex flex-wrap gap-2 font-mono text-xs">
        `;
        for (const [char, lastIdx] of Object.entries(result.badChar)) {
            html += `
                <div class="border border-cyber-purple/20 bg-onyx flex items-center gap-3 px-3 py-1">
                    <span class="text-cyber-cyan font-bold">'${char}'</span>
                    <span class="text-on-surface/40">→</span>
                    <span class="text-cyber-purple font-bold">${lastIdx}</span>
                </div>
            `;
        }
        html += `</div>`;
        helperContainer.innerHTML = html;
    } else {
        helperContainer.classList.add('hidden');
    }
}

function renderStringStep(idx) {
    if (!strSimulationData || !strSimulationData.steps[idx]) return;
    const step = strSimulationData.steps[idx];

    // Render Text Row
    const textCellsContainer = document.getElementById('row-text-cells');
    textCellsContainer.innerHTML = '';

    const textLen = step.text.length;
    const patLen = step.pattern.length;

    // Check cells which match any verified completion index
    const isCompletedMatch = (textIdx) => {
        return step.matches.some(startIdx => textIdx >= startIdx && textIdx < startIdx + patLen);
    };

    for (let c = 0; c < textLen; c++) {
        const char = step.text[c];
        const cell = document.createElement('div');
        
        let borderClass = "border-cyber-purple/20 bg-surface-dark/60";
        let textClass = "text-on-surface/80";

        // Current active index in the window check
        const inCurrentWindow = c >= step.windowStart && c < step.windowStart + patLen;
        const currentPosInPat = c - step.windowStart;

        if (inCurrentWindow) {
            // Check if matches the active cursor
            if (currentPosInPat === step.charPos) {
                borderClass = step.match ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.3)] scale-105" : "border-cyber-pink bg-cyber-pink/10 shadow-[0_0_8px_rgba(255,0,230,0.3)] scale-105";
                textClass = step.match ? "text-emerald-400 font-bold" : "text-cyber-pink font-bold";
            } else if (currentPosInPat < step.charPos) {
                // Past matches inside current window
                borderClass = "border-emerald-500/50 bg-emerald-500/5";
                textClass = "text-emerald-500";
            } else {
                borderClass = "border-cyber-purple/50 bg-surface-dark/90";
            }
        } else if (isCompletedMatch(c)) {
            borderClass = "border-cyber-cyan/30 bg-cyber-cyan/5";
            textClass = "text-cyber-cyan";
        }

        cell.className = `w-8 h-8 flex flex-col justify-center items-center border font-headline text-xs rounded transition-all duration-200 ${borderClass} ${textClass}`;
        cell.innerHTML = `
            <span class="text-[6px] font-mono text-on-surface/30 mb-0.5">${c}</span>
            <span>${char}</span>
        `;
        textCellsContainer.appendChild(cell);
    }

    // Render Sliding Pattern Row
    const patCellsContainer = document.getElementById('row-pattern-cells');
    patCellsContainer.innerHTML = '';
    
    // Shift/slide the pattern container to visually align under the text index
    const cellWidth = 32; // w-8 is 32px
    const cellGap = 6;    // gap-1.5 is 6px
    const offset = step.windowStart * (cellWidth + cellGap);
    patCellsContainer.style.marginLeft = `${offset}px`;

    for (let c = 0; c < patLen; c++) {
        const char = step.pattern[c];
        const cell = document.createElement('div');
        
        let borderClass = "border-cyber-purple/20 bg-surface-dark/60";
        let textClass = "text-on-surface/50";

        if (c === step.charPos) {
            borderClass = step.match ? "border-emerald-500 bg-emerald-500/10 scale-105" : "border-cyber-pink bg-cyber-pink/10 scale-105";
            textClass = step.match ? "text-emerald-400 font-bold" : "text-cyber-pink font-bold";
        } else if (c < step.charPos) {
            borderClass = "border-emerald-500/40 bg-emerald-500/5";
            textClass = "text-emerald-500";
        }

        cell.className = `w-8 h-8 flex flex-col justify-center items-center border font-headline text-xs rounded transition-all duration-200 ${borderClass} ${textClass}`;
        cell.innerHTML = `
            <span class="text-[6px] font-mono text-on-surface/30 mb-0.5">${c}</span>
            <span>${char}</span>
        `;
        patCellsContainer.appendChild(cell);
    }

    // Update labels
    document.getElementById('stat-steps').textContent = `${idx + 1}/${strSimulationData.steps.length}`;
    document.getElementById('stat-compare').textContent = strSimulationData.comparisons;
    document.getElementById('stat-matches').textContent = step.matches.length;
    document.getElementById('viz-description').textContent = step.description;

    // Button states
    document.getElementById('btn-prev').disabled = (idx === 0);
    document.getElementById('btn-next').disabled = (idx === strSimulationData.steps.length - 1);
}

function strStepPrev() {
    if (strCurrentStepIndex > 0) {
        strCurrentStepIndex--;
        renderStringStep(strCurrentStepIndex);
    }
}

function strStepNext() {
    if (strSimulationData && strCurrentStepIndex < strSimulationData.steps.length - 1) {
        strCurrentStepIndex++;
        renderStringStep(strCurrentStepIndex);
    } else {
        strStopAutoPlay();
    }
}

function strTogglePlay() {
    if (strAutoPlayInterval) {
        strStopAutoPlay();
    } else {
        strStartAutoPlay();
    }
}

function strStartAutoPlay() {
    const playBtn = document.getElementById('btn-play');
    const playIcon = document.getElementById('play-icon');
    const playText = document.getElementById('play-text');
    
    playBtn.classList.remove('cyber-btn-purple');
    playBtn.classList.add('cyber-btn');
    playBtn.style.color = '#ff00e6';
    playBtn.style.borderColor = 'rgba(255,0,230,0.3)';
    playIcon.textContent = 'pause';
    playText.textContent = 'PAUSE';

    startStrAutoPlayTimer();
}

function startStrAutoPlayTimer() {
    const delay = parseInt(document.getElementById('speed-slider').value);
    strAutoPlayInterval = setInterval(() => {
        strStepNext();
    }, delay);
}

function strStopAutoPlay() {
    if (strAutoPlayInterval) {
        clearInterval(strAutoPlayInterval);
        strAutoPlayInterval = null;
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

function strEnablePlaybackButtons() {
    document.getElementById('btn-prev').disabled = false;
    document.getElementById('btn-play').disabled = false;
    document.getElementById('btn-next').disabled = false;
}

function strDisablePlaybackButtons() {
    document.getElementById('btn-prev').disabled = true;
    document.getElementById('btn-play').disabled = true;
    document.getElementById('btn-next').disabled = true;
}

// ── Tab Navigation ───────────────────────────────────────────────────────────

function switchStringTab(tabName) {
    strStopAutoPlay();
    
    const tabs = ['visualize', 'compare', 'complexity'];
    tabs.forEach(t => {
        const div = document.getElementById(`string-tab-${t}`);
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

function runStringBenchmark() {
    const text = document.getElementById('comp-text').value;
    const pattern = document.getElementById('comp-pattern').value;

    if (!text || !pattern) {
        alert("Please provide both large text and search pattern.");
        return;
    }
    if (pattern.length > text.length) {
        alert("Pattern is longer than text.");
        return;
    }

    const results = {};
    const algos = {
        'Naive Search': (t, p) => runNaiveSearch(t, p, false),
        'Rabin-Karp': (t, p) => runRabinKarpSearch(t, p, 256, 101, false),
        'KMP': (t, p) => runKMPSearch(t, p, false),
        'Boyer-Moore': (t, p) => runBoyerMooreSearch(t, p, false)
    };

    for (const [name, fn] of Object.entries(algos)) {
        // Run once to get comparisons and matches count
        const outcome = fn(text, pattern);
        
        // Run 1000 times to get a stable average time
        const iterations = 1000;
        const t0 = performance.now();
        for (let k = 0; k < iterations; k++) {
            fn(text, pattern);
        }
        const t1 = performance.now();
        
        results[name] = {
            time: (t1 - t0) / iterations,
            comparisons: outcome.comparisons,
            matches: outcome.matches.length
        };
    }

    renderStringBenchmarkCharts(results);
    renderStringBenchmarkTable(results);
    
    document.getElementById('benchmark-results-container').classList.remove('hidden');
}

function renderStringBenchmarkCharts(results) {
    const times = {};
    const ops = {};
    
    for (const [name, data] of Object.entries(results)) {
        times[name] = data.time;
        ops[name] = data.comparisons;
    }
    
    const maxTime = Math.max(...Object.values(times), 0.001);
    const maxOps = Math.max(...Object.values(ops), 1);
    
    renderStringComparisonChart('chart-time-container', times, maxTime, 'ms');
    renderStringComparisonChart('chart-ops-container', ops, maxOps, ' ops');
}

function renderStringComparisonChart(containerId, dataMap, maxVal, unit) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const colors = {
        'Naive Search': '#ff00e6',
        'Rabin-Karp': '#bc13fe',
        'KMP': '#bc13fe',
        'Boyer-Moore': '#05ffa1'
    };
    
    for (const [name, val] of Object.entries(dataMap)) {
        const heightPercent = maxVal > 0 ? (val / maxVal) * 85 : 0;
        
        const barCol = document.createElement('div');
        barCol.className = "flex flex-col items-center flex-grow h-full justify-end group relative text-center";
        
        barCol.innerHTML = `
            <div class="text-[8px] font-mono text-cyber-cyan mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ${val.toFixed(unit.includes('ms') ? 3 : 0)}${unit}
            </div>
            <div class="w-12 border border-cyber-purple/20 bg-surface-dark transition-all duration-300 hover:border-cyber-cyan relative" 
                 style="height: ${heightPercent}%; background-color: ${colors[name]}20; border-color: ${colors[name]}50;">
            </div>
            <div class="text-[8px] font-headline tracking-tighter mt-2 text-on-surface/50 truncate w-14 text-center">
                ${name.split(' ')[0]}
            </div>
        `;
        container.appendChild(barCol);
    }
}

function renderStringBenchmarkTable(results) {
    const tbody = document.getElementById('benchmark-table-body');
    tbody.innerHTML = '';
    
    for (const [name, data] of Object.entries(results)) {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/2 transition-colors";
        tr.innerHTML = `
            <td class="py-3 text-on-surface font-headline font-bold">${name}</td>
            <td class="py-3 font-mono text-cyber-cyan">${data.time.toFixed(4)} ms</td>
            <td class="py-3 font-mono text-on-surface/75">${data.comparisons}</td>
            <td class="py-3 font-mono text-cyber-pink">${data.matches} matches</td>
        `;
        tbody.appendChild(tr);
    }
}

// Hook tab changer globally
window.switchStringTab = switchStringTab;

// Start module initialization
initStringVisualizer();
