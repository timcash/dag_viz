import * as THREE from 'three';

export class Edge {
    constructor(fromNode, toNode, weight = 0.5) {
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.weight = weight;

        this.curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(),
            new THREE.Vector3(), // Control point 1
            new THREE.Vector3(), // Control point 2
            new THREE.Vector3()
        ]);

        // Glow Simulation:
        // High weight = Brighter, More Opaque
        // Low weight = Dimmer, More Transparent
        // Color Interpolation: Blue (low) -> Cyan -> White (high)

        const baseColor = new THREE.Color(0x0088ff);
        const glowColor = new THREE.Color(0xaaccff);
        const finalColor = baseColor.clone().lerp(glowColor, weight);

        const opacity = 0.3 + (0.7 * weight); // Min 0.3, Max 1.0

        const points = this.getCurvePoints();
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: finalColor,
            opacity: opacity,
            transparent: true,
            linewidth: 1 // Note: Windows WebGL implementation often ignores linewidth > 1
        });

        this.mesh = new THREE.Line(geometry, material);
    }

    getCurvePoints() {
        const start = this.fromNode.mesh.position;
        const end = this.toNode.mesh.position;

        // Create a nice curve. 
        // If nodes are on same Y, curve up/down slightly? 
        // Or just straight if same rank?
        // Standard DAG vis: simple straight or slight S-curve.

        // Let's use CubicBezier
        // Control points should be biased towards the "flow" direction (usually +X or +Z)

        const dist = start.distanceTo(end);
        const midX = (start.x + end.x) / 2;

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

    update() {
        const points = this.getCurvePoints();
        this.mesh.geometry.setFromPoints(points);
        this.mesh.geometry.attributes.position.needsUpdate = true;
    }
}
