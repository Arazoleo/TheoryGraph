import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GraphCanvas from './components/GraphCanvas';
import InfoPanel from './components/InfoPanel';
import AlgoControls from './components/AlgoControls';
import UnionFindCanvas from './components/UnionFindCanvas';
import AuxStructures from './components/AuxStructures';
import { Graph } from './lib/graph';
import { UnionFind } from './lib/unionfind';
import {
  generatePrimSteps,
  generateKruskalSteps,
  generateBoruvkaSteps,
} from './lib/algorithms';

export default function App() {
  const [activeTab, setActiveTab] = useState('editor');

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const nextNodeId = useRef(0);
  const nextEdgeId = useRef(0);
  const [selectedNode, setSelectedNode] = useState(null);

  const [tool, setTool] = useState('select');
  const [weighted, setWeighted] = useState(true);

  const [algorithm, setAlgorithm] = useState('prim');
  const [algoSteps, setAlgoSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [startNode, setStartNode] = useState(null);

  const [weightModal, setWeightModal] = useState(null);
  const [weightInput, setWeightInput] = useState('1');

  const [uf, setUf] = useState(null);
  const [ufHistory, setUfHistory] = useState([]);
  const [pathCompression, setPathCompression] = useState(true);
  const [unionByRank, setUnionByRank] = useState(true);
  const [ufFindSelect, setUfFindSelect] = useState(null);
  const [ufUnionA, setUfUnionA] = useState(null);
  const [ufUnionB, setUfUnionB] = useState(null);
  const [ufHighlighted, setUfHighlighted] = useState(new Set());

  const [reprFormat, setReprFormat] = useState('adjMatrix');

  // ---------- Graph actions ----------

  const addNode = useCallback((x, y) => {
    const id = nextNodeId.current++;
    setNodes((prev) => [...prev, { id, x, y, label: String(id) }]);
  }, []);

  const addEdge = useCallback((sourceId, targetId, weight = 1) => {
    setEdges((prev) => {
      const exists = prev.some(
        (e) =>
          (e.source === sourceId && e.target === targetId) ||
          (e.source === targetId && e.target === sourceId)
      );
      if (exists) return prev;
      const id = nextEdgeId.current++;
      return [...prev, { id, source: sourceId, target: targetId, weight }];
    });
  }, []);

  const moveNode = useCallback((id, x, y) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
  }, []);

  const removeNode = useCallback((id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
    setSelectedNode((sel) => (sel === id ? null : sel));
  }, []);

  const removeEdge = useCallback((id) => {
    setEdges((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    nextNodeId.current = 0;
    nextEdgeId.current = 0;
    setSelectedNode(null);
    setAlgoSteps([]);
    setCurrentStep(-1);
    setIsPlaying(false);
  }, []);

  const handleEdgeCreated = useCallback(
    (sourceId, targetId) => {
      if (weighted) {
        setWeightModal({ sourceId, targetId });
        setWeightInput('1');
      } else {
        addEdge(sourceId, targetId, 1);
      }
    },
    [weighted, addEdge]
  );

  const confirmWeight = useCallback(() => {
    if (!weightModal) return;
    const w = parseInt(weightInput) || 1;
    addEdge(weightModal.sourceId, weightModal.targetId, Math.max(1, w));
    setWeightModal(null);
  }, [weightModal, weightInput, addEdge]);

  // ---------- Build Graph from state ----------

  const buildGraph = useCallback(() => {
    const g = new Graph();
    g.weighted = weighted;
    for (const n of nodes) g.nodes.set(n.id, { ...n });
    for (const e of edges) g.edges.set(e.id, { ...e });
    g.nextNodeId = nextNodeId.current;
    g.nextEdgeId = nextEdgeId.current;
    return g;
  }, [nodes, edges, weighted]);

  // ---------- Sample graphs ----------

  const loadGraph = useCallback((g) => {
    setNodes(g.getNodeArray());
    setEdges(g.getEdgeArray());
    nextNodeId.current = g.nextNodeId;
    nextEdgeId.current = g.nextEdgeId;
    setSelectedNode(null);
    setAlgoSteps([]);
    setCurrentStep(-1);
    setIsPlaying(false);
  }, []);

  const generateRandom = useCallback(() => loadGraph(Graph.generateRandom(6, 0.45, 20)), [loadGraph]);
  const generateComplete = useCallback(() => loadGraph(Graph.generateComplete(5, 15)), [loadGraph]);
  const generateBipartite = useCallback(() => loadGraph(Graph.generateBipartite(3, 3, 15)), [loadGraph]);

  // ---------- Algorithms ----------

  const runAlgorithm = useCallback(() => {
    const g = buildGraph();
    if (g.nodes.size === 0) return;

    let steps;
    const sn = startNode ?? nodes[0]?.id;
    switch (algorithm) {
      case 'prim':
        steps = generatePrimSteps(g, sn);
        break;
      case 'kruskal':
        steps = generateKruskalSteps(g);
        break;
      case 'boruvka':
        steps = generateBoruvkaSteps(g);
        break;
      default:
        return;
    }

    setAlgoSteps(steps);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [buildGraph, algorithm, startNode, nodes]);

  useEffect(() => {
    if (!isPlaying || currentStep >= algoSteps.length - 1) {
      if (isPlaying) setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentStep((s) => s + 1);
    }, speed);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, algoSteps.length, speed]);

  const currentStepData =
    currentStep >= 0 && currentStep < algoSteps.length ? algoSteps[currentStep] : null;

  const currentHighlights = useMemo(() => {
    if (!currentStepData) return {};
    return {
      mstNodes: currentStepData.mstNodes,
      mstEdges: currentStepData.mstEdges,
      candidateEdges: currentStepData.candidateEdges,
      currentEdge: currentStepData.currentEdge,
      rejectedEdge: currentStepData.rejectedEdge,
    };
  }, [currentStepData]);

  // ---------- Union-Find ----------

  const initUF = useCallback(() => {
    if (nodes.length === 0) return;
    const newUf = new UnionFind(nodes.map((n) => n.id));
    newUf.usePathCompression = pathCompression;
    newUf.useUnionByRank = unionByRank;
    setUf(newUf);
    setUfHistory([]);
    setUfHighlighted(new Set());
    if (nodes.length > 0) {
      setUfFindSelect(nodes[0].id);
      setUfUnionA(nodes[0].id);
      setUfUnionB(nodes.length > 1 ? nodes[1].id : nodes[0].id);
    }
  }, [nodes, pathCompression, unionByRank]);

  const handleUFFind = useCallback(() => {
    if (!uf || ufFindSelect === null) return;
    const result = uf.find(ufFindSelect);
    setUf(uf.clone());
    setUfHistory((prev) => [
      { op: 'Find', detail: `Find(${ufFindSelect}) = ${result}` },
      ...prev,
    ]);
    setUfHighlighted(new Set([ufFindSelect, result]));
    setTimeout(() => setUfHighlighted(new Set()), 2000);
  }, [uf, ufFindSelect]);

  const handleUFUnion = useCallback(() => {
    if (!uf || ufUnionA === null || ufUnionB === null) return;
    const result = uf.union(ufUnionA, ufUnionB);
    setUf(uf.clone());
    setUfHistory((prev) => [
      {
        op: 'Union',
        detail: result
          ? `Union(${ufUnionA}, ${ufUnionB}) — conjuntos mesclados`
          : `Union(${ufUnionA}, ${ufUnionB}) — já no mesmo conjunto`,
      },
      ...prev,
    ]);
    setUfHighlighted(new Set([ufUnionA, ufUnionB]));
    setTimeout(() => setUfHighlighted(new Set()), 2000);
  }, [uf, ufUnionA, ufUnionB]);

  useEffect(() => {
    if (uf) {
      uf.usePathCompression = pathCompression;
      uf.useUnionByRank = unionByRank;
    }
  }, [pathCompression, unionByRank, uf]);

  // ---------- Tab switching ----------

  const handleTabChange = useCallback(
    (tab) => {
      setActiveTab(tab);
      setIsPlaying(false);
      if (tab === 'editor') {
        setAlgoSteps([]);
        setCurrentStep(-1);
      }
      if (tab === 'unionfind') {
        initUF();
      }
    },
    [initUF]
  );

  // ---------- Render ----------

  return (
    <div className="h-screen flex flex-col bg-[#050510] text-slate-200 overflow-hidden">
      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          tool={tool}
          onToolChange={setTool}
          weighted={weighted}
          onWeightedChange={setWeighted}
          onGenerateRandom={generateRandom}
          onGenerateComplete={generateComplete}
          onGenerateBipartite={generateBipartite}
          onClear={clearGraph}
          algorithm={algorithm}
          onAlgorithmChange={setAlgorithm}
          nodes={nodes}
          startNode={startNode}
          onStartNodeChange={setStartNode}
          speed={speed}
          onSpeedChange={setSpeed}
          onRunAlgorithm={runAlgorithm}
          reprFormat={reprFormat}
          onReprFormatChange={setReprFormat}
          pathCompression={pathCompression}
          unionByRank={unionByRank}
          onPathCompressionChange={setPathCompression}
          onUnionByRankChange={setUnionByRank}
          onUFReset={initUF}
          ufFindSelect={ufFindSelect}
          onUFFindSelectChange={setUfFindSelect}
          onUFFind={handleUFFind}
          ufUnionA={ufUnionA}
          ufUnionB={ufUnionB}
          onUFUnionAChange={setUfUnionA}
          onUFUnionBChange={setUfUnionB}
          onUFUnion={handleUFUnion}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'unionfind' ? (
            <UnionFindCanvas uf={uf} highlightedNodes={ufHighlighted} />
          ) : activeTab === 'representations' ? (
            <ReprCanvas buildGraph={buildGraph} reprFormat={reprFormat} />
          ) : (
            <GraphCanvas
              nodes={nodes}
              edges={edges}
              tool={activeTab === 'editor' ? tool : 'select'}
              highlights={activeTab === 'algorithms' ? currentHighlights : {}}
              selectedNode={selectedNode}
              onAddNode={addNode}
              onMoveNode={moveNode}
              onEdgeCreated={handleEdgeCreated}
              onDeleteNode={removeNode}
              onDeleteEdge={removeEdge}
              onSelectNode={setSelectedNode}
              weighted={weighted}
              interactive={activeTab === 'editor'}
            />
          )}

          {activeTab === 'algorithms' && algoSteps.length > 0 && (
            <AuxStructures algorithm={algorithm} stepData={currentStepData} />
          )}

          {activeTab === 'algorithms' && algoSteps.length > 0 && (
            <AlgoControls
              currentStep={currentStep}
              totalSteps={algoSteps.length}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onStepForward={() =>
                setCurrentStep((s) => Math.min(s + 1, algoSteps.length - 1))
              }
              onStepBack={() => setCurrentStep((s) => Math.max(s - 1, 0))}
              onReset={() => {
                setCurrentStep(0);
                setIsPlaying(false);
              }}
              onEnd={() => {
                setCurrentStep(algoSteps.length - 1);
                setIsPlaying(false);
              }}
            />
          )}
        </main>

        <InfoPanel
          activeTab={activeTab}
          nodes={nodes}
          edges={edges}
          algorithm={algorithm}
          currentStepData={currentStepData}
          stepIndex={currentStep}
          totalSteps={algoSteps.length}
          reprFormat={reprFormat}
          buildGraph={buildGraph}
          uf={uf}
          ufHistory={ufHistory}
        />
      </div>

      {/* Weight Modal */}
      {weightModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-6 w-80 animate-fade-in">
            <h3 className="text-base font-semibold mb-1">Peso da Aresta</h3>
            <p className="text-xs text-slate-500 mb-4 font-mono">
              Vértice {weightModal.sourceId} → Vértice {weightModal.targetId}
            </p>
            <input
              type="number"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmWeight();
                if (e.key === 'Escape') setWeightModal(null);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-center text-lg font-mono focus:outline-none focus:border-cyan-400/50 transition mb-4"
              autoFocus
              min="1"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setWeightModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmWeight}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 text-white font-semibold text-sm hover:opacity-90 transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReprCanvas({ buildGraph, reprFormat }) {
  const content = useMemo(() => {
    const g = buildGraph();
    if (g.nodes.size === 0) return '';

    switch (reprFormat) {
      case 'adjMatrix': {
        const { matrix, nodeIds } = g.getAdjacencyMatrix();
        const header = '     ' + nodeIds.map((id) => String(id).padStart(4)).join('');
        const rows = matrix.map(
          (row, i) =>
            String(nodeIds[i]).padStart(4) + ' │' + row.map((v) => String(v).padStart(4)).join('')
        );
        const sep = '─────┼' + '────'.repeat(nodeIds.length);
        return header + '\n' + sep + '\n' + rows.join('\n');
      }
      case 'adjList': {
        const list = g.getAdjacencyList();
        const lines = [];
        for (const [nodeId, neighbors] of list) {
          const nbs = neighbors.map((n) => `${n.nodeId}(w=${n.weight})`).join(', ');
          lines.push(`  ${nodeId} → [ ${nbs} ]`);
        }
        return lines.join('\n');
      }
      case 'coordinates': {
        const { An, Ai, Aj, n, Nz } = g.getCoordinateFormat();
        return [
          `n = ${n},  Nz = ${Nz},  custo = 3·Nz = ${3 * Nz}`,
          '',
          `An = [${An.join(', ')}]`,
          `Ai = [${Ai.join(', ')}]`,
          `Aj = [${Aj.join(', ')}]`,
        ].join('\n');
      }
      case 'csr': {
        const { An, Ac, Al, nodeIds, n, Nz } = g.getCSR();
        return [
          `n = ${n},  Nz = ${Nz},  custo = 2·Nz + n+1 = ${2 * Nz + n + 1}`,
          '',
          `An = [${An.join(', ')}]`,
          `Ac = [${Ac.join(', ')}]`,
          `Al = [${Al.join(', ')}]`,
          '',
          '─── Leitura por linha ───',
          ...nodeIds.map((id, i) => {
            const start = Al[i] - 1;
            const end = Al[i + 1] - 1;
            const cols = Ac.slice(start, end).join(', ');
            const vals = An.slice(start, end).join(', ');
            return `  Linha ${i + 1} (v${id}): Al[${i + 1}]=${Al[i]}  →  Ac = [${cols}],  An = [${vals}]`;
          }),
        ].join('\n');
      }
      case 'skyline': {
        const { An, Ai, n, profile } = g.getSkyline();
        return [
          `n = ${n},  profile = ${profile},  |An| = ${An.length}`,
          '',
          `An = [${An.join(', ')}]`,
          `Ai = [${Ai.join(', ')}]`,
          '',
          '─── Leitura por linha ───',
          ...Ai.map((diagPos, i) => {
            const prevDiag = i === 0 ? 0 : Ai[i - 1];
            const elems = An.slice(prevDiag, diagPos);
            return `  Linha ${i + 1}: An[${prevDiag + 1}..${diagPos}] = [${elems.join(', ')}]  (diagonal na posição ${diagPos})`;
          }),
        ].join('\n');
      }
      case 'csrsss': {
        const { Ad, An, Ac, Al, n, numEdges } = g.getCSRSSS();
        const cost = 2 * numEdges + 2 * n + 1;
        return [
          `n = ${n},  |A| = ${numEdges},  custo = 2|A|+2|V|+1 = ${cost}`,
          '',
          `Ad = [${Ad.join(', ')}]`,
          `An = [${An.length > 0 ? An.join(', ') : ''}]`,
          `Ac = [${Ac.length > 0 ? Ac.join(', ') : ''}]`,
          `Al = [${Al.join(', ')}]`,
          '',
          '─── Leitura por linha ───',
          ...Ad.map((d, i) => {
            const start = Al[i];
            const end = Al[i + 1];
            const cols = Ac.slice(start, end);
            const vals = An.slice(start, end);
            const lower = vals.length > 0 ? `tri. inf. = [${vals.join(', ')}] (col. ${cols.join(', ')})` : 'sem elem. tri. inf.';
            return `  Linha ${i + 1}: diag = ${d},  ${lower}`;
          }),
        ].join('\n');
      }
      case 'edgeList': {
        const el = g.getEdgeList();
        return el.map((e) => `  (${e.source}, ${e.target}, peso = ${e.weight})`).join('\n');
      }
      default:
        return '';
    }
  }, [buildGraph, reprFormat]);

  if (!content) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        Crie um grafo na aba Editor para ver as representações.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
      <pre className="info-card text-sm font-mono text-emerald-300/90 whitespace-pre overflow-x-auto max-w-3xl w-full p-6 leading-relaxed animate-fade-in">
        {content}
      </pre>
    </div>
  );
}
