import React, { useRef, useEffect, useState } from 'react';
import interact from 'interactjs';
import { 
  LadderState, 
  LadderNode, 
  NODE_WIDTH, 
  NODE_HEIGHT, 
  LEFT_RAIL_X, 
  RIGHT_RAIL_X, 
  GRID_SIZE,
  RUNG_HEIGHT,
  NodeType
} from '../types';
import { clsx } from 'clsx';
import { Trash2, Edit2 } from 'lucide-react';

interface LadderCanvasProps {
  state: LadderState;
  selectedId: string | null;
  viewport: { x: number; y: number; zoom: number };
  placementType: NodeType | 'wire' | null;
  onSelect: (id: string | null) => void;
  onUpdateNode: (id: string, updates: Partial<LadderNode>) => void;
  onToggleAddress: (address: string) => void;
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
  onCanvasClick: (x: number, y: number) => void;
  onNodeDoubleClick: (id: string) => void;
  onRungAction?: (rungIndex: number, action: 'delete' | 'edit-comment') => void;
  onAddWire?: (fromId: string, fromSide: 'left' | 'right', toId: string, toSide: 'left' | 'right') => void;
  onDeleteWire?: (id: string) => void;
}

// Memoized Node Component for performance
const MemoizedLadderNode = React.memo<{
  node: LadderNode;
  selected: boolean;
  simulationValue: any;
  placementType: string | null;
  wiringState: { fromId: string; fromSide: 'left' | 'right' } | null;
  onSelect: (id: string) => void;
  onToggle: (addr: string) => void;
  onDoubleClick: (id: string) => void;
  onTerminalClick: (id: string, side: 'left' | 'right', x: number, y: number) => void;
  renderSymbol: (node: LadderNode) => React.ReactNode;
}>(({ 
  node, 
  selected, 
  simulationValue, 
  placementType, 
  wiringState, 
  onSelect, 
  onToggle, 
  onDoubleClick, 
  onTerminalClick,
  renderSymbol 
}) => {
  const isEnergized = Boolean(simulationValue);
  let isConducting = isEnergized;
  if (node.type === 'contact-nc') isConducting = !isEnergized;

  return (
    <g 
      data-id={node.id}
      className={clsx(
        "ladder-node-g pointer-events-auto cursor-grab group",
        selected && "selected"
      )}
      transform={`translate(${node.x}, ${node.y})`}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (node.type.startsWith('contact')) {
          onToggle(node.address);
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(node.id);
      }}
    >
      {/* Selection Box */}
      {selected && (
        <rect 
          x={-4} 
          y={-4} 
          width={node.width + 8} 
          height={node.height + 8} 
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth={2} 
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      <g 
        className={clsx(
          "symbol-group transition-colors duration-100",
          isConducting ? "text-green-600" : "text-black"
        )}
        filter={isConducting ? "url(#energized)" : undefined}
      >
        <rect width={node.width} height={node.height} fill="white" fillOpacity={1} />
        {renderSymbol(node)}
        
        {/* Labels */}
        {node.type !== 'wire-junction' && (
          <text 
            y={-12} 
            x={node.width / 2} 
            textAnchor="middle" 
            className="text-[10px] font-mono fill-blue-700 font-bold"
          >
            {node.address}
          </text>
        )}
        
        {node.tag && node.type !== 'wire-junction' && (
          <g transform={`translate(${node.width/2}, -32)`}>
            <rect x={-30} y={0} width={60} height={14} fill="#fffbeb" stroke="#fef3c7" strokeWidth={0.5} />
            <text 
              y={10} 
              textAnchor="middle" 
              className="text-[8px] font-mono fill-zinc-600 italic font-medium"
            >
              {node.tag}
            </text>
          </g>
        )}
      </g>

      {/* Interaction Overlay */}
      <rect 
        width={node.width} 
        height={node.height} 
        fill="transparent" 
        className="cursor-move"
      />

      {/* Terminals (Ports) */}
      <g className={clsx(
        "transition-opacity duration-200",
        placementType === 'wire' ? "opacity-100" : "opacity-0 group-hover:opacity-100 shadow-xl"
      )}>
        {/* Terminal Left */}
        <circle 
          cx={0} 
          cy={node.height / 2} 
          r={placementType === 'wire' ? 14 : 6} 
          fill={wiringState?.fromId === node.id && wiringState?.fromSide === 'left' ? "#ef4444" : (placementType === 'wire' ? "#3b82f6" : "transparent")} 
          stroke={placementType === 'wire' ? "white" : "transparent"}
          strokeWidth={2}
          fillOpacity={placementType === 'wire' ? 0.9 : 0}
          className={clsx("terminal-pin pointer-events-auto cursor-crosshair transition-all", placementType === 'wire' && "animate-pulse")}
          onMouseDown={(e) => {
            e.stopPropagation();
            onTerminalClick(node.id, 'left', node.x, node.y + node.height / 2);
          }}
        />
        {/* Terminal Right */}
        <circle 
          cx={node.width} 
          cy={node.height / 2} 
          r={placementType === 'wire' ? 14 : 6} 
          fill={wiringState?.fromId === node.id && wiringState?.fromSide === 'right' ? "#ef4444" : (placementType === 'wire' ? "#3b82f6" : "transparent")} 
          stroke={placementType === 'wire' ? "white" : "transparent"}
          strokeWidth={2}
          fillOpacity={placementType === 'wire' ? 0.9 : 0}
          className={clsx("terminal-pin pointer-events-auto cursor-crosshair transition-all", placementType === 'wire' && "animate-pulse")}
          onMouseDown={(e) => {
            e.stopPropagation();
            onTerminalClick(node.id, 'right', node.x + node.width, node.y + node.height / 2);
          }}
        />
      </g>
    </g>
  );
});

export function LadderCanvas({ 
  state, 
  selectedId, 
  viewport, 
  placementType,
  onSelect, 
  onUpdateNode, 
  onToggleAddress,
  onViewportChange,
  onCanvasClick,
  onNodeDoubleClick,
  onRungAction,
  onAddWire,
  onDeleteWire
}: LadderCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const ghostRef = useRef<SVGGElement>(null);
  const wiringPreviewRef = useRef<SVGPathElement>(null);
  const vGuideRef = useRef<SVGLineElement>(null);
  const hGuideRef = useRef<SVGLineElement>(null);
  const [wiringState, setWiringState] = useState<{fromId: string; fromSide: 'left' | 'right'; x: number; y: number} | null>(null);

  const viewportRef = useRef(viewport);
  const stateRef = useRef(state);
  const placementTypeRef = useRef(placementType);
  const wiringStateRef = useRef(wiringState);

  useEffect(() => {
    viewportRef.current = viewport;
    stateRef.current = state;
    placementTypeRef.current = placementType;
    wiringStateRef.current = wiringState;
  }, [viewport, state, placementType, wiringState]);

  // Performance: Memoize nodes grouped by rung
  const nodesByRung = React.useMemo(() => {
    const rungs: Record<number, LadderNode[]> = {};
    state.nodes.forEach(node => {
      const rungIdx = Math.round((node.y + node.height / 2 - RUNG_HEIGHT / 2) / RUNG_HEIGHT);
      if (!rungs[rungIdx]) rungs[rungIdx] = [];
      rungs[rungIdx].push(node);
    });
    return rungs;
  }, [state.nodes]);

  // Initialize interactjs for dragging
  useEffect(() => {
    const interactable = interact('.ladder-node-g');
    
    interactable.draggable({
      inertia: false,
      autoScroll: true,
      listeners: {
        move(event) {
          if (placementTypeRef.current === 'wire') return;

          const id = event.target.dataset.id;
          if (!id) return;

          const { zoom } = viewportRef.current;
          
          // Accumulate raw movement
          const currentDx = parseFloat(event.target.getAttribute('data-raw-dx')) || 0;
          const currentDy = parseFloat(event.target.getAttribute('data-raw-dy')) || 0;
          
          const nextDx = currentDx + event.dx / zoom;
          const nextDy = currentDy + event.dy / zoom;

          event.target.setAttribute('data-raw-dx', nextDx.toString());
          event.target.setAttribute('data-raw-dy', nextDy.toString());

          // Visually snap to grid while dragging
          const snappedDx = Math.round(nextDx / GRID_SIZE) * GRID_SIZE;
          const snappedDy = Math.round(nextDy / GRID_SIZE) * GRID_SIZE;
          
          if (snappedDx !== 0 || snappedDy !== 0) {
            event.target.style.transform = `translate(${snappedDx}px, ${snappedDy}px)`;
          }
        },
        end(event) {
          const id = event.target.dataset.id;
          if (!id) return;

          const dx = parseFloat(event.target.getAttribute('data-raw-dx')) || 0;
          const dy = parseFloat(event.target.getAttribute('data-raw-dy')) || 0;

          // Reset attributes and transform for standard React render
          event.target.setAttribute('data-raw-dx', '0');
          event.target.setAttribute('data-raw-dy', '0');
          event.target.style.transform = '';

          const node = stateRef.current.nodes.find(n => n.id === id);
          if (node) {
            onUpdateNode(id, { 
              x: Math.round((node.x + dx) / GRID_SIZE) * GRID_SIZE, 
              y: Math.round((node.y + dy) / GRID_SIZE) * GRID_SIZE
            });
          }
        }
      }
    });

    return () => {
      interactable.unset();
    };
  }, [onUpdateNode]); 

  // Panning logic - improved for reliability
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking the background background
    const target = e.target as HTMLElement;
    if (target.closest('.ladder-node-g')) return;
    
    // Middle click OR Left click with no placement mode
    if (e.button !== 1 && e.button !== 0) return;
    if (e.button === 0 && placementType) return; // Don't pan if placing

    const startX = e.clientX - viewport.x;
    const startY = e.clientY - viewport.y;
    let hasMoved = false;

    const handleMouseMove = (mv: MouseEvent) => {
      if (Math.abs(mv.clientX - (startX + viewport.x)) > 5 || Math.abs(mv.clientY - (startY + viewport.y)) > 5) {
        hasMoved = true;
      }
      onViewportChange({
        ...viewport,
        x: mv.clientX - startX,
        y: mv.clientY - startY
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      onViewportChange({
        ...viewport,
        zoom: Math.max(0.2, Math.min(3, viewport.zoom * delta))
      });
    }
  };

  const renderNodeSymbol = (node: LadderNode) => {
    const isEnergized = state.simulation.values[node.address];
    const isNC = node.type === 'contact-nc';
    
    // Industrial Symbols (Apple Refinement)
    if (node.type.startsWith('contact')) {
      return (
        <g className="symbol-contact">
          <line x1={0} y1={24} x2={34} y2={24} stroke="currentColor" strokeWidth={2.5} />
          <line x1={36} y1={10} x2={36} y2={38} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={60} y1={10} x2={60} y2={38} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={62} y1={24} x2={96} y2={24} stroke="currentColor" strokeWidth={2.5} />
          {isNC && (
            <line x1={36} y1={38} x2={60} y2={10} stroke="currentColor" strokeWidth={2.5} />
          )}
        </g>
      );
    }
    
    if (node.type === 'coil' || node.type === 'coil-latch' || node.type === 'coil-unlatch') {
      const isLatch = node.type === 'coil-latch';
      const isUnlatch = node.type === 'coil-unlatch';
      return (
        <g className="symbol-coil">
          <line x1={0} y1={24} x2={36} y2={24} stroke="currentColor" strokeWidth={2.5} />
          <path d="M 36 10 Q 28 24 36 38" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          <path d="M 60 10 Q 68 24 60 38" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={60} y1={24} x2={96} y2={24} stroke="currentColor" strokeWidth={2.5} />
          {isLatch && <text x={48} y={28} textAnchor="middle" fontSize={14} fontWeight="900" fill="currentColor" className="font-sans">L</text>}
          {isUnlatch && <text x={48} y={28} textAnchor="middle" fontSize={14} fontWeight="900" fill="currentColor" className="font-sans">U</text>}
        </g>
      );
    }

    if (node.type === 'one-shot') {
      return (
        <g className="symbol-ons">
           <line x1={0} y1={24} x2={96} y2={24} stroke="currentColor" strokeWidth={1} />
           <rect x={24} y={12} width={48} height={24} fill="white" stroke="currentColor" strokeWidth={2} />
           <text x={48} y={28} textAnchor="middle" fontSize={8} fontWeight="black" fill="currentColor" className="font-mono">ONS</text>
        </g>
      );
    }

    if (node.type.startsWith('timer') || node.type.startsWith('counter') || node.type === 'reset' || node.type.startsWith('compare') || node.type.startsWith('math')) {
       const accum = state.simulation.values[`${node.address}_ACC`] || 0;
       const dnVal = state.simulation.values[`${node.address}_DN`];
       
       let label = '???';
       if (node.type === 'timer-on') label = 'TON';
       else if (node.type === 'timer-off') label = 'TOF';
       else if (node.type === 'retentive-timer') label = 'RTO';
       else if (node.type === 'counter-up') label = 'CTU';
       else if (node.type === 'counter-down') label = 'CTD';
       else if (node.type === 'reset') label = 'RES';
       else if (node.type === 'compare-eq') label = 'EQU';
       else if (node.type === 'compare-ne') label = 'NEQ';
       else if (node.type === 'compare-lt') label = 'LES';
       else if (node.type === 'compare-gt') label = 'GRT';
       else if (node.type === 'math-add') label = 'ADD';
       else if (node.type === 'math-sub') label = 'SUB';
       else if (node.type === 'math-mul') label = 'MUL';
       else if (node.type === 'math-div') label = 'DIV';
       else if (node.type === 'math-mov') label = 'MOV';

       const isCompare = node.type.startsWith('compare');
       const isMath = node.type.startsWith('math');
       const isTimer = node.type.startsWith('timer');
       const isCounter = node.type.startsWith('counter');

       return (
         <g className="symbol-block">
            <rect x={12} y={4} width={72} height={40} rx={2} stroke="currentColor" strokeWidth={1.5} fill="white" />
            <text x={48} y={14} textAnchor="middle" fontSize={7} fill="currentColor" fontWeight="900" className="tracking-tighter">
              {label}
            </text>
            
            {(isTimer || isCounter) && (
              <>
                <text x={20} y={24} textAnchor="start" fontSize={6} fill="currentColor" opacity={0.6} className="font-mono">
                  PRE:
                </text>
                <text x={76} y={24} textAnchor="end" fontSize={6} fill="currentColor" className="font-mono font-bold">
                  {node.params?.preset || 0}
                </text>
                <text x={20} y={34} textAnchor="start" fontSize={6} fill="currentColor" opacity={0.6} className="font-mono">
                  ACC:
                </text>
                <text x={76} y={34} textAnchor="end" fontSize={6} fill="currentColor" className={clsx("font-mono font-bold", dnVal && "text-blue-600")}>
                  {isTimer ? (Number(accum)/1000).toFixed(1) : accum}
                </text>
                <rect x={74} y={6} width={8} height={8} rx={1} fill={dnVal ? "#22c55e" : "#f4f4f5"} stroke={dnVal ? "#16a34a" : "#d1d5db"} strokeWidth={0.5} />
                <text x={71} y={12} textAnchor="end" fontSize={5} fill={dnVal ? "#16a34a" : "#94a3b8"} fontWeight="bold">DN</text>
              </>
            )}

            {(isCompare || isMath) && (
              <>
                <text x={20} y={24} textAnchor="start" fontSize={5} fill="currentColor" opacity={0.6} className="font-mono">
                  Src A:
                </text>
                <text x={76} y={24} textAnchor="end" fontSize={5} fill="currentColor" className="font-mono font-bold">
                  {node.params?.sourceA || 0}
                </text>
                <text x={20} y={32} textAnchor="start" fontSize={5} fill="currentColor" opacity={0.6} className="font-mono">
                  Src B:
                </text>
                <text x={76} y={32} textAnchor="end" fontSize={5} fill="currentColor" className="font-mono font-bold">
                  {node.params?.sourceB || 0}
                </text>
                {isMath && (
                  <>
                    <text x={20} y={40} textAnchor="start" fontSize={5} fill="currentColor" opacity={0.6} className="font-mono">
                      Dest:
                    </text>
                    <text x={76} y={40} textAnchor="end" fontSize={5} fill="currentColor" className="font-mono font-bold">
                      {node.params?.dest || node.address}
                    </text>
                  </>
                )}
              </>
            )}

            <line x1={0} y1={24} x2={12} y2={24} stroke="currentColor" strokeWidth={1.5} />
            <line x1={84} y1={24} x2={96} y2={24} stroke="currentColor" strokeWidth={1.5} />
         </g>
       );
    }

    if (node.type === 'branch-start' || node.type === 'branch-end' || node.type === 'wire-vertical' || node.type === 'wire-junction') {
      return (
        <g className="symbol-wire">
          {node.type === 'branch-start' && (
            <>
              <line x1={0} y1={node.height/2} x2={node.width} y2={node.height/2} stroke="currentColor" strokeWidth={2.5} />
              <line x1={24} y1={node.height/2} x2={24} y2={RUNG_HEIGHT} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
            </>
          )}
          {node.type === 'branch-end' && (
            <>
              <line x1={0} y1={node.height/2} x2={node.width} y2={node.height/2} stroke="currentColor" strokeWidth={2.5} />
              <line x1={node.width - 24} y1={node.height/2} x2={node.width - 24} y2={RUNG_HEIGHT} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
            </>
          )}
          {node.type === 'wire-vertical' && (
            <line x1={node.width/2} y1={-RUNG_HEIGHT/2} x2={node.width/2} y2={RUNG_HEIGHT/2} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          )}
          {node.type === 'wire-junction' && (
             <circle cx={node.width/2} cy={node.height/2} r={4} fill="currentColor" />
          )}
        </g>
      );
    }

    return <rect width={node.width} height={node.height} fill="none" stroke="currentColor" strokeDasharray="4 2" />;
  };

  const handleMouseMoveGlobal = (e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const { x: vX, y: vY, zoom } = viewportRef.current;
    const rawX = (e.clientX - rect.left - vX) / zoom;
    const rawY = (e.clientY - rect.top - vY) / zoom;

    const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round((rawY - RUNG_HEIGHT / 2) / RUNG_HEIGHT) * RUNG_HEIGHT + (RUNG_HEIGHT / 2 - NODE_HEIGHT / 2);

    // Update Guides (Direct DOM)
    if (vGuideRef.current && hGuideRef.current) {
      const isPlacing = placementTypeRef.current;
      if (isPlacing) {
        vGuideRef.current.setAttribute('x1', snappedX.toString());
        vGuideRef.current.setAttribute('x2', snappedX.toString());
        vGuideRef.current.style.display = 'block';
        
        hGuideRef.current.setAttribute('y1', (snappedY + NODE_HEIGHT/2).toString());
        hGuideRef.current.setAttribute('y2', (snappedY + NODE_HEIGHT/2).toString());
        hGuideRef.current.style.display = 'block';
      } else {
        vGuideRef.current.style.display = 'none';
        hGuideRef.current.style.display = 'none';
      }
    }

    // Update Ghost (Direct DOM)
    if (ghostRef.current) {
      const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round((rawY - RUNG_HEIGHT / 2) / RUNG_HEIGHT) * RUNG_HEIGHT + (RUNG_HEIGHT / 2 - NODE_HEIGHT / 2);
      ghostRef.current.setAttribute('transform', `translate(${snappedX}, ${snappedY})`);
      ghostRef.current.style.display = placementTypeRef.current && placementTypeRef.current !== 'wire' ? 'block' : 'none';
    }

    // Update Wiring Preview (Direct DOM)
    if (wiringPreviewRef.current && wiringStateRef.current) {
      const sw = wiringStateRef.current;
      const midX = (sw.x + rawX) / 2;
      const d = `M ${sw.x} ${sw.y} L ${midX} ${sw.y} L ${midX} ${rawY} L ${rawX} ${rawY}`;
      wiringPreviewRef.current.setAttribute('d', d);
      wiringPreviewRef.current.style.display = 'block';
    } else if (wiringPreviewRef.current) {
      wiringPreviewRef.current.style.display = 'none';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Calculate canvas coordinates
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rawX = e.clientX - rect.left - viewport.x;
    const rawY = e.clientY - rect.top - viewport.y;
    const x = rawX / viewport.zoom;
    const y = rawY / viewport.zoom;

    // If we're currently dragging a wire, clicking background finishes it by creating a junction
    if (wiringState) {
      // Automatic junction creation and connection
      const junctionId = `junction-${Date.now()}`;
      const snappedX = Math.round(x / 8) * 8;
      const snappedY = Math.round(y / 8) * 8;
      
      onCanvasClick(x, y); // This creates the junction in App.tsx
      
      // Delay connection slightly to allow state to catch up, or better, 
      // just let the user click the junction pin.
      // But user wants "anywhere". Let's try to find if we clicked a rung.
      setWiringState(null);
      return;
    }

    // If it's a right click, it might be for context or panning, don't trigger click
    if (e.button !== 0) return;

    // Check if we clicked on an actual node or terminal
    const target = e.target as HTMLElement;
    if (target.closest('.ladder-node-g') || target.closest('.terminal-pin')) return;

    onCanvasClick(x, y);
  };

  const handleTerminalClick = (nodeId: string, side: 'left' | 'right', x: number, y: number) => {
    if (placementType !== 'wire') {
      onSelect(nodeId);
      return;
    }

    if (!wiringState) {
      setWiringState({ fromId: nodeId, fromSide: side, x, y });
    } else {
      if (wiringState.fromId === nodeId && wiringState.fromSide === side) {
        setWiringState(null); // Cancel
        return;
      }
      onAddWire?.(wiringState.fromId, wiringState.fromSide, nodeId, side);
      setWiringState(null);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={clsx(
        "w-full h-full select-none canvas-grid flex items-center justify-center bg-white transition-all",
        placementType ? "cursor-cell" : "cursor-grab active:cursor-grabbing"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMoveGlobal}
      onWheel={handleWheel}
      onClick={handleClick}
    >
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%"
        className="overflow-visible pointer-events-auto"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        <rect 
          x={-5000} 
          y={-5000} 
          width={10000} 
          height={20000} 
          fill="transparent" 
          className="pointer-events-auto cursor-grab"
        />
        <defs>
          <filter id="energized" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feFlood floodColor="#4ade80" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Power Rails */}
        <line x1={LEFT_RAIL_X} y1={-1000} x2={LEFT_RAIL_X} y2={15000} className={clsx("rail rail-left", state.simulation.isRunning && "energized-rail")} />
        <line x1={RIGHT_RAIL_X} y1={-1000} x2={RIGHT_RAIL_X} y2={15000} className="rail rail-right" />

        {/* Visual Guides / Rungs */}
        {Array.from({ length: 50 }).map((_, i) => {
          const comment = state.rungComments?.[i];
          const yBase = i * RUNG_HEIGHT;
          const yCenter = yBase + (RUNG_HEIGHT/2);
          
          return (
            <g key={i}>
              {/* Rung Interaction Handle */}
              <g 
                className="rung-handle opacity-0 hover:opacity-100 transition-opacity cursor-pointer pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onRungAction?.(i, 'delete');
                }}
              >
                 <rect x={LEFT_RAIL_X - 40} y={yCenter - 10} width={24} height={20} rx={4} fill="#fee2e2" />
                 <Trash2 x={LEFT_RAIL_X - 34} y={yCenter - 6} size={12} className="text-red-500" />
              </g>

              {comment && (
                <g transform={`translate(${LEFT_RAIL_X}, ${yBase})`}>
                  <rect x={0} y={4} width={RIGHT_RAIL_X - LEFT_RAIL_X} height={24} fill="#fffbeb" stroke="#fef3c7" strokeWidth={0.5} />
                  <text x={8} y={20} fontStyle="italic" className="text-[10px] fill-amber-700 font-bold uppercase tracking-tight">
                    {comment}
                  </text>
                  <g className="cursor-pointer pointer-events-auto" onClick={() => onRungAction?.(i, 'edit-comment')}>
                    <Edit2 x={RIGHT_RAIL_X - LEFT_RAIL_X - 20} y={8} size={10} className="text-amber-400" />
                  </g>
                </g>
              )}
              
              <line 
                x1={LEFT_RAIL_X} 
                y1={yCenter} 
                x2={RIGHT_RAIL_X} 
                y2={yCenter} 
                className={clsx(
                  "rung-line transition-all duration-300 pointer-events-auto cursor-crosshair",
                  placementType ? "opacity-60 stroke-blue-400 stroke-[3px]" : "opacity-30 stroke-black stroke-[1.5px]"
                )}
                onMouseDown={(e) => {
                  if (placementType !== 'wire') return;
                  e.stopPropagation();
                  const target = e.currentTarget as SVGLineElement;
                  const rect = target.getBoundingClientRect();
                  if (rect) {
                    const x = (e.clientX - rect.left) / viewport.zoom + LEFT_RAIL_X;
                    const y = yCenter;
                    onCanvasClick(x, y); 
                  }
                }}
              />
              <text 
                x={LEFT_RAIL_X - 16} 
                y={yCenter + 5} 
                textAnchor="end" 
                className="text-[12px] font-bold fill-zinc-300 select-none"
              >
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* Logic Continuity Background Lines (Memoized) */}
        {Object.entries(nodesByRung).map(([rungIdx, nodes]) => {
          const i = parseInt(rungIdx);
          const rungY = i * RUNG_HEIGHT + (RUNG_HEIGHT / 2);
          const activeNodes = nodes as LadderNode[];
          if (activeNodes.length === 0) return null;

          const sortedNodes = [...activeNodes].sort((a, b) => a.x - b.x);
          
          return (
            <g key={`rung-wires-${i}`}>
              {/* Rail to first node */}
              <line 
                x1={LEFT_RAIL_X} 
                y1={rungY} 
                x2={sortedNodes[0].x} 
                y2={rungY} 
                className={clsx(
                  "rung-line transition-all duration-300",
                  state.simulation.isRunning ? "opacity-100 stroke-blue-500 stroke-[3px]" : "opacity-40"
                )} 
              />
              
              {/* Node to node */}
              {sortedNodes.map((node, idx) => {
                const nextNode = sortedNodes[idx + 1];
                if (nextNode) {
                  const isEnergized = state.simulation.isRunning && state.simulation.values[node.address];
                  const isNC = node.type === 'contact-nc';
                  const isConducting = isEnergized; // simplify for now or use complex logic
                  
                  return (
                    <line 
                      key={`wire-${node.id}-${nextNode.id}`}
                      x1={node.x + node.width} 
                      y1={rungY} 
                      x2={nextNode.x} 
                      y2={rungY} 
                      className={clsx(
                        "rung-line transition-all duration-300",
                        isConducting ? "opacity-100 stroke-blue-500 stroke-[3px]" : "opacity-40"
                      )}
                    />
                  );
                }
                return null;
              })}
              
              {/* Last node to rail */}
              <line 
                x1={sortedNodes[sortedNodes.length - 1].x + sortedNodes[sortedNodes.length - 1].width} 
                y1={rungY} 
                x2={RIGHT_RAIL_X} 
                y2={rungY} 
                className="rung-line opacity-40" 
              />
            </g>
          );
        })}

        {/* Manual Wires */}
        {state.wires.map(wire => {
          const fromNode = state.nodes.find(n => n.id === wire.fromId);
          const toNode = state.nodes.find(n => n.id === wire.toId);
          if (!fromNode || !toNode) return null;

          const x1 = wire.fromSide === 'left' ? fromNode.x : fromNode.x + fromNode.width;
          const y1 = fromNode.y + fromNode.height / 2;
          const x2 = wire.toSide === 'left' ? toNode.x : toNode.x + toNode.width;
          const y2 = toNode.y + toNode.height / 2;

          // Simple Manhattan Routing (L-shape)
          const midX = (x1 + x2) / 2;

          const isConducting = state.simulation.isRunning && 
                              (state.simulation.values[fromNode.address] || fromNode.type === 'wire-junction');

          return (
            <g key={wire.id} className="group pointer-events-auto">
              <path 
                d={`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`}
                fill="none"
                stroke="transparent"
                strokeWidth={15}
                className="cursor-pointer pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteWire?.(wire.id);
                }}
              />
              <path 
                d={`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`}
                fill="none"
                stroke={isConducting ? "#3b82f6" : "#cbd5e1"}
                strokeWidth={5}
                strokeLinecap="round"
                className="opacity-20 group-hover:stroke-red-400 transition-colors"
              />
              <path 
                d={`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`}
                fill="none"
                stroke={isConducting ? "#3b82f6" : "#475569"}
                strokeWidth={1.5}
                className="transition-colors"
                filter={isConducting ? "url(#energized)" : undefined}
              />
              {/* Delete Handle */}
              <g 
                transform={`translate(${midX - 8}, ${(y1+y2)/2 - 8})`}
                className="opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteWire?.(wire.id);
                }}
              >
                <circle r={8} fill="#ef4444" cx={8} cy={8} />
                <Trash2 x={3} y={3} size={10} className="text-white" />
              </g>
            </g>
          );
        })}

        {/* Guides */}
        <line ref={vGuideRef} y1={-1000} y2={10000} stroke="#3b82f6" strokeWidth={0.5} strokeDasharray="2 2" style={{ display: 'none', pointerEvents: 'none' }} />
        <line ref={hGuideRef} x1={-1000} x2={5000} stroke="#3b82f6" strokeWidth={0.5} strokeDasharray="2 2" style={{ display: 'none', pointerEvents: 'none' }} />

        {/* Interaction Overlays (Refs for performance) */}
        <path 
          ref={wiringPreviewRef}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="4 2"
          style={{ pointerEvents: 'none', display: 'none' }}
        />
        
        <g ref={ghostRef} opacity={0.3} style={{ pointerEvents: 'none', display: 'none' }}>
          <rect width={NODE_WIDTH} height={NODE_HEIGHT} fill="none" stroke="#3b82f6" strokeDasharray="4 2" />
          <text x={NODE_WIDTH/2} y={-10} textAnchor="middle" className="text-[10px] fill-blue-500 font-bold uppercase">PLACING</text>
        </g>

        {/* Components */}
        {state.nodes.map((node) => (
          <MemoizedLadderNode 
            key={node.id}
            node={node}
            selected={selectedId === node.id}
            simulationValue={state.simulation.values[node.address]}
            placementType={placementType}
            wiringState={wiringState}
            onSelect={onSelect}
            onToggle={onToggleAddress}
            onDoubleClick={onNodeDoubleClick}
            onTerminalClick={handleTerminalClick}
            renderSymbol={renderNodeSymbol}
          />
        ))}
      </svg>
    </div>
  );
}
