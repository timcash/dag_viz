import * as THREE from 'three';
import { Layer } from './Layer';
import { CameraManager } from './CameraManager';
import { Spline } from './Spline';
import { HUD } from './HUD';
import { Node } from './Node';

interface LayerStackEntry {
    layer: Layer;
    progress: number;
}

export class App {
    container: HTMLElement;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    rootLayer: Layer;
    currentLayer: Layer;
    layerStack: LayerStackEntry[] = [];
    cameraManager: CameraManager;
    hoverSpline: Spline;
    masterPathSpline: Spline;
    hud: HUD;
    raycaster: THREE.Raycaster;
    pointer: THREE.Vector2;
    keys: { w: boolean; a: boolean; s: boolean; d: boolean };
    masterPathPoints: THREE.Vector3[];
    masterCurve: THREE.CatmullRomCurve3 | null = null;
    travelProgress: number = 0;
    linkSource: Node | null = null;
    hoveredNode: THREE.Object3D | null = null;

    constructor() {
        console.log("[App] Rollercoaster Version 2.0 (TS) Loaded");
        this.container = document.getElementById('canvas-container')!;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.002);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0x404040));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        this.scene.add(new THREE.GridHelper(100, 50, 0x333333, 0x111111));

        this.rootLayer = new Layer('root', this.scene);
        this.currentLayer = this.rootLayer;

        this.cameraManager = new CameraManager(this.camera, this.renderer.domElement);
        this.hoverSpline = new Spline(this.scene, true, 0xffd700); // Golden Tube for hover
        this.hoverSpline.mesh.visible = true;

        this.masterPathSpline = new Spline(this.scene, true, 0xff00ff); // Magenta Tube for master path
        this.masterPathSpline.targetOpacity = 1.0;
        this.masterPathSpline.mesh.visible = true;

        this.hud = new HUD();

        window.addEventListener('resize', () => this.onResize());

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('click', (e) => this.onClick(e));
        window.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('wheel', (e) => this.onMouseWheel(e));

        this.keys = { w: false, a: false, s: false, d: false };
        this.masterPathPoints = [this.camera.position.clone()];

        this.animate();
        this.initDemo();

        (window as any).getSceneMetrics = () => this.getSceneMetrics();
    }

    getSceneMetrics() {
        return {
            cameraPos: this.camera.position.toArray(),
            cameraTarget: this.cameraManager.controls.target.toArray(),
            currentLayerId: this.currentLayer.id,
            nodeCount: this.currentLayer.nodes.size,
        };
    }

    initDemo() {
        const ranks = 4;
        const nodesPerRank = [3, 4, 3, 2];
        const nodes: { id: string, rank: number }[] = [];

        this.camera.position.set(0, 30, 40);
        this.camera.lookAt(0, 0, 0);
        this.cameraManager.controls.target.set(0, 0, 0);

        const spawnPos = this.camera.position.clone();
        const startTarget = new THREE.Vector3(0, 0, 0);
        this.masterPathPoints = [spawnPos, startTarget];
        this.masterCurve = new THREE.CatmullRomCurve3(this.masterPathPoints);

        // Initial visual track (Magenta 0.2 radius)
        this.masterPathSpline.setPath(this.masterCurve.getPoints(50), 0.2);
        this.masterPathSpline.targetOpacity = 0.5;

        let nodeIndex = 0;
        nodesPerRank.forEach((count, rankIndex) => {
            for (let i = 0; i < count; i++) {
                const id = `root_${nodeIndex}`;
                const z = (i - (count - 1) / 2) * 5;
                const x = rankIndex * 10;

                this.rootLayer.addNode(id, `Node ${nodeIndex}`, x, z);
                const node = this.rootLayer.nodes.get(id)!;

                this.ensureSubLayer(node);
                for (let j = 0; j < 2; j++) {
                    const subId = `${id}_sub_${j}`;
                    node.subLayer!.addNode(subId, `Sub ${nodeIndex}.${j}`, 5, (j - 0.5) * 4);
                }

                nodes.push({ id, rank: rankIndex });
                nodeIndex++;
            }
        });

        for (let r = 0; r < ranks - 1; r++) {
            const currentRNodeIds = nodes.filter(n => n.rank === r).map(n => n.id);
            const nextRNodeIds = nodes.filter(n => n.rank === r + 1).map(n => n.id);

            currentRNodeIds.forEach(sourceId => {
                const numTargets = Math.floor(Math.random() * 2) + 1;
                const targets = [...nextRNodeIds].sort(() => 0.5 - Math.random()).slice(0, numTargets);
                targets.forEach(targetId => {
                    this.rootLayer.addEdge(sourceId, targetId);
                });
            });
        }

        this.rootLayer.refreshLayout();
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseWheel(event: WheelEvent) {
        const sensitivity = 0.0005;
        this.travelProgress -= event.deltaY * sensitivity;
        this.travelProgress = Math.max(0, Math.min(1, this.travelProgress));

        if (this.cameraManager.isRideMode) {
            this.cameraManager.rideProgress = this.travelProgress;
        }

        if (this.travelProgress === 0 && event.deltaY > 0 && this.layerStack.length > 0) {
            this.navigateUp();
        }
    }

    onPointerMove(event: PointerEvent) {
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const interactables = this.currentLayer.getInteractables();

        const intersects = this.raycaster.intersectObjects(interactables, true);

        if (intersects.length > 0) {
            this.container.style.cursor = 'pointer';
            let target = intersects[0].object;
            console.log(`[Interaction] Hit: ${target.name} (Type: ${target.type}) at ${intersects[0].point.x.toFixed(2)}, ${intersects[0].point.y.toFixed(2)}`);
            this.currentLayer.onHover(target);

            let nTarget: THREE.Object3D | null = target;
            while (nTarget && !nTarget.userData.id) nTarget = nTarget.parent;

            if (nTarget) {
                const node = this.currentLayer.nodes.get(nTarget.userData.id);
                if (node) {
                    this.updateHoverSpline(node, intersects[0].point);
                }
            }
        } else {
            this.container.style.cursor = 'default';
            this.currentLayer.onHover(null);
            this.hoverSpline.targetOpacity = 0.0;
        }
    }

    onDoubleClick(event: MouseEvent) {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersectsNodes = this.raycaster.intersectObjects(this.currentLayer.getInteractables(), true);
        if (intersectsNodes.length > 0) return;

        const intersectsPlane = this.raycaster.intersectObject(this.currentLayer.plane);
        if (intersectsPlane.length > 0) {
            const label = prompt("New Node Label:");
            if (label) {
                const id = 'n_' + Date.now();
                this.currentLayer.addNode(id, label, 0, 0);
            }
        }
    }

    onClick(event: MouseEvent) {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.currentLayer.getInteractables(), true);

        if (intersects.length > 0) {
            let target: THREE.Object3D | null = intersects[0].object;
            while (target && !target.userData.id) target = target.parent;

            if (target) {
                const node = this.currentLayer.nodes.get(target.userData.id);
                if (node) {
                    if (event.ctrlKey || event.metaKey) {
                        if (this.linkSource === node) {
                            this.linkSource = null;
                        } else if (this.linkSource) {
                            this.currentLayer.addEdge(this.linkSource.id, node.id);
                            this.linkSource = null;
                        } else {
                            this.linkSource = node;
                        }
                    } else {
                        this.focusNode(node);
                    }
                }
            }
        }
    }

    onKeyDown(event: KeyboardEvent) {
        switch (event.key.toLowerCase()) {
            case 'w': this.keys.w = true; break;
            case 'a': this.keys.a = true; break;
            case 's': this.keys.s = true; break;
            case 'd': this.keys.d = true; break;
        }
    }

    onKeyUp(event: KeyboardEvent) {
        switch (event.key.toLowerCase()) {
            case 'w': this.keys.w = false; break;
            case 'a': this.keys.a = false; break;
            case 's': this.keys.s = false; break;
            case 'd': this.keys.d = false; break;
        }
    }

    ensureSubLayer(node: Node) {
        if (!node.subLayer) {
            const parentY = this.currentLayer.yOffset;
            const worldPos = new THREE.Vector3();
            node.mesh.getWorldPosition(worldPos);

            node.subLayer = new Layer(node.id + '_sub', this.scene, parentY - 20, worldPos.x, worldPos.z);

            ['Alpha', 'Beta', 'Gamma'].forEach((label, i) => {
                const subId = `${node.id}_child_${i}`;
                node.subLayer!.addNode(subId, label, i * 3, 0);
            });

            node.subLayer.addEdge(`${node.id}_child_0`, `${node.id}_child_1`);
            node.subLayer.addEdge(`${node.id}_child_1`, `${node.id}_child_2`);
        }
    }

    focusNode(node: Node) {
        this.ensureSubLayer(node);

        this.currentLayer.nodes.forEach(n => {
            if (n.subLayer && n !== node) {
                n.subLayer.targetOpacity = 0.0;
            }
        });

        const targetData = this.getCameraTargetForNode(node);
        const targetPos = targetData.targetPos;

        const curviness = 10;
        const start = this.masterPathPoints[this.masterPathPoints.length - 1];
        const segment = this.createTransitionCurve(start, targetPos, curviness);
        const interpolatedPoints = segment.getPoints(10).slice(1);

        this.masterPathPoints.push(...interpolatedPoints);

        const uniquePoints: THREE.Vector3[] = [];
        this.masterPathPoints.forEach((p, i) => {
            if (i === 0 || p.distanceTo(this.masterPathPoints[i - 1]) > 0.1) {
                uniquePoints.push(p);
            }
        });

        this.masterCurve = new THREE.CatmullRomCurve3(uniquePoints);
        this.masterPathSpline.setPath(this.masterCurve.getPoints(100), 0.2);
        this.masterPathSpline.targetOpacity = 1.0;

        this.cameraManager.setPath(this.masterCurve);
        node.subLayer!.updateParentConnections(new THREE.Vector3(0, 20, 0));

        node.subLayer!.targetOpacity = 1.0;
        node.subLayer!.group.visible = true;

        this.layerStack.push({
            layer: this.currentLayer,
            progress: this.travelProgress
        });

        this.currentLayer = node.subLayer!;
    }

    createTransitionCurve(start: THREE.Vector3, end: THREE.Vector3, curviness: number) {
        const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
        mid.y += curviness;

        const dir = new THREE.Vector3().subVectors(end, start).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const lateral = new THREE.Vector3().crossVectors(dir, up).normalize();
        mid.add(lateral.multiplyScalar(curviness * 0.5));

        return new THREE.CatmullRomCurve3([start, mid, end]);
    }

    navigateUp() {
        if (this.layerStack.length === 0) return;

        this.currentLayer.targetOpacity = 0.0;
        const prevState = this.layerStack.pop()!;
        this.currentLayer = prevState.layer;

        this.travelProgress = prevState.progress;
        this.cameraManager.rideProgress = this.travelProgress;

        this.currentLayer.targetOpacity = 1.0;
        this.currentLayer.group.visible = true;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.cameraManager.update();
        this.rootLayer.update();
        this.layerStack.forEach(entry => entry.layer.update());
        if (this.currentLayer && this.currentLayer !== this.rootLayer) {
            this.currentLayer.update();
        }

        this.hoverSpline.update();
        this.masterPathSpline.update();

        const panSpeed = 0.5;
        if (this.keys.w) this.cameraManager.pan(0, -panSpeed);
        if (this.keys.s) this.cameraManager.pan(0, panSpeed);
        if (this.keys.a) this.cameraManager.pan(-panSpeed, 0);
        if (this.keys.d) this.cameraManager.pan(panSpeed, 0);

        if (this.layerStack.length > 0) {
            const distance = this.camera.position.distanceTo(this.cameraManager.controls.target);
            if (distance > 60) {
                this.navigateUp();
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    updateHoverSpline(node: Node, mousePoint: THREE.Vector3) {
        this.ensureSubLayer(node);
        const start = this.camera.position.clone();
        const end = mousePoint.clone();

        // 2-point straight line as requested
        const points = [start, end];
        this.hoverSpline.setPath(points, 0.05); // Thinner golden "laser" line
        this.hoverSpline.targetOpacity = 1.0;
    }

    getCameraTargetForNode(node: Node) {
        const nodeWorldPos = new THREE.Vector3();
        node.mesh.getWorldPosition(nodeWorldPos);
        const sublayerY = nodeWorldPos.y - 20;
        const targetPos = new THREE.Vector3(nodeWorldPos.x, sublayerY + 20, nodeWorldPos.z + 20);
        const targetLookAt = new THREE.Vector3(nodeWorldPos.x, sublayerY, nodeWorldPos.z);
        return { targetPos, targetLookAt };
    }
}

new App();
