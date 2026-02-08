import * as THREE from 'three';

export class Spline {
    scene: THREE.Scene;
    isTube: boolean;
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
    mesh: THREE.Object3D;
    currentOpacity: number = 0;
    targetOpacity: number = 0;

    constructor(scene: THREE.Scene, isTube: boolean = false, color: number = 0xffd700) {
        this.scene = scene;
        this.isTube = isTube;
        this.geometry = new THREE.BufferGeometry();

        if (this.isTube) {
            this.material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.0,
            });
            this.mesh = new THREE.Mesh(this.geometry, this.material as THREE.MeshBasicMaterial);
        } else {
            this.material = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.0,
                linewidth: 4
            });
            this.mesh = new THREE.Line(this.geometry, this.material as THREE.LineBasicMaterial);
        }

        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    update(): void {
        this.currentOpacity += (this.targetOpacity - this.currentOpacity) * 0.1;
        this.material.opacity = this.currentOpacity;

        if (this.currentOpacity > 0.01) {
            this.mesh.visible = true;
        } else if (this.targetOpacity === 0) {
            this.mesh.visible = false;
        }
    }

    setPath(points: THREE.Vector3[], radius: number = 0.2): void {
        if (!points || points.length < 2) {
            this.mesh.visible = false;
            return;
        }

        // De-duplicate points for CatmullRom to avoid errors
        const uniquePoints: THREE.Vector3[] = [];
        for (let i = 0; i < points.length; i++) {
            if (i === 0 || points[i].distanceTo(points[i - 1]) > 0.001) {
                uniquePoints.push(points[i]);
            }
        }

        if (uniquePoints.length < 2) {
            this.mesh.visible = false;
            return;
        }

        if (this.isTube) {
            const curve = new THREE.CatmullRomCurve3(uniquePoints);
            const tubeGeo = new THREE.TubeGeometry(curve, 128, radius, 8, false);
            (this.mesh as THREE.Mesh).geometry.dispose();
            (this.mesh as THREE.Mesh).geometry = tubeGeo;
        } else {
            this.geometry.setFromPoints(uniquePoints);
            if (this.geometry.attributes.position) {
                this.geometry.attributes.position.needsUpdate = true;
            }
        }
    }

    dispose(): void {
        this.scene.remove(this.mesh);
        (this.mesh as THREE.Mesh).geometry.dispose();
        this.material.dispose();
    }
}
