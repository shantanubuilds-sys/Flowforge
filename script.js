/* =========================================
   FLOWFORGE V1.0
   WORKFLOW ENGINE
   ========================================= */


/* =========================================
   APPLICATION STATE
   ========================================= */


const state = {

    nodes: [],

    connections: [],

    nextNodeId: 1,

    selectedNodeId: null,

    connectingFrom: null,

    zoom: 1,

    variables: {

        deadline: 2,

        priority: 5,

        score: 80

    }

};


/* =========================================
   DOM REFERENCES
   ========================================= */


const canvas =
    document.getElementById("canvas");


const connectionsLayer =
    document.getElementById(
        "connectionsLayer"
    );


const emptyState =
    document.getElementById(
        "emptyState"
    );


const inspectorContent =
    document.getElementById(
        "inspectorContent"
    );


const logsContainer =
    document.getElementById(
        "logsContainer"
    );


const status =
    document.getElementById(
        "status"
    );


const nodeCount =
    document.getElementById(
        "sidebarNodeCount"
    );


const connectionCount =
    document.getElementById(
        "sidebarConnectionCount"
    );


const sidebarNodeCount =
    document.getElementById(
        "sidebarNodeCount"
    );


const sidebarConnectionCount =
    document.getElementById(
        "sidebarConnectionCount"
    );


const zoomValue =
    document.getElementById(
        "zoomValue"
    );


/* =========================================
   NODE DEFINITIONS
   ========================================= */


const nodeTypes = {

    trigger: {

        title: "Trigger",

        icon: "⚡",

        description:
            "Starts the workflow."

    },


    action: {

        title: "Action",

        icon: "⚙️",

        description:
            "Performs a configurable action."

    },


    condition: {

        title: "Condition",

        icon: "🔀",

        description:
            "Evaluates a rule and chooses a branch."

    },


    output: {

        title: "Output",

        icon: "📤",

        description:
            "Produces the final workflow result."

    }

};


/* =========================================
   ADD NODE
   ========================================= */


function addNode(type) {

    if (!nodeTypes[type]) {

        return;

    }


    const id =
        state.nextNodeId++;


    const index =
        state.nodes.length;


    const node = {

        id,

        type,

        x:
            100 +
            (index % 3) * 270,

        y:
            120 +
            Math.floor(index / 3) * 190,

        config: {

            action:
                "Send notification",

            message:
                "Workflow executed successfully.",

            variable:
                "deadline",

            operator:
                "<",

            value:
                3

        }

    };


    state.nodes.push(node);


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


    let ports = "";


    /* INPUT */

    if (
        node.type !== "trigger"
    ) {

        ports += `

            <div
                class="node-port input-port"
                data-port="input"
            ></div>

        `;

    }


    /* NORMAL OUTPUT */

    if (
        node.type !== "output" &&
        node.type !== "condition"
    ) {

        ports += `

            <div
                class="node-port output-port"
                data-port="output"
            ></div>

        `;

    }


    /* CONDITION OUTPUTS */

    if (
        node.type === "condition"
    ) {

        ports += `

            <div
                class="
                    node-port
                    output-port
                    condition-true
                "
                data-port="true"
            ></div>


            <div
                class="
                    node-port
                    output-port
                    condition-false
                "
                data-port="false"
            ></div>

        `;

    }


    element.innerHTML = `

        <div class="node-header">

            <div class="node-title">

                <span>
                    ${definition.icon}
                </span>

                ${definition.title}

                <span class="node-id">
                    #${node.id}
                </span>

            </div>


            <button
                class="node-delete"
                title="Delete node"
            >
                ×
            </button>

        </div>


        <div class="node-body">

            <div class="node-description">
                ${definition.description}
            </div>


            <div class="node-config-preview">
                ${getPreview(node)}
            </div>

        </div>


        ${ports}

    `;


    canvas.appendChild(element);


    /* NODE SELECT */

    element.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".node-port"
                )
            ) {

                return;

            }


            if (
                event.target.closest(
                    ".node-delete"
                )
            ) {

                return;

            }


            selectNode(node.id);

        }
    );


    /* DELETE */

    element
        .querySelector(".node-delete")
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                deleteNode(node.id);

            }
        );


    /* PORTS */

    element
        .querySelectorAll(".node-port")
        .forEach(
            port => {

                port.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        const portType =
                            port.dataset.port;


                        if (
                            portType ===
                            "input"
                        ) {

                            finishConnection(
                                node.id
                            );

                        } else {

                            startConnection(
                                node.id,
                                portType
                            );

                        }

                    }
                );

            }
        );


    makeDraggable(
        element,
        node
    );

}


/* =========================================
   NODE PREVIEW
   ========================================= */


function getPreview(node) {

    if (
        node.type ===
        "trigger"
    ) {

        return "Event: manual";

    }


    if (
        node.type ===
        "action"
    ) {

        return node.config.action;

    }


    if (
        node.type ===
        "condition"
    ) {

        return `${node.config.variable} ${node.config.operator} ${node.config.value}`;

    }


    if (
        node.type ===
        "output"
    ) {

        return node.config.message;

    }


    return "";

}


/* =========================================
   SELECT NODE
   ========================================= */


function selectNode(id) {

    state.selectedNodeId =
        id;


    document
        .querySelectorAll(
            ".workflow-node"
        )
        .forEach(
            element => {

                element.classList.toggle(
                    "selected",
                    Number(
                        element.dataset.id
                    ) === id
                );

            }
        );


    renderInspector();

}


/* =========================================
   INSPECTOR
   ========================================= */


function renderInspector() {

    const node =
        state.nodes.find(
            item =>
                item.id ===
                state.selectedNodeId
        );


    if (!node) {

        inspectorContent.innerHTML = `

            <div class="inspector-empty">

                <div>🎯</div>

                <p>
                    Select a node to configure it.
                </p>

            </div>

        `;

        return;

    }


    const definition =
        nodeTypes[node.type];


    let form = "";


    if (
        node.type ===
        "trigger"
    ) {

        form = `

            <div class="form-group">

                <label>
                    Trigger type
                </label>

                <select id="triggerType">

                    <option value="manual">
                        Manual
                    </option>

                    <option value="event">
                        Event
                    </option>

                </select>

            </div>

        `;

    }


    if (
        node.type ===
        "action"
    ) {

        form = `

            <div class="form-group">

                <label>
                    Action
                </label>

                <select id="actionType">

                    <option>
                        Send notification
                    </option>

                    <option>
                        Create task
                    </option>

                    <option>
                        Log message
                    </option>

                    <option>
                        Update status
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    Message
                </label>

                <input
                    id="actionMessage"
                    value="${escapeHtml(
                        node.config.message
                    )}"
                >

            </div>

        `;

    }


    if (
        node.type ===
        "condition"
    ) {

        form = `

            <div class="form-group">

                <label>
                    Variable
                </label>

                <select id="conditionVariable">

                    <option value="deadline">
                        deadline
                    </option>

                    <option value="priority">
                        priority
                    </option>

                    <option value="score">
                        score
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    Operator
                </label>

                <select id="conditionOperator">

                    <option value="<">
                        Less than
                    </option>

                    <option value="<=">
                        Less than or equal
                    </option>

                    <option value="===">
                        Equal
                    </option>

                    <option value=">">
                        Greater than
                    </option>

                    <option value=">=">
                        Greater than or equal
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    Value
                </label>

                <input
                    id="conditionValue"
                    type="number"
                    value="${node.config.value}"
                >

            </div>

        `;

    }


    if (
        node.type ===
        "output"
    ) {

        form = `

            <div class="form-group">

                <label>
                    Output message
                </label>

                <input
                    id="outputMessage"
                    value="${escapeHtml(
                        node.config.message
                    )}"
                >

            </div>

        `;

    }


    inspectorContent.innerHTML = `

        <div class="inspector-title">

            <strong>
                ${definition.icon}
                ${definition.title}
            </strong>

            <span>
                Node #${node.id}
            </span>

        </div>


        ${form}


        <button
            id="saveNodeBtn"
            class="save-node-btn"
        >
            Save Configuration
        </button>

    `;


    /* SET CURRENT VALUES */

    if (
        node.type ===
        "action"
    ) {

        document.getElementById(
            "actionType"
        ).value =
            node.config.action;

    }


    if (
        node.type ===
        "condition"
    ) {

        document.getElementById(
            "conditionVariable"
        ).value =
            node.config.variable;


        document.getElementById(
            "conditionOperator"
        ).value =
            node.config.operator;

    }


    /* SAVE */

    document
        .getElementById(
            "saveNodeBtn"
        )
        .addEventListener(
            "click",
            saveNodeConfiguration
        );

}


/* =========================================
   SAVE NODE CONFIG
   ========================================= */


function saveNodeConfiguration() {

    const node =
        state.nodes.find(
            item =>
                item.id ===
                state.selectedNodeId
        );


    if (!node) {

        return;

    }


    if (
        node.type ===
        "action"
    ) {

        node.config.action =
            document.getElementById(
                "actionType"
            ).value;


        node.config.message =
            document.getElementById(
                "actionMessage"
            ).value;

    }


    if (
        node.type ===
        "condition"
    ) {

        node.config.variable =
            document.getElementById(
                "conditionVariable"
            ).value;


        node.config.operator =
            document.getElementById(
                "conditionOperator"
            ).value;


        node.config.value =
            Number(
                document.getElementById(
                    "conditionValue"
                ).value
            );

    }


    if (
        node.type ===
        "output"
    ) {

        node.config.message =
            document.getElementById(
                "outputMessage"
            ).value;

    }


    refreshNode(
        node.id
    );


    addLog(
        `⚙️ Node ${node.id} configuration updated.`
    );

}


/* =========================================
   REFRESH NODE
   ========================================= */


function refreshNode(id) {

    const oldElement =
        document.querySelector(
            `.workflow-node[data-id="${id}"]`
        );


    const node =
        state.nodes.find(
            item =>
                item.id === id
        );


    if (
        !oldElement ||
        !node
    ) {

        return;

    }


    const wasSelected =
        oldElement.classList.contains(
            "selected"
        );


    oldElement.remove();


    renderNode(node);


    if (wasSelected) {

        selectNode(id);

    }


    drawConnections();

}


/* =========================================
   CONNECTION START
   ========================================= */


function startConnection(
    nodeId,
    output
) {

    state.connectingFrom = {

        nodeId,

        output

    };


    clearPortStates();


    const element =
        document.querySelector(
            `.workflow-node[data-id="${nodeId}"]`
        );


    if (!element) {

        return;

    }


    const port =
        element.querySelector(
            `[data-port="${output}"]`
        );


    if (port) {

        port.classList.add(
            "connecting"
        );

    }


    addLog(
        `🔗 Connecting from Node ${nodeId} (${output}).`
    );

}


/* =========================================
   CONNECTION FINISH
   ========================================= */


function finishConnection(
    targetNodeId
) {

    if (
        !state.connectingFrom
    ) {

        return;

    }


    const source =
        state.connectingFrom;


    state.connectingFrom =
        null;


    clearPortStates();


    if (
        source.nodeId ===
        targetNodeId
    ) {

        addLog(
            "❌ A node cannot connect to itself."
        );

        return;

    }


    const duplicate =
        state.connections.some(
            connection =>

                connection.from ===
                    source.nodeId &&

                connection.to ===
                    targetNodeId &&

                connection.output ===
                    source.output

        );


    if (duplicate) {

        addLog(
            "❌ That connection already exists."
        );

        return;

    }


    /* ONLY ONE NORMAL OUTPUT */

    if (
        source.output ===
        "output"
    ) {

        state.connections =
            state.connections.filter(
                connection =>

                    !(
                        connection.from ===
                        source.nodeId &&

                        connection.output ===
                        "output"
                    )

            );

    }


    state.connections.push({

        from:
            source.nodeId,

        to:
            targetNodeId,

        output:
            source.output

    });


    drawConnections();

    updateStats();


    addLog(
        `🔗 Node ${source.nodeId} → Node ${targetNodeId}`
    );

}


/* =========================================
   CLEAR PORT STATES
   ========================================= */


function clearPortStates() {

    document
        .querySelectorAll(
            ".node-port"
        )
        .forEach(
            port => {

                port.classList.remove(
                    "connecting"
                );

                port.classList.remove(
                    "connection-target"
                );

            }
        );

}


/* =========================================
   DRAW CONNECTIONS
   ========================================= */


function drawConnections() {

    const defs =
        connectionsLayer.querySelector(
            "defs"
        );


    connectionsLayer.innerHTML =
        "";


    if (defs) {

        connectionsLayer.appendChild(
            defs
        );

    }


    state.connections.forEach(
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
                    `[data-port="${connection.output}"]`
                );


            const targetPort =
                targetElement.querySelector(
                    `[data-port="input"]`
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


            const curve =
                Math.max(
                    70,
                    Math.abs(x2 - x1) * 0.45
                );


            const path =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );


            path.setAttribute(
                "d",
                `
                M ${x1} ${y1}
                C
                ${x1 + curve} ${y1},
                ${x2 - curve} ${y2},
                ${x2} ${y2}
                `
            );


            path.classList.add(
                "connection-line"
            );


            if (
                connection.output ===
                "true"
            ) {

                path.classList.add(
                    "true-line"
                );

            }


            if (
                connection.output ===
                "false"
            ) {

                path.classList.add(
                    "false-line"
                );

            }


            path.dataset.index =
                index;


            path.addEventListener(
                "dblclick",
                () => {

                    deleteConnection(
                        index
                    );

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
        index >=
        state.connections.length
    ) {

        return;

    }


    state.connections.splice(
        index,
        1
    );


    drawConnections();

    updateStats();


    addLog(
        "🗑️ Connection deleted."
    );

}


/* =========================================
   DELETE NODE
   ========================================= */


function deleteNode(id) {

    state.nodes =
        state.nodes.filter(
            node =>
                node.id !== id
        );


    state.connections =
        state.connections.filter(
            connection =>

                connection.from !== id &&
                connection.to !== id

        );


    const element =
        document.querySelector(
            `.workflow-node[data-id="${id}"]`
        );


    if (element) {

        element.remove();

    }


    if (
        state.selectedNodeId === id
    ) {

        state.selectedNodeId =
            null;

        renderInspector();

    }


    drawConnections();

    updateStats();


    if (
        state.nodes.length === 0
    ) {

        emptyState.style.display =
            "block";

    }


    addLog(
        `🗑️ Node ${id} deleted.`
    );

}


/* =========================================
   DRAGGING
   ========================================= */


function makeDraggable(
    element,
    node
) {

    let dragging =
        false;


    let offsetX =
        0;


    let offsetY =
        0;


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
                ".node-delete"
            )
        ) {

            return;

        }


        dragging =
            true;


        selectNode(
            node.id
        );


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

        if (!dragging) {

            return;

        }


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

        dragging =
            false;


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
   WORKFLOW VALIDATION
   ========================================= */


function validateWorkflow() {

    const errors = [];


    const triggers =
        state.nodes.filter(
            node =>
                node.type ===
                "trigger"
        );


    if (
        triggers.length === 0
    ) {

        errors.push(
            "Workflow needs a Trigger."
        );

    }


    if (
        triggers.length > 1
    ) {

        errors.push(
            "Workflow should have only one Trigger."
        );

    }


    const trigger =
        triggers[0];


    if (trigger) {

        const outgoing =
            getOutgoingConnections(
                trigger.id
            );


        if (
            outgoing.length === 0
        ) {

            errors.push(
                "Trigger has no outgoing connection."
            );

        }

    }


    state.nodes.forEach(
        node => {

            if (
                node.type !==
                "trigger"
            ) {

                const incoming =
                    getIncomingConnections(
                        node.id
                    );


                if (
                    incoming.length === 0
                ) {

                    errors.push(
                        `Node ${node.id} has no input connection.`
                    );

                }

            }

        }
    );


    const cycle =
        detectCycle();


    if (cycle) {

        errors.push(
            "Workflow contains a cycle."
        );

    }


    return errors;

}


/* =========================================
   CYCLE DETECTION
   ========================================= */


function detectCycle() {

    const visiting =
        new Set();


    const visited =
        new Set();


    function visit(nodeId) {

        if (
            visiting.has(nodeId)
        ) {

            return true;

        }


        if (
            visited.has(nodeId)
        ) {

            return false;

        }


        visiting.add(
            nodeId
        );


        const outgoing =
            getOutgoingConnections(
                nodeId
            );


        for (
            const connection
            of outgoing
        ) {

            if (
                visit(
                    connection.to
                )
            ) {

                return true;

            }

        }


        visiting.delete(
            nodeId
        );


        visited.add(
            nodeId
        );


        return false;

    }


    return state.nodes.some(
        node =>
            visit(node.id)
    );

}


/* =========================================
   GET CONNECTIONS
   ========================================= */


function getOutgoingConnections(
    nodeId
) {

    return state.connections.filter(
        connection =>
            connection.from ===
            nodeId
    );

}


function getIncomingConnections(
    nodeId
) {

    return state.connections.filter(
        connection =>
            connection.to ===
            nodeId
    );

}


/* =========================================
   RUN WORKFLOW
   ========================================= */


async function runWorkflow() {

    const errors =
        validateWorkflow();


    if (
        errors.length > 0
    ) {

        setStatus(
            "● Invalid",
            "error"
        );


        errors.forEach(
            error =>
                addLog(
                    `❌ ${error}`
                )
        );


        return;

    }


    const trigger =
        state.nodes.find(
            node =>
                node.type ===
                "trigger"
        );


    logsContainer.innerHTML =
        "";


    setStatus(
        "● Running",
        "running"
    );


    addLog(
        "🚀 Workflow execution started."
    );


    const visited =
        new Set();


    const success =
        await executeNode(
            trigger,
            visited
        );


    if (success) {

        setStatus(
            "● Completed",
            "success"
        );


        addLog(
            "✅ Workflow completed successfully."
        );

    } else {

        setStatus(
            "● Failed",
            "error"
        );

    }

}


/* =========================================
   EXECUTE NODE
   ========================================= */


async function executeNode(
    node,
    visited
) {

    if (!node) {

        return false;

    }


    if (
        visited.has(
            node.id
        )
    ) {

        addLog(
            `❌ Cycle detected at Node ${node.id}.`
        );


        return false;

    }


    visited.add(
        node.id
    );


    const definition =
        nodeTypes[node.type];


    addLog(
        `${definition.icon} Executing ${definition.title} #${node.id}`
    );


    await wait(500);


    /* =====================================
       TRIGGER
       ===================================== */


    if (
        node.type ===
        "trigger"
    ) {

        addLog(
            "⚡ Trigger activated."
        );

    }


    /* =====================================
       ACTION
       ===================================== */


    if (
        node.type ===
        "action"
    ) {

        addLog(
            `⚙️ Action: ${node.config.action}`
        );


        addLog(
            `📝 ${node.config.message}`
        );

    }


    /* =====================================
       CONDITION
       ===================================== */


    if (
        node.type ===
        "condition"
    ) {

        const result =
            evaluateCondition(
                node
            );


        addLog(
            result
                ? "🔀 Condition result: TRUE"
                : "🔀 Condition result: FALSE"
        );


        const branch =
            result
                ? "true"
                : "false";


        const connection =
            state.connections.find(
                item =>

                    item.from ===
                    node.id &&

                    item.output ===
                    branch
            );


        if (!connection) {

            addLog(
                `⚠️ No ${branch.toUpperCase()} branch connected.`
            );


            return true;

        }


        const nextNode =
            state.nodes.find(
                item =>
                    item.id ===
                    connection.to
            );


        return executeNode(
            nextNode,
            visited
        );

    }


    /* =====================================
       OUTPUT
       ===================================== */


    if (
        node.type ===
        "output"
    ) {

        addLog(
            `📤 Output: ${node.config.message}`
        );


        return true;

    }


    /* =====================================
       NORMAL NEXT NODE
       ===================================== */


    const outgoing =
        getOutgoingConnections(
            node.id
        );


    if (
        outgoing.length === 0
    ) {

        addLog(
            `⚠️ Node ${node.id} has no next step.`
        );


        return true;

    }


    const nextConnection =
        outgoing[0];


    const nextNode =
        state.nodes.find(
            item =>
                item.id ===
                nextConnection.to
        );


    return executeNode(
        nextNode,
        visited
    );

}


/* =========================================
   CONDITION EVALUATION
   ========================================= */


function evaluateCondition(
    node
) {

    const variable =
        node.config.variable;


    const actualValue =
        state.variables[
            variable
        ];


    const expectedValue =
        Number(
            node.config.value
        );


    const operator =
        node.config.operator;


    addLog(
        `🧮 ${variable} = ${actualValue} ${operator} ${expectedValue}`
    );


    switch (
        operator
    ) {

        case "<":
            return actualValue < expectedValue;

        case "<=":
            return actualValue <= expectedValue;

        case "===":
            return actualValue === expectedValue;

        case ">":
            return actualValue > expectedValue;

        case ">=":
            return actualValue >= expectedValue;

        default:
            return false;

    }

}


/* =========================================
   SAVE LOCAL WORKFLOW
   ========================================= */


function saveWorkflow() {

    const workflow = {

        version:
            "1.0",

        savedAt:
            new Date().toISOString(),

        nodes:
            state.nodes,

        connections:
            state.connections,

        variables:
            state.variables

    };


    localStorage.setItem(
        "flowforge-workflow",
        JSON.stringify(
            workflow
        )
    );


    addLog(
        "💾 Workflow saved locally."
    );

}


/* =========================================
   LOAD LOCAL WORKFLOW
   ========================================= */


function loadWorkflow() {

    const saved =
        localStorage.getItem(
            "flowforge-workflow"
        );


    if (!saved) {

        addLog(
            "ℹ️ No saved workflow found."
        );


        return;

    }


    try {

        const workflow =
            JSON.parse(
                saved
            );


        loadWorkflowObject(
            workflow
        );


        addLog(
            "📂 Workflow loaded."
        );

    } catch {

        addLog(
            "❌ Saved workflow is invalid."
        );

    }

}


/* =========================================
   LOAD WORKFLOW OBJECT
   ========================================= */


function loadWorkflowObject(
    workflow
) {

    state.nodes =
        Array.isArray(
            workflow.nodes
        )
            ? workflow.nodes
            : [];


    state.connections =
        Array.isArray(
            workflow.connections
        )
            ? workflow.connections
            : [];


    state.variables =
        workflow.variables ||
        state.variables;


    state.nextNodeId =
        state.nodes.length > 0
            ? Math.max(
                ...state.nodes.map(
                    node =>
                        Number(node.id)
                )
            ) + 1
            : 1;


    state.selectedNodeId =
        null;


    rebuildCanvas();

}


/* =========================================
   EXPORT JSON
   ========================================= */


function exportWorkflow() {

    const workflow = {

        version:
            "1.0",

        exportedAt:
            new Date().toISOString(),

        nodes:
            state.nodes,

        connections:
            state.connections,

        variables:
            state.variables

    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    workflow,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "flowforge-workflow.json";


    link.click();


    URL.revokeObjectURL(
        url
    );


    addLog(
        "↓ Workflow exported as JSON."
    );

}


/* =========================================
   IMPORT JSON
   ========================================= */


function importWorkflow(
    file
) {

    if (!file) {

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        event => {

            try {

                const workflow =
                    JSON.parse(
                        event.target.result
                    );


                loadWorkflowObject(
                    workflow
                );


                addLog(
                    "↑ Workflow imported."
                );

            } catch {

                addLog(
                    "❌ Invalid workflow JSON."
                );

            }

        };


    reader.readAsText(
        file
    );

}


/* =========================================
   REBUILD CANVAS
   ========================================= */


function rebuildCanvas() {

    document
        .querySelectorAll(
            ".workflow-node"
        )
        .forEach(
            element =>
                element.remove()
        );


    state.nodes.forEach(
        node =>
            renderNode(node)
    );


    drawConnections();

    updateStats();


    if (
        state.nodes.length === 0
    ) {

        emptyState.style.display =
            "block";

    } else {

        hideEmptyState();

    }


    renderInspector();

}


/* =========================================
   CLEAR WORKFLOW
   ========================================= */


function clearWorkflow() {

    const confirmed =
        confirm(
            "Clear the entire workflow?"
        );


    if (!confirmed) {

        return;

    }


    state.nodes = [];

    state.connections = [];

    state.nextNodeId = 1;

    state.selectedNodeId =
        null;

    state.connectingFrom =
        null;


    rebuildCanvas();


    logsContainer.innerHTML = `

        <div class="log-placeholder">

            Execution logs will
            appear here.

        </div>

    `;


    setStatus(
        "● Ready",
        "idle"
    );


    addLog(
        "🧹 Workflow cleared."
    );

}


/* =========================================
   ZOOM
   ========================================= */


function updateZoom() {

    zoomValue.textContent =
        `${Math.round(
            state.zoom * 100
        )}%`;


    document
        .querySelectorAll(
            ".workflow-node"
        )
        .forEach(
            element => {

                element.style.transform =
                    `scale(${state.zoom})`;

                element.style.transformOrigin =
                    "top left";

            }
        );

}


/* =========================================
   RESET VIEW
   ========================================= */


function resetView() {

    state.zoom =
        1;


    updateZoom();


    canvas.scrollLeft =
        0;


    canvas.scrollTop =
        0;


    drawConnections();

}


/* =========================================
   STATS
   ========================================= */


function updateStats() {

    const nodes =
        state.nodes.length;


    const connections =
        state.connections.length;


    nodeCount.textContent =
        nodes;


    connectionCount.textContent =
        connections;


    sidebarNodeCount.textContent =
        nodes;


    sidebarConnectionCount.textContent =
        connections;

}


/* =========================================
   EMPTY STATE
   ========================================= */


function hideEmptyState() {

    emptyState.style.display =
        "none";

}


/* =========================================
   STATUS
   ========================================= */


function setStatus(
    text,
    type
) {

    status.textContent =
        text;


    status.className =
        `status ${type}`;

}


/* =========================================
   LOGGING
   ========================================= */


function addLog(
    message
) {

    const placeholder =
        logsContainer.querySelector(
            ".log-placeholder"
        );


    if (placeholder) {

        logsContainer.innerHTML =
            "";

    }


    const log =
        document.createElement(
            "div"
        );


    log.className =
        "log";


    log.textContent =
        message;


    logsContainer.appendChild(
        log
    );


    logsContainer.scrollTop =
        logsContainer.scrollHeight;

}


/* =========================================
   WAIT
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
   ESCAPE HTML
   ========================================= */


function escapeHtml(
    value
) {

    return String(
        value
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================
   LIBRARY EVENTS
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
   TOPBAR EVENTS
   ========================================= */


document
    .getElementById(
        "saveBtn"
    )
    .addEventListener(
        "click",
        saveWorkflow
    );


document
    .getElementById(
        "loadBtn"
    )
    .addEventListener(
        "click",
        loadWorkflow
    );


document
    .getElementById(
        "exportBtn"
    )
    .addEventListener(
        "click",
        exportWorkflow
    );


document
    .getElementById(
        "clearBtn"
    )
    .addEventListener(
        "click",
        clearWorkflow
    );


document
    .getElementById(
        "runBtn"
    )
    .addEventListener(
        "click",
        runWorkflow
    );


document
    .getElementById(
        "importInput"
    )
    .addEventListener(
        "change",
        event => {

            importWorkflow(
                event.target.files[0]
            );

            event.target.value =
                "";

        }
    );


/* =========================================
   ZOOM EVENTS
   ========================================= */


document
    .getElementById(
        "zoomInBtn"
    )
    .addEventListener(
        "click",
        () => {

            state.zoom =
                Math.min(
                    1.5,
                    state.zoom + 0.1
                );

            updateZoom();

        }
    );


document
    .getElementById(
        "zoomOutBtn"
    )
    .addEventListener(
        "click",
        () => {

            state.zoom =
                Math.max(
                    0.6,
                    state.zoom - 0.1
                );

            updateZoom();

        }
    );


document
    .getElementById(
        "resetViewBtn"
    )
    .addEventListener(
        "click",
        resetView
    );


/* =========================================
   CANVAS EVENTS
   ========================================= */


canvas.addEventListener(
    "scroll",
    drawConnections
);


/* =========================================
   ESCAPE CONNECTION MODE
   ========================================= */


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            state.connectingFrom =
                null;

            clearPortStates();

            addLog(
                "↩️ Connection cancelled."
            );

        }

    }
);


/* =========================================
   INITIALIZE
   ========================================= */


updateStats();

renderInspector();

updateZoom();
