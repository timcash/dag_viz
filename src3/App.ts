import { Stage } from './Stage';
import { Node } from './Node';
import { InputManager } from './InputManager';

export class App {
    stage: Stage;
    inputManager: InputManager;
    nodes: Node[] = [];
    hoveredNodeId: string | null = null;

    constructor() {
        this.stage = new Stage();
        
        const nodeA = new Node('node_A', -10);
        const nodeB = new Node('node_B', 10);
        
        this.nodes.push(nodeA, nodeB);
        this.stage.scene.add(nodeA.mesh);
        this.stage.scene.add(nodeB.mesh);

        this.inputManager = new InputManager(this);

        this.animate();

        (window as any).app = this;
        console.log(`[v3-app] System ready. Current hover: null`);
    }

    animate(): void {
        requestAnimationFrame(() => this.animate());
        this.stage.render();
    }
}

new App();
