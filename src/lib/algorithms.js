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
};
