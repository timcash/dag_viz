import * as THREE from "three";
import { Node } from "./Node";
import { Link } from "./Link";

export class Plane {
    group = new THREE.Group();
    nodes = new Map<string, Node>();
    links: Link[] = [];
    vills: Link[] = [];

    addNode(node: Node) {
        this.nodes.set(node.id, node);
        this.group.add(node.mesh);
    }

    addLink(fromNode: Node, toNode: Node) {
        const link = new Link(fromNode.mesh.position, toNode.mesh.position);
        this.links.push(link);
        this.group.add(link.line);
    }

    addVill(fromLocal: THREE.Vector3, toNode: Node, color: number) {
        // toNode.mesh.position is in this plane's space
        const toPos = toNode.mesh.position.clone();
        toPos.y += 1; // Top of 2x2x2 cube
        
        const link = new Link(fromLocal, toPos, color);
        this.vills.push(link);
        this.group.add(link.line);
    }
}
