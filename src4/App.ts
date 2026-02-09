import { Stage } from "./Stage";
import * as THREE from "three";
export class App {
    stage = new Stage();
    isV4Implemented = true;
    constructor() {
        const materials = [
            new THREE.MeshPhongMaterial({ color: 0xff0000 }), // Right (+X) - Red
            new THREE.MeshPhongMaterial({ color: 0xff0000 }), // Left (-X) - Red
            new THREE.MeshPhongMaterial({ color: 0x0000ff }), // Top (+Y) - Blue
            new THREE.MeshPhongMaterial({ color: 0x0000ff }), // Bottom (-Y) - Blue
            new THREE.MeshPhongMaterial({ color: 0x00ff00 }), // Front (+Z) - Green
            new THREE.MeshPhongMaterial({ color: 0x00ff00 })  // Back (-Z) - Green
        ];
        const box = new THREE.Mesh(new THREE.BoxGeometry(5,5,5), materials);
        this.stage.scene.add(box);
        this.animate();
    }
    private animate() {
        requestAnimationFrame(() => this.animate());
        this.stage.render();
    }
    moveCamera(pos: THREE.Vector3, target: THREE.Vector3, alpha: number, label?: string) {
        if (label) {
            this.stage.camera.position.copy(pos);
        } else {
            this.stage.camera.position.lerp(pos, alpha);
        }
        this.stage.camera.lookAt(target);

        const p = this.stage.camera.position;
        const pStr = `(${Math.round(p.x)}, ${Math.round(p.y)}, ${Math.round(p.z)})`;
        if (label) {
            console.log(`[v4-app] Camera moved to ${label}: ${pStr}`);
        } else {
            console.log(`[v4-app] Interpolation alpha ${alpha.toFixed(1)}: ${pStr}`);
        }
    }
}
(window as any).app = new App();
(window as any).THREE = THREE;