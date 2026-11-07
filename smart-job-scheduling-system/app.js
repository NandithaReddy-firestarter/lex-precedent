/* ==========================================================================
   SMART JOB SCHEDULING SYSTEM - CORE ENGINE (app.js)
   Manages job state, greedy logic, simulation steps, and UI bindings.
   ========================================================================== */

// --- Global Application State ---
let jobsList = [];
let editJobId = null;

// Table Sorting States
let sortingColumn = 'profit'; // default sort by profit
let sortingOrder = 'desc';    // default descending order
let searchQuery = '';

// Simulation / Visualization States
let simulationSteps = [];
let currentStepIndex = 0;
let animationTimer = null;
let isPlaying = false;
let animationSpeed = 1000; // ms

// --- Preset Data Definitions ---
const presets = {
    standard: [
        { id: 'J1', deadline: 2, profit: 100 },
        { id: 'J2', deadline: 1, profit: 19 },
        { id: 'J3', deadline: 2, profit: 27 },
        { id: 'J4', deadline: 1, profit: 25 },
        { id: 'J5', deadline: 3, profit: 15 }
    ],
    clash: [
        { id: 'Task_A', deadline: 2, profit: 80 },
        { id: 'Task_B', deadline: 2, profit: 70 },
        { id: 'Task_C', deadline: 1, profit: 90 },
        { id: 'Task_D', deadline: 1, profit: 85 },
        { id: 'Task_E', deadline: 3, profit: 40 }
    ],
    extended: [
        { id: 'A', deadline: 4, profit: 70 },
        { id: 'B', deadline: 2, profit: 60 },
        { id: 'C', deadline: 4, profit: 50 },
        { id: 'D', deadline: 3, profit: 40 },
        { id: 'E', deadline: 1, profit: 30 },
        { id: 'F', deadline: 4, profit: 20 },
        { id: 'G', deadline: 6, profit: 10 }
    ]
};

// --- DOM Elements Cache ---
const jobForm = document.getElementById('job-form');
const jobIdInput = document.getElementById('job-id');
const jobDeadlineInput = document.getElementById('job-deadline');
const jobProfitInput = document.getElementById('job-profit');
const btnAddJob = document.getElementById('btn-add-job');
const btnClear = document.getElementById('btn-clear');
const btnRunSchedule = document.getElementById('btn-run-schedule');
const tableBody = document.getElementById('table-body');
const tableEmptyState = document.getElementById('table-empty-state');
const tableSearch = document.getElementById('table-search');

// Stats Counters
const statTotalJobs = document.getElementById('stat-total-jobs');
const statScheduledJobs = document.getElementById('stat-scheduled-jobs');
const statMaxProfit = document.getElementById('stat-max-profit');
const statSlotsUtil = document.getElementById('stat-slots-util');

// Visualizer Components
const visJobsPool = document.getElementById('vis-jobs-pool');
const visTimeline = document.getElementById('vis-timeline');
const visLog = document.getElementById('vis-log');
const visStepCounter = document.getElementById('vis-step-counter');
const speedSlider = document.getElementById('speed-slider');

const btnVisPlay = document.getElementById('btn-vis-play');
const btnVisPrev = document.getElementById('btn-vis-prev');
const btnVisNext = document.getElementById('btn-vis-next');
const btnVisReset = document.getElementById('btn-vis-reset');

// Results elements
const resultScheduledCount = document.getElementById('result-scheduled-count');
const resultScheduledList = document.getElementById('result-scheduled-list');
const resultProfitVal = document.getElementById('result-profit-val');
const resultProfitCalc = document.getElementById('result-profit-calc');
const resultRejectedCount = document.getElementById('result-rejected-count');
const resultRejectedList = document.getElementById('result-rejected-list');

// Toast
const errorToast = document.getElementById('error-toast');
const toastMessage = document.getElementById('toast-message');

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
    // Setup initial data charts
    initCharts();
    
    // Load standard preset on start to show realistic active system immediately
    loadPreset('standard');
    
    // Setup form submit handlers
    jobForm.addEventListener('submit', handleFormSubmit);
    
    // Setup table sorting & searching
    document.getElementById('sort-deadline').addEventListener('click', () => toggleSort('deadline'));
    document.getElementById('sort-profit').addEventListener('click', () => toggleSort('profit'));
    tableSearch.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderTable();
    });
    
    // Setup clear and run buttons
    btnClear.addEventListener('click', clearAllJobs);
    btnRunSchedule.addEventListener('click', runSchedulingAlgorithm);
    
    // Setup visualizer button listeners
    btnVisPlay.addEventListener('click', togglePlay);
    btnVisPrev.addEventListener('click', stepBackward);
    btnVisNext.addEventListener('click', stepForward);
    btnVisReset.addEventListener('click', resetSimulation);
    
    speedSlider.addEventListener('input', (e) => {
        // Range slider value represents speed. Note: lower slider values = faster execution.
        // We invert the value calculation: max interval is 2500ms, min is 200ms.
        // The slider ranges from 200 (fast) to 2500 (slow) in HTML.
        animationSpeed = parseInt(e.target.value);
        if (isPlaying) {
            // Restart interval with new speed
            pauseSimulation();
            playSimulation();
        }
    });

    // Run scheduler initially on the loaded preset
    runSchedulingAlgorithm();
});

/* ==========================================================================
   FORM HANDLING & INPUT VALIDATION
   ========================================================================== */
function showToast(message) {
    toastMessage.textContent = message;
    errorToast.classList.add('show');
    
    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
        errorToast.classList.remove('show');
    }, 3500);
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = jobIdInput.value.trim();
    const deadline = parseInt(jobDeadlineInput.value);
    const profit = parseFloat(jobProfitInput.value);

    // --- Validation Rules ---
    if (!id) {
        showToast("Job ID cannot be blank.");
        return;
    }
    
    if (deadline < 1 || isNaN(deadline)) {
        showToast("Deadline must be an integer greater than or equal to 1.");
        return;
    }
    
    if (profit < 0 || isNaN(profit)) {
        showToast("Profit must be a number greater than or equal to 0.");
        return;
    }

    // Check uniqueness (if adding new, or modifying to a different ID)
    const existingIndex = jobsList.findIndex(j => j.id.toLowerCase() === id.toLowerCase());
    
    if (editJobId === null) {
        // Adding new job
        if (existingIndex !== -1) {
            showToast(`A job with ID "${id}" already exists.`);
            return;
        }
        jobsList.push({ id, deadline, profit });
    } else {
        // Editing existing job
        if (existingIndex !== -1 && jobsList[existingIndex].id !== editJobId) {
            showToast(`A job with ID "${id}" already exists.`);
            return;
        }
        
        const editIndex = jobsList.findIndex(j => j.id === editJobId);
        jobsList[editIndex] = { id, deadline, profit };
        
        // Reset edit states
        editJobId = null;
        btnAddJob.innerHTML = '<i class="fa-solid fa-plus"></i> Add Job';
        jobIdInput.disabled = false;
    }

    jobForm.reset();
    renderTable();
    updateDashboardSummary();
}

/* ==========================================================================
   PRESET MANAGEMENT
   ========================================================================== */
function loadPreset(presetKey) {
    if (!presets[presetKey]) return;
    
    // Stop any active simulations
    resetSimulation();
    
    // Copy preset data
    jobsList = JSON.parse(JSON.stringify(presets[presetKey]));
    
    // Reset edit state just in case
    editJobId = null;
    btnAddJob.innerHTML = '<i class="fa-solid fa-plus"></i> Add Job';
    jobIdInput.disabled = false;
    jobForm.reset();

    // Redraw and update stats
    renderTable();
    updateDashboardSummary();
}

function clearAllJobs() {
    resetSimulation();
    jobsList = [];
    editJobId = null;
    btnAddJob.innerHTML = '<i class="fa-solid fa-plus"></i> Add Job';
    jobIdInput.disabled = false;
    jobForm.reset();
    
    renderTable();
    updateDashboardSummary();
    resetCharts();
    
    // Clear outputs
    visLog.innerHTML = '<div class="log-entry info">Queue cleared. Add jobs to start again.</div>';
    visJobsPool.innerHTML = '';
    visTimeline.innerHTML = '';
    
    resultScheduledCount.textContent = '0';
    resultScheduledList.innerHTML = '';
    resultProfitVal.textContent = '0';
    resultProfitCalc.textContent = 'No jobs scheduled';
    resultRejectedCount.textContent = '0';
    resultRejectedList.innerHTML = '';
}

/* ==========================================================================
   JOB TABLE LOGIC (EDIT, DELETE, SORT, SEARCH)
   ========================================================================== */
function renderTable() {
    // Filter by search query
    let filteredJobs = jobsList.filter(job => 
        job.id.toLowerCase().includes(searchQuery)
    );

    // Apply sorting
    filteredJobs.sort((a, b) => {
        let valA = a[sortingColumn];
        let valB = b[sortingColumn];
        
        if (typeof valA === 'string') {
            return sortingOrder === 'asc' 
                ? valA.localeCompare(valB) 
                : valB.localeCompare(valA);
        } else {
            return sortingOrder === 'asc' ? valA - valB : valB - valA;
        }
    });

    // Toggle Empty State Visibility
    if (filteredJobs.length === 0) {
        tableBody.innerHTML = '';
        tableEmptyState.style.display = 'flex';
    } else {
        tableEmptyState.style.display = 'none';
        
        tableBody.innerHTML = filteredJobs.map(job => `
            <tr>
                <td style="font-weight: 600;">${job.id}</td>
                <td>${job.deadline}</td>
                <td style="color: var(--accent); font-weight: 600;">$${job.profit}</td>
                <td style="text-align: center;">
                    <div class="action-buttons" style="justify-content: center;">
                        <button class="btn-icon edit" onclick="editJob('${job.id}')" title="Edit Job">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deleteJob('${job.id}')" title="Delete Job">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    // Update active sort indicator in table headers
    updateSortHeaders();
}

function updateSortHeaders() {
    const deadlineHeader = document.getElementById('sort-deadline');
    const profitHeader = document.getElementById('sort-profit');
    
    const ascArrow = '<i class="fa-solid fa-sort-up"></i>';
    const descArrow = '<i class="fa-solid fa-sort-down"></i>';
    const defaultArrow = '<i class="fa-solid fa-sort"></i>';

    if (sortingColumn === 'deadline') {
        deadlineHeader.innerHTML = `Deadline ${sortingOrder === 'asc' ? ascArrow : descArrow}`;
        profitHeader.innerHTML = `Profit ${defaultArrow}`;
    } else if (sortingColumn === 'profit') {
        profitHeader.innerHTML = `Profit ${sortingOrder === 'asc' ? ascArrow : descArrow}`;
        deadlineHeader.innerHTML = `Deadline ${defaultArrow}`;
    }
}

function toggleSort(column) {
    if (sortingColumn === column) {
        sortingOrder = sortingOrder === 'asc' ? 'desc' : 'asc';
    } else {
        sortingColumn = column;
        sortingOrder = 'desc'; // default to high-to-low on change
    }
    renderTable();
}

function deleteJob(id) {
    // If the job being edited is deleted, cancel edit mode
    if (editJobId === id) {
        editJobId = null;
        btnAddJob.innerHTML = '<i class="fa-solid fa-plus"></i> Add Job';
        jobIdInput.disabled = false;
        jobForm.reset();
    }
    
    jobsList = jobsList.filter(job => job.id !== id);
    renderTable();
    updateDashboardSummary();
}

function editJob(id) {
    const job = jobsList.find(j => j.id === id);
    if (!job) return;
    
    editJobId = id;
    jobIdInput.value = job.id;
    jobDeadlineInput.value = job.deadline;
    jobProfitInput.value = job.profit;
    
    // Toggle primary button state
    btnAddJob.innerHTML = '<i class="fa-solid fa-check"></i> Save Changes';
    // Lock key Job ID editing to avoid integrity errors
    jobIdInput.disabled = true;
    
    // Scroll form into view for mobile users
    jobForm.scrollIntoView({ behavior: 'smooth' });
}

function updateDashboardSummary() {
    statTotalJobs.textContent = jobsList.length;
}

/* ==========================================================================
   GREEDY ALGORITHM CORE & STEP GENERATION
   ========================================================================== */
function runSchedulingAlgorithm() {
    if (jobsList.length === 0) {
        showToast("Please add at least one job to run the scheduler.");
        return;
    }
    
    resetSimulation();
    generateSimulationSteps();
    
    // Jump straight to the final step of simulation to display static result initially
    currentStepIndex = simulationSteps.length - 1;
    renderStateAtStep(currentStepIndex);
    
    // Smooth scroll to visualizer area so user notices updates
    const visualizerEl = document.getElementById('visualizer');
    visualizerEl.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Executes the Greedy Job Sequencing algorithm and populates the simulationSteps array.
 * Each step captures a deep clone of the system state for step scrubbing.
 */
function generateSimulationSteps() {
    simulationSteps = [];
    
    // Make copy of list and sort by profit descending
    const sortedJobs = [...jobsList].sort((a, b) => b.profit - a.profit);
    
    // Find maximum deadline
    let maxDeadline = 0;
    sortedJobs.forEach(job => {
        if (job.deadline > maxDeadline) {
            maxDeadline = job.deadline;
        }
    });

    // Limit maximum slots to 20 for visual clarity in timeline UI
    // If maximum deadline exceeds 20, we caps the timeline and skip out-of-bound slots
    const totalSlots = Math.min(maxDeadline, 20);
    
    // Slots array: 1-indexed, size totalSlots + 1 (representing times slots 1..totalSlots)
    const timeline = new Array(totalSlots + 1).fill(null);
    let accumulatedProfit = 0;
    
    // Map tracking job ID to state: 'pending', 'active', 'scheduled', 'rejected'
    const jobStates = {};
    jobsList.forEach(j => {
        jobStates[j.id] = 'pending';
    });

    // --- STEP 0: Initialization ---
    simulationSteps.push({
        type: 'init',
        jobId: null,
        slot: null,
        message: `System initialized. Running greedy scheduling with ${sortedJobs.length} jobs. Max deadline found: ${maxDeadline}. Timeline sized to ${totalSlots} slots.`,
        state: {
            timeline: [...timeline],
            jobStates: { ...jobStates },
            accProfit: 0,
            activeJobId: null,
            activeSlot: null,
            activeSlotStatus: null
        }
    });

    // Iterate over sorted jobs
    for (let i = 0; i < sortedJobs.length; i++) {
        const currentJob = sortedJobs[i];
        const jId = currentJob.id;
        
        // Mark current job as 'active' (processing)
        jobStates[jId] = 'active';
        
        simulationSteps.push({
            type: 'examine',
            jobId: jId,
            slot: null,
            message: `<strong>Examine:</strong> Job ${jId} has profit $${currentJob.profit} and deadline ${currentJob.deadline}. Searching for empty slot...`,
            state: {
                timeline: [...timeline],
                jobStates: { ...jobStates },
                accProfit: accumulatedProfit,
                activeJobId: jId,
                activeSlot: null,
                activeSlotStatus: null
            }
        });

        // Determine latest starting slot index to search backwards
        // (Must be <= job deadline, and <= max visible slots)
        const startSlot = Math.min(currentJob.deadline, totalSlots);
        let assignedSlot = -1;

        // Trace backward search
        for (let s = startSlot; s >= 1; s--) {
            // Step: Scanning slot 's'
            simulationSteps.push({
                type: 'scan',
                jobId: jId,
                slot: s,
                message: `Scanning timeline Slot ${s} (${s-1}-${s}) for Job ${jId}...`,
                state: {
                    timeline: [...timeline],
                    jobStates: { ...jobStates },
                    accProfit: accumulatedProfit,
                    activeJobId: jId,
                    activeSlot: s,
                    activeSlotStatus: 'checking'
                }
            });

            if (timeline[s] === null) {
                // Free slot found! Allocate job
                timeline[s] = jId;
                assignedSlot = s;
                accumulatedProfit += currentJob.profit;
                jobStates[jId] = 'scheduled';
                
                simulationSteps.push({
                    type: 'allocate',
                    jobId: jId,
                    slot: s,
                    message: `<span class="log-entry success"><i class="fa-solid fa-circle-check"></i> SUCCESS: Slot ${s} is free! Scheduled Job ${jId} (Profit: +$${currentJob.profit}).</span>`,
                    state: {
                        timeline: [...timeline],
                        jobStates: { ...jobStates },
                        accProfit: accumulatedProfit,
                        activeJobId: jId,
                        activeSlot: s,
                        activeSlotStatus: 'filled'
                    }
                });
                break;
            } else {
                // Slot occupied, continue scanning backwards
                simulationSteps.push({
                    type: 'scan_fail',
                    jobId: jId,
                    slot: s,
                    message: `Slot ${s} is already occupied by Job ${timeline[s]}. Moving backwards...`,
                    state: {
                        timeline: [...timeline],
                        jobStates: { ...jobStates },
                        accProfit: accumulatedProfit,
                        activeJobId: jId,
                        activeSlot: s,
                        activeSlotStatus: 'failed'
                    }
                });
            }
        }

        // If job could not fit into any slots before its deadline, reject it
        if (assignedSlot === -1) {
            jobStates[jId] = 'rejected';
            simulationSteps.push({
                type: 'reject',
                jobId: jId,
                slot: null,
                message: `<span class="log-entry danger"><i class="fa-solid fa-circle-xmark"></i> REJECTED: All available slots before time ${currentJob.deadline} are occupied. Job ${jId} cannot be scheduled.</span>`,
                state: {
                    timeline: [...timeline],
                    jobStates: { ...jobStates },
                    accProfit: accumulatedProfit,
                    activeJobId: jId,
                    activeSlot: null,
                    activeSlotStatus: null
                }
            });
        }
    }

    // --- FINAL STEP: Complete ---
    simulationSteps.push({
        type: 'finish',
        jobId: null,
        slot: null,
        message: `<span class="log-entry heading">Simulation Complete</span> Total profit maximized: <strong>$${accumulatedProfit}</strong>. Execution slots optimized.`,
        state: {
            timeline: [...timeline],
            jobStates: { ...jobStates },
            accProfit: accumulatedProfit,
            activeJobId: null,
            activeSlot: null,
            activeSlotStatus: null
        }
    });
}

/* ==========================================================================
   STEP RENDERING LOGIC (RECONSTRUCTS THE ENTIRE UI STATE)
   ========================================================================== */
function renderStateAtStep(stepIdx) {
    if (simulationSteps.length === 0) return;
    
    // Clip index boundary
    if (stepIdx < 0) stepIdx = 0;
    if (stepIdx >= simulationSteps.length) stepIdx = simulationSteps.length - 1;
    currentStepIndex = stepIdx;
    
    const activeStep = simulationSteps[stepIdx];
    const snap = activeStep.state;
    
    // --- 1. Update Step Counter ---
    visStepCounter.textContent = `Step: ${currentStepIndex} / ${simulationSteps.length - 1}`;
    
    // --- 2. Update KPI Stats ---
    statMaxProfit.textContent = `$${snap.accProfit}`;
    
    // Calculate scheduled counts
    const scheduledIds = Object.keys(snap.jobStates).filter(id => snap.jobStates[id] === 'scheduled');
    statScheduledJobs.textContent = scheduledIds.length;
    
    const totalVisibleSlots = snap.timeline.length - 1;
    const filledSlotsCount = snap.timeline.filter(val => val !== null).length;
    statSlotsUtil.textContent = `${filledSlotsCount} / ${totalVisibleSlots}`;

    // --- 3. Render Jobs Pool Box (Sorted List) ---
    const sortedJobs = [...jobsList].sort((a, b) => b.profit - a.profit);
    visJobsPool.innerHTML = sortedJobs.map(job => {
        const state = snap.jobStates[job.id] || 'pending';
        let stateClass = '';
        if (state === 'active') stateClass = 'active';
        else if (state === 'scheduled') stateClass = 'scheduled';
        else if (state === 'rejected') stateClass = 'rejected';
        
        return `
            <div class="job-pill ${stateClass}" id="pill-${job.id}">
                <span class="id">${job.id}</span>
                <span class="deadline">DL: ${job.deadline}</span>
                <span class="profit">$${job.profit}</span>
            </div>
        `;
    }).join('');

    // --- 4. Render Timeline Slots ---
    let timelineHTML = '';
    for (let s = 1; s < snap.timeline.length; s++) {
        const jobId = snap.timeline[s];
        const isChecking = (snap.activeSlot === s && snap.activeSlotStatus === 'checking');
        const isFailedScan = (snap.activeSlot === s && snap.activeSlotStatus === 'failed');
        
        let slotClass = '';
        let content = '<span style="color: var(--text-dark); font-size: 0.75rem;">FREE</span>';
        
        if (jobId) {
            slotClass = 'filled';
            const matchedJob = jobsList.find(j => j.id === jobId);
            const profitStr = matchedJob ? `$${matchedJob.profit}` : '';
            content = `
                <div class="slot-job-id">${jobId}</div>
                <div class="slot-profit">${profitStr}</div>
            `;
        } else if (isChecking) {
            slotClass = 'checking';
            content = `<i class="fa-solid fa-arrows-spin fa-spin" style="color: var(--accent); font-size: 1.25rem;"></i>`;
        } else if (isFailedScan) {
            slotClass = '';
            content = `<i class="fa-solid fa-xmark" style="color: var(--danger); font-size: 1.25rem; animation: shake 0.3s;"></i>`;
        }
        
        timelineHTML += `
            <div class="timeline-slot">
                <div class="slot-box ${slotClass}" id="slot-${s}">
                    ${content}
                </div>
                <span class="slot-time">${s-1} - ${s}</span>
            </div>
        `;
    }
    visTimeline.innerHTML = timelineHTML;

    // --- 5. Render Simulation Console Logs ---
    let logsHTML = '';
    for (let i = 0; i <= currentStepIndex; i++) {
        const step = simulationSteps[i];
        let typeClass = 'info';
        if (step.type === 'examine') typeClass = 'info';
        else if (step.type === 'scan') typeClass = 'checking';
        else if (step.type === 'allocate') typeClass = 'success';
        else if (step.type === 'reject') typeClass = 'danger';
        else if (step.type === 'finish') typeClass = 'heading';
        
        logsHTML += `<div class="log-entry ${typeClass}">${step.message}</div>`;
    }
    visLog.innerHTML = logsHTML;
    
    // Auto-scroll log console
    visLog.scrollTop = visLog.scrollHeight;

    // --- 6. Render Results Panels (only update values at the current step snapshot) ---
    updateResultsDashboard(snap);

    // --- 7. Update Graph Analytics ---
    updateCharts(jobsList, scheduledIds, snap.timeline);

    // --- 8. Set navigation buttons enabled/disabled states ---
    btnVisPrev.disabled = (currentStepIndex === 0);
    btnVisNext.disabled = (currentStepIndex === simulationSteps.length - 1);
}

function updateResultsDashboard(snap) {
    const scheduledIds = Object.keys(snap.jobStates).filter(id => snap.jobStates[id] === 'scheduled');
    const rejectedIds = Object.keys(snap.jobStates).filter(id => snap.jobStates[id] === 'rejected');
    
    // List details
    resultScheduledCount.textContent = scheduledIds.length;
    resultRejectedCount.textContent = rejectedIds.length;
    
    if (scheduledIds.length === 0) {
        resultScheduledList.innerHTML = '<div class="empty-state" style="padding: 10px; font-size: 0.8rem;">No jobs scheduled yet</div>';
        resultProfitVal.textContent = '$0';
        resultProfitCalc.textContent = 'Accumulated: $0';
    } else {
        // Scheduled List Items
        resultScheduledList.innerHTML = scheduledIds.map(id => {
            const job = jobsList.find(j => j.id === id);
            return `
                <div class="result-item" style="border-left: 3px solid var(--success);">
                    <span class="item-id">${id}</span>
                    <span class="item-meta">DL: ${job.deadline}</span>
                    <span class="item-val" style="color: var(--success); font-weight: 600;">+$${job.profit}</span>
                </div>
            `;
        }).join('');

        // Math calculation explanation
        resultProfitVal.textContent = `$${snap.accProfit}`;
        const additionChain = scheduledIds.map(id => {
            const j = jobsList.find(x => x.id === id);
            return j.profit;
        }).join(' + ');
        resultProfitCalc.textContent = `Calculation: ${additionChain} = $${snap.accProfit}`;
    }

    if (rejectedIds.length === 0) {
        resultRejectedList.innerHTML = '<div class="empty-state" style="padding: 10px; font-size: 0.8rem;">No jobs rejected</div>';
    } else {
        resultRejectedList.innerHTML = rejectedIds.map(id => {
            const job = jobsList.find(j => j.id === id);
            return `
                <div class="result-item" style="border-left: 3px solid var(--danger); opacity: 0.85;">
                    <span class="item-id">${id}</span>
                    <span class="item-meta">DL: ${job.deadline}</span>
                    <span class="item-val" style="color: var(--danger); font-weight: 600;">$${job.profit}</span>
                </div>
            `;
        }).join('');
    }
}

/* ==========================================================================
   ANIMATION INTERACTIVE LOOPS (PLAY, PAUSE, STEPPERS)
   ========================================================================== */
function togglePlay() {
    if (isPlaying) {
        pauseSimulation();
    } else {
        playSimulation();
    }
}

function playSimulation() {
    if (simulationSteps.length === 0) {
        runSchedulingAlgorithm();
    }
    
    // If user is at the end, restart from beginning
    if (currentStepIndex >= simulationSteps.length - 1) {
        currentStepIndex = 0;
        renderStateAtStep(0);
    }
    
    isPlaying = true;
    btnVisPlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    btnVisPlay.className = 'btn btn-secondary btn-sm'; // Change color to alert playing state
    
    animationTimer = setInterval(() => {
        if (currentStepIndex < simulationSteps.length - 1) {
            stepForward();
        } else {
            pauseSimulation();
        }
    }, animationSpeed);
}

function pauseSimulation() {
    isPlaying = false;
    btnVisPlay.innerHTML = '<i class="fa-solid fa-play"></i> Play';
    btnVisPlay.className = 'btn btn-accent btn-sm';
    clearInterval(animationTimer);
}

function stepForward() {
    if (currentStepIndex < simulationSteps.length - 1) {
        currentStepIndex++;
        renderStateAtStep(currentStepIndex);
    }
}

function stepBackward() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        renderStateAtStep(currentStepIndex);
    }
}

function resetSimulation() {
    pauseSimulation();
    currentStepIndex = 0;
    if (simulationSteps.length > 0) {
        renderStateAtStep(0);
    }
}

/* ==========================================================================
   UI UTILITIES (TABS SWITCHER)
   ========================================================================== */
function switchTab(event, tabId) {
    // Hide all tab contents
    const contents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < contents.length; i++) {
        contents[i].classList.remove('active');
    }
    
    // Deactivate all tab buttons
    const buttons = document.getElementsByClassName('tab-btn');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
    }
    
    // Show selected and activate button
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}
