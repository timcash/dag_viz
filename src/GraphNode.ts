import * as THREE from 'three';
import { GraphPlane } from './GraphPlane';

/**
 * GraphNode: A node in the DAG.
 * (Steps 6, 7, 15, 16)
 */
export class GraphNode {
    id: string;
    label: string;
    mesh: THREE.Mesh;
    subPlane: GraphPlane | null = null;
    rank: number = 0;

    constructor(id: string, label: string) {
        this.id = id;
        this.label = label;
        
        const geometry = new THREE.BoxGeometry(4, 0.5, 2);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x444444,
            emissive: 0x222222,
            emissiveIntensity: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.userData = { id: id, type: 'node' };

        // Neon Border
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        this.mesh.add(wireframe);

        this.createLabel(label);
    }

    private createLabel(text: string): void {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 256, 128);
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const geometry = new THREE.PlaneGeometry(3.5, 1.5);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const labelMesh = new THREE.Mesh(geometry, material);
        
        labelMesh.position.y = 0.26; // Just above top face
        labelMesh.rotation.x = -Math.PI / 2;
        this.mesh.add(labelMesh);
    }

    setHover(active: boolean): void {
        const mat = this.mesh.material as THREE.MeshPhongMaterial;
        const wireframe = this.mesh.children.find(c => c instanceof THREE.LineSegments) as THREE.LineSegments;
        const borderMat = wireframe?.material as THREE.LineBasicMaterial;

        if (active) {
            mat.color.setHex(0x111111);
            mat.emissive.setHex(0x0066ff);
            mat.emissiveIntensity = 2.0;
            if (borderMat) {
                borderMat.color.setHex(0x00ffff);
                borderMat.opacity = 1.0;
            }
            if (this.subPlane) this.subPlane.group.visible = true;
        } else {
            mat.color.setHex(0x444444);
            mat.emissive.setHex(0x222222);
            mat.emissiveIntensity = 0.5;
            if (borderMat) {
                borderMat.color.setHex(0x888888);
                borderMat.opacity = 0.5;
            }
            if (this.subPlane) this.subPlane.group.visible = false;
        }
    }

    ensureSubLayer(): GraphPlane {
        if (!this.subPlane) {
            this.subPlane = new GraphPlane(this.id + '_sub', -20);
            this.subPlane.group.visible = false;
            this.mesh.add(this.subPlane.group);
        }
        return this.subPlane;
    }
}
