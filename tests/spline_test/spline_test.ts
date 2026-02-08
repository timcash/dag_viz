import * as THREE from 'three';

class SplineTest {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const light = new THREE.PointLight(0xffffff, 1.5);
        light.position.set(20, 20, 20);
        this.scene.add(light);

        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 5, 0);

        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.points = [
            new THREE.Vector3(-10, 0, 0),
            new THREE.Vector3(-5, 8, 5),
            new THREE.Vector3(0, 2, 0),
            new THREE.Vector3(5, 8, -5),
            new THREE.Vector3(10, 0, 0)
        ];

        this.createSpline();
        this.animate();
    }

    createSpline() {
        // Tube
        const curve = new THREE.CatmullRomCurve3(this.points);
        const geometry = new THREE.TubeGeometry(curve, 100, 0.3, 12, false);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            emissive: 0x330033,
            shininess: 100
        });
        this.tube = new THREE.Mesh(geometry, material);
        this.group.add(this.tube);

        // Control Points (Green spheres)
        this.points.forEach(p => {
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry(0.5),
                new THREE.MeshBasicMaterial({ color: 0x00ff00 })
            );
            dot.position.copy(p);
            this.group.add(dot);
        });

        // Grid for reference
        const grid = new THREE.GridHelper(40, 40, 0x444444, 0x222222);
        this.scene.add(grid);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.group.rotation.y += 0.005;
        this.renderer.render(this.scene, this.camera);
    }
}

new SplineTest();
