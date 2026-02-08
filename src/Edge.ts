import * as THREE from 'three';
import { Node } from './Node';

export class Edge {
    fromNode: Node;
    toNode: Node;
    weight: number;
    mesh: THREE.Line;

    constructor(fromNode: Node, toNode: Node, weight: number = 0.5) {
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.weight = weight;

        const baseColor = new THREE.Color(0x0088ff);
        const glowColor = new THREE.Color(0xaaccff);
        const finalColor = baseColor.clone().lerp(glowColor, weight);

        const opacity = 0.3 + (0.7 * weight);

        const points = this.getCurvePoints();
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: finalColor,
            opacity: opacity,
            transparent: true,
            linewidth: 1
        });

        this.mesh = new THREE.Line(geometry, material);
    }

    getCurvePoints(): THREE.Vector3[] {
        const start = this.fromNode.mesh.position;
        const end = this.toNode.mesh.position;

        const dist = start.distanceTo(end);

        const control1 = new THREE.Vector3(start.x + dist * 0.25, start.y + 2, start.z);
        const control2 = new THREE.Vector3(end.x - dist * 0.25, end.y + 2, end.z);

        const curve = new THREE.CubicBezierCurve3(
            start,
            control1,
            control2,
            end
        );

        return curve.getPoints(20);
    }

    update(): void {
        const points = this.getCurvePoints();
        this.mesh.geometry.setFromPoints(points);
        if (this.mesh.geometry.attributes.position) {
            this.mesh.geometry.attributes.position.needsUpdate = true;
        }
    }

    setOpacity(value: number): void {
        const baseOpacity = 0.3 + (0.7 * this.weight);
        (this.mesh.material as THREE.LineBasicMaterial).opacity = baseOpacity * value;
    }
}
