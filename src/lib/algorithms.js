import { UnionFind } from './unionfind';

class MinHeap {
  constructor() {
    this.heap = [];
  }
  push(item) {
    this.heap.push(item);
    let i = this.heap.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.heap[p].weight <= this.heap[i].weight) break;
      [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]];
      i = p;
    }
  }
  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      let i = 0;
      while (true) {
        let s = i;
        const l = 2 * i + 1,
          r = 2 * i + 2;
        if (l < this.heap.length && this.heap[l].weight < this.heap[s].weight) s = l;
        if (r < this.heap.length && this.heap[r].weight < this.heap[s].weight) s = r;
        if (s === i) break;
        [this.heap[s], this.heap[i]] = [this.heap[i], this.heap[s]];
        i = s;
      }
    }
    return top;
  }
  get size() {
    return this.heap.length;
  }
  snapshot() {
    return this.heap
      .slice()
      .sort((a, b) => a.weight - b.weight)
      .map((e) => ({ id: e.id, source: e.source, target: e.target, weight: e.weight }));
  }
}

export function generatePrimSteps(graph, startNodeId) {
  const steps = [];
  const nodes = graph.getNodeArray();
  const edges = graph.getEdgeArray();
  if (nodes.length === 0) return steps;

  const startId = startNodeId ?? nodes[0].id;

  const cost = new Map();
  const pred = new Map();
  const inH = new Set();

  for (const node of nodes) {
    cost.set(node.id, Infinity);
    pred.set(node.id, null);
    inH.add(node.id);
  }
  cost.set(startId, 0);

  const mstEdges = new Set();
  const mstNodes = new Set();
  let totalWeight = 0;

  const getPQ = () =>
    Array.from(inH)
      .map((id) => ({ nodeId: id, cost: cost.get(id), predecessor: pred.get(id) }))
      .sort((a, b) => a.cost - b.cost);

  const findEdge = (u, v) =>
    edges.find(
      (e) => (e.source === u && e.target === v) || (e.source === v && e.target === u)
    );

  steps.push({
    type: 'init',
    description: `Para cada u ∈ V\\{${startId}}: u.custo ← +∞, u.predecessor ← ⊥, Insere(u,H). Raiz r=${startId}: r.custo ← 0, Insere(r,H).`,
    mstNodes: new Set(mstNodes),
    mstEdges: new Set(mstEdges),
    candidateEdges: new Set(),
    currentEdge: null,
    totalWeight,
    pqContents: getPQ(),
    pqExtracted: null,
    pseudocodeLine: 7,
  });

  while (inH.size > 0) {
    let minNode = null;
    let minCost = Infinity;
    for (const id of inH) {
      const c = cost.get(id);
      if (c < minCost || (c === minCost && minNode === null)) {
        minCost = c;
        minNode = id;
      }
    }
    if (minNode === null || minCost === Infinity) break;

    inH.delete(minNode);
    mstNodes.add(minNode);

    const predNode = pred.get(minNode);
    let addedEdge = null;
    if (predNode !== null) {
      addedEdge = findEdge(minNode, predNode);
      if (addedEdge) {
        mstEdges.add(addedEdge.id);
        totalWeight += addedEdge.weight;
      }
    }

    steps.push({
      type: 'extract',
      description:
        predNode !== null
          ? `u ← Retira(H): vértice ${minNode} (custo ${minCost}, predecessor ${predNode}). Aresta (${predNode},${minNode}) entra na AGM T. Peso total: ${totalWeight}.`
          : `u ← Retira(H): vértice ${minNode} (raiz, custo 0). É a raiz da AGM.`,
      mstNodes: new Set(mstNodes),
      mstEdges: new Set(mstEdges),
      candidateEdges: new Set(),
      currentEdge: addedEdge?.id ?? null,
      totalWeight,
      pqContents: getPQ(),
      pqExtracted: { nodeId: minNode, cost: minCost, predecessor: predNode },
      pseudocodeLine: 9,
    });

    const neighbors = graph.getNeighbors(minNode);
    const updates = [];

    for (const nb of neighbors) {
      if (!inH.has(nb.nodeId)) continue;
      const edge = findEdge(minNode, nb.nodeId);
      if (!edge) continue;
      if (edge.weight < cost.get(nb.nodeId)) {
        const oldCost = cost.get(nb.nodeId);
        cost.set(nb.nodeId, edge.weight);
        pred.set(nb.nodeId, minNode);
        updates.push({ nodeId: nb.nodeId, oldCost, newCost: edge.weight, edgeId: edge.id });
      }
    }

    if (updates.length > 0) {
      const updEdgeIds = new Set(updates.map((u) => u.edgeId));
      const desc = updates
        .map((u) => `${u.nodeId}: ${u.oldCost === Infinity ? '∞' : u.oldCost}→${u.newCost}`)
        .join(', ');

      steps.push({
        type: 'update-keys',
        description: `Para cada w adj. a ${minNode} com w ∈ H ∧ peso(${minNode},w) < w.custo: atualização de custos — ${desc}. DecrementaChave aplicado.`,
        mstNodes: new Set(mstNodes),
        mstEdges: new Set(mstEdges),
        candidateEdges: updEdgeIds,
        currentEdge: null,
        totalWeight,
        pqContents: getPQ(),
        pqExtracted: null,
        keyUpdates: updates,
        pseudocodeLine: 14,
      });
    } else if (inH.size > 0) {
      const checked = neighbors.filter((nb) => inH.has(nb.nodeId));
      if (checked.length > 0) {
        const desc = checked
          .map((nb) => {
            const e = findEdge(minNode, nb.nodeId);
            return `peso(${minNode},${nb.nodeId})=${e?.weight} ≥ custo(${nb.nodeId})=${cost.get(nb.nodeId) === Infinity ? '∞' : cost.get(nb.nodeId)}`;
          })
          .join('; ');
        steps.push({
          type: 'no-update',
          description: `Para cada w adj. a ${minNode} com w ∈ H: nenhum custo atualizado. ${desc}.`,
          mstNodes: new Set(mstNodes),
          mstEdges: new Set(mstEdges),
          candidateEdges: new Set(),
          currentEdge: null,
          totalWeight,
          pqContents: getPQ(),
          pqExtracted: null,
          pseudocodeLine: 11,
        });
      }
    }
  }

  steps.push({
    type: 'complete',
    description: `Prim concluído! H = ∅. AGM com ${mstEdges.size} aresta(s) e peso total ${totalWeight}.`,
    mstNodes: new Set(mstNodes),
    mstEdges: new Set(mstEdges),
    candidateEdges: new Set(),
    currentEdge: null,
    totalWeight,
    pqContents: [],
    pqExtracted: null,
    pseudocodeLine: 15,
  });

  return steps;
}

export function generateKruskalSteps(graph) {
  const steps = [];
  const nodes = graph.getNodeArray();
  const edges = graph.getEdgeArray();
  if (nodes.length === 0) return steps;

  const sorted = [...edges].sort((a, b) => a.weight - b.weight);
  const uf = new UnionFind(nodes.map((n) => n.id));
  const mstEdges = new Set();
  let totalWeight = 0;
  const edgeStatuses = sorted.map((e) => ({
    id: e.id, source: e.source, target: e.target, weight: e.weight, status: 'pending',
  }));

  let numComponents = nodes.length;

  const getComponentsDesc = () => {
    const comps = uf.getComponents();
    return Object.values(comps)
      .map((members) => `{${members.sort((a, b) => a - b).join(',')}}`)
      .join(', ');
  };

  steps.push({
    type: 'init',
    description: `Kruskal: F ← ${edges.length} arestas ordenadas por peso. C ← {${nodes.map((n) => `{${n.id}}`).join(', ')}}, |C| = ${numComponents}. T ← ∅.`,
    mstEdges: new Set(),
    currentEdge: null,
    totalWeight: 0,
    numComponents,
    sortedEdgeIds: sorted.map((e) => e.id),
    ufState: uf.getState(),
    edgeStatuses: edgeStatuses.map((e) => ({ ...e })),
    pseudocodeLine: 4,
  });

  for (const edge of sorted) {
    const rootA = uf.find(edge.source);
    const rootB = uf.find(edge.target);
    const es = edgeStatuses.find((e) => e.id === edge.id);
    es.status = 'considering';

    steps.push({
      type: 'consider-edge',
      description: `|C| = ${numComponents} > 1 → Retira(F): aresta (${edge.source},${edge.target}), custo ${edge.weight}. Find(${edge.source})=${rootA}, Find(${edge.target})=${rootB}.`,
      mstEdges: new Set(mstEdges),
      currentEdge: edge.id,
      totalWeight,
      numComponents,
      ufState: uf.getState(),
      edgeStatuses: edgeStatuses.map((e) => ({ ...e })),
      pseudocodeLine: 6,
    });

    if (rootA !== rootB) {
      uf.union(edge.source, edge.target);
      mstEdges.add(edge.id);
      totalWeight += edge.weight;
      es.status = 'accepted';
      numComponents--;

      steps.push({
        type: 'add-to-mst',
        description: `Condição satisfeita (conjuntos disjuntos). Insere (${edge.source},${edge.target}) em T. Union(${edge.source},${edge.target}). C ← {${getComponentsDesc()}}, |C| = ${numComponents}. Peso total: ${totalWeight}.`,
        mstEdges: new Set(mstEdges),
        currentEdge: edge.id,
        totalWeight,
        numComponents,
        ufState: uf.getState(),
        edgeStatuses: edgeStatuses.map((e) => ({ ...e })),
        pseudocodeLine: 8,
      });
    } else {
      es.status = 'rejected';

      steps.push({
        type: 'skip-edge',
        description: `Condição não satisfeita (${edge.source} e ${edge.target} no mesmo conjunto, raiz=${rootA}). Aresta (${edge.source},${edge.target}) formaria ciclo → descartada. C = {${getComponentsDesc()}}, |C| = ${numComponents}.`,
        mstEdges: new Set(mstEdges),
        currentEdge: edge.id,
        rejectedEdge: edge.id,
        totalWeight,
        numComponents,
        ufState: uf.getState(),
        edgeStatuses: edgeStatuses.map((e) => ({ ...e })),
        pseudocodeLine: 7,
      });
    }

    if (numComponents === 1) break;
  }

  steps.push({
    type: 'complete',
    description: `Kruskal concluído! |C| = 1, C = {V}. AGM T com ${mstEdges.size} aresta(s) e peso total ${totalWeight}.`,
    mstEdges: new Set(mstEdges),
    currentEdge: null,
    totalWeight,
    numComponents: 1,
    ufState: uf.getState(),
    edgeStatuses: edgeStatuses.map((e) => ({ ...e })),
    pseudocodeLine: 12,
  });

  return steps;
}

export function generateBoruvkaSteps(graph) {
  const steps = [];
  const nodes = graph.getNodeArray();
  const edges = graph.getEdgeArray();
  if (nodes.length === 0) return steps;

  const uf = new UnionFind(nodes.map((n) => n.id));
  const mstEdges = new Set();
  let totalWeight = 0;
  let numComponents = nodes.length;
  let iteration = 0;

  const getForest = () => {
    const comps = uf.getComponents();
    return Array.from(comps.entries()).map(([root, members]) => ({
      root,
      members: [...members].sort((a, b) => a - b),
    }));
  };

  const forestDesc = () =>
    getForest()
      .map((t) => `{${t.members.join(',')}}`)
      .join(', ');

  steps.push({
    type: 'init',
    description: `Borůvka: L ← ${nodes.length} árvores, cada uma com 1 vértice. L = {${nodes.map((n) => `{${n.id}}`).join(', ')}}. |L| = ${numComponents}.`,
    mstNodes: new Set(nodes.map((n) => n.id)),
    mstEdges: new Set(),
    candidateEdges: new Set(),
    currentEdge: null,
    totalWeight: 0,
    numComponents,
    forest: getForest(),
    cheapestPerComponent: [],
    ufState: uf.getState(),
    pseudocodeLine: 0,
  });

  while (numComponents > 1) {
    iteration++;
    const cheapest = new Map();

    for (const edge of edges) {
      if (mstEdges.has(edge.id)) continue;
      const rootS = uf.find(edge.source);
      const rootT = uf.find(edge.target);
      if (rootS === rootT) continue;
      if (!cheapest.has(rootS) || edge.weight < cheapest.get(rootS).weight) {
        cheapest.set(rootS, edge);
      }
      if (!cheapest.has(rootT) || edge.weight < cheapest.get(rootT).weight) {
        cheapest.set(rootT, edge);
      }
    }

    if (cheapest.size === 0) break;

    const cheapIds = new Set(Array.from(cheapest.values()).map((e) => e.id));
    const cpc = Array.from(cheapest.entries()).map(([root, e]) => {
      const members = uf.getComponents().get(root) || [root];
      return {
        component: root,
        members: [...members].sort((a, b) => a - b),
        edge: { id: e.id, source: e.source, target: e.target, weight: e.weight },
      };
    });

    steps.push({
      type: 'find-cheapest',
      description: `Iteração ${iteration}: |L| = ${numComponents} > 1. L = {${forestDesc()}}. Para cada Tᵢ ∈ L, encontrando aresta de menor peso na franja de Tᵢ.`,
      mstNodes: new Set(nodes.map((n) => n.id)),
      mstEdges: new Set(mstEdges),
      candidateEdges: cheapIds,
      currentEdge: null,
      totalWeight,
      numComponents,
      forest: getForest(),
      cheapestPerComponent: cpc,
      ufState: uf.getState(),
      pseudocodeLine: 3,
    });

    const added = new Set();
    for (const edge of cheapest.values()) {
      if (added.has(edge.id)) continue;
      const rootS = uf.find(edge.source);
      const rootT = uf.find(edge.target);
      if (rootS === rootT) continue;

      const membersS = uf.getComponents().get(rootS) || [rootS];
      const membersT = uf.getComponents().get(rootT) || [rootT];
      const treeI = `{${[...membersS].sort((a, b) => a - b).join(',')}}`;
      const treeJ = `{${[...membersT].sort((a, b) => a - b).join(',')}}`;

      uf.union(edge.source, edge.target);
      mstEdges.add(edge.id);
      totalWeight += edge.weight;
      numComponents--;
      added.add(edge.id);

      steps.push({
        type: 'add-to-mst',
        description: `Intercalando ${treeI} e ${treeJ} via aresta (${edge.source},${edge.target}), peso ${edge.weight}. L ← {${forestDesc()}}. |L| = ${numComponents}. Peso total: ${totalWeight}.`,
        mstNodes: new Set(nodes.map((n) => n.id)),
        mstEdges: new Set(mstEdges),
        candidateEdges: new Set(),
        currentEdge: edge.id,
        totalWeight,
        numComponents,
        forest: getForest(),
        cheapestPerComponent: cpc,
        ufState: uf.getState(),
        pseudocodeLine: 7,
      });
    }
  }

  steps.push({
    type: 'complete',
    description: `Borůvka concluído em ${iteration} iteração(ões)! |L| = 1, L = {{V}}. AGM com ${mstEdges.size} aresta(s), peso total ${totalWeight}.`,
    mstNodes: new Set(nodes.map((n) => n.id)),
    mstEdges: new Set(mstEdges),
    candidateEdges: new Set(),
    currentEdge: null,
    totalWeight,
    numComponents: 1,
    forest: getForest(),
    cheapestPerComponent: [],
    ufState: uf.getState(),
    pseudocodeLine: 8,
  });

  return steps;
}

export function generateBfsSteps(graph, startNodeId) {
  const steps = [];
  const nodes = graph.getNodeArray().sort((a, b) => a.id - b.id);
  if (nodes.length === 0) return steps;

  const startId = startNodeId ?? nodes[0].id;
  const visited = new Set();
  const treeEdges = new Set();
  const parents = new Map(nodes.map((n) => [n.id, null]));

  const getEdgeBetween = (u, v) => {
    const edges = graph.getEdgeArray();
    return edges.find(
      (e) => (e.source === u && e.target === v) || (e.source === v && e.target === u)
    );
  };

  const bfsFrom = (root, isExtraComponent = false) => {
    const queue = [root];
    visited.add(root);

    steps.push({
      type: isExtraComponent ? 'new-component' : 'init',
      description: isExtraComponent
        ? `Novo componente encontrado. Inicia BFS em ${root}: marca como visitado e Enfileira(${root}).`
        : `BFS: marca ${root} como visitado e Enfileira(${root}).`,
      mstNodes: new Set(visited),
      mstEdges: new Set(treeEdges),
      candidateEdges: new Set(),
      currentEdge: null,
      totalWeight: treeEdges.size,
      frontierType: 'queue',
      frontierContents: [...queue],
      frontierPopped: null,
      pseudocodeLine: 1,
    });

    while (queue.length > 0) {
      const u = queue.shift();
      const neighbors = graph
        .getNeighbors(u)
        .slice()
        .sort((a, b) => a.nodeId - b.nodeId);

      steps.push({
        type: 'dequeue',
        description: `Desenfileira ${u}. Explora seus vizinhos em ordem crescente.`,
        mstNodes: new Set(visited),
        mstEdges: new Set(treeEdges),
        candidateEdges: new Set(),
        currentEdge: null,
        totalWeight: treeEdges.size,
        frontierType: 'queue',
        frontierContents: [...queue],
        frontierPopped: u,
        pseudocodeLine: 3,
      });

      const newlyDiscovered = [];
      for (const nb of neighbors) {
        if (visited.has(nb.nodeId)) continue;
        visited.add(nb.nodeId);
        parents.set(nb.nodeId, u);
        queue.push(nb.nodeId);

        const edge = getEdgeBetween(u, nb.nodeId);
        if (edge) treeEdges.add(edge.id);
        newlyDiscovered.push({ nodeId: nb.nodeId, edgeId: edge?.id ?? null });
      }

      if (newlyDiscovered.length > 0) {
        steps.push({
          type: 'discover',
          description: `Novos vértices descobertos a partir de ${u}: ${newlyDiscovered.map((d) => d.nodeId).join(', ')}. Eles entram na fila.`,
          mstNodes: new Set(visited),
          mstEdges: new Set(treeEdges),
          candidateEdges: new Set(
            newlyDiscovered.filter((d) => d.edgeId !== null).map((d) => d.edgeId)
          ),
          currentEdge: null,
          totalWeight: treeEdges.size,
          frontierType: 'queue',
          frontierContents: [...queue],
          frontierPopped: null,
          pseudocodeLine: 6,
        });
      } else {
        steps.push({
          type: 'no-discover',
          description: `Nenhum novo vértice descoberto a partir de ${u}.`,
          mstNodes: new Set(visited),
          mstEdges: new Set(treeEdges),
          candidateEdges: new Set(),
          currentEdge: null,
          totalWeight: treeEdges.size,
          frontierType: 'queue',
          frontierContents: [...queue],
          frontierPopped: null,
          pseudocodeLine: 5,
        });
      }
    }
  };

  bfsFrom(startId, false);

  for (const node of nodes) {
    if (!visited.has(node.id)) bfsFrom(node.id, true);
  }

  steps.push({
    type: 'complete',
    description: `BFS concluída! ${visited.size} vértice(s) visitado(s) e ${treeEdges.size} aresta(s) de árvore.`,
    mstNodes: new Set(visited),
    mstEdges: new Set(treeEdges),
    candidateEdges: new Set(),
    currentEdge: null,
    totalWeight: treeEdges.size,
    frontierType: 'queue',
    frontierContents: [],
    frontierPopped: null,
    pseudocodeLine: 8,
  });

  return steps;
}

export function generateDfsSteps(graph, startNodeId) {
  const steps = [];
  const nodes = graph.getNodeArray().sort((a, b) => a.id - b.id);
  if (nodes.length === 0) return steps;

  const startId = startNodeId ?? nodes[0].id;
  const visited = new Set();
  const treeEdges = new Set();

  const getEdgeBetween = (u, v) => {
    const edges = graph.getEdgeArray();
    return edges.find(
      (e) => (e.source === u && e.target === v) || (e.source === v && e.target === u)
    );
  };

  const dfsFrom = (root, isExtraComponent = false) => {
    const stack = [{ nodeId: root, parent: null, edgeId: null }];

    steps.push({
      type: isExtraComponent ? 'new-component' : 'init',
      description: isExtraComponent
        ? `Novo componente encontrado. Inicia DFS em ${root}: Empilha(${root}).`
        : `DFS: Empilha(${root}) como vértice inicial.`,
      mstNodes: new Set(visited),
      mstEdges: new Set(treeEdges),
      candidateEdges: new Set(),
      currentEdge: null,
      totalWeight: treeEdges.size,
      frontierType: 'stack',
      frontierContents: stack.map((s) => s.nodeId),
      frontierPopped: null,
      pseudocodeLine: 1,
    });

    while (stack.length > 0) {
      const top = stack.pop();
      const u = top.nodeId;

      steps.push({
        type: 'pop',
        description: `Desempilha ${u}.`,
        mstNodes: new Set(visited),
        mstEdges: new Set(treeEdges),
        candidateEdges: new Set(),
        currentEdge: top.edgeId,
        totalWeight: treeEdges.size,
        frontierType: 'stack',
        frontierContents: stack.map((s) => s.nodeId),
        frontierPopped: u,
        pseudocodeLine: 3,
      });

      if (visited.has(u)) {
        steps.push({
          type: 'already-visited',
          description: `${u} já estava visitado; segue para o próximo da pilha.`,
          mstNodes: new Set(visited),
          mstEdges: new Set(treeEdges),
          candidateEdges: new Set(),
          currentEdge: null,
          totalWeight: treeEdges.size,
          frontierType: 'stack',
          frontierContents: stack.map((s) => s.nodeId),
          frontierPopped: null,
          pseudocodeLine: 4,
        });
        continue;
      }

      visited.add(u);
      if (top.edgeId !== null) treeEdges.add(top.edgeId);

      steps.push({
        type: 'visit',
        description:
          top.parent === null
            ? `Visita ${u} (raiz da DFS deste componente).`
            : `Visita ${u} via aresta (${top.parent},${u}).`,
        mstNodes: new Set(visited),
        mstEdges: new Set(treeEdges),
        candidateEdges: new Set(),
        currentEdge: top.edgeId,
        totalWeight: treeEdges.size,
        frontierType: 'stack',
        frontierContents: stack.map((s) => s.nodeId),
        frontierPopped: null,
        pseudocodeLine: 4,
      });

      const neighbors = graph
        .getNeighbors(u)
        .slice()
        .sort((a, b) => b.nodeId - a.nodeId);

      const pushed = [];
      for (const nb of neighbors) {
        if (visited.has(nb.nodeId)) continue;
        const edge = getEdgeBetween(u, nb.nodeId);
        stack.push({ nodeId: nb.nodeId, parent: u, edgeId: edge?.id ?? null });
        pushed.push({ nodeId: nb.nodeId, edgeId: edge?.id ?? null });
      }

      if (pushed.length > 0) {
        steps.push({
          type: 'push-neighbors',
          description: `Empilha vizinhos não visitados de ${u}: ${pushed.map((p) => p.nodeId).join(', ')}.`,
          mstNodes: new Set(visited),
          mstEdges: new Set(treeEdges),
          candidateEdges: new Set(
            pushed.filter((p) => p.edgeId !== null).map((p) => p.edgeId)
          ),
          currentEdge: null,
          totalWeight: treeEdges.size,
          frontierType: 'stack',
          frontierContents: stack.map((s) => s.nodeId),
          frontierPopped: null,
          pseudocodeLine: 6,
        });
      }
    }
  };

  dfsFrom(startId, false);

  for (const node of nodes) {
    if (!visited.has(node.id)) dfsFrom(node.id, true);
  }

  steps.push({
    type: 'complete',
    description: `DFS concluída! ${visited.size} vértice(s) visitado(s) e ${treeEdges.size} aresta(s) de árvore.`,
    mstNodes: new Set(visited),
    mstEdges: new Set(treeEdges),
    candidateEdges: new Set(),
    currentEdge: null,
    totalWeight: treeEdges.size,
    frontierType: 'stack',
    frontierContents: [],
    frontierPopped: null,
    pseudocodeLine: 8,
  });

  return steps;
}

export function generateApsSteps(graph, initialMatching = 'empty') {
  const steps = [];
  const nodes = graph.getNodeArray().sort((a, b) => a.id - b.id);
  const edges = graph.getEdgeArray();
  if (nodes.length === 0) return steps;

  const getEdgeBetween = (u, v) =>
    edges.find((e) => (e.source === u && e.target === v) || (e.source === v && e.target === u));

  const matchingEdgeIds = new Set();
  const matchOf = new Map();

  const isCovered = (id) => matchOf.has(id);

  const getMatchedPairs = () => {
    const seen = new Set();
    const pairs = [];
    for (const eid of matchingEdgeIds) {
      if (seen.has(eid)) continue;
      seen.add(eid);
      const e = edges.find((ed) => ed.id === eid);
      if (e) pairs.push({ nodeA: e.source, nodeB: e.target, edgeId: eid });
    }
    return pairs;
  };

  const snap = () => new Set(matchingEdgeIds);

  // Build greedy initial matching
  if (initialMatching === 'greedy') {
    for (const edge of edges) {
      if (!matchOf.has(edge.source) && !matchOf.has(edge.target)) {
        matchingEdgeIds.add(edge.id);
        matchOf.set(edge.source, edge.target);
        matchOf.set(edge.target, edge.source);
      }
    }
  }

  const initDesc = initialMatching === 'greedy'
    ? `APS — Augmenting Path Search (Alg. 16.18). Matching inicial greedy: M = {${getMatchedPairs().map(p=>`(${p.nodeA},${p.nodeB})`).join(', ') || '∅'}} (|M|=${matchingEdgeIds.size}). APS aumentará M até ser máximo.`
    : `APS — Augmenting Path Search (Bondy & Murty, Alg. 16.18). Início: M ← ∅. Buscaremos caminhos M-aumentantes a partir de cada vértice não-coberto até não existir nenhum (Teorema de Berge).`;

  steps.push({
    type: 'start',
    description: initDesc,
    mstEdges: new Set(),
    candidateEdges: new Set(),
    currentEdge: null,
    redNodes: new Set(),
    blueNodes: new Set(),
    matchingSize: 0,
    currentRoot: null,
    pseudocodeLine: -1,
    augmentingPath: null,
    matchedPairs: [],
  });

  let foundAugmenting = true;

  while (foundAugmenting) {
    foundAugmenting = false;

    for (const startNode of nodes) {
      if (isCovered(startNode.id)) continue;
      const u = startNode.id;

      const VT = new Set([u]);
      const RT = new Set([u]);
      const BT = new Set();
      const ET = new Set();
      const treeParentEdge = new Map();
      const treeParentNode = new Map();

      const nonMatchTreeEdges = () => new Set([...ET].filter((eid) => !matchingEdgeIds.has(eid)));

      steps.push({
        type: 'init-aps',
        description: `APS(G, M, ${u}): vértice ${u} não coberto por M. V(T) ← {${u}}, E(T) ← ∅, R(T) ← {${u}} (vermelho). B(T) ← ∅.`,
        mstEdges: snap(),
        candidateEdges: new Set(),
        currentEdge: null,
        redNodes: new Set(RT),
        blueNodes: new Set(),
        matchingSize: matchingEdgeIds.size,
        currentRoot: u,
        pseudocodeLine: 0,
        augmentingPath: null,
        matchedPairs: getMatchedPairs(),
      });

      let augmented = false;

      while (!augmented) {
        // Find next edge xy with x ∈ R(T), y ∉ V(T)
        let found = null;
        for (const x of [...RT].sort((a, b) => a - b)) {
          if (found) break;
          const nbrs = graph.getNeighbors(x).sort((a, b) => a.nodeId - b.nodeId);
          for (const nb of nbrs) {
            if (!VT.has(nb.nodeId)) {
              const e = getEdgeBetween(x, nb.nodeId);
              if (e) { found = { x, y: nb.nodeId, edge: e }; break; }
            }
          }
        }

        if (!found) {
          // APS-tree: no augmenting path from u
          steps.push({
            type: 'aps-tree',
            description: `Não existe aresta xy com x ∈ R(T) e y ∉ V(T). T é uma APS-tree enraizada em ${u}. R(T) = {${[...RT].sort((a,b)=>a-b).join(', ')}}, B(T) = {${[...BT].sort((a,b)=>a-b).join(', ') || '∅'}}. Nenhum caminho M-aumentante a partir de ${u}.`,
            mstEdges: snap(),
            candidateEdges: nonMatchTreeEdges(),
            currentEdge: null,
            redNodes: new Set(RT),
            blueNodes: new Set(BT),
            matchingSize: matchingEdgeIds.size,
            currentRoot: u,
            pseudocodeLine: 10,
            augmentingPath: null,
            matchedPairs: getMatchedPairs(),
          });
          break;
        }

        const { x, y, edge: xyEdge } = found;
        VT.add(y);
        ET.add(xyEdge.id);
        treeParentEdge.set(y, xyEdge.id);
        treeParentNode.set(y, x);

        if (!isCovered(y)) {
          // Reconstruct augmenting path P = uTy
          const pathEdges = new Set([xyEdge.id]);
          let cur = x;
          while (cur !== u) {
            const matchEid = treeParentEdge.get(cur);
            pathEdges.add(matchEid);
            const bNode = treeParentNode.get(cur);
            const nonMatchEid = treeParentEdge.get(bNode);
            pathEdges.add(nonMatchEid);
            cur = treeParentNode.get(bNode);
          }

          const pathLen = pathEdges.size;
          steps.push({
            type: 'augment-found',
            description: `y = ${y} não coberto por M! Caminho M-aumentante P = u(${u})Ty(${y}) encontrado com ${pathLen} aresta(s). Linha 4: M ← M Δ E(P).`,
            mstEdges: snap(),
            candidateEdges: nonMatchTreeEdges(),
            currentEdge: xyEdge.id,
            redNodes: new Set(RT),
            blueNodes: new Set(BT),
            matchingSize: matchingEdgeIds.size,
            currentRoot: u,
            pseudocodeLine: 3,
            augmentingPath: pathEdges,
            matchedPairs: getMatchedPairs(),
          });

          // Apply M Δ E(P)
          for (const eid of pathEdges) {
            const e = edges.find((ed) => ed.id === eid);
            if (!e) continue;
            if (matchingEdgeIds.has(eid)) {
              matchingEdgeIds.delete(eid);
              matchOf.delete(e.source);
              matchOf.delete(e.target);
            } else {
              matchingEdgeIds.add(eid);
              matchOf.set(e.source, e.target);
              matchOf.set(e.target, e.source);
            }
          }

          steps.push({
            type: 'augment-apply',
            description: `M ← M Δ E(P) aplicado. |M| = ${matchingEdgeIds.size}. Vértices ${u} e ${y} agora cobertos. Reinicia APS do início.`,
            mstEdges: snap(),
            candidateEdges: new Set(),
            currentEdge: null,
            redNodes: new Set(),
            blueNodes: new Set(),
            matchingSize: matchingEdgeIds.size,
            currentRoot: u,
            pseudocodeLine: 4,
            augmentingPath: pathEdges,
            matchedPairs: getMatchedPairs(),
          });

          augmented = true;
          foundAugmenting = true;
        } else {
          // y is covered: grow T with y (blue) and z=match(y) (red)
          const z = matchOf.get(y);
          const yzEdge = getEdgeBetween(y, z);
          BT.add(y);
          VT.add(z);
          ET.add(yzEdge.id);
          RT.add(z);
          treeParentEdge.set(z, yzEdge.id);
          treeParentNode.set(z, y);

          steps.push({
            type: 'grow-tree',
            description: `Aresta (${x}, ${y}) adicionada: y = ${y} coberto por M, com parceiro z = ${z} (aresta ${y}-${z} ∈ M). Adiciona ${y} → B(T) (azul) e ${z} → R(T) (vermelho). Árvore M-coberta cresce.`,
            mstEdges: snap(),
            candidateEdges: nonMatchTreeEdges(),
            currentEdge: xyEdge.id,
            redNodes: new Set(RT),
            blueNodes: new Set(BT),
            matchingSize: matchingEdgeIds.size,
            currentRoot: u,
            pseudocodeLine: 7,
            augmentingPath: null,
            matchedPairs: getMatchedPairs(),
          });
        }
      }

      if (augmented) break;
    }
  }

  steps.push({
    type: 'complete',
    description: `APS concluído. Emparelhamento máximo M com ${matchingEdgeIds.size} aresta(s). Pelo Teorema de Berge (16.3): não existe caminho M-aumentante, logo M é máximo.`,
    mstEdges: snap(),
    candidateEdges: new Set(),
    currentEdge: null,
    redNodes: new Set(),
    blueNodes: new Set(),
    matchingSize: matchingEdgeIds.size,
    currentRoot: null,
    pseudocodeLine: 11,
    augmentingPath: null,
    matchedPairs: getMatchedPairs(),
  });

  return steps;
}

export function generateEgervarySteps(graph, initialMatching = 'empty') {
  const steps = [];
  const nodes = graph.getNodeArray().sort((a, b) => a.id - b.id);
  const edges = graph.getEdgeArray();
  if (nodes.length === 0) return steps;

  const getEdgeBetween = (u, v) =>
    edges.find((e) => (e.source === u && e.target === v) || (e.source === v && e.target === u));

  // M': active matching in G'
  const matchingEdgeIds = new Set();
  const matchOf = new Map();
  // M(T) committed from completed APS-trees
  const committedEdgeIds = new Set();
  // Nodes removed from G'
  const removedNodes = new Set();
  // Completed APS-trees
  const apsTrees = [];

  const isCovered = (id) => matchOf.has(id);
  const isActive = (id) => !removedNodes.has(id);
  const snap = () => new Set([...matchingEdgeIds, ...committedEdgeIds]);

  const getMatchedPairs = (edgeSet) => {
    const seen = new Set();
    const pairs = [];
    for (const eid of edgeSet) {
      if (seen.has(eid)) continue;
      seen.add(eid);
      const e = edges.find((ed) => ed.id === eid);
      if (e) pairs.push({ nodeA: e.source, nodeB: e.target, edgeId: eid });
    }
    return pairs;
  };

  const getAllRed = () => new Set(apsTrees.flatMap((t) => [...t.RT]));
  const getAllBlue = () => new Set(apsTrees.flatMap((t) => [...t.BT]));
  const getTreesSnapshot = () => apsTrees.map((t) => ({ ...t }));

  // Build initial matching
  if (initialMatching === 'greedy') {
    for (const edge of edges) {
      if (!matchOf.has(edge.source) && !matchOf.has(edge.target)) {
        matchingEdgeIds.add(edge.id);
        matchOf.set(edge.source, edge.target);
        matchOf.set(edge.target, edge.source);
      }
    }
  }

  const initDesc = initialMatching === 'greedy'
    ? `Egerváry: G' ← G, M ← greedy |M|=${matchingEdgeIds.size}, T ← ∅. APS com redução de subgrafo.`
    : `Egerváry (Bondy & Murty, Alg. 16.18): G' ← G, M ← ∅, T ← ∅. A cada APS-tree: comita M(T) e remove V(T) de G'.`;

  steps.push({
    type: 'start',
    description: initDesc,
    mstEdges: snap(),
    candidateEdges: new Set(),
    currentEdge: null,
    redNodes: new Set(),
    blueNodes: new Set(),
    removedNodes: new Set(),
    augmentingPath: null,
    matchingSize: matchingEdgeIds.size + committedEdgeIds.size,
    currentRoot: null,
    pseudocodeLine: 0,
    apsTrees: getTreesSnapshot(),
    matchedPairs: getMatchedPairs(snap()),
  });

  // Main loop: while G' has uncovered vertex
  while (true) {
    const uNode = nodes.find((n) => isActive(n.id) && !isCovered(n.id));
    if (!uNode) break;
    const u = uNode.id;

    // APS(G', M, u) — restricted to active subgraph
    const VT = new Set([u]);
    const RT = new Set([u]);
    const BT = new Set();
    const ET = new Set();
    const treeParentEdge = new Map();
    const treeParentNode = new Map();

    const nonMatchTreeEdges = () => new Set([...ET].filter((eid) => !matchingEdgeIds.has(eid)));

    steps.push({
      type: 'init-aps',
      description: `G' tem ${nodes.filter((n) => isActive(n.id)).length} vértices ativos. APS(G', M, ${u}): u=${u} não coberto. V(T)←{${u}}, R(T)←{${u}}.`,
      mstEdges: snap(),
      candidateEdges: new Set(),
      currentEdge: null,
      redNodes: new Set(RT),
      blueNodes: new Set(BT),
      removedNodes: new Set(removedNodes),
      augmentingPath: null,
      matchingSize: matchingEdgeIds.size + committedEdgeIds.size,
      currentRoot: u,
      pseudocodeLine: 3,
      apsTrees: getTreesSnapshot(),
      matchedPairs: getMatchedPairs(snap()),
    });

    let augmented = false;

    while (true) {
      // Find edge xy: x ∈ R(T), y ∉ V(T), y ∈ G'
      let found = null;
      for (const x of [...RT].sort((a, b) => a - b)) {
        if (found) break;
        const nbrs = graph.getNeighbors(x)
          .filter((nb) => !removedNodes.has(nb.nodeId))
          .sort((a, b) => a.nodeId - b.nodeId);
        for (const nb of nbrs) {
          if (!VT.has(nb.nodeId)) {
            const e = getEdgeBetween(x, nb.nodeId);
            if (e) { found = { x, y: nb.nodeId, edge: e }; break; }
          }
        }
      }

      if (!found) {
        // APS-tree T found
        const MT = new Set([...ET].filter((eid) => matchingEdgeIds.has(eid)));
        const rList = [...RT].sort((a, b) => a - b);
        const bList = [...BT].sort((a, b) => a - b);
        const mtDesc = [...MT].map((eid) => { const e = edges.find((ed) => ed.id === eid); return e ? `(${e.source},${e.target})` : ''; }).join(', ') || '∅';

        apsTrees.push({ root: u, RT: new Set(RT), BT: new Set(BT), VT: new Set(VT), MT: new Set(MT) });

        steps.push({
          type: 'aps-tree-commit',
          description: `APS-tree T enraizada em u=${u}: R(T)={${rList.join(',')}}, B(T)={${bList.join(',') || '∅'}}. Commit M(T)={${mtDesc}}. G' ← G'−V(T).`,
          mstEdges: snap(),
          candidateEdges: nonMatchTreeEdges(),
          currentEdge: null,
          redNodes: new Set(RT),
          blueNodes: new Set(BT),
          removedNodes: new Set(removedNodes),
          augmentingPath: null,
          matchingSize: matchingEdgeIds.size + committedEdgeIds.size,
          currentRoot: u,
          pseudocodeLine: 7,
          apsTrees: getTreesSnapshot(),
          matchedPairs: getMatchedPairs(snap()),
        });

        // M ← M \ E(T): move M(T) to committed, remove from active matching
        for (const eid of MT) {
          matchingEdgeIds.delete(eid);
          committedEdgeIds.add(eid);
        }
        // Remove V(T) from G'
        for (const nodeId of VT) {
          removedNodes.add(nodeId);
          matchOf.delete(nodeId);
        }

        steps.push({
          type: 'subgraph-reduced',
          description: `M ← M\\E(T). G' reduzido: ${[...VT].sort((a,b)=>a-b).join(',')} removidos. |G'| = ${nodes.filter((n) => isActive(n.id)).length} vértice(s). |M*| = ${matchingEdgeIds.size + committedEdgeIds.size}.`,
          mstEdges: snap(),
          candidateEdges: new Set(),
          currentEdge: null,
          redNodes: new Set(),
          blueNodes: new Set(),
          removedNodes: new Set(removedNodes),
          augmentingPath: null,
          matchingSize: matchingEdgeIds.size + committedEdgeIds.size,
          currentRoot: null,
          pseudocodeLine: 9,
          apsTrees: getTreesSnapshot(),
          matchedPairs: getMatchedPairs(snap()),
        });

        break;
      }

      const { x, y, edge: xyEdge } = found;
      VT.add(y);
      ET.add(xyEdge.id);
      treeParentEdge.set(y, xyEdge.id);
      treeParentNode.set(y, x);

      if (!isCovered(y)) {
        // Augmenting path found
        const pathEdges = new Set([xyEdge.id]);
        let cur = x;
        while (cur !== u) {
          const matchEid = treeParentEdge.get(cur);
          pathEdges.add(matchEid);
          const bNode = treeParentNode.get(cur);
          const nonMatchEid = treeParentEdge.get(bNode);
          pathEdges.add(nonMatchEid);
          cur = treeParentNode.get(bNode);
        }

        steps.push({
          type: 'augment-found',
          description: `y=${y} não coberto! Caminho M-aumentante P = u(${u})Ty(${y}), ${pathEdges.size} aresta(s). M ← M Δ E(P).`,
          mstEdges: snap(),
          candidateEdges: nonMatchTreeEdges(),
          currentEdge: xyEdge.id,
          redNodes: new Set(RT),
          blueNodes: new Set(BT),
          removedNodes: new Set(removedNodes),
          augmentingPath: pathEdges,
          matchingSize: matchingEdgeIds.size + committedEdgeIds.size,
          currentRoot: u,
          pseudocodeLine: 4,
          apsTrees: getTreesSnapshot(),
          matchedPairs: getMatchedPairs(snap()),
        });

        // Apply M Δ E(P)
        for (const eid of pathEdges) {
          const e = edges.find((ed) => ed.id === eid);
          if (!e) continue;
          if (matchingEdgeIds.has(eid)) {
            matchingEdgeIds.delete(eid);
            matchOf.delete(e.source);
            matchOf.delete(e.target);
          } else {
            matchingEdgeIds.add(eid);
            matchOf.set(e.source, e.target);
            matchOf.set(e.target, e.source);
          }
        }

        steps.push({
          type: 'augment-apply',
          description: `M ← M Δ E(P). |M*| = ${matchingEdgeIds.size + committedEdgeIds.size}. APS reinicia em G'.`,
          mstEdges: snap(),
          candidateEdges: new Set(),
          currentEdge: null,
          redNodes: new Set(),
          blueNodes: new Set(),
          removedNodes: new Set(removedNodes),
          augmentingPath: pathEdges,
          matchingSize: matchingEdgeIds.size + committedEdgeIds.size,
          currentRoot: u,
          pseudocodeLine: 5,
          apsTrees: getTreesSnapshot(),
          matchedPairs: getMatchedPairs(snap()),
        });

        augmented = true;
        break;
      } else {
        // y covered: grow tree
        const z = matchOf.get(y);
        const yzEdge = getEdgeBetween(y, z);
        BT.add(y);
        VT.add(z);
        ET.add(yzEdge.id);
        RT.add(z);
        treeParentEdge.set(z, yzEdge.id);
        treeParentNode.set(z, y);

        steps.push({
          type: 'grow-tree',
          description: `Aresta (${x},${y}): y=${y} coberto, parceiro z=${z}. ${y}→B(T) (azul), ${z}→R(T) (vermelho).`,
          mstEdges: snap(),
          candidateEdges: nonMatchTreeEdges(),
          currentEdge: xyEdge.id,
          redNodes: new Set(RT),
          blueNodes: new Set(BT),
          removedNodes: new Set(removedNodes),
          augmentingPath: null,
          matchingSize: matchingEdgeIds.size + committedEdgeIds.size,
          currentRoot: u,
          pseudocodeLine: 3,
          apsTrees: getTreesSnapshot(),
          matchedPairs: getMatchedPairs(snap()),
        });
      }
    }
    // Loop continues: augmented → APS restarts; APS-tree → reduced G', APS restarts
  }

  // G' has no uncovered vertex → M(G') = matchingEdgeIds (perfect matching of F)
  const vF = nodes.filter((n) => !removedNodes.has(n.id)).map((n) => n.id);
  const mFsize = matchingEdgeIds.size;
  for (const eid of matchingEdgeIds) committedEdgeIds.add(eid);
  matchingEdgeIds.clear();

  const allRed = getAllRed();
  const allBlue = getAllBlue();
  const allRoots = apsTrees.map((t) => t.root);

  steps.push({
    type: 'complete',
    description: `Egerváry concluído! F = G'−(R∪B) com V(F)={${vF.join(',') || '∅'}}, M(F) perfeito (${mFsize} aresta(s)). M* = ⋃M(T)∪M(F), |M*|=${committedEdgeIds.size}. T=${apsTrees.length} árvore(s), U={${allRoots.join(',') || '∅'}}.`,
    mstEdges: new Set(committedEdgeIds),
    candidateEdges: new Set(),
    currentEdge: null,
    redNodes: new Set(),
    blueNodes: new Set(),
    removedNodes: new Set(removedNodes),
    augmentingPath: null,
    matchingSize: committedEdgeIds.size,
    currentRoot: null,
    pseudocodeLine: 12,
    apsTrees: getTreesSnapshot(),
    matchedPairs: getMatchedPairs(new Set(committedEdgeIds)),
  });

  return steps;
}

export const PSEUDOCODE = {
  prim: [
    ' 2  H ← ∅;',
    ' 3  para cada (u ∈ V \\ {r}) faça',
    ' 4    u.custo ← +∞;',
    ' 5    u.predecessor ← ⊥;',
    ' 6    Insere(u, H);',
    ' 8  r.custo ← 0;',
    ' 9  r.predecessor ← ⊥;',
    '10  Insere(r, H);',
    '11  enquanto (H ≠ ∅) faça',
    '12    u ← Retira(H);',
    '13    para cada (w adj. a u) faça',
    '14      se (w∈H ∧ peso(u,w) < w.custo)',
    '15        w.predecessor ← u;',
    '16        w.custo ← peso(u,w);',
    '17        DecrementaChave(w,Custo[w],H);',
    '21  fim.',
  ],
  kruskal: [
    ' 2  F ← ∅;  // fila de prioridades',
    ' 3  C ← ∅;  // conj. disjuntos (floresta)',
    ' 4  T ← ∅;  // AGM',
    ' 5  ∀ a∈A: Insere(a, F);',
    ' 6  ∀ v∈V: Insere({v}, C);',
    ' 7  enquanto (|C| > 1) faça',
    ' 8    (u,v) ← Retira(F);',
    ' 9    se (u∈Rᵢ ∧ v∈Rⱼ disjuntos)',
    '10      Insere((u,v), T);',
    '11      S ← Rᵢ ∪ Rⱼ;',
    '12      Remove(Rᵢ, Rⱼ, C);',
    '13      Insere(S, C);',
    '16  retorna T;',
    '17  fim.',
  ],
  boruvka: [
    ' 2  L ← |V| árvores (1 vértice cada)',
    ' 3  enquanto (|L| > 1) faça',
    ' 4    para cada (Tᵢ ∈ L) faça',
    ' 5      encontre (u,v) menor peso,',
    '        u ∈ Tᵢ, v ∈ Tⱼ = G−Tᵢ, i≠j',
    ' 6      associe (u,v) a Tᵢ;',
    ' 8    para cada par: intercale Tᵢ, Tⱼ',
    ' 9      L ← (L−Tᵢ−Tⱼ) ∪ (Tᵢ∪Tⱼ);',
    '12  retorna L.T;',
    '13  fim.',
  ],
  dfs: [
    ' 1  para cada v ∈ V: visitado[v] ← falso',
    ' 2  Empilha(s)',
    ' 3  enquanto pilha ≠ ∅ faça',
    ' 4    u ← Desempilha(); se visitado[u] continue',
    ' 5    visitado[u] ← verdadeiro',
    ' 6    para cada w adj. a u (não visitado): Empilha(w)',
    ' 7  fim-enquanto',
    ' 8  fim.',
  ],
  bfs: [
    ' 1  para cada v ∈ V: visitado[v] ← falso',
    ' 2  visitado[s] ← verdadeiro; Enfileira(s)',
    ' 3  enquanto fila ≠ ∅ faça',
    ' 4    u ← Desenfileira()',
    ' 5    para cada w adj. a u faça',
    ' 6      se não visitado[w]: visitado[w] ← verdadeiro; Enfileira(w)',
    ' 7  fim-enquanto',
    ' 8  fim.',
  ],
  egervary: [
    ' 1  G\'←G, M←M₀, T←∅',
    ' 2  enquanto G\' tem vértice não coberto faça',
    ' 3    u ← vértice não coberto em G\'',
    ' 4    APS(G\', M, u) →',
    ' 5    se caminho aumentante P então',
    ' 6      M ← M Δ E(P)',
    ' 7    senão  {T é APS-tree}',
    ' 8      T ← T ∪ {T};  M(T)←M∩E(T)',
    ' 9      M ← M \\ E(T)',
    '10      G\' ← G\' − V(T)',
    '11    fim se',
    '12  fim enquanto',
    '13  M* ← ⋃{M(T):T∈T} ∪ M(G\')',
    '14  retorna M*, T, R, B, F, U',
  ],
  aps: [
    ' 1  V(T)←{u}, E(T)←∅, R(T)←{u}',
    ' 2  enquanto ∃ aresta xy: x∈R(T), y∉V(T) faça',
    ' 3    V(T)←V(T)∪{y},  E(T)←E(T)∪{xy}',
    ' 4    se y não coberto por M então',
    ' 5      M ← M Δ E(P),  P := uTy',
    ' 6      retorna M',
    ' 7    senão',
    ' 8      V(T)∪{z}, E(T)∪{yz},',
    '        R(T)∪{z}  (yz ∈ M)',
    ' 9    fim se',
    '10  fim enquanto',
    '11  T←(V(T),E(T)); B(T)←V(T)∖R(T)',
    '12  retorna (T, u, R(T), B(T), M(T))',
  ],
};

export const COMPLEXITY = {
  prim: {
    time: 'O((A + V) log V)',
    space: 'O(V)',
    detail:
      'Com heap binário: Insere e Retira custam O(log V). DecrementaChave custa O(log V). São V extrações e no máximo A atualizações de chave, totalizando O((A + V) log V).',
  },
  kruskal: {
    time: 'O(A log V)',
    space: 'O(V + A)',
    detail: 'Ordenação: O(A log A) = O(A log V), pois A ≤ V² ⇒ log A ≤ 2 log V. Com árvores + rank + compressão, as operações Union-Find custam O(A·α(V)), dominado por O(A log V).',
    ufAnalysis: [
      {
        title: 'Por Listas (sem heurística)',
        ops: 'Cria_Conjunto: O(1)  ·  Encontra: O(1)  ·  União: O(n)',
        total: 'Sequência de n−1 uniões: Ω(n²) no pior caso',
        color: 'text-rose-400',
      },
      {
        title: 'Por Listas + Heurística de Peso',
        ops: 'União ponderada: lista menor → lista maior',
        total: 'Total: O(m + n log n)',
        color: 'text-amber-400',
      },
      {
        title: 'Por Árvores + Rank + Compressão de Caminho',
        ops: 'Find/Union: O(α(n)) amortizado',
        total: 'Kruskal: O(A log V) — superlinear',
        color: 'text-emerald-400',
      },
    ],
  },
  boruvka: {
    time: 'O(A log V)',
    space: 'O(V + A)',
    detail:
      'Cada iteração reduz |L| pelo menos pela metade → no máximo O(log V) iterações. Cada iteração percorre todas as A arestas. Total: O(A log V).',
  },
  dfs: {
    time: 'O(V + A)',
    space: 'O(V)',
    detail:
      'Cada vértice é visitado no máximo uma vez e cada aresta é analisada no máximo duas vezes (grafo não-direcionado). Pilha + marcação de visitados ocupam O(V).',
  },
  bfs: {
    time: 'O(V + A)',
    space: 'O(V)',
    detail:
      'Cada vértice entra e sai da fila no máximo uma vez. A varredura total das listas de adjacência custa O(A), resultando em O(V + A).',
  },
  egervary: {
    time: 'O(V · A)',
    space: 'O(V + A)',
    detail:
      'Cada APS roda em O(V + A). O número de aumentos é ≤ ⌊V/2⌋ e o número de APS-trees também é ≤ ⌊V/2⌋. Cada APS-tree remove ≥ 1 vértice de G\'. Total: O(V) chamadas APS × O(A) = O(V·A). Produz também uma cobertura mínima K* do mesmo tamanho de M* (Teorema König-Egerváry).',
  },
  aps: {
    time: 'O(V · (V + A))',
    space: 'O(V + A)',
    detail:
      'Cada chamada APS(G, M, u) percorre no máximo V vértices e A arestas: O(V + A). O número de aumentos é no máximo ⌊V/2⌋ (cada aumento cobre 2 vértices). Após cada aumento reiniciamos a varredura: O(V) chamadas × O(V + A) = O(V·(V + A)). Para grafos bipartidos, Hopcroft–Karp reduz para O(√V · A) usando BFS em fases.',
  },
};
