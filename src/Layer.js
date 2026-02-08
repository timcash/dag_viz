import * as THREE from 'three';
import { Node } from './Node.js';
import { Edge } from './Edge.js';
import { Layout } from './Layout.js';

export class Layer {
    constructor(id, scene, yOffset = 0, parentX = 0, parentZ = 0) {
        this.id = id;
        this.scene = scene;
        this.nodes = new Map();
        this.edges = [];
        this.group = new THREE.Group();
        this.group.position.y = yOffset;

        // Center the group horizontally on the parent node
        this.group.position.x = parentX;
        this.group.position.z = parentZ;

        this.group.visible = id === 'root'; // Only root visible by default
        this.scene.add(this.group);

        // Invisible plane for raycasting clicks on "empty space"
        const planeGeo = new THREE.PlaneGeometry(100, 100);
        const planeMat = new THREE.MeshBasicMaterial({ visible: false });
        this.plane = new THREE.Mesh(planeGeo, planeMat);
        this.plane.rotation.x = -Math.PI / 2;
        this.group.add(this.plane);

        this.yOffset = yOffset;
    }

    addNode(id, label, x = 0, z = 0) {
        const node = new Node(id, label, x, z);
        this.nodes.set(id, node);
        this.group.add(node.mesh);
        this.refreshLayout();
    }

    addEdge(fromId, toId, weight = 0.5) {
        const fromNode = this.nodes.get(fromId);
        const toNode = this.nodes.get(toId);
        if (fromNode && toNode) {
            const edge = new Edge(fromNode, toNode, weight);
            this.edges.push({ from: fromId, to: toId, mesh: edge }); // Store mesh object
            this.group.add(edge.mesh);
            this.refreshLayout();
        }
    }

    removeNode(id) {
        const node = this.nodes.get(id);
        if (!node) return;

        // Remove edges connected to this node
        this.edges = this.edges.filter(e => {
            if (e.from === id || e.to === id) {
                this.group.remove(e.mesh.mesh);
                return false;
            }
            return true;
        });

        // Remove node mesh
        this.group.remove(node.mesh);
        this.nodes.delete(id);

        this.refreshLayout();
    }

    refreshLayout() {
        // Prepare simple edge objects for Layout
        const simpleEdges = this.edges.map(e => ({ from: e.from, to: e.to }));
        Layout.compute(this.nodes, simpleEdges);

        // Update node positions
        this.nodes.forEach(node => {
            node.updatePosition();
        });

        // Update edge geometries
        this.edges.forEach(edgeObj => {
            edgeObj.mesh.update();
        });
    }

    getInteractables() {
        return Array.from(this.nodes.values()).map(n => n.mesh);
    }

    onHover(object) {
        this.nodes.forEach(node => {
            node.setHover(object === node.mesh);
        });
    }

    update() {
        // Animation updates if needed
    }
}
