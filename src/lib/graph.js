export class Graph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.nextNodeId = 0;
    this.nextEdgeId = 0;
    this.directed = false;
    this.weighted = true;
  }

  addNode(x, y, label = null) {
    const id = this.nextNodeId++;
    const node = { id, x, y, label: label ?? String(id) };
    this.nodes.set(id, node);
    return node;
  }

  addEdge(source, target, weight = 1) {
    if (source === target) return null;
    for (const edge of this.edges.values()) {
      if (
        (edge.source === source && edge.target === target) ||
        (!this.directed && edge.source === target && edge.target === source)
      ) {
        return null;
      }
    }
    const id = this.nextEdgeId++;
    const edge = { id, source, target, weight };
    this.edges.set(id, edge);
    return edge;
  }

  removeNode(id) {
    this.nodes.delete(id);
    const toRemove = [];
    for (const [edgeId, edge] of this.edges) {
      if (edge.source === id || edge.target === id) toRemove.push(edgeId);
    }
    toRemove.forEach((eid) => this.edges.delete(eid));
  }

  removeEdge(id) {
    this.edges.delete(id);
  }

  getNeighbors(nodeId) {
    const neighbors = [];
    for (const edge of this.edges.values()) {
      if (edge.source === nodeId) {
        neighbors.push({ nodeId: edge.target, weight: edge.weight, edgeId: edge.id });
      }
      if (!this.directed && edge.target === nodeId) {
        neighbors.push({ nodeId: edge.source, weight: edge.weight, edgeId: edge.id });
      }
    }
    return neighbors;
  }

  getDegree(nodeId) {
    return this.getNeighbors(nodeId).length;
  }

  getNodeArray() {
    return Array.from(this.nodes.values());
  }

  getEdgeArray() {
    return Array.from(this.edges.values());
  }

  getComponents() {
    const visited = new Set();
    const components = [];
    for (const nodeId of this.nodes.keys()) {
      if (visited.has(nodeId)) continue;
      const component = [];
      const queue = [nodeId];
      while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);
        component.push(current);
        for (const { nodeId: neighbor } of this.getNeighbors(current)) {
          if (!visited.has(neighbor)) queue.push(neighbor);
        }
      }
      components.push(component);
    }
    return components;
  }

  getMaxDegree() {
    let max = 0;
    for (const nodeId of this.nodes.keys()) {
      max = Math.max(max, this.getDegree(nodeId));
    }
    return max;
  }

  getAdjacencyMatrix() {
    const nodeIds = Array.from(this.nodes.keys()).sort((a, b) => a - b);
    const n = nodeIds.length;
    const indexMap = new Map(nodeIds.map((id, i) => [id, i]));
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    for (const edge of this.edges.values()) {
      const i = indexMap.get(edge.source);
      const j = indexMap.get(edge.target);
      matrix[i][j] = edge.weight;
      if (!this.directed) matrix[j][i] = edge.weight;
    }
    return { matrix, nodeIds };
  }

  getAdjacencyList() {
    const list = new Map();
    for (const nodeId of this.nodes.keys()) {
      list.set(nodeId, this.getNeighbors(nodeId));
    }
    return list;
  }

  getCSR() {
    const nodeIds = Array.from(this.nodes.keys()).sort((a, b) => a - b);
    const n = nodeIds.length;
    const indexMap = new Map(nodeIds.map((id, i) => [id, i]));
    const Al = [1];
    const Ac = [];
    const An = [];
    for (const nodeId of nodeIds) {
      const neighbors = this.getNeighbors(nodeId).sort(
        (a, b) => indexMap.get(a.nodeId) - indexMap.get(b.nodeId)
      );
      for (const { nodeId: neighbor, weight } of neighbors) {
        Ac.push(indexMap.get(neighbor) + 1);
        An.push(weight);
      }
      Al.push(Ac.length + 1);
    }
    const Nz = An.length;
    return { An, Ac, Al, nodeIds, n, Nz };
  }

  getCoordinateFormat() {
    const { matrix, nodeIds } = this.getAdjacencyMatrix();
    const n = nodeIds.length;
    const An = [];
    const Ai = [];
    const Aj = [];
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        if (matrix[i][j] !== 0) {
          An.push(matrix[i][j]);
          Ai.push(i + 1);
          Aj.push(j + 1);
        }
      }
    }
    const Nz = An.length;
    return { An, Ai, Aj, nodeIds, n, Nz };
  }

  getSkyline() {
    const { matrix, nodeIds } = this.getAdjacencyMatrix();
    const n = nodeIds.length;
    const An = [];
    const AiDiag = [];
    for (let i = 0; i < n; i++) {
      let firstNz = i;
      for (let j = 0; j < i; j++) {
        if (matrix[i][j] !== 0) { firstNz = j; break; }
      }
      for (let j = firstNz; j <= i; j++) {
        An.push(matrix[i][j]);
      }
      AiDiag.push(An.length);
    }
    return { An, Ai: AiDiag, nodeIds, n, profile: An.length - n };
  }

  getCSRSSS() {
    const { matrix, nodeIds } = this.getAdjacencyMatrix();
    const n = nodeIds.length;
    const Ad = [];
    const An = [];
    const Ac = [];
    const Al = [0];
    for (let i = 0; i < n; i++) {
      Ad.push(matrix[i][i]);
      for (let j = 0; j < i; j++) {
        if (matrix[i][j] !== 0) {
          An.push(matrix[i][j]);
          Ac.push(j + 1);
        }
      }
      Al.push(An.length);
    }
    const numEdges = An.length;
    return { Ad, An, Ac, Al, nodeIds, n, numEdges };
  }

  getEdgeList() {
    return this.getEdgeArray().map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    }));
  }

  clear() {
    this.nodes.clear();
    this.edges.clear();
    this.nextNodeId = 0;
    this.nextEdgeId = 0;
  }

  static generateRandom(n = 6, edgeProb = 0.4, maxWeight = 20) {
    const g = new Graph();
    const padding = 100;
    const width = 750;
    const height = 500;
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const rx = width / 2 - padding;
      const ry = height / 2 - padding;
      const x = width / 2 + rx * Math.cos(angle) + (Math.random() - 0.5) * 30;
      const y = height / 2 + ry * Math.sin(angle) + (Math.random() - 0.5) * 30;
      g.addNode(x, y);
    }
    const ids = Array.from(g.nodes.keys());
    for (let i = 1; i < ids.length; i++) {
      const j = Math.floor(Math.random() * i);
      g.addEdge(ids[i], ids[j], Math.floor(Math.random() * maxWeight) + 1);
    }
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 2; j < ids.length; j++) {
        if (Math.random() < edgeProb) {
          g.addEdge(ids[i], ids[j], Math.floor(Math.random() * maxWeight) + 1);
        }
      }
    }
    return g;
  }

  static generateComplete(n = 5, maxWeight = 15) {
    const g = new Graph();
    const padding = 100;
    const width = 750;
    const height = 500;
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const rx = width / 2 - padding;
      const ry = height / 2 - padding;
      g.addNode(
        width / 2 + rx * Math.cos(angle),
        height / 2 + ry * Math.sin(angle)
      );
    }
    const ids = Array.from(g.nodes.keys());
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        g.addEdge(ids[i], ids[j], Math.floor(Math.random() * maxWeight) + 1);
      }
    }
    return g;
  }

  static generateBipartite(n1 = 3, n2 = 3, maxWeight = 15) {
    const g = new Graph();
    const width = 750;
    const height = 500;
    const ids1 = [];
    const ids2 = [];
    for (let i = 0; i < n1; i++) {
      const node = g.addNode(200, 80 + (i * (height - 160)) / Math.max(n1 - 1, 1));
      ids1.push(node.id);
    }
    for (let i = 0; i < n2; i++) {
      const node = g.addNode(550, 80 + (i * (height - 160)) / Math.max(n2 - 1, 1));
      ids2.push(node.id);
    }
    for (const a of ids1) {
      const numEdges = 1 + Math.floor(Math.random() * n2);
      const targets = [...ids2].sort(() => Math.random() - 0.5).slice(0, numEdges);
      for (const b of targets) {
        g.addEdge(a, b, Math.floor(Math.random() * maxWeight) + 1);
      }
    }
    return g;
  }
}
