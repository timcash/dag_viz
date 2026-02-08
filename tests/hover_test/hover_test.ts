import * as THREE from 'three';

class HoverTest {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    nodes: THREE.Mesh[] = [];
    raycaster: THREE.Raycaster;
    pointer: THREE.Vector2;
    hoverSpline: THREE.Line;
    splineGeometry: THREE.BufferGeometry;

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const light = new THREE.PointLight(0xffffff, 1.5);
        light.position.set(10, 10, 10);
        this.scene.add(light);

        this.camera.position.z = 15;
        this.camera.position.y = 5;
        this.camera.lookAt(0, 0, 0);

        this.createNodes();

        // Spline for debugging
        this.splineGeometry = new THREE.BufferGeometry();
        this.hoverSpline = new THREE.Line(this.splineGeometry, new THREE.LineBasicMaterial({ color: 0xff00ff }));
        this.scene.add(this.hoverSpline);

        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.animate();
    }

    createNodes() {
        const geometry = new THREE.BoxGeometry(4, 1, 4);
        const positions = [
            new THREE.Vector3(-6, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(6, 0, 0)
        ];

        positions.forEach((pos, i) => {
            const material = new THREE.MeshPhongMaterial({
                color: 0x444444,
                emissive: 0x000000
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(pos);
            mesh.name = `Node_${i}`;
            // Add a "label" child to test recursive hit testing
            const labelGeo = new THREE.SphereGeometry(0.5);
            const labelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const label = new THREE.Mesh(labelGeo, labelMat);
            label.position.set(0, 1, 0);
            label.name = `Label_${i}`;
            label.raycast = () => { }; // Debug: ignore labels for intersection
            mesh.add(label);

            this.nodes.push(mesh);
            this.scene.add(mesh);
        });

        const gridSize = 20;
        const divisions = 20;
        const gridHelper = new THREE.GridHelper(gridSize, divisions, 0x444444, 0x222222);
        this.scene.add(gridHelper);
    }

    onPointerMove(event: PointerEvent) {
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.nodes, true);

        // Reset all
        this.nodes.forEach(node => {
            (node.material as THREE.MeshPhongMaterial).emissive.setHex(0x000000);
        });

        if (intersects.length > 0) {
            let target = intersects[0].object;
            // Traverse to parent if we hit the label
            while (target.parent && target !== this.scene && !this.nodes.includes(target as THREE.Mesh)) {
                target = target.parent;
            }

            if (this.nodes.includes(target as THREE.Mesh)) {
                (target as THREE.Mesh).scale.set(1.1, 1.1, 1.1);
                ((target as THREE.Mesh).material as THREE.MeshPhongMaterial).emissive.setHex(0x00ffff);

                // Update Debug Spline
                const points = [this.camera.position.clone(), intersects[0].point.clone()];
                this.splineGeometry.setFromPoints(points);
                this.hoverSpline.visible = true;

                console.log(`[Hover] Hit: ${target.name} at ${intersects[0].point.x.toFixed(2)}, ${intersects[0].point.y.toFixed(2)}`);
            }
        } else {
            this.nodes.forEach(node => node.scale.set(1, 1, 1));
            this.hoverSpline.visible = false;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new HoverTest();
