import * as THREE from 'three';

export class Node {
    constructor(id, label, x, z) {
        this.id = id;
        this.label = label;
        this.width = 2;
        this.depth = 1;
        this.height = 0.2;

        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: false,
            transparent: true,
            opacity: 0.9
        });

        this.mesh = new THREE.Mesh(geometry, material);
        // Position will be set by updatePosition or init

        // Edge Glow / Border
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        this.border = new THREE.LineSegments(edges, lineMaterial);
        this.mesh.add(this.border);

        // Label Texture (created via method)
        this.createLabel(label);

        // Group for raycasting identification
        this.mesh.userData = { id: id, type: 'node' };

        // Position properties for layout
        this.x = x;
        this.z = z;
        this.updatePosition();

        // Nested layer
        this.subLayer = null;
    }

    updatePosition() {
        this.mesh.position.set(this.x, 0, this.z);
    }

    createLabel(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
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
        labelMesh.position.y = 0.11; // Slightly above box
        labelMesh.rotation.x = -Math.PI / 2;
        this.mesh.add(labelMesh);
    }

    setHover(isHovered) {
        if (isHovered) {
            this.border.material.color.setHex(0x0088ff); // Blue glow
        } else {
            this.border.material.color.setHex(0xffffff);
        }
    }
}
