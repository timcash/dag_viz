import * as THREE from "three";

export class Link {
    line: THREE.Line;

    constructor(from: THREE.Vector3, to: THREE.Vector3, color: number = 0xaaaaaa) {
        const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
        const material = new THREE.LineBasicMaterial({ color: color });
        this.line = new THREE.Line(geometry, material);
    }
}
