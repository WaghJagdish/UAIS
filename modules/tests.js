// modules/tests.js

// A lightweight assertion library
class Assert {
    static equal(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message || "Assertion failed"}: Expected [${expected}], got [${actual}]`);
        }
    }
    static deepEqual(actual, expected, message) {
        const actStr = JSON.stringify(actual);
        const expStr = JSON.stringify(expected);
        if (actStr !== expStr) {
            throw new Error(`${message || "Assertion failed"}: Expected ${expStr}, got ${actStr}`);
        }
    }
    static true(val, message) {
        if (!val) {
            throw new Error(message || "Assertion failed: expected true");
        }
    }
}

// Log message to the test console
function logToConsole(text, type = 'info') {
    const consoleLogs = document.getElementById('console-logs');
    if (!consoleLogs) return;
    
    let colorClass = 'text-on-surface/60';
    let prefix = '>> ';
    
    if (type === 'success') {
        colorClass = 'text-cyber-cyan font-semibold';
        prefix = '[PASS] ';
    } else if (type === 'error') {
        colorClass = 'text-cyber-pink font-semibold';
        prefix = '[FAIL] ';
    } else if (type === 'header') {
        colorClass = 'text-cyber-purple font-black border-t border-white/5 pt-2 mt-2';
        prefix = '=== ';
    }
    
    const line = document.createElement('div');
    line.className = colorClass;
    line.textContent = `${prefix}${text}`;
    consoleLogs.appendChild(line);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

// Load a script's raw code, strip its self-initialization routine, append testing hook exports, and run it
async function loadScriptForTesting(scriptPath, initRoutineToStrip, exportName, exportsToBind) {
    const res = await fetch(`${scriptPath}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`Failed to load ${scriptPath} code`);
    let code = await res.text();
    
    // Strip self-run routine to prevent layout failures during script load
    if (initRoutineToStrip) {
        code = code.replace(initRoutineToStrip, `/* Stripped ${initRoutineToStrip} for unit tests */`);
    }
    
    // Append window export binder
    const exportBindStrs = exportsToBind.map(fn => `${fn}: typeof ${fn} !== 'undefined' ? ${fn} : undefined`).join(', ');
    code += `\nwindow.${exportName} = { ${exportBindStrs} };\n`;
    
    // Execute module
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = code;
    document.body.appendChild(script);
    
    // Give browser a frame to parse module
    await new Promise(r => setTimeout(r, 80));
    
    if (!window[exportName]) {
        throw new Error(`Failed to bind mock exports for ${exportName}`);
    }
    return window[exportName];
}

// Global Diagnostics Runner
async function runAllDiagnostics() {
    const runBtn = document.getElementById('run-tests-btn');
    const summary = document.getElementById('test-summary');
    const logs = document.getElementById('console-logs');
    
    if (runBtn) runBtn.disabled = true;
    if (summary) summary.classList.remove('hidden');
    if (logs) logs.innerHTML = '';
    
    logToConsole('Starting System Integration Check...', 'header');
    
    const startTime = performance.now();
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    // Reset badges
    ['core', 'sorting', 'searching', 'graph'].forEach(id => {
        const el = document.getElementById(`badge-${id}`);
        if (el) {
            el.className = "text-[9px] font-headline border border-yellow-500/50 px-2 py-0.5 text-yellow-500 animate-pulse";
            el.textContent = "RUNNING";
        }
        const resEl = document.getElementById(`results-${id}`);
        if (resEl) resEl.innerHTML = '';
    });
    
    // Helper to log individual test item results
    function renderTestItem(containerId, name, success, errorMsg = '') {
        totalTests++;
        if (success) passedTests++;
        else failedTests++;
        
        const container = document.getElementById(`results-${containerId}`);
        if (!container) return;
        
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center py-1 border-b border-white/5';
        
        const nameEl = document.createElement('span');
        nameEl.className = 'text-on-surface/80';
        nameEl.textContent = name;
        
        const statusEl = document.createElement('span');
        if (success) {
            statusEl.className = 'text-cyber-cyan';
            statusEl.textContent = 'PASS';
            logToConsole(`${containerId.toUpperCase()}::${name} - Passed`, 'success');
        } else {
            statusEl.className = 'text-cyber-pink font-bold';
            statusEl.textContent = 'FAIL';
            logToConsole(`${containerId.toUpperCase()}::${name} - Failed: ${errorMsg}`, 'error');
        }
        
        item.appendChild(nameEl);
        item.appendChild(statusEl);
        container.appendChild(item);
        
        // Update live counters
        document.getElementById('test-total-count').textContent = totalTests;
        document.getElementById('test-passed-count').textContent = passedTests;
        document.getElementById('test-failed-count').textContent = failedTests;
    }
    
    // Finalize suite badge status
    function finalizeBadge(id, suiteSuccess) {
        const el = document.getElementById(`badge-${id}`);
        if (!el) return;
        if (suiteSuccess) {
            el.className = "text-[9px] font-headline border border-cyber-cyan px-2 py-0.5 text-cyber-cyan";
            el.textContent = "PASSED";
        } else {
            el.className = "text-[9px] font-headline border border-cyber-pink px-2 py-0.5 text-cyber-pink";
            el.textContent = "FAILED";
        }
    }

    // ==========================================
    // 1. CORE ROUTER SANITY TESTS
    // ==========================================
    logToConsole('Running Core Routing Sanity Tests...', 'header');
    let coreSuccess = true;
    
    // Test index html fetch
    try {
        const res = await fetch('index.html');
        Assert.equal(res.ok, true, "index.html check");
        renderTestItem('core', 'Verify index.html exists', true);
    } catch(e) {
        coreSuccess = false;
        renderTestItem('core', 'Verify index.html exists', false, e.message);
    }
    
    // Test router.js fetch
    try {
        const res = await fetch('router.js');
        Assert.equal(res.ok, true, "router.js check");
        renderTestItem('core', 'Verify router.js exists', true);
    } catch(e) {
        coreSuccess = false;
        renderTestItem('core', 'Verify router.js exists', false, e.message);
    }
    
    // Test style.css fetch
    try {
        const res = await fetch('style.css');
        Assert.equal(res.ok, true, "style.css check");
        renderTestItem('core', 'Verify style.css exists', true);
    } catch(e) {
        coreSuccess = false;
        renderTestItem('core', 'Verify style.css exists', false, e.message);
    }
    
    // Test homepage template fetch
    try {
        const res = await fetch('modules/home.html');
        Assert.equal(res.ok, true, "modules/home.html check");
        renderTestItem('core', 'Verify home.html module template', true);
    } catch(e) {
        coreSuccess = false;
        renderTestItem('core', 'Verify home.html module template', false, e.message);
    }
    finalizeBadge('core', coreSuccess);

    // ==========================================
    // 2. SORTING ALGORITHM TESTS
    // ==========================================
    logToConsole('Running Sorting Algorithm Sanity Tests...', 'header');
    let sortingSuccess = true;
    try {
        const sortingAPI = await loadScriptForTesting(
            'modules/sorting.js', 
            'initVisualizer();', 
            '__test_sorting', 
            ['runSelectionSort', 'runInsertionSort', 'runMergeSort', 'runQuickSort']
        );
        
        const testArray = [5, 2, 9, 1, 5, 6];
        const expected = [1, 2, 5, 5, 6, 9];
        
        // Selection Sort
        try {
            const steps = sortingAPI.runSelectionSort(testArray);
            const finalArr = steps[steps.length - 1].array;
            Assert.deepEqual(finalArr, expected, "Selection Sort correctness");
            renderTestItem('sorting', 'Selection Sort state verification', true);
        } catch(e) {
            sortingSuccess = false;
            renderTestItem('sorting', 'Selection Sort state verification', false, e.message);
        }
        
        // Insertion Sort
        try {
            const steps = sortingAPI.runInsertionSort(testArray);
            const finalArr = steps[steps.length - 1].array;
            Assert.deepEqual(finalArr, expected, "Insertion Sort correctness");
            renderTestItem('sorting', 'Insertion Sort state verification', true);
        } catch(e) {
            sortingSuccess = false;
            renderTestItem('sorting', 'Insertion Sort state verification', false, e.message);
        }
        
        // Merge Sort
        try {
            const steps = sortingAPI.runMergeSort(testArray);
            const finalArr = steps[steps.length - 1].array;
            Assert.deepEqual(finalArr, expected, "Merge Sort correctness");
            renderTestItem('sorting', 'Merge Sort state verification', true);
        } catch(e) {
            sortingSuccess = false;
            renderTestItem('sorting', 'Merge Sort state verification', false, e.message);
        }
        
        // Quick Sort
        try {
            const steps = sortingAPI.runQuickSort(testArray);
            const finalArr = steps[steps.length - 1].array;
            Assert.deepEqual(finalArr, expected, "Quick Sort correctness");
            renderTestItem('sorting', 'Quick Sort state verification', true);
        } catch(e) {
            sortingSuccess = false;
            renderTestItem('sorting', 'Quick Sort state verification', false, e.message);
        }
        
    } catch (e) {
        sortingSuccess = false;
        logToConsole(`Sorting Suite setup failed: ${e.message}`, 'error');
    }
    finalizeBadge('sorting', sortingSuccess);

    // ==========================================
    // 3. SEARCHING ALGORITHM TESTS
    // ==========================================
    logToConsole('Running Searching Algorithm Sanity Tests...', 'header');
    let searchingSuccess = true;
    try {
        const searchingAPI = await loadScriptForTesting(
            'modules/searching.js', 
            'initSearchVisualizer();', 
            '__test_searching', 
            ['runLinearSearch', 'runBinarySearch']
        );
        
        const testArray = [10, 20, 30, 40, 50];
        
        // Linear Search hit
        try {
            const steps = searchingAPI.runLinearSearch(testArray, 30);
            const lastStep = steps[steps.length - 1];
            Assert.equal(lastStep.found, true, "Linear Search hit condition");
            Assert.equal(lastStep.currentIndex, 2, "Linear Search index matches target");
            renderTestItem('searching', 'Linear Search - Target Found', true);
        } catch(e) {
            searchingSuccess = false;
            renderTestItem('searching', 'Linear Search - Target Found', false, e.message);
        }
        
        // Binary Search hit
        try {
            const steps = searchingAPI.runBinarySearch(testArray, 40);
            const lastStep = steps[steps.length - 1];
            Assert.equal(lastStep.found, true, "Binary Search hit condition");
            Assert.equal(lastStep.mid, 3, "Binary Search index matches target");
            renderTestItem('searching', 'Binary Search - Target Found', true);
        } catch(e) {
            searchingSuccess = false;
            renderTestItem('searching', 'Binary Search - Target Found', false, e.message);
        }
        
        // Binary Search miss
        try {
            const steps = searchingAPI.runBinarySearch(testArray, 25);
            const lastStep = steps[steps.length - 1];
            Assert.equal(lastStep.found, false, "Binary Search miss condition");
            renderTestItem('searching', 'Binary Search - Target Not Found', true);
        } catch(e) {
            searchingSuccess = false;
            renderTestItem('searching', 'Binary Search - Target Not Found', false, e.message);
        }
    } catch(e) {
        searchingSuccess = false;
        logToConsole(`Searching Suite setup failed: ${e.message}`, 'error');
    }
    finalizeBadge('searching', searchingSuccess);

    // ==========================================
    // 4. GRAPH ALGORITHM TESTS
    // ==========================================
    logToConsole('Running Graph Algorithm Sanity Tests...', 'header');
    let graphSuccess = true;
    try {
        const graphAPI = await loadScriptForTesting(
            'modules/graph.js', 
            'initGraphVisualizer();', 
            '__test_graph', 
            ['runDijkstra', 'runKruskal', 'runPrim']
        );
        
        const nodes = [
            { id: 'A' }, { id: 'B' }, { id: 'C' }
        ];
        const edges = [
            { source: 'A', target: 'B', weight: 4 },
            { source: 'B', target: 'C', weight: 3 },
            { source: 'A', target: 'C', weight: 8 }
        ];
        
        // Dijkstra's Shortest Path from A to C (Should choose A->B->C = 7 instead of A->C = 8)
        try {
            const steps = graphAPI.runDijkstra(nodes, edges, 'A', 'C');
            const lastStep = steps[steps.length - 1];
            const shortestDist = lastStep.distances['C'];
            Assert.equal(shortestDist, 7, "Dijkstra optimal cost check");
            renderTestItem('graph', 'Dijkstra shortest path weights', true);
        } catch(e) {
            graphSuccess = false;
            renderTestItem('graph', 'Dijkstra shortest path weights', false, e.message);
        }
        
        // Kruskal's MST (Should choose A->B and B->C, total weight = 7)
        try {
            const steps = graphAPI.runKruskal(nodes, edges);
            const lastStep = steps[steps.length - 1];
            const mstEdges = lastStep.mstEdges;
            const totalWeight = mstEdges.reduce((sum, e) => sum + e.weight, 0);
            Assert.equal(totalWeight, 7, "Kruskal MST edge cost sum check");
            renderTestItem('graph', 'Kruskal MST total weights', true);
        } catch(e) {
            graphSuccess = false;
            renderTestItem('graph', 'Kruskal MST total weights', false, e.message);
        }
        
    } catch(e) {
        graphSuccess = false;
        logToConsole(`Graph Suite setup failed: ${e.message}`, 'error');
    }
    finalizeBadge('graph', graphSuccess);

    // Finalize Diagnostic Suite Execution
    const duration = Math.round(performance.now() - startTime);
    document.getElementById('test-duration').textContent = `${duration}ms`;
    
    const suiteStatusText = document.getElementById('suite-status-text');
    if (suiteStatusText) {
        if (failedTests === 0) {
            suiteStatusText.className = 'text-cyber-cyan font-bold tracking-wider';
            suiteStatusText.textContent = 'ALL_SYSTEMS_OPERATIONAL';
            logToConsole('SYSTEM INTEGRITY VERIFIED: All test suites passed successfully!', 'success');
        } else {
            suiteStatusText.className = 'text-cyber-pink font-bold tracking-wider';
            suiteStatusText.textContent = 'DEGRADED_INTEGRITY';
            logToConsole(`SYSTEM CHECK COMPLETED: ${failedTests} assertions failed.`, 'error');
        }
    }
    
    if (runBtn) runBtn.disabled = false;
}

// Hook runner when page elements load
const runBtn = document.getElementById('run-tests-btn');
if (runBtn) {
    runBtn.addEventListener('click', runAllDiagnostics);
}
