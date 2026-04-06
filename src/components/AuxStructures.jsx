import { ArrowDown, Check, X, Search } from 'lucide-react';

export default function AuxStructures({ algorithm, stepData }) {
  if (!stepData) return null;

  return (
    <div className="border-t border-white/5 bg-slate-900/50 backdrop-blur-sm shrink-0 overflow-hidden">
      <div className="px-4 py-2.5 overflow-x-auto">
        {algorithm === 'prim' && <PrimHeap stepData={stepData} />}
        {algorithm === 'kruskal' && <KruskalEdges stepData={stepData} />}
        {algorithm === 'boruvka' && <BoruvkaComponents stepData={stepData} />}
        {(algorithm === 'dfs' || algorithm === 'bfs') && <SearchFrontier stepData={stepData} />}
      </div>
    </div>
  );
}

function PrimHeap({ stepData }) {
  const { pqContents = [], pqExtracted, keyUpdates } = stepData;
  const updatedNodes = new Set((keyUpdates || []).map((u) => u.nodeId));

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-slate-500">
          Fila de Prioridades H (vértices por custo)
        </span>
        <span className="text-[0.6rem] text-slate-600 font-mono">
          — |H| = {pqContents.length}
        </span>
      </div>

      <div className="flex items-end gap-1.5 min-h-[3.5rem]">
        {/* Extracted vertex */}
        {pqExtracted && (
          <div className="flex items-center gap-1.5 mr-1">
            <div className="flex flex-col items-center px-2.5 py-1.5 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs font-mono animate-fade-in">
              <span className="text-[0.55rem] text-emerald-500 mb-0.5">Retira(H)</span>
              <span className="font-bold text-sm">v{pqExtracted.nodeId}</span>
              <span className="text-[0.6rem] opacity-70">
                custo={pqExtracted.cost}
              </span>
              {pqExtracted.predecessor !== null && (
                <span className="text-[0.55rem] opacity-60">
                  pred={pqExtracted.predecessor}
                </span>
              )}
            </div>
            {pqContents.length > 0 && (
              <ArrowDown size={12} className="text-slate-600 rotate-[-90deg]" />
            )}
          </div>
        )}

        {/* PQ contents: vertices ordered by cost */}
        {pqContents.length > 0 ? (
          pqContents.map((item, i) => {
            const isMin = i === 0;
            const wasUpdated = updatedNodes.has(item.nodeId);
            const costLabel = item.cost === Infinity ? '∞' : item.cost;
            return (
              <div
                key={`pq-v${item.nodeId}`}
                className={`flex flex-col items-center px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                  wasUpdated
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 animate-pulse-glow'
                    : isMin
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : 'bg-white/3 border-white/8 text-slate-400'
                }`}
              >
                <span className={`font-bold text-sm ${isMin && !wasUpdated ? 'text-cyan-300' : ''}`}>
                  v{item.nodeId}
                </span>
                <span className="text-[0.6rem] opacity-80">
                  {costLabel}
                </span>
                {item.predecessor !== null && (
                  <span className="text-[0.55rem] opacity-50">
                    ←{item.predecessor}
                  </span>
                )}
                {isMin && !wasUpdated && (
                  <span className="text-[0.5rem] text-cyan-500 mt-0.5">▲ próximo</span>
                )}
              </div>
            );
          })
        ) : (
          !pqExtracted && (
            <span className="text-xs text-slate-600 italic">H = ∅</span>
          )
        )}
      </div>
    </div>
  );
}

function KruskalEdges({ stepData }) {
  const { edgeStatuses = [], numComponents, ufState } = stepData;

  const statusConfig = {
    pending:     { icon: null,    color: 'text-slate-600', bg: 'bg-white/2',         border: 'border-white/5' },
    considering: { icon: Search,  color: 'text-amber-400', bg: 'bg-amber-500/10',    border: 'border-amber-500/30' },
    accepted:    { icon: Check,   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    rejected:    { icon: X,       color: 'text-rose-400',  bg: 'bg-rose-500/10',     border: 'border-rose-500/30' },
  };

  const components = ufState?.components
    ? Object.values(ufState.components)
        .map((members) => `{${[...members].sort((a, b) => a - b).join(',')}}`)
    : [];

  return (
    <div>
      {/* C (conjuntos disjuntos) */}
      {components.length > 0 && (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-slate-500">
            C =
          </span>
          <span className="text-xs font-mono text-violet-300">
            {'{' + components.join(', ') + '}'}
          </span>
          <span className="text-[0.6rem] text-slate-600 font-mono">
            |C| = {numComponents ?? components.length}
          </span>
        </div>
      )}

      {/* F (fila de arestas) */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-slate-500">
          Fila F (arestas por peso)
        </span>
        <span className="text-[0.6rem] text-slate-600 font-mono">
          — {edgeStatuses.filter((e) => e.status === 'pending' || e.status === 'considering').length} restante(s)
        </span>
      </div>

      <div className="flex items-center gap-1.5 min-h-[3.5rem] flex-wrap">
        {edgeStatuses.map((es) => {
          const cfg = statusConfig[es.status] || statusConfig.pending;
          const Icon = cfg.icon;
          return (
            <div
              key={`ke-${es.id}`}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-mono transition-all ${cfg.bg} ${cfg.border} ${cfg.color} ${
                es.status === 'considering' ? 'animate-pulse-glow ring-1 ring-amber-400/20' : ''
              }`}
            >
              {Icon && <Icon size={10} className="shrink-0" />}
              <span className="font-semibold">{es.weight}</span>
              <span className="text-[0.6rem] opacity-70">
                ({es.source},{es.target})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BoruvkaComponents({ stepData }) {
  const { cheapestPerComponent = [], forest = [], numComponents } = stepData;

  return (
    <div>
      {/* L (floresta de árvores) */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-slate-500">
          L =
        </span>
        {forest.length > 0 ? (
          <>
            <span className="text-xs font-mono text-violet-300">
              {'{' + forest.map((t) => `{${t.members.join(',')}}`).join(', ') + '}'}
            </span>
            <span className="text-[0.6rem] text-slate-600 font-mono">
              |L| = {numComponents ?? forest.length}
            </span>
          </>
        ) : (
          <span className="text-xs text-slate-600 italic">∅</span>
        )}
      </div>

      {/* Franja: aresta mais barata por árvore */}
      {cheapestPerComponent.length > 0 ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-slate-500">
              Franja (aresta mais barata por Tᵢ)
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-h-[3.5rem] flex-wrap">
            {cheapestPerComponent.map((cpc, i) => (
              <div
                key={`bk-${cpc.component}-${i}`}
                className="flex flex-col items-center px-2.5 py-1.5 rounded-lg border bg-violet-500/10 border-violet-500/25 text-xs font-mono text-violet-300 animate-fade-in"
              >
                <span className="text-[0.55rem] text-violet-500 mb-0.5">
                  {'{' + (cpc.members || [cpc.component]).join(',') + '}'}
                </span>
                <span className="font-bold text-sm">{cpc.edge.weight}</span>
                <span className="text-[0.6rem] opacity-70">
                  ({cpc.edge.source},{cpc.edge.target})
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        stepData.type === 'complete' && (
          <p className="text-xs text-slate-600 italic">
            |L| = 1 — AGM encontrada.
          </p>
        )
      )}
    </div>
  );
}

function SearchFrontier({ stepData }) {
  const { frontierType, frontierContents = [], frontierPopped } = stepData;
  const isStack = frontierType === 'stack';

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-slate-500">
          {isStack ? 'Pilha' : 'Fila'} de fronteira
        </span>
        <span className="text-[0.6rem] text-slate-600 font-mono">
          — tamanho = {frontierContents.length}
        </span>
      </div>

      <div className="flex items-center gap-1.5 min-h-[3.5rem] flex-wrap">
        {frontierPopped !== null && (
          <div className="flex items-center gap-1.5 mr-1">
            <div className="flex flex-col items-center px-2.5 py-1.5 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs font-mono animate-fade-in">
              <span className="text-[0.55rem] text-emerald-500 mb-0.5">
                {isStack ? 'Desempilha' : 'Desenfileira'}
              </span>
              <span className="font-bold text-sm">v{frontierPopped}</span>
            </div>
            {frontierContents.length > 0 && (
              <ArrowDown size={12} className="text-slate-600 rotate-[-90deg]" />
            )}
          </div>
        )}

        {frontierContents.length > 0 ? (
          frontierContents.map((nodeId, i) => (
            <div
              key={`frontier-${nodeId}-${i}`}
              className="flex flex-col items-center px-2.5 py-1.5 rounded-lg border text-xs font-mono bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
            >
              <span className="font-bold text-sm">v{nodeId}</span>
              {((isStack && i === frontierContents.length - 1) || (!isStack && i === 0)) && (
                <span className="text-[0.5rem] text-cyan-500 mt-0.5">
                  {isStack ? 'topo' : 'frente'}
                </span>
              )}
            </div>
          ))
        ) : (
          frontierPopped === null && (
            <span className="text-xs text-slate-600 italic">
              {isStack ? 'Pilha vazia' : 'Fila vazia'}
            </span>
          )
        )}
      </div>
    </div>
  );
}
