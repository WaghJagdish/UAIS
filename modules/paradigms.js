// modules/paradigms.js

// ── 0/1 Knapsack Algorithms ──────────────────────────────────────────────────

function solveKnapsackDP(weights, values, capacity) {
    const n = weights.length;
    // dp[i][w]
    const dp = Array.from({length: n + 1}, () => Array(capacity + 1).fill(0));
    const steps = [];

    for (let i = 1; i <= n; i++) {
        for (let w = 0; w <= capacity; w++) {
            if (weights[i - 1] <= w) {
                dp[i][w] = Math.max(
                    dp[i - 1][w],
                    values[i - 1] + dp[i - 1][w - weights[i - 1]]
                );
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
        steps.push({
            item: i,
            description: `Processed Item ${i} (val=${values[i-1]}, wt=${weights[i-1]}): Evaluated max profits for all capacities.`
        });
    }

    // Traceback
    const selected = [];
    let w = capacity;
    for (let i = n; i > 0; i--) {
        if (dp[i][w] !== dp[i - 1][w]) {
            selected.push(i - 1);
            w -= weights[i - 1];
        }
    }
    selected.reverse();

    return {
        maxValue: dp[n][capacity],
        selectedItems: selected,
        dpTable: dp,
        steps: steps
    };
}

function solveKnapsackGreedy(weights, values, capacity) {
    const n = weights.length;
    const items = Array.from({length: n}, (_, i) => ({
        index: i,
        ratio: values[i] / weights[i],
        val: values[i],
        wt: weights[i]
    }));

    // Sort by value/weight ratio descending
    items.sort((x, y) => y.ratio - x.ratio);

    let totalVal = 0;
    let totalWt = 0;
    const selected = [];
    const steps = [];

    for (let k = 0; k < n; k++) {
        const item = items[k];
        if (totalWt + item.wt <= capacity) {
            totalWt += item.wt;
            totalVal += item.val;
            selected.push(item.index);
            steps.push({
                item: item.index + 1,
                action: "added",
                totalWeight: totalWt,
                totalValue: totalVal,
                description: `Added Item ${item.index + 1} (val=${item.val}, wt=${item.wt}, ratio=${item.ratio.toFixed(2)})`
            });
        } else {
            steps.push({
                item: item.index + 1,
                action: "skipped",
                totalWeight: totalWt,
                totalValue: totalVal,
                description: `Skipped Item ${item.index + 1} (wt=${item.wt} exceeds remaining space of ${capacity - totalWt})`
            });
        }
    }

    return {
        maxValue: totalVal,
        selectedItems: selected.sort((x, y) => x - y),
        steps: steps
    };
}

function solveKnapsackBranchBound(weights, values, capacity) {
    const n = weights.length;
    // Sort items by value/weight ratio descending
    const items = Array.from({length: n}, (_, i) => ({
        index: i,
        ratio: values[i] / weights[i],
        val: values[i],
        wt: weights[i]
    })).sort((x, y) => y.ratio - x.ratio);

    let bestVal = 0;
    let bestSel = [];
    let nodesExplored = 0;
    const steps = [];

    // Calculate upper bound using fractional relaxation
    function upperBound(idx, curW, curV) {
        let ub = curV;
        let w = curW;
        for (let k = idx; k < n; k++) {
            const item = items[k];
            if (w + item.wt <= capacity) {
                w += item.wt;
                ub += item.val;
            } else {
                ub += (capacity - w) * item.ratio;
                break;
            }
        }
        return ub;
    }

    function bnb(idx, curW, curV, sel) {
        nodesExplored++;
        if (curW > capacity) return;
        
        if (idx === n || upperBound(idx, curW, curV) <= bestVal) {
            if (curV > bestVal) {
                bestVal = curV;
                bestSel = [...sel];
            }
            return;
        }

        const item = items[idx];

        // 1. Include item branch
        sel.push(item.index);
        steps.push({
            node: nodesExplored,
            item: item.index + 1,
            action: "include",
            curVal: curV + item.val,
            curWeight: curW + item.wt,
            description: `Node ${nodesExplored} (Include Item ${item.index + 1}): val=${curV + item.val}, wt=${curW + item.wt}, bound=${upperBound(idx + 1, curW + item.wt, curV + item.val).toFixed(2)}`
        });
        bnb(idx + 1, curW + item.wt, curV + item.val, sel);
        sel.pop();

        // 2. Exclude item branch
        steps.push({
            node: nodesExplored,
            item: item.index + 1,
            action: "exclude",
            curVal: curV,
            curWeight: curW,
            description: `Node ${nodesExplored} (Exclude Item ${item.index + 1}): val=${curV}, wt=${curW}, bound=${upperBound(idx + 1, curW, curV).toFixed(2)}`
        });
        bnb(idx + 1, curW, curV, sel);
    }

    bnb(0, 0, 0, []);

    return {
        maxValue: bestVal,
        selectedItems: bestSel.sort((x, y) => x - y),
        nodesExplored: nodesExplored,
        steps: steps.slice(0, 50) // limit for display
    };
}

// ── Travelling Salesman Problem (TSP) Algorithms ─────────────────────────────

function solveTspDP(distMatrix, nodeNames) {
    const n = distMatrix.length;
    if (n === 0) return { minCost: 0, path: [], steps: [] };

    const FULL = (1 << n) - 1;
    const dp = Array.from({length: 1 << n}, () => Array(n).fill(Infinity));
    const parent = Array.from({length: 1 << n}, () => Array(n).fill(-1));
    dp[1][0] = 0;
    const steps = [];

    for (let mask = 1; mask < (1 << n); mask++) {
        if (!(mask & 1)) continue; // must include source city 0
        for (let u = 0; u < n; u++) {
            if (!(mask & (1 << u))) continue;
            if (dp[mask][u] === Infinity) continue;
            
            for (let v = 0; v < n; v++) {
                if (mask & (1 << v)) continue; // already visited
                
                const newMask = mask | (1 << v);
                const newCost = dp[mask][u] + distMatrix[u][v];
                if (newCost < dp[newMask][v]) {
                    dp[newMask][v] = newCost;
                    parent[newMask][v] = u;
                    steps.push({
                        from: u,
                        to: v,
                        cost: newCost,
                        description: `DP transition: ${nodeNames[u]} → ${nodeNames[v]} | Mask: ${newMask.toString(2)} | Cost: ${newCost}`
                    });
                }
            }
        }
    }

    // Find best ending city returning to 0
    let minCost = Infinity;
    let last = -1;
    for (let u = 1; u < n; u++) {
        const cost = dp[FULL][u] + distMatrix[u][0];
        if (cost < minCost) {
            minCost = cost;
            last = u;
        }
    }

    // Reconstruct path
    const path = [];
    if (last !== -1) {
        let mask = FULL;
        let cur = last;
        while (cur !== -1) {
            path.push(cur);
            const prev = parent[mask][cur];
            mask ^= (1 << cur);
            cur = prev;
        }
        path.push(0);
        path.reverse();
    } else if (n > 1) {
        // Fallback path
        path.push(...Array.from({length: n}, (_, i) => i), 0);
    } else {
        path.push(0);
    }

    const pathNamed = path.map(i => nodeNames[i]);

    return {
        minCost: minCost !== Infinity ? minCost : null,
        path: pathNamed,
        rawPath: path,
        steps: steps.slice(0, 60)
    };
}

function solveTspBranchBound(distMatrix, nodeNames) {
    const n = distMatrix.length;
    if (n === 0) return { minCost: 0, path: [], steps: [], nodesExplored: 0 };

    let bestCost = Infinity;
    let bestPath = [];
    let nodesExplored = 0;
    const steps = [];

    function bnb(path, visited, curCost) {
        nodesExplored++;
        const u = path[path.length - 1];
        
        if (path.length === n) {
            const total = curCost + distMatrix[u][0];
            steps.push({
                path: [...path, 0],
                cost: total,
                description: `Tour Complete: ${path.map(i => nodeNames[i]).join('→')}→${nodeNames[0]} | Cost: ${total}`
            });
            if (total < bestCost) {
                bestCost = total;
                bestPath = [...path, 0];
            }
            return;
        }

        for (let v = 0; v < n; v++) {
            if (!visited[v]) {
                const newCost = curCost + distMatrix[u][v];
                // Pruning bounds check
                if (newCost < bestCost) {
                    visited[v] = true;
                    path.push(v);
                    steps.push({
                        path: [...path],
                        cost: newCost,
                        description: `Explored path branch: ${path.map(i => nodeNames[i]).join('→')} | Cost: ${newCost}`
                    });
                    bnb(path, visited, newCost);
                    path.pop();
                    visited[v] = false;
                } else {
                    steps.push({
                        path: [...path, v],
                        cost: newCost,
                        description: `Pruned path branch: ${path.map(i => nodeNames[i]).join('→')}→${nodeNames[v]} (Cost ${newCost} >= bestCost ${bestCost})`
                    });
                }
            }
        }
    }

    const visited = Array(n).fill(false);
    visited[0] = true;
    bnb([0], visited, 0);

    const pathNamed = bestPath.map(i => nodeNames[i]);

    return {
        minCost: bestCost !== Infinity ? bestCost : null,
        path: pathNamed,
        rawPath: bestPath,
        nodesExplored: nodesExplored,
        steps: steps.slice(0, 60)
    };
}

// ── UI Integration & Event Hookups ──────────────────────────────────────────

let activeProblem = 'knapsack';

function initParadigmsModule() {
    // Knapsack slider values hooks
    const ksCapacityInput = document.getElementById('ks-capacity');
    const ksCapacityVal = document.getElementById('ks-cap-val');
    ksCapacityInput.addEventListener('input', (e) => {
        ksCapacityVal.textContent = e.target.value;
    });

    const ksItemsInput = document.getElementById('ks-items-count');
    const ksItemsVal = document.getElementById('ks-items-val');
    ksItemsInput.addEventListener('input', (e) => {
        ksItemsVal.textContent = e.target.value;
        renderKnapsackItemsGrid(parseInt(e.target.value));
    });

    document.getElementById('btn-ks-solve').addEventListener('click', () => {
        runKnapsackSimulation();
    });

    // TSP cities count slider hooks
    const tspCitiesInput = document.getElementById('tsp-cities-count');
    const tspCitiesVal = document.getElementById('tsp-cities-val');
    tspCitiesInput.addEventListener('input', (e) => {
        tspCitiesVal.textContent = e.target.value;
        renderTSPMatrixInputGrid(parseInt(e.target.value));
    });

    document.getElementById('btn-tsp-solve').addEventListener('click', () => {
        runTspSimulation();
    });

    // Draw initial grids
    renderKnapsackItemsGrid(5);
    renderTSPMatrixInputGrid(4);
    
    // Set default TSP distance matrix values
    setTimeout(generateDefaultTSPMatrix, 50);
}

// Switch between Knapsack and TSP panels
function switchProblemSpace(val) {
    activeProblem = val;
    const panelKs = document.getElementById('panel-knapsack');
    const panelTsp = document.getElementById('panel-tsp');
    
    if (val === 'knapsack') {
        panelKs.classList.remove('hidden');
        panelTsp.classList.add('hidden');
    } else {
        panelKs.classList.add('hidden');
        panelTsp.classList.remove('hidden');
    }
}

// ── Knapsack UI Sub-logic ────────────────────────────────────────────────────

const DEFAULT_VALS = [10, 40, 30, 50, 35, 25, 15, 45, 20, 60];
const DEFAULT_WTS = [5, 4, 6, 3, 7, 8, 2, 9, 4, 6];

function renderKnapsackItemsGrid(count) {
    const grid = document.getElementById('ks-items-grid');
    grid.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const val = DEFAULT_VALS[i % DEFAULT_VALS.length];
        const wt = DEFAULT_WTS[i % DEFAULT_WTS.length];
        
        const card = document.createElement('div');
        card.className = "col-span-2 border border-cyber-purple/20 bg-onyx/60 p-2 space-y-2 relative rounded";
        card.innerHTML = `
            <div class="text-[8px] font-mono text-cyber-cyan absolute top-1 right-2">#${i+1}</div>
            <div class="grid grid-cols-2 gap-2 text-[9px]">
                <div class="space-y-1">
                    <span class="text-on-surface/40 uppercase block font-mono">Val</span>
                    <input type="number" id="ks-val-${i}" value="${val}" min="1" max="500" class="cyber-input w-full p-1 text-[10px]">
                </div>
                <div class="space-y-1">
                    <span class="text-on-surface/40 uppercase block font-mono">Wt</span>
                    <input type="number" id="ks-wt-${i}" value="${wt}" min="1" max="100" class="cyber-input w-full p-1 text-[10px]">
                </div>
            </div>
        `;
        grid.appendChild(card);
    }
}

function runKnapsackSimulation() {
    const capacity = parseInt(document.getElementById('ks-capacity').value);
    const count = parseInt(document.getElementById('ks-items-count').value);
    
    const values = [];
    const weights = [];
    for (let i = 0; i < count; i++) {
        values.push(parseInt(document.getElementById(`ks-val-${i}`).value) || 1);
        weights.push(parseInt(document.getElementById(`ks-wt-${i}`).value) || 1);
    }

    // Run algorithms and measure elapsed time
    const t0 = performance.now();
    const dpRes = solveKnapsackDP(weights, values, capacity);
    const t1 = performance.now();
    const dpTime = t1 - t0;

    const t2 = performance.now();
    const greedyRes = solveKnapsackGreedy(weights, values, capacity);
    const t3 = performance.now();
    const greedyTime = t3 - t2;

    const t4 = performance.now();
    const bbRes = solveKnapsackBranchBound(weights, values, capacity);
    const t5 = performance.now();
    const bbTime = t5 - t4;

    // 1. Update metric numbers
    document.getElementById('ks-metric-dp').textContent = dpRes.maxValue;
    document.getElementById('ks-time-dp').textContent = `${dpTime.toFixed(3)}ms`;

    document.getElementById('ks-metric-greedy').textContent = greedyRes.maxValue;
    document.getElementById('ks-time-greedy').textContent = `${greedyTime.toFixed(3)}ms`;

    document.getElementById('ks-metric-bb').textContent = bbRes.maxValue;
    document.getElementById('ks-time-bb').textContent = `${bbTime.toFixed(3)}ms`;

    // 2. Render Results Table
    const tbody = document.getElementById('ks-results-table-body');
    tbody.innerHTML = '';

    const rows = [
        { name: "DP (Optimal)", val: dpRes.maxValue, items: dpRes.selectedItems.map(i => i + 1).join(', '), optimal: "Yes", time: dpTime },
        { name: "Greedy (Approx)", val: greedyRes.maxValue, items: greedyRes.selectedItems.map(i => i + 1).join(', '), optimal: "Approximate", time: greedyTime },
        { name: "Branch & Bound", val: bbRes.maxValue, items: bbRes.selectedItems.map(i => i + 1).join(', '), optimal: "Yes", time: bbTime }
    ];

    rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/2 transition-colors";
        tr.innerHTML = `
            <td class="py-3 text-on-surface font-headline font-bold">${r.name}</td>
            <td class="py-3 font-mono text-cyber-cyan">${r.val}</td>
            <td class="py-3 font-mono text-on-surface/75">[${r.items}]</td>
            <td class="py-3 font-mono text-on-surface/50">${r.optimal}</td>
            <td class="py-3 font-mono text-cyber-purple">${r.time.toFixed(4)} ms</td>
        `;
        tbody.appendChild(tr);
    });

    // 3. Render Runtime comparison bar chart
    renderKsBarChart({
        "DP": dpTime,
        "Greedy": greedyTime,
        "B&B": bbTime
    });

    // 4. Update Gap Warning Box
    const gapBox = document.getElementById('ks-gap-box');
    const gapVal = dpRes.maxValue - greedyRes.maxValue;
    
    gapBox.classList.remove('hidden');
    if (gapVal > 0) {
        gapBox.className = "hud-border bg-surface-dark/80 p-6 border-l-4 border-l-cyber-pink text-xs font-mono text-on-surface/80";
        gapBox.innerHTML = `
            <div class="flex items-center gap-3 mb-1 text-cyber-pink font-headline font-bold text-[11px] uppercase">
                <span class="material-symbols-outlined text-sm">warning</span> APPROXIMATION_GAP_DETECTED
            </div>
            The greedy fractional knapsack approximation yielded a suboptimal profit. The gap is **${gapVal} units** (${((gapVal/dpRes.maxValue)*100).toFixed(1)}% below the optimal profit of ${dpRes.maxValue}).
        `;
    } else {
        gapBox.className = "hud-border bg-surface-dark/80 p-6 border-l-4 border-l-cyber-cyan text-xs font-mono text-on-surface/80";
        gapBox.innerHTML = `
            <div class="flex items-center gap-3 mb-1 text-cyber-cyan font-headline font-bold text-[11px] uppercase">
                <span class="material-symbols-outlined text-sm">check_circle</span> OPTIMAL_GREEDY_BOUND
            </div>
            Success! The greedy heuristic successfully solved this instance optimally. Both approximation and mathematical models converged at ${dpRes.maxValue} units.
        `;
    }

    // 5. Render DP Table Grid
    renderDpTableGrid(dpRes.dpTable, weights);

    // 6. Render Steps Log
    const stepsLog = document.getElementById('ks-steps-log');
    stepsLog.innerHTML = '';
    
    // Add DP steps
    const header = document.createElement('h5');
    header.className = "font-headline text-xs text-cyber-cyan mt-2 mb-2 uppercase";
    header.textContent = "DP Table Matrix Construction Steps:";
    stepsLog.appendChild(header);

    dpRes.steps.forEach((s, idx) => {
        const item = document.createElement('div');
        item.className = "py-1 border-b border-white/2 text-on-surface/70";
        item.textContent = `[Step ${idx+1}] ${s.description}`;
        stepsLog.appendChild(item);
    });

    const headerBnB = document.createElement('h5');
    headerBnB.className = "font-headline text-xs text-cyber-pink mt-6 mb-2 uppercase";
    headerBnB.textContent = "Branch & Bound Search Tree Steps:";
    stepsLog.appendChild(headerBnB);

    bbRes.steps.forEach((s, idx) => {
        const item = document.createElement('div');
        item.className = "py-1 border-b border-white/2 text-on-surface/70";
        item.textContent = `[Node ${s.node}] ${s.description}`;
        stepsLog.appendChild(item);
    });
}

function renderKsBarChart(data) {
    const container = document.getElementById('ks-chart-container');
    container.innerHTML = '';
    
    const maxVal = Math.max(...Object.values(data), 0.001);
    
    const colors = {
        'DP': '#05ffa1',
        'Greedy': '#ff00e6',
        'B&B': '#bc13fe'
    };

    for (const [name, val] of Object.entries(data)) {
        const heightPercent = (val / maxVal) * 80;
        
        const col = document.createElement('div');
        col.className = "flex flex-col items-center flex-grow h-full justify-end group relative text-center";
        
        col.innerHTML = `
            <div class="text-[8px] font-mono text-cyber-cyan mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ${val.toFixed(4)}ms
            </div>
            <div class="w-16 border border-cyber-purple/20 bg-surface-dark transition-all duration-300 hover:border-cyber-cyan relative" 
                 style="height: ${heightPercent}%; background-color: ${colors[name]}20; border-color: ${colors[name]}50;">
            </div>
            <div class="text-[9px] font-headline tracking-widest mt-2 text-on-surface/50 uppercase">
                ${name}
            </div>
        `;
        container.appendChild(col);
    }
}

function renderDpTableGrid(table, weights) {
    const wrapper = document.getElementById('ks-dp-grid-wrapper');
    wrapper.innerHTML = '';

    const rowsCount = table.length; // N + 1
    const colsCount = table[0].length; // W + 1

    const tableElement = document.createElement('table');
    tableElement.className = "border border-cyber-purple/10 text-center font-mono text-[9px] divide-y divide-white/5 border-collapse w-full";

    // Header row (capacities)
    const thead = document.createElement('thead');
    const headerTr = document.createElement('tr');
    headerTr.className = "bg-surface-dark/80 text-cyber-purple border-b border-cyber-purple/20";
    headerTr.innerHTML = `<th class="p-2 border-r border-cyber-purple/20 font-headline text-[8px] tracking-wider uppercase">Item / Cap</th>`;
    for (let w = 0; w < colsCount; w++) {
        headerTr.innerHTML += `<th class="p-2 font-bold">${w}</th>`;
    }
    thead.appendChild(headerTr);
    tableElement.appendChild(thead);

    // Body rows
    const tbody = document.createElement('tbody');
    for (let i = 0; i < rowsCount; i++) {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/2 transition-colors border-b border-white/5";
        
        // Row header
        const rowTitle = i === 0 ? "Initial (0)" : `Item ${i} (wt:${weights[i-1]})`;
        let innerHTML = `<td class="p-2 border-r border-cyber-purple/20 text-on-surface/50 text-[8px] font-headline text-left font-bold truncate max-w-[80px]">${rowTitle}</td>`;
        
        for (let w = 0; w < colsCount; w++) {
            const val = table[i][w];
            // highlight cells with values
            const highlightClass = val > 0 ? "text-cyber-cyan font-bold" : "text-on-surface/30";
            innerHTML += `<td class="p-2 border-r border-white/5 ${highlightClass}" title="dp[item:${i}][cap:${w}] = ${val}">${val}</td>`;
        }
        tr.innerHTML = innerHTML;
        tbody.appendChild(tr);
    }
    tableElement.appendChild(tbody);
    wrapper.appendChild(tableElement);
}

function switchKsTab(tabName) {
    const tabs = ['results', 'dptable', 'steps'];
    tabs.forEach(t => {
        const div = document.getElementById(`ks-tab-${t}`);
        const btn = document.getElementById(`ks-tab-btn-${t}`);
        if (t === tabName) {
            div.classList.remove('hidden');
            btn.className = "py-2 px-6 font-headline text-xs tracking-wider border border-cyber-cyan bg-cyber-purple/10 text-cyber-cyan glow-text-cyan hover:border-cyber-cyan transition-all";
        } else {
            div.classList.add('hidden');
            btn.className = "py-2 px-6 font-headline text-xs tracking-wider border border-transparent text-on-surface/60 hover:text-on-surface hover:border-cyber-purple/40 transition-all";
        }
    });
}

// ── Travelling Salesman (TSP) UI Sub-logic ───────────────────────────────────

const TSP_DEFAULT_NAMES = ["A", "B", "C", "D", "E", "F", "G"];
const TSP_DEFAULT_MATRIX = [
    [0,  10, 15, 20, 25, 30, 35],
    [10,  0, 35, 25, 20, 15, 30],
    [15, 35,  0, 30, 45, 10, 20],
    [20, 25, 30,  0, 12, 22, 18],
    [25, 20, 45, 12,  0, 28, 40],
    [30, 15, 10, 22, 28,  0, 15],
    [35, 30, 20, 18, 40, 15,  0]
];

function renderTSPMatrixInputGrid(count) {
    const grid = document.getElementById('tsp-matrix-grid');
    grid.innerHTML = '';
    
    // Set grid template columns dynamically
    grid.style.gridTemplateColumns = `repeat(${count + 1}, minmax(40px, 1fr))`;

    // Top-Left corner label
    const tlCorner = document.createElement('div');
    tlCorner.className = "text-center text-[9px] font-headline text-cyber-purple font-bold p-1 uppercase border-b border-r border-cyber-purple/20";
    tlCorner.textContent = "From\\To";
    grid.appendChild(tlCorner);

    // Columns headers
    for (let c = 0; c < count; c++) {
        const th = document.createElement('div');
        th.className = "text-center text-[10px] font-headline text-cyber-cyan font-bold p-1 border-b border-cyber-purple/20";
        th.textContent = TSP_DEFAULT_NAMES[c];
        grid.appendChild(th);
    }

    // Rows with cells
    for (let r = 0; r < count; r++) {
        // Row label
        const rh = document.createElement('div');
        rh.className = "text-left text-[10px] font-headline text-cyber-cyan font-bold p-1 flex items-center border-r border-cyber-purple/20";
        rh.textContent = TSP_DEFAULT_NAMES[r];
        grid.appendChild(rh);

        for (let c = 0; c < count; c++) {
            const cell = document.createElement('div');
            
            if (r === c) {
                // Diagonal cells are distance 0 (self loop)
                cell.className = "text-center text-[10px] text-on-surface/20 font-bold p-1 bg-white/2 flex items-center justify-center rounded border border-transparent";
                cell.innerHTML = `<span id="tsp-dist-${r}-${c}">0</span>`;
            } else {
                const dist = TSP_DEFAULT_MATRIX[r][c];
                cell.innerHTML = `
                    <input type="number" id="tsp-dist-${r}-${c}" value="${dist}" min="1" max="1000" class="cyber-input w-full p-1 text-[10px] text-center">
                `;
            }
            grid.appendChild(cell);
        }
    }
}

function generateDefaultTSPMatrix() {
    const count = parseInt(document.getElementById('tsp-cities-count').value);
    for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
            if (r !== c) {
                const inputEl = document.getElementById(`tsp-dist-${r}-${c}`);
                if (inputEl) {
                    // Populate from TSP_DEFAULT_MATRIX symmetrical index
                    inputEl.value = TSP_DEFAULT_MATRIX[r][c];
                }
            }
        }
    }
}

function runTspSimulation() {
    const count = parseInt(document.getElementById('tsp-cities-count').value);
    
    // Parse matrix
    const distMatrix = Array.from({length: count}, () => Array(count).fill(0));
    for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
            if (r === c) {
                distMatrix[r][c] = 0;
            } else {
                const val = parseFloat(document.getElementById(`tsp-dist-${r}-${c}`).value);
                if (isNaN(val) || val < 0) {
                    alert("All distance values must be positive integers.");
                    return;
                }
                distMatrix[r][c] = val;
            }
        }
    }

    const cityNames = TSP_DEFAULT_NAMES.slice(0, count);

    // Solve DP Held-Karp
    const t0 = performance.now();
    const dpRes = solveTspDP(distMatrix, cityNames);
    const t1 = performance.now();
    const dpTime = t1 - t0;

    // Solve B&B
    const t2 = performance.now();
    const bbRes = solveTspBranchBound(distMatrix, cityNames);
    const t3 = performance.now();
    const bbTime = t3 - t2;

    // 1. Update Metrics
    document.getElementById('tsp-metric-dp-cost').textContent = dpRes.minCost !== null ? dpRes.minCost : '∞';
    document.getElementById('tsp-path-dp').textContent = `Optimal route: [${dpRes.path.join(' → ')}]`;

    document.getElementById('tsp-metric-bb-cost').textContent = bbRes.minCost !== null ? bbRes.minCost : '∞';
    document.getElementById('tsp-path-bb').textContent = `Search tree nodes explored: ${bbRes.nodesExplored}`;

    // 2. Populate Results Table
    const tbody = document.getElementById('tsp-results-table-body');
    tbody.innerHTML = '';
    
    const rows = [
        { name: "DP (Held-Karp)", cost: dpRes.minCost, tour: dpRes.path.join(' → '), time: dpTime },
        { name: "Branch & Bound", cost: bbRes.minCost, tour: bbRes.path.join(' → '), time: bbTime }
    ];

    rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/2 transition-colors";
        tr.innerHTML = `
            <td class="py-3 text-on-surface font-headline font-bold">${r.name}</td>
            <td class="py-3 font-mono text-cyber-cyan">${r.cost}</td>
            <td class="py-3 font-mono text-on-surface/75">[${r.tour}]</td>
            <td class="py-3 font-mono text-cyber-purple">${r.time.toFixed(4)} ms</td>
        `;
        tbody.appendChild(tr);
    });

    // 3. Render Steps Log
    const stepsLog = document.getElementById('tsp-steps-log');
    stepsLog.innerHTML = '';

    const headerDP = document.createElement('h5');
    headerDP.className = "font-headline text-xs text-cyber-cyan mt-2 mb-2 uppercase";
    headerDP.textContent = "Held-Karp Dynamic Programming Steps:";
    stepsLog.appendChild(headerDP);

    dpRes.steps.forEach((s, idx) => {
        const item = document.createElement('div');
        item.className = "py-1 border-b border-white/2 text-on-surface/70";
        item.textContent = `[Step ${idx+1}] ${s.description}`;
        stepsLog.appendChild(item);
    });

    const headerBnB = document.createElement('h5');
    headerBnB.className = "font-headline text-xs text-cyber-pink mt-6 mb-2 uppercase";
    headerBnB.textContent = "Branch & Bound Exploration Tree Leaves:";
    stepsLog.appendChild(headerBnB);

    bbRes.steps.forEach((s, idx) => {
        const item = document.createElement('div');
        item.className = "py-1 border-b border-white/2 text-on-surface/70";
        item.textContent = `[Node ${idx+1}] ${s.description}`;
        stepsLog.appendChild(item);
    });

    // 4. Draw Canvas Node Tour
    drawTspTour(dpRes.rawPath, cityNames, distMatrix);
}

function drawTspTour(rawPath, cityNames, distMatrix) {
    const canvas = document.getElementById('tsp-tour-canvas');
    if (!canvas) return;

    // Set canvas dimensions explicitly to match bounding box
    const container = document.getElementById('tsp-tour-canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const n = cityNames.length;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    // 1. Calculate positions on a circle
    const positions = [];
    const angleStep = (2 * Math.PI) / n;
    for (let i = 0; i < n; i++) {
        const angle = i * angleStep - Math.PI / 2; // offset by 90deg to start top
        positions.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        });
    }

    // 2. Draw all connections (edges)
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(188, 19, 254, 0.1)"; // faint purple
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(positions[j].x, positions[j].y);
            ctx.stroke();

            // Label weights occasionally
            if (n <= 5) {
                const textX = (positions[i].x + positions[j].x) / 2;
                const textY = (positions[i].y + positions[j].y) / 2;
                ctx.font = "8px monospace";
                ctx.fillStyle = "rgba(224, 224, 255, 0.25)";
                ctx.fillText(distMatrix[i][j], textX, textY);
            }
        }
    }

    // 3. Highlight Tour path
    if (rawPath && rawPath.length > 0) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#05ffa1"; // glowing cyber-cyan
        ctx.shadowColor = "rgba(5, 255, 161, 0.6)";
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(positions[rawPath[0]].x, positions[rawPath[0]].y);
        for (let i = 1; i < rawPath.length; i++) {
            ctx.lineTo(positions[rawPath[i]].x, positions[rawPath[i]].y);
        }
        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    // 4. Draw Nodes
    for (let i = 0; i < n; i++) {
        const pos = positions[i];
        
        // Glow effect for nodes
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 14, 0, 2 * Math.PI);
        ctx.fillStyle = "#0d0d12";
        ctx.fill();
        
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = rawPath.includes(i) ? "#bc13fe" : "rgba(188, 19, 254, 0.4)";
        ctx.stroke();

        // Node Label
        ctx.font = "bold 9px 'Orbitron', sans-serif";
        ctx.fillStyle = "#e0e0ff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cityNames[i], pos.x, pos.y);
    }
}

function switchTspTab(tabName) {
    const tabs = ['results', 'steps'];
    tabs.forEach(t => {
        const div = document.getElementById(`tsp-tab-${t}`);
        const btn = document.getElementById(`tsp-tab-btn-${t}`);
        if (t === tabName) {
            div.classList.remove('hidden');
            btn.className = "py-2 px-6 font-headline text-xs tracking-wider border border-cyber-cyan bg-cyber-purple/10 text-cyber-cyan glow-text-cyan hover:border-cyber-cyan transition-all";
        } else {
            div.classList.add('hidden');
            btn.className = "py-2 px-6 font-headline text-xs tracking-wider border border-transparent text-on-surface/60 hover:text-on-surface hover:border-cyber-purple/40 transition-all";
        }
    });
}

// Hook functions globally
window.switchProblemSpace = switchProblemSpace;
window.switchKsTab = switchKsTab;
window.switchTspTab = switchTspTab;
window.generateDefaultTSPMatrix = generateDefaultTSPMatrix;

// Initialize
initParadigmsModule();
