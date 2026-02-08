import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class CameraManager {
    constructor(camera, domElement) {
        this.camera = camera;
        this.controls = new OrbitControls(camera, domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        this.targetPosition = null;
        this.targetLookAt = null;
        this.isTransitioning = false;

        // Snappy Zoom Settings
        this.lerpFactor = 0.15;
        this.stoppingThreshold = 0.1;

        // Panning Speed
        this.panSpeed = 0.5;
    }

    pan(deltaX, deltaZ) {
        // Move camera and target together to pan
        // We want to pan relative to the camera's orientation on the XZ plane

        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, this.camera.up).normalize();

        const moveVec = new THREE.Vector3();
        moveVec.addScaledVector(forward, deltaZ);
        moveVec.addScaledVector(right, deltaX);

        this.camera.position.add(moveVec);
        this.controls.target.add(moveVec);
    }

    transitionTo(position, lookAt) {
        console.log(`[Camera] TransitionTo: Pos(${position.x},${position.y},${position.z}) LookAt(${lookAt.x},${lookAt.y},${lookAt.z})`);
        this.targetPosition = position;
        this.targetLookAt = lookAt;
        this.isTransitioning = true;
        this.controls.enabled = false;
    }

    flyThrough(startPos, midPos, endPos, endLookAt) {
        console.log(`[Camera] FlyThrough initiated`);

        // precise curve passing through midPos
        this.flightCurve = new THREE.CatmullRomCurve3([
            startPos,
            midPos,
            endPos
        ]);

        this.targetLookAt = endLookAt;
        this.flightStartTime = performance.now();
        this.flightDuration = 2000; // 2 seconds
        this.isFlying = true;
        this.isTransitioning = false; // Disable linear transition
        this.controls.enabled = false;
    }

    update() {
        if (this.isFlying) {
            const now = performance.now();
            const progress = Math.min((now - this.flightStartTime) / this.flightDuration, 1.0);

            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            // Get position on curve
            const point = this.flightCurve.getPoint(ease);
            this.camera.position.copy(point);

            // Lerp LookAt to target
            // We want to look *ahead* or eventually at the target.
            // Simple lerp of target:
            this.controls.target.lerp(this.targetLookAt, 0.1);
            this.camera.lookAt(this.controls.target);

            if (progress >= 1.0) {
                console.log('[Camera] FlyThrough Complete');
                this.isFlying = false;
                this.controls.enabled = true;
            }
        }
        else if (this.isTransitioning) {
            // Move camera
            this.camera.position.lerp(this.targetPosition, this.lerpFactor);
            // Move target
            this.controls.target.lerp(this.targetLookAt, this.lerpFactor);
            this.camera.lookAt(this.controls.target);

            if (this.camera.position.distanceTo(this.targetPosition) < this.stoppingThreshold &&
                this.controls.target.distanceTo(this.targetLookAt) < this.stoppingThreshold) {

                console.log('[Camera] Transition Complete');
                this.isTransitioning = false;
                this.controls.enabled = true;
            }
        }
        this.controls.update();
    }
}
