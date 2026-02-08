import * as THREE from 'three';
import { Node } from './Node';
import { Edge } from './Edge';
import { Layout } from './Layout';

export class Layer {
    id: string;
    scene: THREE.Scene;
    nodes: Map<string, Node>;
    edges: { from: string, to: string, mesh: Edge }[];
    group: THREE.Group;
    plane: THREE.Mesh;
    yOffset: number;
    parentConnectionsGroup: THREE.Group;
    opacity: number;
    targetOpacity: number;

    constructor(id: string, scene: THREE.Scene, yOffset = 0, parentX = 0, parentZ = 0) {
        this.id = id;
        this.scene = scene;
        this.nodes = new Map();
        this.edges = [];
        this.group = new THREE.Group();
        this.group.position.y = yOffset;

        this.group.position.x = parentX;
        this.group.position.z = parentZ;

        this.group.visible = id === 'root';
        this.scene.add(this.group);

        const planeGeo = new THREE.PlaneGeometry(100, 100);
        const planeMat = new THREE.MeshBasicMaterial({ visible: false });
        this.plane = new THREE.Mesh(planeGeo, planeMat);
        this.plane.rotation.x = -Math.PI / 2;
        this.group.add(this.plane);

        this.yOffset = yOffset;

        this.parentConnectionsGroup = new THREE.Group();
        this.group.add(this.parentConnectionsGroup);

        this.opacity = (id === 'root') ? 1.0 : 0.0;
        this.targetOpacity = (id === 'root') ? 1.0 : 0.0;
    }

    updateParentConnections(parentLocalPos: THREE.Vector3): void {
        while (this.parentConnectionsGroup.children.length > 0) {
            const child = this.parentConnectionsGroup.children[0] as THREE.Line;
            if (child.geometry) child.geometry.dispose();
            if (child.material) (child.material as THREE.Material).dispose();
            this.parentConnectionsGroup.remove(child);
        }

        this.nodes.forEach(node => {
            const start = parentLocalPos;
            const end = node.mesh.position.clone();
            end.y += 2;

            const midY = (start.y + end.y) / 2;
            const control1 = new THREE.Vector3(start.x, midY, start.z);
            const control2 = new THREE.Vector3(end.x, midY, end.z);

            const curve = new THREE.CubicBezierCurve3(start, control1, control2, end);
            const points = curve.getPoints(20);

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.8,
                linewidth: 2
            });

            const line = new THREE.Line(geometry, material);
            this.parentConnectionsGroup.add(line);
        });
    }

    addNode(id: string, label: string, x = 0, z = 0): void {
        const node = new Node(id, label, x, z);
        this.nodes.set(id, node);
        this.group.add(node.mesh);
        this.refreshLayout();
    }

    addEdge(fromId: string, toId: string, weight = 0.5): void {
        const fromNode = this.nodes.get(fromId);
        const toNode = this.nodes.get(toId);
        if (fromNode && toNode) {
            const edge = new Edge(fromNode, toNode, weight);
            this.edges.push({ from: fromId, to: toId, mesh: edge });
            this.group.add(edge.mesh);
            this.refreshLayout();
        }
    }

    removeNode(id: string): void {
        const node = this.nodes.get(id);
        if (!node) return;

        this.edges = this.edges.filter(e => {
            if (e.from === id || e.to === id) {
                this.group.remove(e.mesh.mesh);
                return false;
            }
            return true;
        });

        this.group.remove(node.mesh);
        this.nodes.delete(id);

        this.refreshLayout();
    }

    refreshLayout(): void {
        const simpleEdges = this.edges.map(e => ({ from: e.from, to: e.to }));
        Layout.compute(this.nodes, simpleEdges);

        this.nodes.forEach(node => {
            node.updatePosition();
        });

        this.edges.forEach(edgeObj => {
            edgeObj.mesh.update();
        });
    }

    getInteractables(): THREE.Object3D[] {
        return Array.from(this.nodes.values()).map(n => n.mesh);
    }

    onHover(object: THREE.Object3D | null): void {
        this.nodes.forEach(node => {
            let isTarget = false;
            let current = object;
            while (current) {
                if (current === node.mesh) {
                    isTarget = true;
                    break;
                }
                current = current.parent;
            }
            node.setHover(isTarget);
        });
    }

    update(): void {
        if (Math.abs(this.opacity - this.targetOpacity) > 0.001) {
            this.opacity += (this.targetOpacity - this.opacity) * 0.1;

            this.nodes.forEach(node => node.setOpacity(this.opacity));
            this.edges.forEach(edgeObj => edgeObj.mesh.setOpacity(this.opacity));

            this.parentConnectionsGroup.children.forEach(child => {
                const line = child as THREE.Line;
                if (line.material) (line.material as THREE.LineBasicMaterial).opacity = 0.8 * this.opacity;
            });
        }

        if (this.targetOpacity > 0 || this.opacity > 0.01) {
            this.group.visible = true;
        } else {
            this.group.visible = false;
        }
    }
}
