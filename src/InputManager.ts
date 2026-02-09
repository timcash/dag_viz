import * as THREE from 'three';
import { App } from './App';

/**
 * InputManager: Handles user input and raycasting.
 * (Steps 14, 15, 20, 27)
 */
export class InputManager {
    app: App;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;

    constructor(app: App) {
        this.app = app;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.initListeners();
    }

    private initListeners(): void {
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', (e) => this.onClick(e));
        window.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        window.addEventListener('wheel', (e) => this.onWheel(e));
    }

    private onDoubleClick(e: MouseEvent): void {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.app.stage.camera);

        // Intersect only the ground plane of the current layer
        const ground = this.app.currentPlane.group.children.find(c => c.geometry?.type === 'PlaneGeometry');
        if (!ground) return;

        const intersects = this.raycaster.intersectObject(ground);
        if (intersects.length > 0) {
            const pt = intersects[0].point;
            // Add node at the clicked position (local to the plane)
            const id = `node_${Date.now()}`;
            const node = this.app.currentPlane.addNode(id, 'New Node');
            // Convert world point to local plane point
            const localPt = this.app.currentPlane.group.worldToLocal(pt.clone());
            node.mesh.position.set(localPt.x, 0, localPt.z);
        }
    }

    private onMouseMove(e: MouseEvent): void {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.app.stage.camera);
        
        // Find ALL nodes in the scene (including nested ones)
        const allNodes: THREE.Object3D[] = [];
        const collectNodes = (plane: any) => {
            plane.nodes.forEach((node: any) => {
                allNodes.push(node.mesh);
                if (node.subPlane) collectNodes(node.subPlane);
            });
        };
        collectNodes(this.app.rootPlane);

        const intersects = this.raycaster.intersectObjects(allNodes, true);
        
        // Track which nodes are in the "active hover path"
        const activeHoverIds = new Set<string>();

        if (intersects.length > 0) {
            let obj: THREE.Object3D | null = intersects[0].object;
            while (obj) {
                if (obj.userData && obj.userData.type === 'node') {
                    const nodeId = obj.userData.id;
                    activeHoverIds.add(nodeId);
                    
                    // Also add parent nodes to keep sub-layers visible
                    // We need to walk up the THREE hierarchy to find parent nodes
                    let parent = obj.parent;
                    while (parent) {
                        if (parent.userData && parent.userData.type === 'node') {
                            activeHoverIds.add(parent.userData.id);
                        }
                        parent = parent.parent;
                    }
                    break;
                }
                obj = obj.parent;
            }
        }

        // Apply hover state recursively
        const applyHover = (plane: any) => {
            plane.nodes.forEach((node: any) => {
                node.setHover(activeHoverIds.has(node.id));
                if (node.subPlane) applyHover(node.subPlane);
            });
        };
        applyHover(this.app.rootPlane);
    }

    private onClick(e: MouseEvent): void {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.app.stage.camera);
        
        // Collect all nodes for clicking
        const allNodes: any[] = [];
        const collectNodes = (plane: any) => {
            plane.nodes.forEach((node: any) => {
                allNodes.push(node);
                if (node.subPlane) collectNodes(node.subPlane);
            });
        };
        collectNodes(this.app.rootPlane);

        const intersects = this.raycaster.intersectObjects(allNodes.map(n => n.mesh), true);
        
        if (intersects.length > 0) {
            let obj: THREE.Object3D | null = intersects[0].object;
            while (obj) {
                if (obj.userData && obj.userData.type === 'node') {
                    const nodeId = obj.userData.id;
                    // Find node object from the flat list
                    const node = allNodes.find(n => n.id === nodeId);
                    if (node) {
                        this.app.navigator.dive(node);
                    }
                    break;
                }
                obj = obj.parent;
            }
        }
    }
    private onWheel(e: WheelEvent): void {
        this.app.navigator.scrub(e.deltaY);
    }
}
