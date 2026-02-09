import * as THREE from 'three';
import { Stage } from './Stage';
import { Navigator } from './Navigator';
import { InputManager } from './InputManager';
import { UIController } from './UIController';
import { GraphPlane } from './GraphPlane';
import { LayoutEngine } from './LayoutEngine';

/**
 * App: Bootstrap for Dag Viz v2.0
 */
export class App {
    stage: Stage;
    navigator: Navigator;
    input: InputManager;
    ui: UIController;
    
    rootPlane: GraphPlane;
    currentPlane: GraphPlane;

    constructor() {
        (window as any).THREE = THREE;
        console.log("[App] Initializing v2.0...", window.location.href);
        // Step 0: Error-Ping
        if (window.location.search.includes('error-ping')) {
            console.log("[App] Error-ping detected, throwing error...");
            throw new Error('Smoke Test Error');
        }

        this.stage = new Stage();
        this.navigator = new Navigator(this.stage.camera);
        this.input = new InputManager(this);
        this.ui = new UIController(this);

        this.rootPlane = new GraphPlane('root', 0);
        this.currentPlane = this.rootPlane;
        this.stage.scene.add(this.rootPlane.group);

        // Multiple nodes for layout and edge testing
        this.rootPlane.addNode('node_0', 'Start');
        this.rootPlane.addNode('node_1', 'Process');
        this.rootPlane.addNode('node_2', 'End');

        this.rootPlane.addLink('node_0', 'node_1');
        this.rootPlane.addLink('node_1', 'node_2');

        const sub = this.rootPlane.nodes.get('node_0')!.ensureSubLayer();
        sub.addNode('sub_0', 'Child A');
        sub.addNode('sub_1', 'Child B');
        sub.addLink('sub_0', 'sub_1');

        LayoutEngine.apply(this.rootPlane);

        this.stage.camera.lookAt(0, 0, 0);
        this.animate();
    }

    private animate(): void {
        requestAnimationFrame(() => this.animate());
        this.ui.updateBreadcrumbs();
        this.ui.updateMinimap();
        this.stage.render();
    }

    get hoveredNodeId(): string | null {
        let foundId: string | null = null;
        const checkPlane = (plane: GraphPlane) => {
            plane.nodes.forEach(node => {
                const mat = node.mesh.material as THREE.MeshPhongMaterial;
                if (mat.emissiveIntensity > 1.0) foundId = node.id;
                if (node.subPlane) checkPlane(node.subPlane);
            });
        };
        checkPlane(this.rootPlane);
        return foundId;
    }
}

(window as any).app = new App();
