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
  placementType: NodeType | null;
  onSelect: (id: string | null) => void;
  onUpdateNode: (id: string, updates: Partial<LadderNode>) => void;
  onToggleAddress: (address: string) => void;
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
  onCanvasClick: (x: number, y: number) => void;
  onNodeDoubleClick: (id: string) => void;
  onRungAction?: (rungIndex: number, action: 'delete' | 'edit-comment') => void;
}

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
  onRungAction
}: LadderCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Initialize interactjs for dragging
  useEffect(() => {
    const interactable = interact('.ladder-node-g');
    
    interactable.draggable({
      inertia: false,
      autoScroll: true,
      listeners: {
        move(event) {
          const id = event.target.dataset.id;
          if (!id) return;

          const dx = event.dx / viewport.zoom;
          const dy = event.dy / viewport.zoom;

          const totalDx = (parseFloat(event.target.getAttribute('data-dx')) || 0) + dx;
          const totalDy = (parseFloat(event.target.getAttribute('data-dy')) || 0) + dy;

          event.target.setAttribute('data-dx', totalDx.toString());
          event.target.setAttribute('data-dy', totalDy.toString());
          
          event.target.style.transform = `translate(${totalDx}px, ${totalDy}px)`;
        },
        end(event) {
          const id = event.target.dataset.id;
          if (!id) return;

          const dx = parseFloat(event.target.getAttribute('data-dx')) || 0;
          const dy = parseFloat(event.target.getAttribute('data-dy')) || 0;

          // Reset styles
          event.target.setAttribute('data-dx', '0');
          event.target.setAttribute('data-dy', '0');
          event.target.style.transform = '';

          const node = state.nodes.find(n => n.id === id);
          if (node) {
            onUpdateNode(id, { 
              x: Math.round((node.x + dx) / GRID_SIZE) * GRID_SIZE, 
              y: Math.round((node.y + dy - RUNG_HEIGHT/2) / RUNG_HEIGHT) * RUNG_HEIGHT + (RUNG_HEIGHT/2 - NODE_HEIGHT/2)
            });
          }
        }
      }
    });

    return () => {
      interactable.unset();
    };
  }, [state.nodes.length, viewport.zoom, viewport.x, viewport.y]);

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

    return <rect width={node.width} height={node.height} fill="none" stroke="currentColor" strokeDasharray="4 2" />;
  };

  const handleMouseMoveGlobal = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const rawX = e.clientX - rect.left - viewport.x;
      const rawY = e.clientY - rect.top - viewport.y;
      setMousePos({ x: rawX / viewport.zoom, y: rawY / viewport.zoom });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If it's a right click, it might be for context or panning, don't trigger click
    if (e.button !== 0) return;

    // Check if we clicked on an actual node
    const target = e.target as HTMLElement;
    const isNode = target.closest('.ladder-node-g');
    if (isNode) return;

    // Calculate canvas coordinates
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const rawX = e.clientX - rect.left - viewport.x;
      const rawY = e.clientY - rect.top - viewport.y;
      const x = rawX / viewport.zoom;
      const y = rawY / viewport.zoom;
      onCanvasClick(x, y);
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
        className="overflow-visible pointer-events-none"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
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
        {Array.from({ length: 100 }).map((_, i) => {
          const comment = state.rungComments?.[i];
          const yBase = i * RUNG_HEIGHT;
          const yCenter = yBase + (RUNG_HEIGHT/2);
          
          return (
            <g key={i}>
              {/* Rung Interaction Handle */}
              <g 
                className="rung-handle opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
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
                  <g className="cursor-pointer" onClick={() => onRungAction?.(i, 'edit-comment')}>
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
                  "rung-line transition-all duration-300",
                  placementType ? "opacity-60 stroke-blue-400 stroke-[3px]" : "opacity-30 stroke-black stroke-[1.5px]"
                )} 
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

        {/* Logic Continuity Background Lines */}
        {state.nodes.map(node => {
          const y = node.y + (node.height / 2);
          return (
             <React.Fragment key={`line-${node.id}`}>
               <line x1={LEFT_RAIL_X} y1={y} x2={node.x} y2={y} className="rung-line opacity-40" />
               <line x1={node.x + node.width} y1={y} x2={RIGHT_RAIL_X} y2={y} className="rung-line opacity-40" />
             </React.Fragment>
          );
        })}

        {/* Placement Ghost */}
        {placementType && (
          <g opacity={0.3} transform={`translate(${Math.round(mousePos.x/GRID_SIZE)*GRID_SIZE}, ${Math.round((mousePos.y - RUNG_HEIGHT/2) / RUNG_HEIGHT) * RUNG_HEIGHT + (RUNG_HEIGHT/2 - NODE_HEIGHT/2)})`}>
            <rect width={NODE_WIDTH} height={NODE_HEIGHT} fill="none" stroke="#3b82f6" strokeDasharray="4 2" />
            <text x={NODE_WIDTH/2} y={-10} textAnchor="middle" className="text-[10px] fill-blue-500 font-bold uppercase">{placementType}</text>
          </g>
        )}

        {/* Components */}
        {state.nodes.map((node) => {
          const isEnergized = Boolean(state.simulation.values[node.address]);
          let isConducting = isEnergized;
          if (node.type === 'contact-nc') isConducting = !isEnergized;

          return (
            <g 
              key={node.id}
              data-id={node.id}
              className={clsx(
                "ladder-node-g pointer-events-auto cursor-grab group",
                selectedId === node.id && "selected"
              )}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseDown={(e) => {
                e.stopPropagation();
                onSelect(node.id);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (state.simulation.isRunning && node.type.startsWith('contact')) {
                  onToggleAddress(node.address);
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onNodeDoubleClick(node.id);
              }}
            >
              {/* Selection Box */}
              {selectedId === node.id && (
                <rect 
                  x={-4} 
                  y={-4} 
                  width={NODE_WIDTH + 8} 
                  height={NODE_HEIGHT + 8} 
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
                {renderNodeSymbol(node)}
                
                {/* Configuration Button Trigger - easier than double click */}
                <g 
                  className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNodeDoubleClick(node.id);
                  }}
                  transform={`translate(${NODE_WIDTH - 12}, 0)`}
                >
                  <rect width={12} height={12} fill="#3b82f6" rx={2} />
                  <path d="M 3 6 L 9 6 M 6 3 L 6 9" stroke="white" strokeWidth={1.5} />
                </g>

                {/* Labels */}
                <text 
                  y={-12} 
                  x={NODE_WIDTH / 2} 
                  textAnchor="middle" 
                  className="text-[10px] font-mono fill-blue-700 font-bold"
                >
                  {node.address}
                </text>
                
                {node.tag && (
                  <g transform={`translate(${NODE_WIDTH/2}, -32)`}>
                    <rect x={-30} y={0} width={60} height={14} fill="#fef9c3" stroke="#fde047" strokeWidth={0.5} />
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
            </g>
          );
        })}
      </svg>
    </div>
  );
}
