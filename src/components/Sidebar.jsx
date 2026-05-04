import {
  MousePointer2,
  CirclePlus,
  Spline,
  Trash2,
  Shuffle,
  Hexagon,
  SplitSquareHorizontal,
  Eraser,
  Zap,
} from 'lucide-react';

const editorTools = [
  { id: 'select', label: 'Selecionar', icon: MousePointer2 },
  { id: 'addNode', label: 'Vértice +', icon: CirclePlus },
  { id: 'addEdge', label: 'Aresta +', icon: Spline },
  { id: 'delete', label: 'Deletar', icon: Trash2 },
];

const algorithms = [
  { id: 'prim', label: 'Prim' },
  { id: 'kruskal', label: 'Kruskal' },
  { id: 'boruvka', label: 'Borůvka' },
  { id: 'dfs', label: 'Busca Profundidade (DFS)' },
  { id: 'bfs', label: 'Busca Largura (BFS)' },
  { id: 'aps', label: 'APS (Emparelhamento)' },
  { id: 'egervary', label: 'Egerváry' },
];

const reprFormats = [
  { id: 'adjMatrix', label: 'Matriz de Adjacência' },
  { id: 'adjList', label: 'Lista de Adjacência' },
  { id: 'coordinates', label: 'Coordenadas (COO)' },
  { id: 'csr', label: 'CSR' },
  { id: 'skyline', label: 'Skyline (SSS)' },
  { id: 'csrsss', label: 'CSR-SSS' },
  { id: 'edgeList', label: 'Lista de Arestas' },
];

export default function Sidebar({
  activeTab,
  tool,
  onToolChange,
  weighted,
  onWeightedChange,
  onGenerateRandom,
  onGenerateComplete,
  onGenerateBipartite,
  onClear,
  algorithm,
  onAlgorithmChange,
  nodes,
  startNode,
  onStartNodeChange,
  speed,
  onSpeedChange,
  onRunAlgorithm,
  reprFormat,
  onReprFormatChange,
  pathCompression,
  unionByRank,
  onPathCompressionChange,
  onUnionByRankChange,
  onUFReset,
  ufFindSelect,
  onUFFindSelectChange,
  onUFFind,
  ufUnionA,
  ufUnionB,
  onUFUnionAChange,
  onUFUnionBChange,
  onUFUnion,
  apsInitialMatching,
  onApsInitialMatchingChange,
  algoError,
}) {
  return (
    <aside className="w-64 bg-slate-900/40 border-r border-white/5 flex flex-col overflow-y-auto shrink-0">
      <div className="p-4 flex flex-col gap-5">
        {/* ===== EDITOR TAB ===== */}
        {activeTab === 'editor' && (
          <>
            <Section title="Ferramentas">
              <div className="flex flex-col gap-1">
                {editorTools.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onToolChange(t.id)}
                      className={`sidebar-btn ${tool === t.id ? 'active' : 'text-slate-400'}`}
                    >
                      <Icon size={15} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="Opções">
              <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={weighted}
                  onChange={(e) => onWeightedChange(e.target.checked)}
                  className="accent-cyan-400 w-3.5 h-3.5"
                />
                Grafo Ponderado
              </label>
            </Section>

            <Section title="Grafos de Exemplo">
              <div className="flex flex-col gap-1.5">
                <button onClick={onGenerateRandom} className="sample-btn flex items-center gap-2">
                  <Shuffle size={13} /> Aleatório (6 vértices)
                </button>
                <button onClick={onGenerateComplete} className="sample-btn flex items-center gap-2">
                  <Hexagon size={13} /> Completo K₅
                </button>
                <button onClick={onGenerateBipartite} className="sample-btn flex items-center gap-2">
                  <SplitSquareHorizontal size={13} /> Bipartido
                </button>
                <button onClick={onClear} className="sample-btn flex items-center gap-2 text-rose-400/80 hover:text-rose-400">
                  <Eraser size={13} /> Limpar Tudo
                </button>
              </div>
            </Section>
          </>
        )}

        {/* ===== ALGORITHMS TAB ===== */}
        {activeTab === 'algorithms' && (
          <>
            <Section title="Algoritmo">
              <div className="flex flex-wrap gap-2">
                {algorithms.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onAlgorithmChange(a.id)}
                    className={`algo-chip ${algorithm === a.id ? 'active' : ''}`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </Section>

            {(algorithm === 'prim' || algorithm === 'dfs' || algorithm === 'bfs') && (
              <Section title="Vértice Inicial">
                <select
                  value={startNode ?? ''}
                  onChange={(e) => onStartNodeChange(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      Vértice {n.label}
                    </option>
                  ))}
                </select>
              </Section>
            )}

            <Section title="Velocidade">
              <input
                type="range"
                min={100}
                max={3000}
                step={100}
                value={speed}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <span className="text-xs text-slate-500 font-mono">{(speed / 1000).toFixed(1)}s por passo</span>
            </Section>

            {(algorithm === 'aps' || algorithm === 'egervary') && (
              <Section title="Matching Inicial">
                <div className="flex flex-col gap-1.5">
                  {[
                    { id: 'empty', label: 'Vazio (M ← ∅)', desc: 'Começa sem nenhum emparelhamento' },
                    { id: 'greedy', label: 'Greedy', desc: 'Pré-emparelha aresta a aresta guloso' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                        apsInitialMatching === opt.id
                          ? 'border-cyan-500/40 bg-cyan-500/8 text-slate-200'
                          : 'border-white/5 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="apsInitial"
                        value={opt.id}
                        checked={apsInitialMatching === opt.id}
                        onChange={() => onApsInitialMatchingChange(opt.id)}
                        className="accent-cyan-400 mt-0.5 shrink-0"
                      />
                      <div>
                        <div className="text-xs font-medium">{opt.label}</div>
                        <div className="text-[0.6rem] text-slate-500 mt-0.5">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </Section>
            )}

            {algoError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/8 px-3 py-2.5 text-xs text-rose-300 leading-relaxed">
                {algoError}
              </div>
            )}

            <button
              onClick={onRunAlgorithm}
              disabled={nodes.length === 0}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Zap size={15} />
              Iniciar {algorithms.find((a) => a.id === algorithm)?.label}
            </button>
          </>
        )}

        {/* ===== UNION-FIND TAB ===== */}
        {activeTab === 'unionfind' && (
          <>
            <Section title="Heurísticas">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pathCompression}
                    onChange={(e) => onPathCompressionChange(e.target.checked)}
                    className="accent-violet-400 w-3.5 h-3.5"
                  />
                  Compressão de Caminho
                </label>
                <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={unionByRank}
                    onChange={(e) => onUnionByRankChange(e.target.checked)}
                    className="accent-violet-400 w-3.5 h-3.5"
                  />
                  União por Rank
                </label>
              </div>
            </Section>

            <Section title="Operação Find">
              <div className="flex gap-2">
                <select
                  value={ufFindSelect ?? ''}
                  onChange={(e) => onUFFindSelectChange(Number(e.target.value))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
                <button onClick={onUFFind} className="sample-btn px-4">Find</button>
              </div>
            </Section>

            <Section title="Operação Union">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <select
                    value={ufUnionA ?? ''}
                    onChange={(e) => onUFUnionAChange(Number(e.target.value))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
                  >
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                  <select
                    value={ufUnionB ?? ''}
                    onChange={(e) => onUFUnionBChange(Number(e.target.value))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
                  >
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                </div>
                <button onClick={onUFUnion} className="sample-btn w-full">Union</button>
              </div>
            </Section>

            <button
              onClick={onUFReset}
              className="sample-btn flex items-center justify-center gap-2 text-rose-400/80 hover:text-rose-400"
            >
              <Eraser size={13} /> Resetar Union-Find
            </button>
          </>
        )}

        {/* ===== REPRESENTATIONS TAB ===== */}
        {activeTab === 'representations' && (
          <Section title="Formato">
            <div className="flex flex-col gap-1">
              {reprFormats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onReprFormatChange(f.id)}
                  className={`sidebar-btn ${reprFormat === f.id ? 'active' : 'text-slate-400'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Section>
        )}
      </div>
    </aside>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-[0.65rem] font-semibold uppercase tracking-widest text-slate-500 mb-2.5">
        {title}
      </h3>
      {children}
    </div>
  );
}
