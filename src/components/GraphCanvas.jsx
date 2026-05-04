import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

const NODE_RADIUS = 22;

export default function GraphCanvas({
  nodes,
  edges,
  tool,
  highlights = {},
  selectedNode,
  onAddNode,
  onMoveNode,
  onEdgeCreated,
  onDeleteNode,
  onDeleteEdge,
  onSelectNode,
  weighted = true,
  interactive = true,
}) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [edgeStart, setEdgeStart] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  const getSvgPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const isRemoved = (nodeId) => highlights.removedNodes?.has(nodeId);

  const getNodeFill = (nodeId) => {
    if (isRemoved(nodeId)) return 'url(#grad-removed)';
    if (highlights.redNodes?.has(nodeId)) return 'url(#grad-rose)';
    if (highlights.blueNodes?.has(nodeId)) return 'url(#grad-violet)';
    if (highlights.mstNodes?.has(nodeId)) return 'url(#grad-green)';
    if (nodeId === selectedNode || nodeId === edgeStart) return 'url(#grad-cyan)';
    return 'url(#grad-default)';
  };

  const getNodeStroke = (nodeId) => {
    if (isRemoved(nodeId)) return '#1e293b';
    if (highlights.redNodes?.has(nodeId)) return '#fb7185';
    if (highlights.blueNodes?.has(nodeId)) return '#a78bfa';
    if (highlights.mstNodes?.has(nodeId)) return '#34d399';
    if (nodeId === selectedNode || nodeId === edgeStart) return '#22d3ee';
    if (nodeId === hoveredNode) return '#94a3b8';
    return '#475569';
  };

  const getNodeFilter = (nodeId) => {
    if (isRemoved(nodeId)) return '';
    if (highlights.redNodes?.has(nodeId)) return 'url(#glow-rose)';
    if (highlights.blueNodes?.has(nodeId)) return 'url(#glow-violet)';
    if (highlights.mstNodes?.has(nodeId)) return 'url(#glow-green)';
    if (nodeId === selectedNode || nodeId === edgeStart) return 'url(#glow-cyan)';
    return '';
  };

  const isRemovedEdge = (edge) =>
    highlights.removedNodes?.has(edge.source) || highlights.removedNodes?.has(edge.target);

  const getEdgeColor = (edgeId, edge) => {
    if (isRemovedEdge(edge)) return '#0f172a';
    if (highlights.augmentingPath?.has(edgeId)) return '#fbbf24';
    if (highlights.rejectedEdge === edgeId) return '#f87171';
    if (highlights.currentEdge === edgeId) return '#fbbf24';
    if (highlights.mstEdges?.has(edgeId)) return '#34d399';
    if (highlights.candidateEdges?.has(edgeId)) return '#22d3ee';
    return '#334155';
  };

  const getEdgeWidth = (edgeId, edge) => {
    if (isRemovedEdge(edge)) return 0.8;
    if (highlights.augmentingPath?.has(edgeId)) return 3.5;
    if (highlights.mstEdges?.has(edgeId)) return 3;
    if (highlights.currentEdge === edgeId) return 3;
    if (highlights.candidateEdges?.has(edgeId)) return 2;
    return 1.5;
  };

  const getEdgeFilter = (edgeId, edge) => {
    if (isRemovedEdge(edge)) return '';
    if (highlights.augmentingPath?.has(edgeId)) return 'url(#glow-amber)';
    if (highlights.mstEdges?.has(edgeId)) return 'url(#glow-green)';
    if (highlights.currentEdge === edgeId) return 'url(#glow-amber)';
    if (highlights.rejectedEdge === edgeId) return 'url(#glow-red)';
    return '';
  };

  const handleSvgMouseDown = (e) => {
    if (!interactive) return;
    if (e.target.closest('.graph-node')) return;
    if (tool === 'addNode') {
      const pt = getSvgPoint(e);
      onAddNode?.(pt.x, pt.y);
    } else {
      onSelectNode?.(null);
      setEdgeStart(null);
    }
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    if (!interactive) return;
    if (tool === 'select') {
      onSelectNode?.(nodeId);
      const pt = getSvgPoint(e);
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setDragging(nodeId);
        setDragOffset({ x: pt.x - node.x, y: pt.y - node.y });
      }
    } else if (tool === 'addEdge') {
      if (edgeStart === null) {
        setEdgeStart(nodeId);
      } else if (edgeStart !== nodeId) {
        onEdgeCreated?.(edgeStart, nodeId);
        setEdgeStart(null);
      }
    } else if (tool === 'delete') {
      onDeleteNode?.(nodeId);
    }
  };

  const handleEdgeClick = (e, edgeId) => {
    e.stopPropagation();
    if (!interactive || tool !== 'delete') return;
    onDeleteEdge?.(edgeId);
  };

  const handleMouseMove = (e) => {
    const pt = getSvgPoint(e);
    setMousePos(pt);
    if (dragging !== null && interactive) {
      onMoveNode?.(dragging, pt.x - dragOffset.x, pt.y - dragOffset.y);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const getCursor = () => {
    if (!interactive) return 'default';
    if (tool === 'addNode') return 'crosshair';
    if (tool === 'delete') return 'pointer';
    if (dragging !== null) return 'grabbing';
    return 'default';
  };

  return (
    <svg
      ref={svgRef}
      className="w-full h-full select-none"
      onMouseDown={handleSvgMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: getCursor() }}
    >
      <defs>
        <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feFlood floodColor="#34d399" floodOpacity="0.5" result="c" />
          <feComposite in="c" in2="b" operator="in" result="s" />
          <feMerge>
            <feMergeNode in="s" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feFlood floodColor="#22d3ee" floodOpacity="0.5" result="c" />
          <feComposite in="c" in2="b" operator="in" result="s" />
          <feMerge>
            <feMergeNode in="s" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feFlood floodColor="#fbbf24" floodOpacity="0.6" result="c" />
          <feComposite in="c" in2="b" operator="in" result="s" />
          <feMerge>
            <feMergeNode in="s" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feFlood floodColor="#f87171" floodOpacity="0.5" result="c" />
          <feComposite in="c" in2="b" operator="in" result="s" />
          <feMerge>
            <feMergeNode in="s" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="grad-default" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>
        <radialGradient id="grad-green" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#10b981" />
        </radialGradient>
        <radialGradient id="grad-cyan" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#06b6d4" />
        </radialGradient>
        <radialGradient id="grad-amber" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id="grad-rose" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="100%" stopColor="#f43f5e" />
        </radialGradient>
        <radialGradient id="grad-violet" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
        <filter id="glow-rose" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feFlood floodColor="#fb7185" floodOpacity="0.5" result="c" />
          <feComposite in="c" in2="b" operator="in" result="s" />
          <feMerge><feMergeNode in="s" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="grad-removed" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
        <filter id="glow-violet" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feFlood floodColor="#a78bfa" floodOpacity="0.5" result="c" />
          <feComposite in="c" in2="b" operator="in" result="s" />
          <feMerge><feMergeNode in="s" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="0.6" fill="rgba(255,255,255,0.04)" />
        </pattern>
      </defs>

      <rect className="bg-layer" width="100%" height="100%" fill="#050510" />
      <rect width="100%" height="100%" fill="url(#dotgrid)" />

      {/* Edges */}
      {edges.map((edge) => {
        const src = nodes.find((n) => n.id === edge.source);
        const tgt = nodes.find((n) => n.id === edge.target);
        if (!src || !tgt) return null;
        const color = getEdgeColor(edge.id, edge);
        const width = getEdgeWidth(edge.id, edge);
        const filter = getEdgeFilter(edge.id, edge);
        const isCand = highlights.candidateEdges?.has(edge.id);
        const isRejected = highlights.rejectedEdge === edge.id;
        const isCurrent = highlights.currentEdge === edge.id;
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;

        return (
          <g key={`e-${edge.id}`}>
            <line
              x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke={color}
              strokeWidth={width}
              strokeLinecap="round"
              filter={filter}
              strokeDasharray={isCand && !highlights.mstEdges?.has(edge.id) ? '8 4' : 'none'}
              className={isCand && !highlights.mstEdges?.has(edge.id) ? 'animate-edge-march' : ''}
              style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
            />
            {/* Hit area */}
            <line
              x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke="transparent" strokeWidth={14}
              style={{ cursor: interactive && tool === 'delete' ? 'pointer' : 'default' }}
              onClick={(e) => handleEdgeClick(e, edge.id)}
            />
            {weighted && (
              <g className={isRejected ? 'animate-pulse-glow' : isCurrent ? 'animate-pulse-glow' : ''}>
                <rect
                  x={midX - 14} y={midY - 11}
                  width={28} height={22}
                  rx={6}
                  fill="#0c0c20"
                  stroke={color}
                  strokeWidth={highlights.mstEdges?.has(edge.id) || isCurrent || isRejected ? 1 : 0.5}
                  opacity={0.95}
                />
                <text
                  x={midX} y={midY + 4}
                  textAnchor="middle"
                  fill={highlights.mstEdges?.has(edge.id) || isCurrent || isRejected || isCand ? color : '#94a3b8'}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="var(--font-mono)"
                >
                  {edge.weight}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Temp edge being drawn */}
      {edgeStart !== null && mousePos && (() => {
        const startNode = nodes.find((n) => n.id === edgeStart);
        if (!startNode) return null;
        return (
          <line
            x1={startNode.x} y1={startNode.y}
            x2={mousePos.x} y2={mousePos.y}
            stroke="#22d3ee" strokeWidth={2}
            strokeDasharray="6 4" opacity={0.5}
            pointerEvents="none"
          />
        );
      })()}

      {/* Nodes */}
      {nodes.map((node) => {
        const fill = getNodeFill(node.id);
        const stroke = getNodeStroke(node.id);
        const filter = getNodeFilter(node.id);
        const removed = isRemoved(node.id);
        const isHighlighted = !removed && (highlights.mstNodes?.has(node.id) || highlights.redNodes?.has(node.id) || highlights.blueNodes?.has(node.id) || node.id === selectedNode || node.id === edgeStart);

        return (
          <g
            key={`n-${node.id}`}
            className="graph-node"
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            style={{
              cursor: !interactive
                ? 'default'
                : tool === 'select'
                ? dragging === node.id ? 'grabbing' : 'grab'
                : 'pointer',
              opacity: removed ? 0.2 : 1,
            }}
          >
            <circle
              cx={node.x} cy={node.y}
              r={NODE_RADIUS}
              fill={fill}
              stroke={stroke}
              strokeWidth={isHighlighted ? 2.5 : 1.5}
              filter={filter}
            />
            <text
              x={node.x} y={node.y + 5}
              textAnchor="middle"
              fill="white"
              fontSize="13"
              fontWeight="700"
              fontFamily="var(--font-sans)"
              pointerEvents="none"
            >
              {node.label}
            </text>
          </g>
        );
      })}

      {/* Empty state */}
      {nodes.length === 0 && (
        <text
          x="50%" y="50%"
          textAnchor="middle"
          fill="#334155"
          fontSize="15"
          fontFamily="var(--font-sans)"
          pointerEvents="none"
        >
          {interactive
            ? 'Clique no canvas para adicionar vértices'
            : 'Crie um grafo na aba Editor primeiro'}
        </text>
      )}
    </svg>
  );
}
