// modules/graph.js

// Seeded random for layout or benchmarks
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }
}

// ── Graph State Variables ───────────────────────────────────────────────────
let graphNodes = [];       // { id, x, y, radius: 20 }
let graphEdges = [];       // { u, v, weight }
let nodePositions = {};    // id -> { x, y }

let graphSteps = [];       // step log for visualization
let graphStepIndex = -1;
let graphAutoPlayInterval = null;

let selectedNode = null;
let hoveredNode = null;

let canvas = null;
let ctx = null;

// Color Tokens (match style.css)
const COLORS = {
    bg: '#060608',
    grid: '#bc13fe11',
    nodeDefault: '#1a1a24',
    nodeBorder: '#bc13fe55',
    nodeActive: '#ff00e6',     // cyber-pink
    nodeVisited: '#8b5cf6',    // purple-500
    nodeSelected: '#05ffa1',   // cyber-cyan
    text: '#e0e0ff',
    edgeDefault: '#3f3f46',
    edgeHighlight: '#05ffa1',  // cyber-cyan
    edgeConsider: '#ff00e6',   // cyber-pink
    edgeSkip: '#ff2a2a'
};

// ── Graph Algorithms Implementation ──────────────────────────────────────────

// Dijkstra's Shortest Path
function runDijkstra(nodes, edges, source, target) {
    // Build adj list
    const adj = {};
    nodes.forEach(n => adj[n] = []);
    edges.forEach(e => {
        adj[e.u].push({ v: e.v, w: e.weight });
        adj[e.v].push({ v: e.u, w: e.weight });
    });

    const dist = {};
    const prev = {};
    nodes.forEach(n => {
        dist[n] = Infinity;
        prev[n] = null;
    });
    dist[source] = 0;

    const visited = new Set();
    const steps = [];

    // Prioritized node selection
    const unvisited = new Set(nodes);

    steps.push({
        action: 'init',
        description: `Initialize distances. Set source '${source}' distance to 0, all others to ∞.`,
        visited: new Set(),
        activeNode: null,
        edge: null,
        distances: { ...dist },
        predecessors: { ...prev }
    });

    while (unvisited.size > 0) {
        // Find unvisited node with minimum distance
        let u = null;
        let minDist = Infinity;
        for (const n of unvisited) {
            if (dist[n] < minDist) {
                minDist = dist[n];
                u = n;
            }
        }

        if (u === null || minDist === Infinity) {
            break;
        }

        unvisited.delete(u);
        visited.add(u);

        steps.push({
            action: 'visit',
            description: `Select unvisited node '${u}' with minimal distance (${minDist}). Mark as visited.`,
            visited: new Set(visited),
            activeNode: u,
            edge: null,
            distances: { ...dist },
            predecessors: { ...prev }
        });

        // Relax neighbors
        for (const neighbor of adj[u]) {
            const v = neighbor.v;
            const w = neighbor.w;

            if (!visited.has(v)) {
                const newDist = dist[u] + w;
                const isRelaxed = newDist < dist[v];
                
                steps.push({
                    action: 'consider_edge',
                    description: `Evaluate edge ${u}→${v} (weight=${w}). Tentative path distance: ${dist[u]} + ${w} = ${newDist}. Current dist['${v}'] = ${dist[v] === Infinity ? '∞' : dist[v]}.`,
                    visited: new Set(visited),
                    activeNode: u,
                    edge: [u, v],
                    distances: { ...dist },
                    predecessors: { ...prev }
                });

                if (isRelaxed) {
                    dist[v] = newDist;
                    prev[v] = u;
                    steps.push({
                        action: 'relax',
                        description: `✅ Relaxed path to '${v}' via '${u}': new distance = ${newDist}.`,
                        visited: new Set(visited),
                        activeNode: u,
                        edge: [u, v],
                        distances: { ...dist },
                        predecessors: { ...prev }
                    });
                }
            }
        }
    }

    // Reconstruct final path if target is reachable
    const finalPath = [];
    let cur = target;
    while (cur !== null) {
        finalPath.push(cur);
        cur = prev[cur];
    }
    finalPath.reverse();

    const isConnected = finalPath[0] === source;
    const pathEdges = [];
    if (isConnected) {
        for (let i = 0; i < finalPath.length - 1; i++) {
            pathEdges.push([finalPath[i], finalPath[i+1]]);
        }
    }

    steps.push({
        action: 'done',
        description: isConnected 
            ? `🏁 Shortest path resolved: ${finalPath.join(' → ')} with total weight = ${dist[target]}.`
            : `🏁 Shortest path resolved: No path found from '${source}' to '${target}'.`,
        visited: new Set(visited),
        activeNode: null,
        edge: null,
        distances: { ...dist },
        predecessors: { ...prev },
        pathEdges: pathEdges,
        cost: isConnected ? dist[target] : Infinity,
        pathString: isConnected ? finalPath.join('→') : 'No path'
    });

    return { steps, prev, dist };
}

// Kruskal's MST
function runKruskal(nodes, edges) {
    // Union-Find structures
    const parent = {};
    nodes.forEach(n => parent[n] = n);

    function find(x) {
        let root = x;
        while (parent[root] !== root) {
            root = parent[root];
        }
        // Path compression
        let curr = x;
        while (curr !== root) {
            let next = parent[curr];
            parent[curr] = root;
            curr = next;
        }
        return root;
    }

    function union(x, y) {
        const rootX = find(x);
        const rootY = find(y);
        if (rootX !== rootY) {
            parent[rootX] = rootY;
            return true;
        }
        return false;
    }

    // Sort edges by weight
    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
    const mst = [];
    const steps = [];

    steps.push({
        action: 'init',
        description: `Sort all ${edges.length} edges by weight ascending. Initialize disjoint sets.`,
        mst: [],
        edge: null,
        visited: new Set()
    });

    for (const e of sortedEdges) {
        steps.push({
            action: 'consider',
            description: `Considering edge ${e.u}-${e.v} (weight=${e.weight}).`,
            mst: [...mst],
            edge: [e.u, e.v],
            visited: new Set(mst.flatMap(me => [me.u, me.v]))
        });

        if (find(e.u) !== find(e.v)) {
            union(e.u, e.v);
            mst.push(e);
            steps.push({
                action: 'add',
                description: `✅ Added edge ${e.u}-${e.v} (weight=${e.weight}) to MST. Connected components successfully unioned.`,
                mst: [...mst],
                edge: [e.u, e.v],
                visited: new Set(mst.flatMap(me => [me.u, me.v]))
            });
        } else {
            steps.push({
                action: 'skip',
                description: `❌ Skipped edge ${e.u}-${e.v} (weight=${e.weight}) because it forms a cycle in the current component.`,
                mst: [...mst],
                edge: [e.u, e.v],
                visited: new Set(mst.flatMap(me => [me.u, me.v])),
                skipped: true
            });
        }
    }

    const totalWeight = mst.reduce((sum, e) => sum + e.weight, 0);
    steps.push({
        action: 'done',
        description: `🏁 Kruskal resolved. MST weight = ${totalWeight}. Total edges in MST = ${mst.length}.`,
        mst: [...mst],
        edge: null,
        visited: new Set(mst.flatMap(me => [me.u, me.v])),
        cost: totalWeight
    });

    return { steps, mst, totalWeight };
}

// Prim's MST
function runPrim(nodes, edges) {
    if (nodes.length === 0) return { steps: [], mst: [], totalWeight: 0 };

    const start = nodes[0];
    const visited = new Set([start]);
    const mst = [];
    const steps = [];

    // Adjacency structure
    const adj = {};
    nodes.forEach(n => adj[n] = []);
    edges.forEach(e => {
        adj[e.u].push({ u: e.u, v: e.v, w: e.weight });
        adj[e.v].push({ u: e.v, v: e.u, w: e.weight });
    });

    steps.push({
        action: 'init',
        description: `Initialize Prim's algorithm starting from root node '${start}'.`,
        mst: [],
        edge: null,
        visited: new Set(visited),
        activeNode: start
    });

    while (visited.size < nodes.length) {
        // Collect candidate edges crossing the cut
        let candidates = [];
        for (const u of visited) {
            for (const edge of adj[u]) {
                if (!visited.has(edge.v)) {
                    candidates.push(edge);
                }
            }
        }

        if (candidates.length === 0) {
            // Graph is disconnected
            break;
        }

        // Sort to find minimum weight crossing edge
        candidates.sort((a, b) => a.w - b.w);
        const minEdge = candidates[0];

        steps.push({
            action: 'consider',
            description: `Prim greedy choice: evaluating cut edges. Min cut edge is ${minEdge.u}-${minEdge.v} (weight=${minEdge.w}).`,
            mst: [...mst],
            edge: [minEdge.u, minEdge.v],
            visited: new Set(visited),
            activeNode: minEdge.u
        });

        visited.add(minEdge.v);
        mst.push({ u: minEdge.u, v: minEdge.v, weight: minEdge.w });

        steps.push({
            action: 'add',
            description: `✅ Added edge ${minEdge.u}-${minEdge.v} (weight=${minEdge.w}) to MST. Marked '${minEdge.v}' as visited.`,
            mst: [...mst],
            edge: [minEdge.u, minEdge.v],
            visited: new Set(visited),
            activeNode: minEdge.v
        });
    }

    const totalWeight = mst.reduce((sum, e) => sum + e.weight, 0);
    steps.push({
        action: 'done',
        description: `🏁 Prim resolved. MST weight = ${totalWeight}. Total edges in MST = ${mst.length}.`,
        mst: [...mst],
        edge: null,
        visited: new Set(visited),
        cost: totalWeight
    });

    return { steps, mst, totalWeight };
}

// ── Graph Generator & Parser ────────────────────────────────────────────────

function parseEdgesInput() {
    const raw = document.getElementById('edges-input').value;
    const nodesSet = new Set();
    const edges = [];

    raw.split('\n').forEach(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length === 3) {
            const u = parts[0];
            const v = parts[1];
            const w = parseFloat(parts[2]);
            if (u && v && !isNaN(w)) {
                edges.push({ u, v, weight: w });
                nodesSet.add(u);
                nodesSet.add(v);
            }
        }
    });

    const sortedNodes = Array.from(nodesSet).sort();
    return { nodes: sortedNodes, edges };
}

function generateCircularPositions(nodes, width, height) {
    const positions = {};
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    nodes.forEach((node, idx) => {
        const angle = (2 * Math.PI * idx) / nodes.length;
        positions[node] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    });

    return positions;
}

function updateGraphStructure() {
    const parsed = parseEdgesInput();
    const nodes = parsed.nodes;
    graphEdges = parsed.edges;

    // Retain existing node positions if possible, else generate new circular ones
    const newNodes = [];
    const initialPositions = generateCircularPositions(nodes, canvas.width, canvas.height);

    nodes.forEach(nodeId => {
        let x = initialPositions[nodeId].x;
        let y = initialPositions[nodeId].y;

        if (nodePositions[nodeId]) {
            x = nodePositions[nodeId].x;
            y = nodePositions[nodeId].y;
        }

        newNodes.push({ id: nodeId, x, y, radius: 20 });
        nodePositions[nodeId] = { x, y };
    });

    // Clean up nodePositions for removed nodes
    for (const key in nodePositions) {
        if (!nodes.includes(key)) {
            delete nodePositions[key];
        }
    }

    graphNodes = newNodes;
    drawGraph();
}

// ── Rendering Engine ─────────────────────────────────────────────────────────

function drawGraph() {
    if (!canvas || !document.body.contains(canvas)) return;

    // Reset dimensions safely with fallbacks
    const rect = canvas.parentNode.getBoundingClientRect();
    const newWidth = rect.width || 800;
    const newHeight = rect.height || 320;
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
    }

    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Cyberpunk Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Determine current highlight states from active step
    const currentStep = graphSteps[graphStepIndex];
    let activeNode = null;
    let visitedNodes = new Set();
    let highlightedEdges = [];
    let considerEdge = null;
    let mstEdges = [];

    if (currentStep) {
        activeNode = currentStep.activeNode;
        if (currentStep.visited) visitedNodes = currentStep.visited;
        
        // Dijkstra highlights
        if (currentStep.pathEdges) {
            highlightedEdges = currentStep.pathEdges;
        } else if (currentStep.predecessors) {
            // Draw path back to source or build visual active paths
            const algoSelect = document.getElementById('algo-select').value;
            const target = document.getElementById('target-node').value.trim();
            if (algoSelect === 'dijkstra') {
                let cur = target;
                while (cur && currentStep.predecessors[cur]) {
                    highlightedEdges.push([currentStep.predecessors[cur], cur]);
                    cur = currentStep.predecessors[cur];
                }
            }
        }

        // Edge currently under consideration
        if (currentStep.edge) {
            considerEdge = currentStep.edge;
        }

        // MST highlights
        if (currentStep.mst) {
            mstEdges = currentStep.mst;
        }
    }

    // Helper to check if edge is highlit
    function isEdgeInHighlight(u, v) {
        return highlightedEdges.some(he => (he[0] === u && he[1] === v) || (he[0] === v && he[1] === u));
    }

    function isEdgeInMST(u, v) {
        return mstEdges.some(me => (me.u === u && me.v === v) || (me.u === v && me.v === u));
    }

    function isEdgeConsidered(u, v) {
        return considerEdge && ((considerEdge[0] === u && considerEdge[1] === v) || (considerEdge[0] === v && considerEdge[1] === u));
    }

    // 1. Draw Edges
    graphEdges.forEach(edge => {
        const p1 = nodePositions[edge.u];
        const p2 = nodePositions[edge.v];
        if (!p1 || !p2) return;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        let color = COLORS.edgeDefault;
        let width = 1.5;

        if (isEdgeInHighlight(edge.u, edge.v) || isEdgeInMST(edge.u, edge.v)) {
            color = COLORS.edgeHighlight;
            width = 3.5;
        } else if (isEdgeConsidered(edge.u, edge.v)) {
            color = COLORS.edgeConsider;
            width = 3.5;
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();

        // Glowing effect for active paths
        if (width > 2) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.stroke();
            ctx.shadowBlur = 0; // reset
        }

        // Draw edge weight
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        ctx.fillStyle = '#ff8c00'; // darkorange
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Small background backing for readability
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(midX - 10, midY - 6, 20, 12);

        ctx.fillStyle = '#f39c12';
        ctx.fillText(edge.weight, midX, midY);
    });

    // 2. Draw Nodes
    graphNodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);

        let fill = COLORS.nodeDefault;
        let stroke = COLORS.nodeBorder;
        let borderWeight = 1.5;

        // Custom styling based on node state
        const sourceId = document.getElementById('source-node').value.trim();
        const targetId = document.getElementById('target-node').value.trim();
        const algoSelect = document.getElementById('algo-select').value;

        if (node.id === activeNode) {
            fill = '#bc13fe22';
            stroke = COLORS.nodeActive;
            borderWeight = 2.5;
        } else if (visitedNodes.has(node.id)) {
            fill = '#8b5cf622';
            stroke = COLORS.nodeVisited;
            borderWeight = 2;
        }

        if (algoSelect === 'dijkstra') {
            if (node.id === sourceId) {
                stroke = COLORS.nodeSelected;
                borderWeight = 2.5;
            } else if (node.id === targetId) {
                stroke = COLORS.nodeActive;
                borderWeight = 2.5;
            }
        }

        if (node === hoveredNode) {
            stroke = '#ffffff';
        }

        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = borderWeight;
        ctx.fill();

        // Node Glow
        if (node.id === activeNode || node.id === sourceId || node.id === targetId) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = stroke;
            ctx.stroke();
            ctx.shadowBlur = 0; // reset
        } else {
            ctx.stroke();
        }

        // Draw Node label
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 11px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.id, node.x, node.y - 1);

        // Under-node state detail (Dijkstra Distances)
        if (currentStep && currentStep.distances && currentStep.distances[node.id] !== undefined) {
            const distVal = currentStep.distances[node.id];
            ctx.font = '8px JetBrains Mono';
            ctx.fillStyle = distVal === Infinity ? '#6b7280' : COLORS.edgeHighlight;
            ctx.fillText(distVal === Infinity ? '∞' : `d:${distVal}`, node.x, node.y + node.radius + 10);
        }
    });
}

// ── Interactive Node Dragging ────────────────────────────────────────────────

function initDragListeners() {
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);

    // Mobile touch support
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);
}

function getNodeAt(x, y) {
    for (const node of graphNodes) {
        const dx = node.x - x;
        const dy = node.y - y;
        if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 5) {
            return node;
        }
    }
    return null;
}

function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    selectedNode = getNodeAt(x, y);
}

function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedNode) {
        selectedNode.x = Math.max(20, Math.min(canvas.width - 20, x));
        selectedNode.y = Math.max(20, Math.min(canvas.height - 20, y));
        nodePositions[selectedNode.id] = { x: selectedNode.x, y: selectedNode.y };
        drawGraph();
    } else {
        const node = getNodeAt(x, y);
        if (node !== hoveredNode) {
            hoveredNode = node;
            canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
            drawGraph();
        }
    }
}

function onMouseUp() {
    selectedNode = null;
}

function onTouchStart(e) {
    if (e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    selectedNode = getNodeAt(x, y);
}

function onTouchMove(e) {
    if (!selectedNode || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    selectedNode.x = Math.max(20, Math.min(canvas.width - 20, x));
    selectedNode.y = Math.max(20, Math.min(canvas.height - 20, y));
    nodePositions[selectedNode.id] = { x: selectedNode.x, y: selectedNode.y };
    drawGraph();
}

function onTouchEnd() {
    selectedNode = null;
}

// ── Playback Controls ────────────────────────────────────────────────────────

function graphRenderStep() {
    if (graphStepIndex < 0 || graphStepIndex >= graphSteps.length) return;

    const step = graphSteps[graphStepIndex];

    // Update Text details
    document.getElementById('viz-description').innerHTML = step.description;
    document.getElementById('stat-steps').textContent = `${graphStepIndex + 1}/${graphSteps.length}`;

    // Compute active stats
    const algoSelect = document.getElementById('algo-select').value;
    const target = document.getElementById('target-node').value.trim();

    if (algoSelect === 'dijkstra') {
        const dist = step.distances ? step.distances[target] : Infinity;
        document.getElementById('stat-cost').textContent = dist === Infinity ? '∞' : dist;
        
        let pathString = '-';
        if (step.pathString) {
            pathString = step.pathString;
        } else if (step.predecessors) {
            const tempPath = [];
            let cur = target;
            while (cur) {
                tempPath.push(cur);
                cur = step.predecessors[cur];
            }
            tempPath.reverse();
            pathString = tempPath[0] === document.getElementById('source-node').value.trim() ? tempPath.join('→') : '-';
        }
        document.getElementById('stat-path').textContent = pathString;
    } else {
        const cost = step.cost !== undefined ? step.cost : (step.mst ? step.mst.reduce((sum, e) => sum + e.weight, 0) : 0);
        document.getElementById('stat-cost').textContent = cost;
        document.getElementById('stat-path').textContent = 'MST_BUILD';
    }

    // Toggle disabled status for Prev/Next
    document.getElementById('btn-prev').disabled = graphStepIndex === 0;
    document.getElementById('btn-next').disabled = graphStepIndex === graphSteps.length - 1;

    drawGraph();
}

function graphStepPrev() {
    graphStopAutoPlay();
    if (graphStepIndex > 0) {
        graphStepIndex--;
        graphRenderStep();
    }
}

function graphStepNext() {
    if (graphStepIndex < graphSteps.length - 1) {
        graphStepIndex++;
        graphRenderStep();
    } else {
        graphStopAutoPlay();
    }
}

function graphTogglePlay() {
    if (graphAutoPlayInterval) {
        graphStopAutoPlay();
    } else {
        if (graphStepIndex === graphSteps.length - 1) {
            graphStepIndex = 0; // restart
        }
        
        const playBtn = document.getElementById('btn-play');
        playBtn.className = "cyber-btn px-6 py-1.5 text-[10px] font-headline text-cyber-cyan border-cyber-cyan flex items-center gap-1";
        playBtn.style.color = '#05ffa1';
        playBtn.style.borderColor = '#05ffa1';
        document.getElementById('play-icon').textContent = 'pause';
        document.getElementById('play-text').textContent = 'PAUSE';

        const delay = parseInt(document.getElementById('speed-slider').value);
        graphAutoPlayInterval = setInterval(() => {
            graphStepNext();
        }, delay);
    }
}

function graphStopAutoPlay() {
    if (graphAutoPlayInterval) {
        clearInterval(graphAutoPlayInterval);
        graphAutoPlayInterval = null;
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

function graphEnablePlaybackButtons() {
    document.getElementById('btn-prev').disabled = false;
    document.getElementById('btn-play').disabled = false;
    document.getElementById('btn-next').disabled = false;
}

function graphDisablePlaybackButtons() {
    document.getElementById('btn-prev').disabled = true;
    document.getElementById('btn-play').disabled = true;
    document.getElementById('btn-next').disabled = true;
}

// ── Tab Management ───────────────────────────────────────────────────────────

function switchGraphTab(tabName) {
    graphStopAutoPlay();
    
    const tabs = ['visualize', 'compare', 'complexity'];
    tabs.forEach(t => {
        const div = document.getElementById(`graph-tab-${t}`);
        const btn = document.getElementById(`tab-btn-${t}`);
        if (t === tabName) {
            div.classList.remove('hidden');
            btn.className = "py-2 px-6 font-headline text-xs tracking-wider border border-cyber-cyan bg-cyber-purple/10 text-cyber-cyan glow-text-cyan hover:border-cyber-cyan transition-all";
        } else {
            div.classList.add('hidden');
            btn.className = "py-2 px-6 font-headline text-xs tracking-wider border border-transparent text-on-surface/60 hover:text-on-surface hover:border-cyber-purple/40 transition-all";
        }
    });

    if (tabName === 'compare') {
        runGraphBenchmark();
    }
}

// ── Benchmark Suite ──────────────────────────────────────────────────────────

function runGraphBenchmark() {
    const parsed = parseEdgesInput();
    const nodes = parsed.nodes;
    const edges = parsed.edges;

    if (nodes.length === 0 || edges.length === 0) {
        document.getElementById('comp-metric-dijk').textContent = 'N/A';
        document.getElementById('comp-metric-krus').textContent = 'N/A';
        document.getElementById('comp-metric-prim').textContent = 'N/A';
        return;
    }

    const source = document.getElementById('source-node').value.trim() || nodes[0];
    const target = document.getElementById('target-node').value.trim() || nodes[nodes.length - 1];

    // Dijkstra
    const t0 = performance.now();
    const resDijk = runDijkstra(nodes, edges, source, target);
    const t1 = performance.now();
    const timeDijk = t1 - t0;

    // Kruskal
    const t2 = performance.now();
    const resKrus = runKruskal(nodes, edges);
    const t3 = performance.now();
    const timeKrus = t3 - t2;

    // Prim
    // Build adj list for Prim
    const adj = {};
    nodes.forEach(n => adj[n] = []);
    edges.forEach(e => {
        adj[e.u].push({ u: e.u, v: e.v, w: e.weight });
        adj[e.v].push({ u: e.v, v: e.u, w: e.weight });
    });
    const t4 = performance.now();
    const resPrim = runPrim(nodes, edges);
    const t5 = performance.now();
    const timePrim = t5 - t4;

    // Render Metrics cards
    const dijkVal = resDijk.dist[target];
    document.getElementById('comp-metric-dijk').textContent = dijkVal === Infinity ? '∞' : dijkVal;
    document.getElementById('comp-time-dijk').textContent = `${timeDijk.toFixed(3)}ms`;

    document.getElementById('comp-metric-krus').textContent = resKrus.totalWeight;
    document.getElementById('comp-time-krus').textContent = `${timeKrus.toFixed(3)}ms`;

    document.getElementById('comp-metric-prim').textContent = resPrim.totalWeight;
    document.getElementById('comp-time-prim').textContent = `${timePrim.toFixed(3)}ms`;

    // Render Table
    const tbody = document.getElementById('comp-results-table-body');
    tbody.innerHTML = '';

    const results = [
        { name: "Dijkstra Path", result: dijkVal === Infinity ? '∞ (No Path)' : `dist = ${dijkVal}`, steps: resDijk.steps.length, time: timeDijk },
        { name: "Kruskal MST", result: `weight = ${resKrus.totalWeight}`, steps: resKrus.steps.length, time: timeKrus },
        { name: "Prim MST", result: `weight = ${resPrim.totalWeight}`, steps: resPrim.steps.length, time: timePrim }
    ];

    results.forEach(res => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/2 transition-colors";
        tr.innerHTML = `
            <td class="py-3 text-on-surface font-headline font-bold">${res.name}</td>
            <td class="py-3 font-mono text-cyber-cyan">${res.result}</td>
            <td class="py-3 font-mono text-on-surface/75">${res.steps}</td>
            <td class="py-3 font-mono text-cyber-pink">${res.time.toFixed(4)} ms</td>
        `;
        tbody.appendChild(tr);
    });

    // Render Bar Chart
    renderGraphComparisonChart({
        'Dijkstra': timeDijk,
        'Kruskal': timeKrus,
        'Prim': timePrim
    });
}

function renderGraphComparisonChart(timesMap) {
    const container = document.getElementById('graph-chart-container');
    container.innerHTML = '';

    const maxVal = Math.max(...Object.values(timesMap), 0.001);
    const colors = {
        'Dijkstra': '#05ffa1', // cyan
        'Kruskal': '#ff00e6',  // pink
        'Prim': '#bc13fe'      // purple
    };

    for (const [name, val] of Object.entries(timesMap)) {
        const heightPercent = (val / maxVal) * 85;

        const barCol = document.createElement('div');
        barCol.className = "flex flex-col items-center flex-grow h-full justify-end group relative text-center";

        barCol.innerHTML = `
            <div class="text-[8px] font-mono text-cyber-cyan mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ${val.toFixed(4)}ms
            </div>
            <div class="w-14 border border-cyber-purple/20 bg-surface-dark transition-all duration-300 hover:border-cyber-cyan relative" 
                 style="height: ${heightPercent}%; background-color: ${colors[name]}20; border-color: ${colors[name]}50;">
            </div>
            <div class="text-[8px] font-headline tracking-tighter mt-2 text-on-surface/50 truncate w-14 text-center">
                ${name}
            </div>
        `;
        container.appendChild(barCol);
    }
}

// ── Initializer ──────────────────────────────────────────────────────────────

function initGraphVisualizer() {
    canvas = document.getElementById('graph-canvas');
    ctx = canvas.getContext('2d');

    // Handle canvas resizing
    window.addEventListener('resize', drawGraph);

    // Initial resize of canvas to container dimensions before setting up node positions
    const rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = rect.height || 320;

    // Define initial positions on grid
    updateGraphStructure();

    // Attach listeners
    initDragListeners();

    // Hook Form Control buttons
    document.getElementById('btn-generate').addEventListener('click', () => {
        graphStopAutoPlay();
        updateGraphStructure();
    });

    document.getElementById('btn-run').addEventListener('click', () => {
        graphStopAutoPlay();
        
        const parsed = parseEdgesInput();
        const nodes = parsed.nodes;
        const edges = parsed.edges;

        if (nodes.length === 0 || edges.length === 0) {
            alert("No nodes or edges found! Please review u,v,weight input formatting.");
            return;
        }

        const algo = document.getElementById('algo-select').value;
        const source = document.getElementById('source-node').value.trim();
        const target = document.getElementById('target-node').value.trim();

        if (algo === 'dijkstra') {
            if (!nodes.includes(source) || !nodes.includes(target)) {
                alert(`Error: Source node '${source}' or Target node '${target}' is not in the graph nodes list: ${nodes.join(', ')}`);
                return;
            }
            const res = runDijkstra(nodes, edges, source, target);
            graphSteps = res.steps;
        } else if (algo === 'kruskal') {
            const res = runKruskal(nodes, edges);
            graphSteps = res.steps;
        } else if (algo === 'prim') {
            const res = runPrim(nodes, edges);
            graphSteps = res.steps;
        }

        graphStepIndex = 0;
        graphEnablePlaybackButtons();
        graphRenderStep();
    });

    // Hook playback controls
    document.getElementById('btn-prev').addEventListener('click', graphStepPrev);
    document.getElementById('btn-play').addEventListener('click', graphTogglePlay);
    document.getElementById('btn-next').addEventListener('click', graphStepNext);

    // Speed slider UI updates
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');
    speedSlider.addEventListener('input', () => {
        speedVal.textContent = `${speedSlider.value}ms`;
        if (graphAutoPlayInterval) {
            // Restart with new speed
            graphStopAutoPlay();
            graphTogglePlay();
        }
    });

    // Make switchGraphTab globally accessible
    window.switchGraphTab = switchGraphTab;
}

// Auto-run init
initGraphVisualizer();
