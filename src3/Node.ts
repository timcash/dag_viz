import * as THREE from 'three';

export class Node {
    id: string;
    mesh: THREE.Mesh;

    constructor(id: string, x: number) {
        this.id = id;
        const geometry = new THREE.BoxGeometry(5, 5, 5);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            emissive: 0x000000,
            emissiveIntensity: 1
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, 0, 0);
        this.mesh.userData = { id: this.id, type: 'node' };
    }

    setHover(isHovered: boolean): void {
        const mat = this.mesh.material as THREE.MeshStandardMaterial;
        if (isHovered) {
            mat.emissive.setHex(0x0066ff);
        } else {
            mat.emissive.setHex(0x000000);
        }
    }
}
