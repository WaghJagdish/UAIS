// router.js

// ── Timer Registry & Wrappers (Professional cleanup system) ────────────────
const nativeSetInterval = window.setInterval;
const nativeClearInterval = window.clearInterval;
const nativeSetTimeout = window.setTimeout;
const nativeClearTimeout = window.clearTimeout;

const activeIntervals = new Set();
const activeTimeouts = new Set();

window.setInterval = function(callback, delay, ...args) {
    const id = nativeSetInterval(callback, delay, ...args);
    activeIntervals.add(id);
    return id;
};

window.clearInterval = function(id) {
    nativeClearInterval(id);
    activeIntervals.delete(id);
};

window.setTimeout = function(callback, delay, ...args) {
    const id = nativeSetTimeout(callback, delay, ...args);
    activeTimeouts.add(id);
    return id;
};

window.clearTimeout = function(id) {
    nativeClearTimeout(id);
    activeTimeouts.delete(id);
};

window.clearAllPageTimers = function() {
    activeIntervals.forEach(id => nativeClearInterval(id));
    activeIntervals.clear();
    activeTimeouts.forEach(id => nativeClearTimeout(id));
    activeTimeouts.clear();
};

// Page keys mapping

const PAGES = {
    'home': 'modules/home.html',
    'sorting': 'modules/sorting.html',
    'searching': 'modules/searching.html',
    'paradigms': 'modules/paradigms.html',
    'strings': 'modules/strings.html',
    'graph': 'modules/graph.html',
    'streaming': 'modules/streaming.html'
};

const SIDEBAR_MAP = {
    'home': null,
    'sorting': 'side-sorting',
    'searching': 'side-searching',
    'paradigms': 'side-paradigms',
    'strings': 'side-strings',
    'graph': 'side-graph',
    'streaming': 'side-streaming'
};

let currentPage = 'home';

// Toggle Dropdown for Simulations
function toggleDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('simulations-dropdown');
    dropdown.classList.toggle('hidden');
}

// Close dropdown when clicking outside
window.addEventListener('click', function(e) {
    const dropdown = document.getElementById('simulations-dropdown');
    const navSimulations = document.getElementById('nav-simulations');
    if (dropdown && !dropdown.classList.contains('hidden') && e.target !== navSimulations) {
        dropdown.classList.add('hidden');
    }
});

// Navigate to a page
function navigateTo(page) {
    if (!PAGES[page]) return;
    currentPage = page;
    
    // Close dropdown
    const dropdown = document.getElementById('simulations-dropdown');
    if (dropdown) dropdown.classList.add('hidden');

    // Update query parameter without forcing full reload
    const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?page=' + page;
    window.history.pushState({path:newurl}, '', newurl);
    
    loadView(page);
}

// Load and render view
async function loadView(page) {
    // Clear all active intervals and timeouts from previous page scripts to prevent leakage
    window.clearAllPageTimers();


    const contentArea = document.getElementById('app-content');
    const sidebar = document.getElementById('app-sidebar');
    
    // 1. Sidebar visibility
    if (page === 'home') {
        sidebar.className = "hidden";
        document.getElementById('nav-home').className = "text-[9px] sm:text-[10px] font-headline tracking-[0.2em] sm:tracking-[0.3em] text-cyber-cyan glow-text-cyan border-b-2 border-cyber-cyan pb-1";
    } else {
        sidebar.className = "hidden lg:flex lg:w-64 border-r border-cyber-purple/20 bg-surface-dark/90 backdrop-blur-md p-6 flex-col justify-between shrink-0";
        document.getElementById('nav-home').className = "text-[9px] sm:text-[10px] font-headline tracking-[0.2em] sm:tracking-[0.3em] text-on-surface/50 hover:text-cyber-purple transition-colors pb-1";
    }

    // Update navigation active states
    // Header navigations
    const navSimulations = document.getElementById('nav-simulations');
    if (page !== 'home') {
        navSimulations.className = "text-[9px] sm:text-[10px] font-headline tracking-[0.2em] sm:tracking-[0.3em] text-cyber-cyan glow-text-cyan border-b-2 border-cyber-cyan pb-1";
    } else {
        navSimulations.className = "text-[9px] sm:text-[10px] font-headline tracking-[0.2em] sm:tracking-[0.3em] text-on-surface/50 hover:text-cyber-purple transition-colors pb-1";
    }

    // Sidebar active options
    for (const [key, sideId] of Object.entries(SIDEBAR_MAP)) {
        if (!sideId) continue;
        const el = document.getElementById(sideId);
        if (!el) continue;
        if (key === page) {
            el.className = "flex items-center gap-3 py-2 px-3 border border-cyber-cyan/30 text-xs bg-cyber-purple/10 text-cyber-cyan transition-all";
        } else {
            el.className = "flex items-center gap-3 py-2 px-3 border border-transparent text-xs hover:border-cyber-purple/40 text-on-surface/60 hover:text-on-surface transition-all";
        }
    }

    // 2. Fetch and render view content
    try {
        const response = await fetch(`${PAGES[page]}?t=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`Failed to load view file: ${PAGES[page]}`);
        }
        const html = await response.text();
        contentArea.innerHTML = html;

        // If Spline viewer needs loading/rendering trigger (Spline viewer script element is loaded on demand if needed)
        if (page === 'home') {
            initSpline();
        }

        // Dynamically load corresponding JS logic file
        loadModuleScript(page);

    } catch (error) {
        console.error(error);
        contentArea.innerHTML = `
            <div class="hud-border-purple bg-surface-dark/80 p-8 text-center max-w-xl mx-auto mt-20">
                <span class="material-symbols-outlined text-cyber-pink text-5xl mb-4">error</span>
                <h3 class="text-xl font-headline mb-2 text-cyber-pink">MODULE_LOAD_FAILURE</h3>
                <p class="text-xs text-on-surface/60 font-mono mb-4">${error.message}</p>
                <button class="cyber-btn px-6 py-2" onclick="navigateTo('home')">BACK_TO_ROOT</button>
            </div>
        `;
    }
}

// Load spline script on demand for home page
function initSpline() {
    if (!document.querySelector('script[src*="spline-viewer.js"]')) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = "https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js";
        document.head.appendChild(script);
    }
}

// Keep track of loaded modules scripts to avoid duplicates
const loadedScripts = {};

function loadModuleScript(page) {
    if (page === 'home') return; // Home has no dedicated script logic other than template

    // Add cache-busting parameter to force the browser to re-execute the module on every navigation re-entry
    const scriptPath = `modules/${page}.js?t=${Date.now()}`;
    
    // Remove previous script to allow fresh execution on page re-entry
    const existing = document.getElementById(`module-script-${page}`);
    if (existing) {
        existing.remove();
    }

    const script = document.createElement('script');
    script.id = `module-script-${page}`;
    script.src = scriptPath;
    script.type = 'module';
    document.body.appendChild(script);
}

// Sync clock in UTC
function startHUDClock() {
    nativeSetInterval(() => {
        const timeEl = document.getElementById('time-display');
        const now = new Date();
        const timeStr = `T_STAMP: ${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}:${now.getUTCSeconds().toString().padStart(2, '0')}_UTC`;
        if (timeEl) timeEl.textContent = timeStr;
    }, 1000);
}

// Initial Routing on page load
window.addEventListener('load', () => {
    startHUDClock();
    
    // Parse URL query parameter
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') || 'home';
    
    navigateTo(page);
});

// Handle browser Back/Forward navigation
window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') || 'home';
    loadView(page);
});

// Expose navigateTo globally so navigation links can trigger it
window.navigateTo = navigateTo;
window.toggleDropdown = toggleDropdown;
