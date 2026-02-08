import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class CameraManager {
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    activePath: THREE.Curve<THREE.Vector3> | null = null;
    rideProgress: number = 0;
    isRideMode: boolean = false;

    constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
        this.camera = camera;
        this.controls = new OrbitControls(camera, domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    setRideMode(active: boolean): void {
        this.isRideMode = active;
        this.controls.enabled = !active;
        console.log(`[Camera] Ride Mode: ${active}`);
    }

    setPath(curve: THREE.Curve<THREE.Vector3>): void {
        this.activePath = curve;
        this.isRideMode = true;
    }

    update(): void {
        if (this.isRideMode && this.activePath) {
            // "Rollercoaster" Update
            const eye = this.activePath.getPointAt(this.rideProgress);
            const viewEye = eye.clone().add(new THREE.Vector3(0, 0.5, 0));
            this.camera.position.copy(viewEye);

            const lookForward = Math.min(this.rideProgress + 0.02, 1.0);
            const target = this.activePath.getPointAt(lookForward);

            if (lookForward <= this.rideProgress) {
                const tangent = (this.activePath as any).getTangentAt ? (this.activePath as any).getTangentAt(this.rideProgress) : new THREE.Vector3(1, 0, 0);
                const projectedTarget = eye.clone().add(tangent);
                this.controls.target.copy(projectedTarget);
            } else {
                this.controls.target.copy(target);
            }

            this.camera.lookAt(this.controls.target);
        }

        this.controls.update();
    }

    pan(x: number, y: number): void {
        const offset = new THREE.Vector3();
        const position = this.camera.position;
        offset.copy(position).sub(this.controls.target);

        const target = this.controls.target;
        const left = new THREE.Vector3();
        left.setFromMatrixColumn(this.camera.matrix, 0);
        const up = new THREE.Vector3();
        up.setFromMatrixColumn(this.camera.matrix, 1);

        left.multiplyScalar(x);
        up.multiplyScalar(y);

        target.add(left).add(up);
        position.add(left).add(up);
    }
}
