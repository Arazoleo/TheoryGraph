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

const ALGO_LEGEND = {
  prim: [
    { color: '#34d399', label: 'Na AGM' },
    { color: '#22d3ee', label: 'Candidato' },
    { color: '#f87171', label: 'Rejeitado' },
  ],
  kruskal: [
    { color: '#34d399', label: 'Na AGM' },
    { color: '#fbbf24', label: 'Em consideração' },
    { color: '#f87171', label: 'Rejeitado (ciclo)' },
  ],
  boruvka: [
    { color: '#34d399', label: 'Na AGM' },
    { color: '#22d3ee', label: 'Mais barato do componente' },
  ],
  dfs: [
    { color: '#34d399', label: 'Visitado' },
    { color: '#22d3ee', label: 'Atual / Empilhado' },
  ],
  bfs: [
    { color: '#34d399', label: 'Visitado' },
    { color: '#22d3ee', label: 'Atual / Na fila' },
  ],
  aps: [
    { color: '#34d399', label: 'No emparelhamento M' },
    { color: '#fb7185', label: 'R(T) — raízes' },
    { color: '#a78bfa', label: 'B(T) — cobertos' },
    { color: '#fbbf24', label: 'Caminho aumentante' },
  ],
  egervary: [
    { color: '#34d399', label: 'Emparelhamento M*' },
    { color: '#fb7185', label: 'R(T) — raízes' },
    { color: '#a78bfa', label: 'B(T) — cobertos' },
    { color: '#fbbf24', label: 'Caminho aumentante' },
  ],
};

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
  edges,
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
    <aside
      className="w-64 border-r flex flex-col overflow-y-auto shrink-0"
      style={{ background: 'var(--panel-bg)', borderColor: 'var(--border-color)' }}
    >
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

            {nodes.length > 0 && (
              <Section title="Grafo Atual">
                {/* Node dots with rainbow colors */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {nodes.slice(0, 16).map((n, i) => {
                    const palette = ['#22d3ee','#818cf8','#a78bfa','#f472b6','#34d399','#fbbf24','#fb7185','#60a5fa'];
                    const c = palette[i % palette.length];
                    return (
                      <div
                        key={n.id}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white font-black shrink-0"
                        style={{ fontSize: '6.5px', background: `radial-gradient(circle at 35% 30%, ${c}cc, ${c}66)`, boxShadow: `0 0 6px ${c}55` }}
                      >
                        {n.label}
                      </div>
                    );
                  })}
                  {nodes.length > 16 && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0"
                      style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '6px', border: '1px solid var(--border-color)' }}
                    >
                      +{nodes.length - 16}
                    </div>
                  )}
                </div>
                {/* Density bars */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.6rem] w-16 shrink-0" style={{ color: 'var(--text-muted)' }}>Vértices</span>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(nodes.length / 20 * 100, 100)}%`, background: 'linear-gradient(90deg, #0891b2, #22d3ee)', transition: 'width 0.4s' }} />
                    </div>
                    <span className="text-[0.6rem] font-mono tabular-nums w-4 text-right" style={{ color: 'var(--text-secondary)' }}>{nodes.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.6rem] w-16 shrink-0" style={{ color: 'var(--text-muted)' }}>Arestas</span>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(edges.length / 40 * 100, 100)}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', transition: 'width 0.4s' }} />
                    </div>
                    <span className="text-[0.6rem] font-mono tabular-nums w-4 text-right" style={{ color: 'var(--text-secondary)' }}>{edges.length}</span>
                  </div>
                </div>
              </Section>
            )}

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
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
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

            {ALGO_LEGEND[algorithm] && (
              <Section title="Legenda">
                <div className="flex flex-col gap-1.5">
                  {ALGO_LEGEND[algorithm].map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: item.color, boxShadow: `0 0 6px ${item.color}50` }}
                      />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {item.label}
                      </span>
                    </div>
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
              className="run-btn w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 relative overflow-hidden"
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
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
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
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  >
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                  <select
                    value={ufUnionB ?? ''}
                    onChange={(e) => onUFUnionBChange(Number(e.target.value))}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
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
      <div className="section-title">
        <div className="section-title-bar" />
        <h3>{title}</h3>
      </div>
      {children}
    </div>
  );
}
