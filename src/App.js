import * as THREE from 'three';
import { Layer } from './Layer.js';
import { CameraManager } from './CameraManager.js';

export class App {
    constructor() {
        this.container = document.getElementById('canvas-container');

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.002);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 20, 20);
        this.camera.lookAt(0, 0, 0);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        // Grid Helper
        const gridHelper = new THREE.GridHelper(100, 50, 0x333333, 0x111111);
        this.scene.add(gridHelper);

        // State
        this.rootLayer = new Layer('root', this.scene);
        this.currentLayer = this.rootLayer;
        this.layerStack = []; // Stack of { layer, cameraPos, cameraTarget }

        this.cameraManager = new CameraManager(this.camera, this.renderer.domElement);

        // Event Listeners
        window.addEventListener('resize', this.onResize.bind(this));

        // Raycaster for interactions
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        window.addEventListener('pointermove', this.onPointerMove.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
        window.addEventListener('dblclick', this.onDoubleClick.bind(this));
        window.addEventListener('dblclick', this.onDoubleClick.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));

        this.keys = { w: false, a: false, s: false, d: false };

        // State for linking
        this.linkSource = null;
        this.hoveredNode = null;

        // Start loop

        // Start loop
        this.animate();

        // Init Demo
        this.initDemo();

        // Expose for testing
        window.getSceneMetrics = this.getSceneMetrics.bind(this);
    }

    getSceneMetrics() {
        return {
            cameraPos: this.camera.position.toArray(),
            cameraTarget: this.cameraManager.controls.target.toArray(),
            cameraTransitioning: this.cameraManager.isTransitioning,
            cameraTargetPos: this.cameraManager.targetPosition ? this.cameraManager.targetPosition.toArray() : null,
            currentLayerId: this.currentLayer.id,
            rootLayerVisible: this.rootLayer.group.visible, // Added for testing
            nodeCount: this.currentLayer.nodes.size,
            nodes: Array.from(this.currentLayer.nodes.entries()).map(([id, n]) => {
                // Calculate screen position
                const vector = n.mesh.position.clone();
                vector.project(this.camera);
                const x = (vector.x * .5 + .5) * window.innerWidth;
                const y = (-(vector.y * .5) + .5) * window.innerHeight;

                return {
                    id,
                    x: n.x,
                    z: n.z,
                    worldPos: n.mesh.position.toArray(),
                    screenPos: { x, y }
                };
            })
        };
    }

    initDemo() {
        const ranks = 4;
        const nodesPerRank = [3, 4, 3, 2]; // 12 nodes total: 3+4+3+2
        const nodes = [];

        let nodeIndex = 0;

        // Create Nodes
        nodesPerRank.forEach((count, rankIndex) => {
            const rankNodes = [];
            for (let i = 0; i < count; i++) {
                const id = `root_${nodeIndex}`;
                // Z-offset centered around 0 based on count
                const z = (i - (count - 1) / 2) * 4;
                const x = rankIndex * 8; // Spread ranks out more

                this.rootLayer.addNode(id, `Node ${nodeIndex}`, x, z);
                console.log(`Node created: ${id} "Node ${nodeIndex}" at Rank ${rankIndex}`);
                rankNodes.push(id);
                nodes.push({ id, rank: rankIndex });
                nodeIndex++;
            }
        });

        // Create Edges (Forward linking)
        // Link each node in rank N to 1-3 random nodes in rank N+1
        const nodesByRank = [];
        nodes.forEach(n => {
            if (!nodesByRank[n.rank]) nodesByRank[n.rank] = [];
            nodesByRank[n.rank].push(n.id);
        });

        for (let r = 0; r < ranks - 1; r++) {
            const currentRank = nodesByRank[r];
            const nextRank = nodesByRank[r + 1];

            currentRank.forEach(sourceId => {
                // Ensure at least one connection
                const numTargets = Math.floor(Math.random() * 2) + 1; // 1 or 2 connections
                // Pick random unique targets
                const targets = [...nextRank].sort(() => 0.5 - Math.random()).slice(0, numTargets);

                targets.forEach(targetId => {
                    const weight = Math.random(); // Random weight 0-1
                    this.rootLayer.addEdge(sourceId, targetId, weight);
                    console.log(`Edge created: ${sourceId} -> ${targetId} (w: ${weight.toFixed(2)})`);
                });
            });
        }

        // Ensure root_1 exists and is connected for smoke tests (it was hardcoded before as 2nd node)
        // root_1 corresponds to index 1, which is in Rank 0 (since Rank 0 has 3 nodes: 0, 1, 2).
        // It should have edges to Rank 1.

        this.rootLayer.refreshLayout();
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onPointerMove(event) {
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.currentLayer.getInteractables());

        if (intersects.length > 0) {
            this.container.style.cursor = 'pointer';
            const object = intersects[0].object;
            this.currentLayer.onHover(object);

            // Track hovered node for deletion
            let target = object;
            while (target && !target.userData.id) target = target.parent;
            this.hoveredNode = target;

            // Show sublayer preview
            if (target) {
                const node = this.currentLayer.nodes.get(target.userData.id);
                if (node) {
                    if (!node.subLayer || !node.subLayer.group.visible) {
                        const pos = node.mesh.position;
                        console.log(`[Interaction] Hover node: ${node.id} at (${pos.x}, ${pos.y}, ${pos.z})`);
                    }
                    this.ensureSubLayer(node);
                    node.subLayer.group.visible = true;
                }
            }
        } else {
            this.container.style.cursor = 'default';
            this.currentLayer.onHover(null);
            this.hoveredNode = null;

            // Hide all sublayers of current layer when not hovering
            // Strict visibility: Only current layer and active sublayer are visible.
            this.currentLayer.nodes.forEach(n => {
                if (n.subLayer) n.subLayer.group.visible = false;
            });
        }
    }

    onDoubleClick(event) {
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.camera);

        // Check for node click first (maybe for drill down later)
        const intersectsNodes = this.raycaster.intersectObjects(this.currentLayer.getInteractables(), true);
        if (intersectsNodes.length > 0) return; // Don't add node if double clicking an existing one

        // Check for plane click
        const intersectsPlane = this.raycaster.intersectObject(this.currentLayer.plane);
        if (intersectsPlane.length > 0) {
            const point = intersectsPlane[0].point;
            // Convert to local layout coordinates roughly
            // Layout engine overwrites X/Z based on rank, so adding at specific X/Z might be temporary
            // For now, let's just add it and let layout handle it. 
            // Or better: prompt for name
            const label = prompt("New Node Label:");
            if (label) {
                const id = 'n_' + Date.now();
                this.currentLayer.addNode(id, label, 0, 0); // pos will be fixed by layout
                console.log(`Node created: ${id} "${label}"`);
            }
        }
    }

    onClick(event) {
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.currentLayer.getInteractables(), true);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            // Traverse up to find the Group or Mesh with ID
            let target = object;
            while (target && !target.userData.id) {
                target = target.parent;
            }

            if (target) {
                const nodeId = target.userData.id;

                // Use currentLayer instead of rootLayer
                const node = this.currentLayer.nodes.get(nodeId);

                if (node) {
                    const pos = node.mesh.position;
                    // Log CLICK Coordinates
                    console.log(`[Interaction] Click detected at Screen(${event.clientX}, ${event.clientY})`);
                    console.log(`[Interaction] Click node: ${node.id} at World(${pos.x}, ${pos.y}, ${pos.z})`);
                    if (event.ctrlKey || event.metaKey) {
                        // Linking Logic
                        if (this.linkSource === node) {
                            this.linkSource = null; // Deselect
                            console.log("Link source deselected");
                        } else if (this.linkSource) {
                            this.currentLayer.addEdge(this.linkSource.id, node.id);
                            this.linkSource = null;
                            console.log("Linked:", this.linkSource.id, "->", node.id);
                        } else {
                            this.linkSource = node;
                            console.log("Link source selected:", node.id);
                        }
                    } else {
                        // Navigation Logic
                        this.focusNode(node);
                    }
                }
            }
        }
    }

    onKeyDown(event) {
        if ((event.key === 'Delete' || event.key === 'Backspace') && this.hoveredNode) {
            const id = this.hoveredNode.userData.id;
            console.log("Deleting node:", id);
            this.currentLayer.removeNode(id);
            this.hoveredNode = null;
            this.container.style.cursor = 'default';
        }

        switch (event.key.toLowerCase()) {
            case 'w': this.keys.w = true; break;
            case 'a': this.keys.a = true; break;
            case 's': this.keys.s = true; break;
            case 'd': this.keys.d = true; break;
        }
    }

    onKeyUp(event) {
        switch (event.key.toLowerCase()) {
            case 'w': this.keys.w = false; break;
            case 'a': this.keys.a = false; break;
            case 's': this.keys.s = false; break;
            case 'd': this.keys.d = false; break;
        }
    }

    findNodeRecursive(layer, id) {
        if (layer.nodes.has(id)) return layer.nodes.get(id);
        for (const n of layer.nodes.values()) {
            if (n.subLayer) {
                const found = this.findNodeRecursive(n.subLayer, id);
                if (found) return found;
            }
        }
        return null;
    }

    ensureSubLayer(node) {
        if (!node.subLayer) {
            const parentY = this.currentLayer.yOffset;
            const parentX = node.mesh.position.x;
            const parentZ = node.mesh.position.z;

            // Pass parent X/Z so the new layer is centered under the node
            // Note: Since we are nesting layers in the SCENE (not in the parent mesh),
            // we need to offset the new layer's group to match the parent's world position (ignoring parent layer offset if we want absolute?)
            // Actually, `node.mesh.position` is local to `this.currentLayer.group`.
            // So world X = currentLayer.group.position.x + node.x
            // But usually currentLayer.group.position.x is 0 for root.

            // If we are deep in nesting, we need to accumulate offsets?
            // "Nested Layout" usually means: Position = ParentWorldPos + RelativePos
            // Our Layer class sets `this.group.position`.
            // So if we set `group.position.x = parentWorldX`, then `node(0,0)` in that layer will be at `parentWorldX`.

            const worldPos = new THREE.Vector3();
            node.mesh.getWorldPosition(worldPos);

            node.subLayer = new Layer(node.id + '_sub', this.scene, parentY - 20, worldPos.x, worldPos.z); // Downward nesting

            // Level 2 & 3 Generation
            ['Alpha', 'Beta', 'Gamma'].forEach((label, i) => {
                const subId = `${node.id}_child_${i}`;
                node.subLayer.addNode(subId, label, i * 3, 0);

                // Pre-generate Level 3 (Empty but ready)
            });

            node.subLayer.addEdge(`${node.id}_child_0`, `${node.id}_child_1`);
            node.subLayer.addEdge(`${node.id}_child_1`, `${node.id}_child_2`);

            console.log(`Sublayer created for node: ${node.id}`);
        }
    }

    focusNode(node) {
        // Create sublayer if not exists
        this.ensureSubLayer(node);

        // Hide other sublayers at this level
        this.currentLayer.nodes.forEach(n => {
            if (n.subLayer && n !== node && n.subLayer.group.visible) {
                n.subLayer.group.visible = false;
                console.log(`[Visibility] Hiding sibling sublayer: ${n.subLayer.id}`);
            }
        });

        // HIDE CURRENT (PARENT) LAYER
        this.currentLayer.group.visible = false;
        console.log(`[Visibility] Hiding parent layer: ${this.currentLayer.id}`);

        node.subLayer.group.visible = true;
        console.log(`[Visibility] Showing sublayer: ${node.subLayer.id}`);
        console.log(`[Navigation] Focusing node: ${node.id}, switching to sublayer: ${node.subLayer.id}`);

        // Push current state
        this.layerStack.push({
            layer: this.currentLayer,
            // Saved implicitly by orbit controls but we might want explicit restore points
            cameraPos: this.camera.position.clone(),
            target: this.cameraManager.controls.target.clone()
        });

        // Camera Transition - Over the Shoulder with Spline Path
        // Position: Behind and Above the *Current* Node, looking down at the *Sublayer*
        // Path: CurrentCam -> Through Node -> EndPos

        const offsetBack = 20;
        const offsetUp = 20;

        // Target: Center of sublayer (approx). 
        // Sublayer Y is node.subLayer.yOffset
        // Since sublayer is centered on node X/Z, look at that X/Z.
        const targetLookAt = new THREE.Vector3(node.mesh.position.x, node.subLayer.yOffset, node.mesh.position.z);

        // End Position: Relative to the NODE (parent coords)
        const targetPos = new THREE.Vector3(
            node.mesh.position.x,
            node.subLayer.yOffset + offsetUp, // 20 units above the sublayer
            node.mesh.position.z + offsetBack   // 20 units back
        );

        // Fly Through Point: The Node's center
        // const flyThroughPos = node.mesh.position.clone();
        // Actually, let's fly through slightly *above* it so we don't clip inside geometry?
        // Or right through it for effect? 
        const flyThroughPos = node.mesh.position.clone();

        this.cameraManager.flyThrough(
            this.camera.position.clone(),
            flyThroughPos,
            targetPos,
            targetLookAt
        );

        this.currentLayer = node.subLayer;
    }

    navigateUp() {
        console.log("[Navigation] Navigate Up triggered");
        if (this.layerStack.length === 0) return;

        // Hide current layer (which is the sublayer we are leaving)
        this.currentLayer.group.visible = false;
        console.log(`[Visibility] Hiding layer: ${this.currentLayer.id}`);

        const prevState = this.layerStack.pop();
        this.currentLayer = prevState.layer;

        // SHOW RESTORED LAYER
        this.currentLayer.group.visible = true;
        console.log(`[Visibility] Showing restored layer: ${this.currentLayer.id}`);

        this.cameraManager.transitionTo(prevState.cameraPos, prevState.target);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        this.cameraManager.update();
        if (this.currentLayer) this.currentLayer.update();

        // WASD Panning
        const panSpeed = 0.5;
        if (this.keys.w) this.cameraManager.pan(0, -panSpeed);
        if (this.keys.s) this.cameraManager.pan(0, panSpeed);
        if (this.keys.a) this.cameraManager.pan(-panSpeed, 0);
        if (this.keys.d) this.cameraManager.pan(panSpeed, 0);

        // Zoom out check
        if (this.layerStack.length > 0 && !this.cameraManager.isTransitioning) {
            const distance = this.camera.position.distanceTo(this.cameraManager.controls.target);
            if (distance > 60) {
                console.log(`[Navigation] Auto-zoom out triggered (Distance: ${distance.toFixed(1)})`);
                this.navigateUp();
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new App();
