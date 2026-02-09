import * as THREE from "three";
export class Stage {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    constructor() {
        this.scene.background = new THREE.Color(0x111111);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x111111, 1);
        const container = document.getElementById("canvas-container") || document.body;
        container.appendChild(this.renderer.domElement);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(50, 50, 50);
        this.scene.add(dirLight);
    }
    render() { this.renderer.render(this.scene, this.camera); }
}