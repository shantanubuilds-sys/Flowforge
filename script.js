/* =========================================
   FLOWFORGE
   WORKFLOW ENGINE
   ========================================= */


/* ================= STATE ================= */

let nodes = [];

let nodeId = 0;


/* ================= DOM ================= */

const canvas = document.getElementById("canvas");

const emptyState = document.getElementById("emptyState");

const nodeCount = document.getElementById("nodeCount");

const runBtn = document.getElementById("runBtn");

const clearBtn = document.getElementById("clearBtn");

const status = document.getElementById("status");

const logsContainer = document.getElementById("logsContainer");


/* ================= NODE DEFINITIONS ================= */

const nodeTypes = {

    trigger: {
        title: "Trigger",
        icon: "⚡",
        description: "Starts the workflow"
    },

    action: {
        title: "Action",
        icon: "⚙️",
        description: "Performs an action"
    },

    condition: {
        title: "Condition",
        icon: "🔀",
        description: "Checks a condition"
    },

    output: {
        title: "Output",
        icon: "📤",
        description: "Produces final output"
    }

};


/* ================= ADD NODE ================= */

function addNode(type) {

    const definition = nodeTypes[type];

    if (!definition) return;


    nodeId++;


    const node = {

        id: nodeId,

        type: type,

        x: 100 + ((nodeId - 1) % 3) * 230,

        y: 100 + Math.floor((nodeId - 1) / 3) * 150

    };


    nodes.push(node);


    renderNode(node);

    updateNodeCount();

    hideEmptyState();

}


/* ================= RENDER NODE ================= */

function renderNode(node) {

    const definition = nodeTypes[node.type];


    const element = document.createElement("div");

    element.className =
        `workflow-node node-${node.type}`;

    element.dataset.id = node.id;


    element.style.left = `${node.x}px`;

    element.style.top = `${node.y}px`;


    element.innerHTML = `

        <div class="node-header">

            <div class="node-title">

                <span>${definition.icon}</span>

                ${definition.title}

            </div>

            <button class="delete-node">
                ×
            </button>

        </div>

        <div class="node-body">

            ${definition.description}

        </div>

        ${
            node.type !== "trigger"
                ? `<div class="node-port input-port"></div>`
                : ""
        }

        ${
            node.type !== "output"
                ? `<div class="node-port output-port"></div>`
                : ""
        }

    `;


    canvas.appendChild(element);


    /* Delete node */

    const deleteButton =
        element.querySelector(".delete-node");


    deleteButton.addEventListener("click", () => {

        deleteNode(node.id);

    });


    /* Drag node */

    makeDraggable(element, node);

}


/* ================= DELETE NODE ================= */

function deleteNode(id) {

    nodes = nodes.filter(node => node.id !== id);


    const element =
        document.querySelector(
            `.workflow-node[data-id="${id}"]`
        );


    if (element) {

        element.remove();

    }


    updateNodeCount();


    if (nodes.length === 0) {

        emptyState.style.display = "block";

    }

}


/* ================= DRAGGING ================= */

function makeDraggable(element, node) {

    let dragging = false;

    let offsetX = 0;

    let offsetY = 0;


    element.addEventListener("mousedown", startDrag);


    function startDrag(event) {

        if (
            event.target.classList.contains("delete-node")
        ) {
            return;
        }


        dragging = true;


        offsetX =
            event.clientX -
            element.getBoundingClientRect().left;

        offsetY =
            event.clientY -
            element.getBoundingClientRect().top;


        document.addEventListener(
            "mousemove",
            drag
        );

        document.addEventListener(
            "mouseup",
            stopDrag
        );

    }


    function drag(event) {

        if (!dragging) return;


        const rect =
            canvas.getBoundingClientRect();


        node.x =
            event.clientX -
            rect.left -
            offsetX +
            canvas.scrollLeft;


        node.y =
            event.clientY -
            rect.top -
            offsetY +
            canvas.scrollTop;


        element.style.left =
            `${node.x}px`;

        element.style.top =
            `${node.y}px`;

    }


    function stopDrag() {

        dragging = false;


        document.removeEventListener(
            "mousemove",
            drag
        );

        document.removeEventListener(
            "mouseup",
            stopDrag
        );

    }

}


/* ================= NODE COUNT ================= */

function updateNodeCount() {

    nodeCount.textContent =
        `${nodes.length} ${
            nodes.length === 1
                ? "node"
                : "nodes"
        }`;

}


/* ================= EMPTY STATE ================= */

function hideEmptyState() {

    emptyState.style.display = "none";

}


/* ================= LOGGING ================= */

function addLog(message) {

    const log =
        document.createElement("div");


    log.className = "log";

    log.textContent = message;


    logsContainer.appendChild(log);


    logsContainer.scrollTop =
        logsContainer.scrollHeight;

}


/* ================= RUN WORKFLOW ================= */

async function runWorkflow() {

    if (nodes.length === 0) {

        addLog("❌ No nodes in workflow.");

        return;

    }


    status.textContent =
        "● Running...";

    status.className =
        "status running";


    logsContainer.innerHTML = "";


    addLog("Workflow execution started.");


    const sortedNodes =
        [...nodes].sort(
            (a, b) => a.x - b.x
        );


    for (const node of sortedNodes) {

        const definition =
            nodeTypes[node.type];


        addLog(
            `${definition.icon} Executing ${definition.title}...`
        );


        await wait(700);

    }


    addLog(
        "✅ Workflow completed successfully."
    );


    status.textContent =
        "● Completed";

    status.className =
        "status success";

}


/* ================= DELAY ================= */

function wait(ms) {

    return new Promise(
        resolve => setTimeout(resolve, ms)
    );

}


/* ================= CLEAR ================= */

function clearWorkflow() {

    nodes = [];

    nodeId = 0;


    document
        .querySelectorAll(".workflow-node")
        .forEach(node => node.remove());


    updateNodeCount();


    emptyState.style.display =
        "block";


    logsContainer.innerHTML = `

        <div class="log-placeholder">

            Workflow execution logs will appear here.

        </div>

    `;


    status.textContent =
        "● Ready";

    status.className =
        "status idle";

}


/* ================= LIBRARY EVENTS ================= */

document
    .querySelectorAll(".library-node")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const type =
                    button.dataset.type;

                addNode(type);

            }
        );

    });


/* ================= BUTTON EVENTS ================= */

runBtn.addEventListener(
    "click",
    runWorkflow
);


clearBtn.addEventListener(
    "click",
    clearWorkflow
);
