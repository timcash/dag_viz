import * as THREE from 'three';
import { Layer } from './Layer';

export class Node {
    id: string;
    label: string;
    width: number = 2;
    depth: number = 1;
    height: number = 0.2;
    x: number;
    z: number;
    mesh: THREE.Mesh;
    border: THREE.LineSegments;
    subLayer: Layer | null = null;

    constructor(id: string, label: string, x: number, z: number) {
        this.id = id;
        this.label = label;
        this.x = x;
        this.z = z;

        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const material = new THREE.MeshPhongMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.9,
            emissive: 0x000000,
            emissiveIntensity: 1.0
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.userData = { id: id, type: 'node' };

        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true });
        this.border = new THREE.LineSegments(edges, lineMaterial);
        this.border.raycast = () => { }; // Disable raycasting for border to avoid snapping to edges
        this.mesh.add(this.border);

        this.createLabel(label);
        this.updatePosition();
    }

    updatePosition(): void {
        this.mesh.position.set(this.x, 0, this.z);
    }

    createLabel(text: string): void {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = 256;
        canvas.height = 128;

        context.fillStyle = 'black';
        context.fillRect(0, 0, 256, 128);

        context.font = 'bold 40px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 128, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const labelGeo = new THREE.PlaneGeometry(2, 1);
        const labelMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.y = 0.11;
        labelMesh.rotation.x = -Math.PI / 2;
        labelMesh.raycast = () => { }; // Disable raycasting for label to avoid surface offsets
        this.mesh.add(labelMesh);
    }

    setHover(isHovered: boolean): void {
        const mat = this.mesh.material as THREE.MeshPhongMaterial;
        const borderMat = this.border.material as THREE.LineBasicMaterial;

        if (isHovered) {
            borderMat.color.setHex(0x00ccff);
            mat.color.setHex(0x003366);
            mat.emissive.setHex(0x0066ff);
            mat.emissiveIntensity = 2.0;
        } else {
            borderMat.color.setHex(0xffffff);
            mat.color.setHex(0x000000);
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 1.0;
        }
    }

    setOpacity(value: number): void {
        const mat = this.mesh.material as THREE.MeshPhongMaterial;
        mat.opacity = 0.9 * value;

        const borderMat = this.border.material as THREE.LineBasicMaterial;
        borderMat.opacity = value;

        this.mesh.children.forEach(child => {
            if ((child as any).material) {
                (child as any).material.opacity = value;
            }
        });
    }
}
