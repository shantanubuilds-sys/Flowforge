/* =========================================
   FLOWFORGE V0.2
   REAL WORKFLOW CONNECTIONS
   ========================================= */


/* =========================================
   STATE
   ========================================= */


let nodes = [];

let connections = [];

let nodeId = 0;

let connectingFrom = null;


/* =========================================
   DOM ELEMENTS
   ========================================= */


const canvas =
    document.getElementById("canvas");

const connectionsLayer =
    document.getElementById("connectionsLayer");

const emptyState =
    document.getElementById("emptyState");

const nodeCount =
    document.getElementById("nodeCount");

const connectionCount =
    document.getElementById("connectionCount");

const runBtn =
    document.getElementById("runBtn");

const clearBtn =
    document.getElementById("clearBtn");

const status =
    document.getElementById("status");

const logsContainer =
    document.getElementById("logsContainer");


/* =========================================
   NODE DEFINITIONS
   ========================================= */


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


/* =========================================
   ADD NODE
   ========================================= */


function addNode(type) {

    const definition = nodeTypes[type];

    if (!definition) return;


    nodeId++;


    const node = {

        id: nodeId,

        type: type,

        x:
            100 +
            ((nodeId - 1) % 3) * 240,

        y:
            100 +
            Math.floor(
                (nodeId - 1) / 3
            ) * 160

    };


    nodes.push(node);


    renderNode(node);

    updateStats();

    hideEmptyState();

}


/* =========================================
   RENDER NODE
   ========================================= */


function renderNode(node) {

    const definition =
        nodeTypes[node.type];


    const element =
        document.createElement("div");


    element.className =
        `workflow-node node-${node.type}`;


    element.dataset.id =
        node.id;


    element.style.left =
        `${node.x}px`;


    element.style.top =
        `${node.y}px`;


    element.innerHTML = `

        <div class="node-header">

            <div class="node-title">

                <span>
                    ${definition.icon}
                </span>

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
                ? `
                    <div
                        class="node-port input-port"
                        data-port="input"
                    ></div>
                  `
                : ""
        }


        ${
            node.type !== "output"
                ? `
                    <div
                        class="node-port output-port"
                        data-port="output"
                    ></div>
                  `
                : ""
        }

    `;


    canvas.appendChild(element);


    /* Delete */

    const deleteButton =
        element.querySelector(".delete-node");


    deleteButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            deleteNode(node.id);

        }
    );


    /* Output port */

    const outputPort =
        element.querySelector(".output-port");


    if (outputPort) {

        outputPort.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                startConnection(node.id);

            }
        );

    }


    /* Input port */

    const inputPort =
        element.querySelector(".input-port");


    if (inputPort) {

        inputPort.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                finishConnection(node.id);

            }
        );

    }


    /* Dragging */

    makeDraggable(
        element,
        node
    );

}


/* =========================================
   START CONNECTION
   ========================================= */


function startConnection(nodeId) {

    const node =
        nodes.find(
            item => item.id === nodeId
        );


    if (!node) return;


    connectingFrom = nodeId;


    document
        .querySelectorAll(".output-port")
        .forEach(port => {

            port.classList.remove(
                "connecting"
            );

        });


    const element =
        document.querySelector(
            `.workflow-node[data-id="${nodeId}"]`
        );


    const port =
        element.querySelector(
            ".output-port"
        );


    if (port) {

        port.classList.add(
            "connecting"
        );

    }


    addLog(
        `🔗 Select an input port to connect from ${nodeTypes[node.type].title}.`
    );

}


/* =========================================
   FINISH CONNECTION
   ========================================= */


function finishConnection(targetNodeId) {

    if (connectingFrom === null) {

        return;

    }


    const sourceNodeId =
        connectingFrom;


    connectingFrom = null;


    clearPortStates();


    /* Prevent self connection */

    if (
        sourceNodeId === targetNodeId
    ) {

        addLog(
            "❌ A node cannot connect to itself."
        );

        return;

    }


    /* Check duplicate */

    const duplicate =
        connections.some(
            connection =>
                connection.from === sourceNodeId &&
                connection.to === targetNodeId
        );


    if (duplicate) {

        addLog(
            "❌ This connection already exists."
        );

        return;

    }


    /* Create connection */

    connections.push({

        from: sourceNodeId,

        to: targetNodeId

    });


    drawConnections();

    updateStats();


    addLog(
        `🔗 Connected Node ${sourceNodeId} → Node ${targetNodeId}`
    );

}


/* =========================================
   CLEAR PORT STATES
   ========================================= */


function clearPortStates() {

    document
        .querySelectorAll(".node-port")
        .forEach(port => {

            port.classList.remove(
                "connecting"
            );

            port.classList.remove(
                "connection-target"
            );

        });

}


/* =========================================
   DRAW CONNECTIONS
   ========================================= */


function drawConnections() {

    connectionsLayer.innerHTML = "";


    connections.forEach(
        (connection, index) => {

            const sourceElement =
                document.querySelector(
                    `.workflow-node[data-id="${connection.from}"]`
                );


            const targetElement =
                document.querySelector(
                    `.workflow-node[data-id="${connection.to}"]`
                );


            if (
                !sourceElement ||
                !targetElement
            ) {

                return;

            }


            const sourcePort =
                sourceElement.querySelector(
                    ".output-port"
                );


            const targetPort =
                targetElement.querySelector(
                    ".input-port"
                );


            if (
                !sourcePort ||
                !targetPort
            ) {

                return;

            }


            const sourceRect =
                sourcePort.getBoundingClientRect();


            const targetRect =
                targetPort.getBoundingClientRect();


            const canvasRect =
                canvas.getBoundingClientRect();


            const x1 =
                sourceRect.left +
                sourceRect.width / 2 -
                canvasRect.left +
                canvas.scrollLeft;


            const y1 =
                sourceRect.top +
                sourceRect.height / 2 -
                canvasRect.top +
                canvas.scrollTop;


            const x2 =
                targetRect.left +
                targetRect.width / 2 -
                canvasRect.left +
                canvas.scrollLeft;


            const y2 =
                targetRect.top +
                targetRect.height / 2 -
                canvasRect.top +
                canvas.scrollTop;


            const distance =
                Math.abs(x2 - x1);


            const curve =
                Math.max(
                    60,
                    distance * 0.5
                );


            const path =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );


            const pathData = `

                M ${x1} ${y1}

                C
                ${x1 + curve} ${y1},
                ${x2 - curve} ${y2},
                ${x2} ${y2}

            `;


            path.setAttribute(
                "d",
                pathData
            );


            path.classList.add(
                "connection-line"
            );


            path.dataset.index =
                index;


            path.addEventListener(
                "dblclick",
                () => {

                    deleteConnection(index);

                }
            );


            connectionsLayer.appendChild(
                path
            );

        }
    );

}


/* =========================================
   DELETE CONNECTION
   ========================================= */


function deleteConnection(index) {

    if (
        index < 0 ||
        index >= connections.length
    ) {

        return;

    }


    connections.splice(
        index,
        1
    );


    drawConnections();

    updateStats();


    addLog(
        "🗑️ Connection removed."
    );

}


/* =========================================
   DELETE NODE
   ========================================= */


function deleteNode(id) {


    /* Remove node */

    nodes =
        nodes.filter(
            node => node.id !== id
        );


    /* Remove related connections */

    connections =
        connections.filter(
            connection =>
                connection.from !== id &&
                connection.to !== id
        );


    /* Remove visual node */

    const element =
        document.querySelector(
            `.workflow-node[data-id="${id}"]`
        );


    if (element) {

        element.remove();

    }


    drawConnections();

    updateStats();


    if (nodes.length === 0) {

        emptyState.style.display =
            "block";

    }


    addLog(
        `🗑️ Node ${id} removed.`
    );

}


/* =========================================
   DRAGGING
   ========================================= */


function makeDraggable(
    element,
    node
) {

    let dragging = false;

    let offsetX = 0;

    let offsetY = 0;


    element.addEventListener(
        "mousedown",
        startDrag
    );


    function startDrag(event) {

        if (
            event.target.closest(
                ".node-port"
            )
        ) {

            return;

        }


        if (
            event.target.closest(
                ".delete-node"
            )
        ) {

            return;

        }


        dragging = true;


        const rect =
            element.getBoundingClientRect();


        offsetX =
            event.clientX -
            rect.left;


        offsetY =
            event.clientY -
            rect.top;


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


        const canvasRect =
            canvas.getBoundingClientRect();


        node.x =
            event.clientX -
            canvasRect.left -
            offsetX +
            canvas.scrollLeft;


        node.y =
            event.clientY -
            canvasRect.top -
            offsetY +
            canvas.scrollTop;


        element.style.left =
            `${node.x}px`;


        element.style.top =
            `${node.y}px`;


        drawConnections();

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


/* =========================================
   UPDATE STATS
   ========================================= */


function updateStats() {

    nodeCount.textContent =
        `${nodes.length} ${
            nodes.length === 1
                ? "node"
                : "nodes"
        }`;


    connectionCount.textContent =
        `${connections.length} ${
            connections.length === 1
                ? "connection"
                : "connections"
        }`;

}


/* =========================================
   EMPTY STATE
   ========================================= */


function hideEmptyState() {

    emptyState.style.display =
        "none";

}


/* =========================================
   LOGGING
   ========================================= */


function addLog(message) {

    if (
        logsContainer.querySelector(
            ".log-placeholder"
        )
    ) {

        logsContainer.innerHTML = "";

    }


    const log =
        document.createElement("div");


    log.className = "log";


    log.textContent =
        message;


    logsContainer.appendChild(
        log
    );


    logsContainer.scrollTop =
        logsContainer.scrollHeight;

}


/* =========================================
   WORKFLOW EXECUTION
   ========================================= */


async function runWorkflow() {

    if (nodes.length === 0) {

        setStatus(
            "● Error",
            "error"
        );

        addLog(
            "❌ Cannot run an empty workflow."
        );

        return;

    }


    const trigger =
        nodes.find(
            node =>
                node.type === "trigger"
        );


    if (!trigger) {

        setStatus(
            "● Error",
            "error"
        );

        addLog(
            "❌ Workflow needs a Trigger node."
        );

        return;

    }


    setStatus(
        "● Running...",
        "running"
    );


    logsContainer.innerHTML = "";


    addLog(
        "🚀 Workflow execution started."
    );


    const visited =
        new Set();


    let currentNode =
        trigger;


    while (currentNode) {


        if (
            visited.has(
                currentNode.id
            )
        ) {

            addLog(
                "❌ Cycle detected. Execution stopped."
            );

            setStatus(
                "● Error",
                "error"
            );

            return;

        }


        visited.add(
            currentNode.id
        );


        const definition =
            nodeTypes[
                currentNode.type
            ];


        addLog(
            `${definition.icon} Executing ${definition.title} (Node ${currentNode.id})`
        );


        await wait(600);


        /* Find next node */

        const connection =
            connections.find(
                item =>
                    item.from ===
                    currentNode.id
            );


        if (!connection) {

            currentNode = null;

        } else {

            currentNode =
                nodes.find(
                    node =>
                        node.id ===
                        connection.to
                );

        }

    }


    addLog(
        "✅ Workflow completed successfully."
    );


    setStatus(
        "● Completed",
        "success"
    );

}


/* =========================================
   STATUS
   ========================================= */


function setStatus(
    text,
    state
) {

    status.textContent =
        text;

    status.className =
        `status ${state}`;

}


/* =========================================
   DELAY
   ========================================= */


function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


/* =========================================
   CLEAR WORKFLOW
   ========================================= */


function clearWorkflow() {

    nodes = [];

    connections = [];

    nodeId = 0;

    connectingFrom = null;


    document
        .querySelectorAll(
            ".workflow-node"
        )
        .forEach(
            node => node.remove()
        );


    connectionsLayer.innerHTML =
        "";


    updateStats();


    emptyState.style.display =
        "block";


    logsContainer.innerHTML = `

        <div class="log-placeholder">

            Workflow execution logs will appear here.

        </div>

    `;


    setStatus(
        "● Ready",
        "idle"
    );

}


/* =========================================
   NODE LIBRARY EVENTS
   ========================================= */


document
    .querySelectorAll(
        ".library-node"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    addNode(
                        button.dataset.type
                    );

                }
            );

        }
    );


/* =========================================
   BUTTON EVENTS
   ========================================= */


runBtn.addEventListener(
    "click",
    runWorkflow
);


clearBtn.addEventListener(
    "click",
    clearWorkflow
);


/* =========================================
   CANVAS SCROLL
   ========================================= */


canvas.addEventListener(
    "scroll",
    drawConnections
);


/* =========================================
   INITIALIZE
   ========================================= */


updateStats();
