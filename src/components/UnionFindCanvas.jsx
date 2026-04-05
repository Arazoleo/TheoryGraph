import { useMemo } from 'react';

export default function UnionFindCanvas({ uf, highlightedNodes = new Set() }) {
  const layout = useMemo(() => {
    if (!uf || uf.parent.size === 0) return { trees: [], width: 0, height: 0 };

    const components = uf.getComponents();
    const trees = [];
    let offsetX = 60;
    const nodeSpacing = 60;
    const levelHeight = 70;

    for (const [root, members] of components) {
      const children = new Map();
      for (const m of members) {
        children.set(m, []);
      }
      for (const m of members) {
        const p = uf.parent.get(m);
        if (p !== m && children.has(p)) {
          children.get(p).push(m);
        }
      }

      const positions = new Map();
      const queue = [{ node: root, depth: 0 }];
      const levels = new Map();

      while (queue.length > 0) {
        const { node, depth } = queue.shift();
        if (!levels.has(depth)) levels.set(depth, []);
        levels.get(depth).push(node);
        for (const child of children.get(node) || []) {
          queue.push({ node: child, depth: depth + 1 });
        }
      }

      const maxLevel = Math.max(...levels.keys(), 0);
      const maxLevelWidth = Math.max(...Array.from(levels.values()).map((l) => l.length));
      const treeWidth = Math.max(maxLevelWidth * nodeSpacing, nodeSpacing);

      for (const [depth, nodesAtLevel] of levels) {
        const levelWidth = nodesAtLevel.length * nodeSpacing;
        const startX = offsetX + (treeWidth - levelWidth) / 2 + nodeSpacing / 2;
        nodesAtLevel.forEach((node, i) => {
          positions.set(node, {
            x: startX + i * nodeSpacing,
            y: 50 + depth * levelHeight,
          });
        });
      }

      const edges = [];
      for (const m of members) {
        const p = uf.parent.get(m);
        if (p !== m) {
          edges.push({ child: m, parent: p });
        }
      }

      trees.push({ root, members, positions, edges, offsetX, width: treeWidth });
      offsetX += treeWidth + 40;
    }

    const totalWidth = Math.max(offsetX, 400);
    const maxDepth = Math.max(
      ...Array.from(trees.flatMap((t) => Array.from(t.positions.values()).map((p) => p.y))),
      100
    );

    return { trees, width: totalWidth, height: maxDepth + 80 };
  }, [uf]);

  if (!uf || uf.parent.size === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        Crie um grafo na aba Editor. Os vértices serão usados como elementos do Union-Find.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <svg
        width={layout.width}
        height={layout.height}
        className="mx-auto"
      >
        <defs>
          <filter id="uf-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feFlood floodColor="#8b5cf6" floodOpacity="0.4" result="c" />
            <feComposite in="c" in2="b" operator="in" result="s" />
            <feMerge>
              <feMergeNode in="s" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="uf-arrow" viewBox="0 0 10 10" refX="5" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
          </marker>
        </defs>

        {layout.trees.map((tree) => (
          <g key={`tree-${tree.root}`}>
            {/* Tree edges */}
            {tree.edges.map(({ child, parent }) => {
              const cp = tree.positions.get(child);
              const pp = tree.positions.get(parent);
              if (!cp || !pp) return null;
              return (
                <line
                  key={`uf-e-${child}-${parent}`}
                  x1={cp.x} y1={cp.y - 16}
                  x2={pp.x} y2={pp.y + 16}
                  stroke="#475569"
                  strokeWidth={1.5}
                  markerEnd="url(#uf-arrow)"
                />
              );
            })}

            {/* Tree nodes */}
            {tree.members.map((m) => {
              const pos = tree.positions.get(m);
              if (!pos) return null;
              const isRoot = m === tree.root;
              const isHighlighted = highlightedNodes.has(m);
              const rank = uf.rank.get(m);

              return (
                <g key={`uf-n-${m}`}>
                  <circle
                    cx={pos.x} cy={pos.y} r={18}
                    fill={isRoot ? '#1e1b4b' : '#0f172a'}
                    stroke={isHighlighted ? '#8b5cf6' : isRoot ? '#7c3aed' : '#334155'}
                    strokeWidth={isRoot ? 2.5 : 1.5}
                    filter={isHighlighted ? 'url(#uf-glow)' : ''}
                  />
                  <text
                    x={pos.x} y={pos.y + 4}
                    textAnchor="middle"
                    fill={isRoot ? '#c4b5fd' : '#94a3b8'}
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="var(--font-sans)"
                  >
                    {m}
                  </text>
                  {isRoot && (
                    <text
                      x={pos.x} y={pos.y - 26}
                      textAnchor="middle"
                      fill="#7c3aed"
                      fontSize="9"
                      fontWeight="600"
                      fontFamily="var(--font-mono)"
                    >
                      raiz (rank {rank})
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
