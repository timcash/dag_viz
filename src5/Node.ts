import * as THREE from "three";

export class Node {
    mesh: THREE.Mesh;
    id: string;
    subLayer: any = null;

    constructor(id: string, x: number, y: number, z: number) {
        this.id = id;
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhongMaterial({ color: 0x888888 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
    }
}
