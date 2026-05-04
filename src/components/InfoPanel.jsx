import { useMemo } from 'react';
import { MousePointer2, CirclePlus, Spline, Trash2 } from 'lucide-react';
import { PSEUDOCODE, COMPLEXITY } from '../lib/algorithms';

export default function InfoPanel({
  activeTab,
  nodes,
  edges,
  algorithm,
  currentStepData,
  stepIndex,
  totalSteps,
  reprFormat,
  buildGraph,
  uf,
  ufHistory,
}) {
  return (
    <aside
      className="w-72 border-l flex flex-col overflow-y-auto shrink-0"
      style={{ background: 'var(--panel-bg)', borderColor: 'var(--border-color)' }}
    >
      <div className="p-4 flex flex-col gap-5">
        {activeTab === 'editor' && (
          <EditorInfo nodes={nodes} edges={edges} buildGraph={buildGraph} />
        )}
        {activeTab === 'algorithms' && (
          <AlgorithmInfo
            algorithm={algorithm}
            stepData={currentStepData}
            stepIndex={stepIndex}
            totalSteps={totalSteps}
          />
        )}
        {activeTab === 'unionfind' && (
          <UnionFindInfo uf={uf} ufHistory={ufHistory} />
        )}
        {activeTab === 'representations' && (
          <RepresentationInfo reprFormat={reprFormat} buildGraph={buildGraph} />
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

function EditorInfo({ nodes, edges, buildGraph }) {
  const stats = useMemo(() => {
    if (nodes.length === 0) return { nodes: 0, edges: 0, components: 0, maxDeg: 0 };
    const g = buildGraph();
    return {
      nodes: nodes.length,
      edges: edges.length,
      components: g.getComponents().length,
      maxDeg: g.getMaxDegree(),
    };
  }, [nodes, edges, buildGraph]);

  return (
    <>
      <Section title="Propriedades do Grafo">
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Vértices" value={stats.nodes} color="text-cyan-400" />
          <StatBox label="Arestas" value={stats.edges} color="text-violet-400" />
          <StatBox label="Componentes" value={stats.components} color="text-emerald-400" />
          <StatBox label="Grau Máx" value={stats.maxDeg} color="text-amber-400" />
        </div>
      </Section>

      <Section title="Como usar">
        <div className="space-y-2">
          {[
            { Icon: MousePointer2, label: 'Selecionar', desc: 'clique e arraste vértices' },
            { Icon: CirclePlus, label: 'Vértice +', desc: 'clique no canvas vazio' },
            { Icon: Spline, label: 'Aresta +', desc: 'clique em dois vértices' },
            { Icon: Trash2, label: 'Deletar', desc: 'clique em vértices ou arestas' },
          ].map(({ Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-2.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-px"
                style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <Icon size={12} />
              </div>
              <div className="text-xs leading-snug pt-0.5">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</span>
                <span style={{ color: 'var(--text-muted)' }}> — {desc}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function AlgorithmInfo({ algorithm, stepData, stepIndex, totalSteps }) {
  const pseudocode = PSEUDOCODE[algorithm] || [];
  const complexity = COMPLEXITY[algorithm] || {};
  const pseudoLine = stepData?.pseudocodeLine ?? -1;
  const isSearch = algorithm === 'dfs' || algorithm === 'bfs';
  const isMatching = algorithm === 'aps' || algorithm === 'egervary';
  const algoChapter =
    algorithm === 'prim'
      ? '1'
      : algorithm === 'kruskal'
      ? '2'
      : algorithm === 'boruvka'
      ? '3'
      : algorithm === 'dfs'
      ? '4'
      : algorithm === 'bfs'
      ? '5'
      : algorithm === 'egervary'
      ? 'Egerváry'
      : '16.18';

  return (
    <>
      <Section title="Passo Atual">
        <div
          key={stepIndex}
          className="rounded-xl p-[1px] animate-float-up"
          style={{
            background: stepData
              ? 'linear-gradient(135deg, rgba(34,211,238,0.25) 0%, rgba(139,92,246,0.15) 100%)'
              : 'var(--border-color)',
          }}
        >
          <div className="rounded-xl p-3.5" style={{ background: 'var(--panel-bg)' }}>
            {stepData ? (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {stepData.description}
              </p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Clique em "Iniciar" para executar o algoritmo.
              </p>
            )}
          </div>
        </div>
      </Section>

      {stepData && !isMatching && (
        <Section title={isSearch ? 'Busca' : 'AGM (Árvore Geradora Mínima)'}>
          <div className="flex gap-3">
            <StatBox
              label={isSearch ? 'Visitados' : 'Arestas'}
              value={stepData.mstNodes?.size ?? 0}
              color="text-emerald-400"
            />
            <StatBox
              label={isSearch ? 'Arestas Árvore' : 'Peso Total'}
              value={stepData.mstEdges?.size ?? 0}
              color="text-cyan-400"
            />
          </div>
        </Section>
      )}

      {stepData && isMatching && (
        <Section title={algorithm === 'egervary' ? 'Emparelhamento M*' : 'Emparelhamento M'}>
          <div className="flex gap-2 flex-wrap">
            <StatBox label="|M*|" value={stepData.matchingSize ?? 0} color="text-emerald-400" />
            <StatBox label="R(T)" value={stepData.redNodes?.size ?? 0} color="text-rose-400" />
            <StatBox label="B(T)" value={stepData.blueNodes?.size ?? 0} color="text-violet-400" />
            {algorithm === 'egervary' && (
              <StatBox label="|T|" value={stepData.apsTrees?.length ?? 0} color="text-amber-400" />
            )}
          </div>
        </Section>
      )}

      <Section title={isMatching ? `Algoritmo ${algoChapter}` : `Algoritmo 7.${algoChapter}`}>
        <div className="info-card p-2">
          {pseudocode.map((line, i) => (
            <div key={i} className={`pseudo-line ${i === pseudoLine ? 'active' : ''}`}>
              {line}
            </div>
          ))}
        </div>
      </Section>

      {!isMatching && (
        <Section title="Complexidade">
          <div className="info-card text-xs leading-relaxed">
            <div className="flex flex-col gap-1 mb-2">
              <span className="text-slate-400">
                Tempo: <span className="text-cyan-400 font-mono font-semibold">{complexity.time}</span>
              </span>
              <span className="text-slate-400">
                Espaço: <span className="text-violet-400 font-mono font-semibold">{complexity.space}</span>
              </span>
            </div>
            {complexity.detail && <p className="text-slate-500">{complexity.detail}</p>}
          </div>
        </Section>
      )}

      {complexity.ufAnalysis && (
        <Section title="Conjuntos Disjuntos no Kruskal">
          <div className="space-y-2.5">
            {complexity.ufAnalysis.map((item, i) => (
              <div key={i} className="info-card text-xs leading-relaxed">
                <p className={`font-semibold mb-1 ${item.color}`}>{item.title}</p>
                <p className="text-slate-500 font-mono text-[0.65rem]">{item.ops}</p>
                <p className={`font-mono font-semibold mt-1 ${item.color}`}>{item.total}</p>
              </div>
            ))}
            <div className="info-card text-xs leading-relaxed">
              <p className="text-slate-400 mb-1">
                <strong className="text-violet-400">α(n)</strong> = inversa da função de Ackermann
              </p>
              <p className="text-slate-500">
                Cresce tão lentamente que α(n) ≤ 4 para todo n prático
                (n &lt; 10⁸⁰). A combinação de <em>rank</em> + <em>compressão de caminho</em> torna
                o Union-Find quase linear — O(m·α(n)) é dito <strong className="text-emerald-400">superlinear</strong>.
              </p>
            </div>
          </div>
        </Section>
      )}
    </>
  );
}

function UnionFindInfo({ uf, ufHistory }) {
  const numComponents = uf ? uf.getComponents().size : 0;
  const numElements = uf ? uf.parent.size : 0;

  return (
    <>
      <Section title="Estado">
        <div className="flex gap-3">
          <StatBox label="Elementos" value={numElements} color="text-violet-400" />
          <StatBox label="Conjuntos" value={numComponents} color="text-cyan-400" />
        </div>
      </Section>

      <Section title="Complexidade">
        <div className="info-card text-xs leading-relaxed space-y-2">
          <p className="text-slate-400">
            Com <span className="text-violet-400">compressão de caminho</span> e{' '}
            <span className="text-violet-400">união por rank</span>:
          </p>
          <p className="text-slate-300 font-mono">
            Find/Union: O(α(n)) amortizado
          </p>
          <p className="text-slate-500">
            α(n) é a <strong>inversa da função de Ackermann</strong>. Cresce tão lentamente
            que α(n) ≤ 4 para todos os valores práticos (n &lt; 10⁸⁰). Na prática, é
            considerada constante.
          </p>
          <p className="text-slate-500">
            Sem heurísticas: O(n) no pior caso por operação. A combinação das duas
            heurísticas é crucial para a eficiência do algoritmo de Kruskal.
          </p>
        </div>
      </Section>

      {ufHistory && ufHistory.length > 0 && (
        <Section title="Histórico">
          <div className="info-card max-h-48 overflow-y-auto">
            {ufHistory.map((entry, i) => (
              <div key={i} className="text-xs text-slate-400 py-1 border-b border-white/5 last:border-0">
                <span className="text-violet-400 font-mono mr-1">{entry.op}</span>
                {entry.detail}
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

function RepresentationInfo({ reprFormat, buildGraph }) {
  const content = useMemo(() => {
    const g = buildGraph();
    if (g.nodes.size === 0) return { text: 'Crie um grafo na aba Editor.', desc: '' };

    let text = '';
    let desc = '';

    switch (reprFormat) {
      case 'adjMatrix': {
        const { matrix, nodeIds } = g.getAdjacencyMatrix();
        const header = '     ' + nodeIds.map((id) => String(id).padStart(4)).join('');
        const rows = matrix.map(
          (row, i) =>
            String(nodeIds[i]).padStart(4) + ' ' + row.map((v) => String(v).padStart(4)).join('')
        );
        text = header + '\n' + rows.join('\n');
        desc =
          'Matriz V×V onde M[i][j] contém o peso da aresta entre i e j (0 = sem aresta). Acesso O(1), mas espaço O(V²).';
        break;
      }
      case 'adjList': {
        const list = g.getAdjacencyList();
        const lines = [];
        for (const [nodeId, neighbors] of list) {
          const nbs = neighbors.map((n) => `${n.nodeId}(${n.weight})`).join(', ');
          lines.push(`${nodeId} → [${nbs}]`);
        }
        text = lines.join('\n');
        desc =
          'Cada vértice armazena sua lista de vizinhos. Espaço O(V+E). Eficiente para grafos esparsos.';
        break;
      }
      case 'coordinates': {
        const { An, Ai, Aj, Nz } = g.getCoordinateFormat();
        text = `An = [${An.join(', ')}]\nAi = [${Ai.join(', ')}]\nAj = [${Aj.join(', ')}]`;
        desc = `Formato por coordenadas (COO). Armazena os Nz=${Nz} coeficientes não nulos em An, com seus índices de linha (Ai) e coluna (Aj). Custo: 3·Nz = ${3 * Nz}. A disposição dos coeficientes em An pode ser qualquer, bastando ajustar Ai e Aj de acordo.`;
        break;
      }
      case 'csr': {
        const { An, Ac, Al, Nz, n } = g.getCSR();
        text = `An = [${An.join(', ')}]\nAc = [${Ac.join(', ')}]\nAl = [${Al.join(', ')}]`;
        desc = `Compressed Sparse Row (CSR). Coeficientes não nulos dispostos linha a linha em An. Ac contém os índices das colunas. Al[i] indica o início da linha i em Ac, e Al[n+1] = Al[1] + Nz. |An| = |Ac| = Nz = ${Nz}, |Al| = n+1 = ${n + 1}. Custo: 2·Nz + n+1 = ${2 * Nz + n + 1}.`;
        break;
      }
      case 'skyline': {
        const { An, Ai, n, profile } = g.getSkyline();
        text = `An = [${An.join(', ')}]\nAi = [${Ai.join(', ')}]`;
        desc = `Formato Skyline (SSS). Para matrizes simétricas: armazena a diagonal principal e o envelope. O vetor An contém os elementos do envelope linha a linha (do primeiro não-nulo até a diagonal). Ai[i] aponta para a posição da diagonal da i-ésima linha em An. |An| = profile + n = ${An.length}, profile = ${profile}. Vantagem: fill-in recai somente no envelope durante decomposições como Cholesky.`;
        break;
      }
      case 'csrsss': {
        const { Ad, An, Ac, Al, n, numEdges } = g.getCSRSSS();
        text = `Ad = [${Ad.join(', ')}]\nAn = [${An.join(', ')}]\nAc = [${Ac.join(', ')}]\nAl = [${Al.join(', ')}]`;
        desc = `CSR-SSS: para matrizes simétricas, armazena a diagonal (Ad) separadamente e os coeficientes não nulos da triangular inferior linha a linha (An), com colunas (Ac) e ponteiros de linha (Al). |Ad| = n = ${n}, |An| = |Ac| = |A| = ${numEdges}, |Al| = n+1 = ${n + 1}. Custo: 2|A|+2|V|+1 = ${2 * numEdges + 2 * n + 1}. Comparação: listas de adjacências custam 2|A|+|V|+1.`;
        break;
      }
      case 'edgeList': {
        const el = g.getEdgeList();
        text = el.map((e) => `(${e.source}, ${e.target}, peso=${e.weight})`).join('\n');
        desc =
          'Lista de todas as arestas. Espaço O(E). Usada pelo algoritmo de Kruskal (após ordenação por peso).';
        break;
      }
    }

    return { text, desc };
  }, [reprFormat, buildGraph]);

  return (
    <>
      <Section title="Sobre o Formato">
        <div className="info-card text-xs text-slate-400 leading-relaxed">
          {content.desc || 'Selecione um formato no painel esquerdo.'}
        </div>
      </Section>

      <Section title="Representação">
        <pre className="info-card text-xs font-mono text-slate-300 whitespace-pre overflow-x-auto max-h-96">
          {content.text || '—'}
        </pre>
      </Section>
    </>
  );
}

const STAT_GLOWS = {
  'text-cyan-400':    'rgba(34, 211, 238, 0.15)',
  'text-violet-400':  'rgba(167, 139, 250, 0.15)',
  'text-emerald-400': 'rgba(52, 211, 153, 0.15)',
  'text-amber-400':   'rgba(251, 191, 36, 0.15)',
  'text-rose-400':    'rgba(251, 113, 133, 0.15)',
};

function StatBox({ label, value, color = 'text-white' }) {
  const glow = STAT_GLOWS[color] || 'rgba(255,255,255,0.06)';
  return (
    <div
      className="stat-box flex-1 group"
      style={{ background: `radial-gradient(ellipse 80% 60% at 50% 110%, ${glow} 0%, var(--surface) 70%)` }}
    >
      <span className={`text-xl font-black font-mono ${color}`}>{value}</span>
      <span className="text-[0.58rem] uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}
