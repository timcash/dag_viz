import * as THREE from 'three';

/**
 * Stage: Manages the 3D environment.
 * (Steps 1, 2, 3, 4)
 */
export class Stage {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a); // Very dark grey

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 30, 60);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x0a0a0a, 1);
        
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(50, 50, 50);
        this.scene.add(dirLight);

        this.scene.add(new THREE.GridHelper(200, 20, 0x333333, 0x111111));
        
        const container = document.getElementById('canvas-container') || document.body;
        container.appendChild(this.renderer.domElement);
    }

    render(): void {
        this.renderer.render(this.scene, this.camera);
    }
}
