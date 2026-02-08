/**
 * @typedef {Object} Node
 * @property {string} id
 * @property {string} label
 * @property {number} x - Grid X position
 * @property {number} y - Grid Y position
 * @property {number} rank - Calculated rank
 */

/**
 * @typedef {Object} Edge
 * @property {string} from
 * @property {string} to
 */

/**
 * @typedef {Object} Subgraph
 * @property {Map<string, Node>} nodes
 * @property {Array<Edge>} edges
 */

class GraphUI {
    constructor() {
        this.gridSizeX = 240;
        this.gridSizeY = 100;
        this.nodeWidth = 180;
        this.nodeHeight = 50;

        // Nested state up to 12 levels
        this.path = []; // Navigation path IDs
        this.rootData = { nodes: new Map(), edges: [] };

        // Map of node ID -> Subgraph
        this.subgraphs = new Map();

        // UI State
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isPanning = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.selectedForLink = null;

        this.initDOM();
        this.initDemo();
        this.initViewportEvents();
        this.render();

        window.addEventListener('resize', () => this.drawEdges());
        document.getElementById('back-btn').onclick = () => this.navigateUp();
    }

    initDOM() {
        const container = document.getElementById('rank-container');
        this.highlight = document.createElement('div');
        this.highlight.id = 'grid-highlight';
        container.appendChild(this.highlight);
    }

    initDemo() {
        // Create root nodes
        this.addNodeToData(this.rootData, 'n1', 'Algebra', 0, 2);
        this.addNodeToData(this.rootData, 'n2', 'Magma', 1, 2);
        this.addEdgeToData(this.rootData, 'n1', 'n2');

        // Demo subgraph for Monoid
        const monoidId = 'n3';
        this.addNodeToData(this.rootData, monoidId, 'Monoid (Click to Zoom)', 2, 2);
        this.addEdgeToData(this.rootData, 'n2', monoidId);

        const sub = { nodes: new Map(), edges: [] };
        this.addNodeToData(sub, 'm1', 'Identity', 0, 1);
        this.addNodeToData(sub, 'm2', 'Associativity', 0, 3);
        this.subgraphs.set(monoidId, sub);
    }

    addNodeToData(data, id, label, x, y) {
        data.nodes.set(id, { id, label, x, y, rank: 0 });
        this.updateAutoRanking(data);
    }

    addEdgeToData(data, from, to) {
        if (from === to) return;
        if (data.edges.some(e => e.from === from && e.to === to)) return;
        data.edges.push({ from, to });
        this.updateAutoRanking(data);
    }

    updateAutoRanking(data) {
        // Ensure toNode.x > fromNode.x for all edges
        let changed = true;
        let iterations = 0;
        const maxIterations = 100;

        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;
            data.edges.forEach(edge => {
                const fromNode = data.nodes.get(edge.from);
                const toNode = data.nodes.get(edge.to);
                if (fromNode && toNode) {
                    if (toNode.x <= fromNode.x) {
                        toNode.x = fromNode.x + 1;
                        changed = true;
                    }
                }
            });
        }
    }

    render() {
        const container = document.getElementById('rank-container');
        // Keep highlight
        const highlight = document.getElementById('grid-highlight');
        container.innerHTML = '';
        container.appendChild(highlight);

        const currentData = this.getCurrentData();

        currentData.nodes.forEach(node => {
            const nodeEl = document.createElement('div');
            nodeEl.className = 'node fading-in';
            if (this.selectedForLink === node.id) nodeEl.classList.add('selected');
            nodeEl.id = `node-${node.id}`;

            // Centered in grid cell
            const x = node.x * this.gridSizeX + (this.gridSizeX - this.nodeWidth) / 2;
            const y = node.y * this.gridSizeY + (this.gridSizeY - this.nodeHeight) / 2;

            nodeEl.style.left = `${x}px`;
            nodeEl.style.top = `${y}px`;
            nodeEl.textContent = node.label;

            const delBtn = document.createElement('div');
            delBtn.className = 'node-delete-btn';
            delBtn.innerHTML = '×';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteNode(node.id);
            };
            nodeEl.appendChild(delBtn);

            nodeEl.onclick = (e) => {
                e.stopPropagation();
                if (e.metaKey || e.ctrlKey) {
                    this.handleNodeLink(node.id);
                } else {
                    this.navigateDown(node.id);
                }
            };

            container.appendChild(nodeEl);
            // Trigger fade in
            setTimeout(() => nodeEl.classList.remove('fading-in'), 10);
        });

        this.updateControls();
        this.updateTransform();
        setTimeout(() => this.drawEdges(), 50);
    }

    getCurrentData() {
        let current = this.rootData;
        for (const id of this.path) {
            if (this.subgraphs.has(id)) {
                current = this.subgraphs.get(id);
            } else {
                // Sub-subgraph should exist if we are in it
                return current;
            }
        }
        return current;
    }

    navigateDown(nodeId) {
        if (this.path.length >= 12) {
            alert("Max recursion depth (12) reached.");
            return;
        }
        if (this._navigating) return;

        const node = this.getCurrentData().nodes.get(nodeId);
        if (!node) return;

        this._navigating = true;
        const containerRect = document.getElementById('graph-container').getBoundingClientRect();

        // Target zoom level: filling the screen roughly
        this.scale = 8.0;
        const targetX = node.x * this.gridSizeX + this.gridSizeX / 2;
        const targetY = node.y * this.gridSizeY + this.gridSizeY / 2;

        this.offsetX = containerRect.width / 2 - targetX * this.scale;
        this.offsetY = containerRect.height / 2 - targetY * this.scale;

        this.updateTransform();

        // Delay path change for zoom feel
        setTimeout(() => {
            if (!this.subgraphs.has(nodeId)) {
                this.subgraphs.set(nodeId, { nodes: new Map(), edges: [] });
            }
            this.path.push(nodeId);

            // Fading out the transition
            document.body.style.opacity = '0';
            setTimeout(() => {
                // Reset viewport for new layer
                this.scale = 1.0;
                this.offsetX = containerRect.width / 4;
                this.offsetY = containerRect.height / 4;
                this.selectedForLink = null;
                this.render();
                document.body.style.opacity = '1';
                document.body.style.transition = 'opacity 0.3s';
                this._navigating = false;
            }, 150);
        }, 500);
    }

    navigateUpInteractive() {
        if (this._navigating || this.path.length === 0) return;
        this._navigating = true;

        // Visual "zoom out and fade" effect
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s';

        setTimeout(() => {
            const containerRect = document.getElementById('graph-container').getBoundingClientRect();
            this.path.pop();
            this.scale = 1.0;
            this.offsetX = containerRect.width / 4;
            this.offsetY = containerRect.height / 4;
            this.selectedForLink = null;
            this.render();
            document.body.style.opacity = '1';
            this._navigating = false;
        }, 300);
    }

    navigateUp() {
        this.navigateUpInteractive();
    }

    handleNodeLink(nodeId) {
        if (this.selectedForLink === nodeId) {
            this.selectedForLink = null;
        } else if (this.selectedForLink) {
            this.addEdgeToData(this.getCurrentData(), this.selectedForLink, nodeId);
            this.selectedForLink = null;
        } else {
            this.selectedForLink = nodeId;
        }
        this.render();
    }

    deleteNode(nodeId) {
        const data = this.getCurrentData();
        data.nodes.delete(nodeId);
        data.edges = data.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
        this.subgraphs.delete(nodeId);
        if (this.selectedForLink === nodeId) this.selectedForLink = null;
        this.updateAutoRanking(data);
        this.render();
    }

    initViewportEvents() {
        const container = document.getElementById('graph-container');

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Transformed coords
            const worldX = (mouseX - this.offsetX) / this.scale;
            const worldY = (mouseY - this.offsetY) / this.scale;

            // Snap to grid and calculate centered box position
            const gridX = Math.floor(worldX / this.gridSizeX);
            const gridY = Math.floor(worldY / this.gridSizeY);

            const highlightX = gridX * this.gridSizeX + (this.gridSizeX - this.nodeWidth) / 2;
            const highlightY = gridY * this.gridSizeY + (this.gridSizeY - this.nodeHeight) / 2;

            this.highlight.style.left = `${highlightX}px`;
            this.highlight.style.top = `${highlightY}px`;

            if (this.isPanning) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.offsetX += dx;
                this.offsetY += dy;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.updateTransform();
            }
        });

        container.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && (e.metaKey || e.ctrlKey))) {
                this.isPanning = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                container.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });

        window.addEventListener('mouseup', () => {
            this.isPanning = false;
            container.style.cursor = 'crosshair';
        });

        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.001;
            const delta = -e.deltaY;
            const newScale = Math.min(Math.max(this.scale + delta * zoomSpeed, 0.1), 5);

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const worldX = (mouseX - this.offsetX) / this.scale;
            const worldY = (mouseY - this.offsetY) / this.scale;

            this.scale = newScale;
            this.offsetX = mouseX - worldX * this.scale;
            this.offsetY = mouseY - worldY * this.scale;

            this.updateTransform();

            // Trigger zoom-out navigation if scale is too small
            if (this.scale < 0.25 && this.path.length > 0 && !this._navigating) {
                this.navigateUpInteractive();
            }
        }, { passive: false });

        container.ondblclick = (e) => {
            if (e.target === container || e.target.id === 'rank-container') {
                const rect = container.getBoundingClientRect();
                const worldX = (e.clientX - rect.left - this.offsetX) / this.scale;
                const worldY = (e.clientY - rect.top - this.offsetY) / this.scale;

                const gridX = Math.floor(worldX / this.gridSizeX);
                const gridY = Math.floor(worldY / this.gridSizeY);

                this.createNodeInline(gridX, gridY);
            }
        };
    }

    createNodeInline(gridX, gridY) {
        // Finalize any existing input before creating a new one
        const existingInput = document.querySelector('.node-input');
        if (existingInput) {
            existingInput.blur();
        }

        const id = 'n' + Date.now();
        const data = this.getCurrentData();

        // Add node
        data.nodes.set(id, { id, label: "", x: gridX, y: gridY, rank: 0 });

        // Custom render logic to avoid blowing away everything if possible, 
        // but for simplicity we'll just render and then focus.
        this.render();

        const nodeEl = document.getElementById(`node-${id}`);
        if (!nodeEl) return;

        nodeEl.innerHTML = '';
        const input = document.createElement('input');
        input.className = 'node-input';
        input.type = 'text';
        input.placeholder = 'Label...';

        nodeEl.appendChild(input);
        input.focus();

        let finalized = false;
        const finalize = () => {
            if (finalized) return;
            finalized = true;
            const label = input.value.trim() || "New Node";
            const node = data.nodes.get(id);
            if (node) {
                node.label = label;
                this.updateAutoRanking(data);
                this.render();
            }
        };

        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                finalize();
            } else if (e.key === 'Escape') {
                finalized = true;
                this.deleteNode(id);
            }
        };

        input.onblur = finalize;
    }

    updateTransform() {
        const content = document.getElementById('rank-container');
        const edges = document.getElementById('edge-layer');
        const transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
        content.style.transform = transform;
        edges.style.transform = transform;
        this.updateControls();
    }

    updateControls() {
        const backBtn = document.getElementById('back-btn');
        const pathDisplay = document.getElementById('path-display');
        backBtn.style.display = this.path.length > 0 ? 'block' : 'none';
        pathDisplay.textContent = ['Root', ...this.path.map(id => {
            // Find label for ID
            // This is simplified, for now just show ID or index
            return id.substring(0, 5);
        })].join(' > ') + ` [Zoom: ${Math.round(this.scale * 100)}%]`;
    }

    drawEdges() {
        const svg = document.getElementById('edge-layer');
        svg.innerHTML = '';
        const data = this.getCurrentData();

        data.edges.forEach(edge => {
            const fromNode = data.nodes.get(edge.from);
            const toNode = data.nodes.get(edge.to);

            if (fromNode && toNode) {
                const x1 = fromNode.x * this.gridSizeX + (this.gridSizeX + this.nodeWidth) / 2;
                const y1 = fromNode.y * this.gridSizeY + this.gridSizeY / 2;
                const x2 = toNode.x * this.gridSizeX + (this.gridSizeX - this.nodeWidth) / 2;
                const y2 = toNode.y * this.gridSizeY + this.gridSizeY / 2;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const cp1x = x1 + (x2 - x1) / 2;
                const d = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp1x} ${y2}, ${x2} ${y2}`;
                path.setAttribute('d', d);
                path.setAttribute('class', 'edge');
                svg.appendChild(path);
            }
        });
    }
}

new GraphUI();
