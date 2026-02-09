import * as THREE from 'three';
import { App } from './App';

export class InputManager {
    app: App;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    lastHoveredId: string | null = null;

    constructor(app: App) {
        this.app = app;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    private onMouseMove(e: MouseEvent): void {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.app.stage.camera);
        
        const intersects = this.raycaster.intersectObjects(this.app.nodes.map(n => n.mesh));
        
        let currentHoveredId: string | null = null;
        if (intersects.length > 0) {
            currentHoveredId = intersects[0].object.userData.id;
        }

        if (currentHoveredId !== this.lastHoveredId) {
            this.lastHoveredId = currentHoveredId;
            this.app.hoveredNodeId = currentHoveredId;
            console.log(`[v3-app] Hover change: ${currentHoveredId}`);
            
            this.app.nodes.forEach(node => {
                node.setHover(node.id === currentHoveredId);
            });
        }
    }
}
