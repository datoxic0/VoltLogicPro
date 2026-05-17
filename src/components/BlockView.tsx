import React from 'react';
import { LadderState, RUNG_HEIGHT } from '../types';
import { motion } from 'motion/react';
import { Box, Zap, Info, ChevronRight, Activity, Database } from 'lucide-react';
import { clsx } from 'clsx';

interface BlockViewProps {
  state: LadderState;
  onNodeClick: (id: string) => void;
}

export function BlockView({ state, onNodeClick }: BlockViewProps) {
  // Group nodes by rung (y coordinate)
  const rungCoordinates = Array.from(new Set(state.nodes.map(n => Math.round(n.y))));
  rungCoordinates.sort((a, b) => a - b);

  const renderLogicGate = (type: 'AND' | 'OR' | 'NOT' | 'DIRECT', inputs: any[], output: any, isEnergized: boolean) => {
    const renderGateShape = () => {
      const color = isEnergized ? '#22c55e' : '#3f3f46';
      const strokeColor = isEnergized ? '#22c55e' : '#52525b';
      
      if (type === 'AND') {
        return (
          <svg width="100" height="80" viewBox="0 0 100 80" className="drop-shadow-[0_0_15px_rgba(34,197,94,0.15)]">
            <path 
              d="M 20 10 L 50 10 A 30 30 0 0 1 50 70 L 20 70 Z" 
              fill={isEnergized ? "rgba(34, 197, 94, 0.1)" : "rgba(24, 24, 27, 0.8)"}
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            <text x="35" y="45" fill="white" className="text-[14px] font-black italic select-none" textAnchor="middle">AND</text>
          </svg>
        );
      }
      if (type === 'OR') {
        return (
          <svg width="100" height="80" viewBox="0 0 100 80">
            <path 
              d="M 15 10 C 25 10 40 15 65 40 C 40 65 25 70 15 70 C 25 40 25 40 15 10" 
              fill={isEnergized ? "rgba(34, 197, 94, 0.1)" : "rgba(24, 24, 27, 0.8)"}
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            <text x="30" y="45" fill="white" className="text-[12px] font-black italic select-none" textAnchor="middle">OR</text>
          </svg>
        );
      }
      if (type === 'NOT') {
        return (
          <svg width="100" height="80" viewBox="0 0 100 80">
            <path 
              d="M 20 15 L 60 40 L 20 65 Z" 
              fill={isEnergized ? "rgba(34, 197, 94, 0.1)" : "rgba(24, 24, 27, 0.8)"}
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            <circle cx="68" cy="40" r="8" fill="rgba(24, 24, 27, 0.8)" stroke={strokeColor} strokeWidth="2.5" />
          </svg>
        );
      }
      return (
        <div className="w-24 h-24 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center">
           <Zap className="text-zinc-800" size={32} />
        </div>
      );
    };
    
    return (
      <div className="flex items-center gap-12 group/gate">
        {/* Input Terminal Block */}
        <div className="flex flex-col gap-6">
          {inputs.map((input, idx) => (
            <div key={idx} className="flex items-center gap-3 relative">
              <div className="flex flex-col items-end">
                <span className={clsx(
                  "text-[8px] font-black tracking-widest leading-none mb-1 font-mono",
                  input.active ? "text-green-400" : "text-zinc-600"
                )}>
                  {input.address}
                </span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase max-w-[100px] truncate text-right">
                  {input.tag || 'INPUT'}
                </span>
              </div>
              <div className={clsx(
                "w-12 h-1 rounded-full relative overflow-hidden",
                input.active ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]" : "bg-zinc-800"
              )}>
                 {input.active && (
                   <motion.div 
                    animate={{ x: [0, 100], opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 bg-white/40 w-4 blur-sm"
                   />
                 )}
              </div>
              {input.isNC && (
                <div className="absolute right-[-4px] w-3 h-3 rounded-full border-2 border-zinc-600 bg-zinc-900 flex items-center justify-center z-10" title="Inverted Input (NOT)">
                   <div className="w-1 h-1 bg-white rounded-full opacity-40" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* The Gate Body */}
        <div className="relative">
          {renderGateShape()}
          
          <div className="absolute top-2 left-6 flex gap-1.5">
             <div className={clsx("w-1.5 h-1.5 rounded-full", isEnergized ? "bg-green-400 shadow-[0_0_8px_#22c55e]" : "bg-zinc-800")} />
             <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 border border-zinc-800" />
          </div>
        </div>

        {/* Output Wire and Terminal */}
        <div className="flex items-center gap-4">
          <div className={clsx(
            "w-20 h-1 rounded-full relative overflow-hidden",
            isEnergized ? "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)]" : "bg-zinc-800"
          )}>
             {isEnergized && (
               <motion.div 
                animate={{ x: [0, 200], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute inset-0 bg-white/60 w-8 blur-md"
               />
             )}
          </div>
          
          <div 
            onClick={() => onNodeClick(output.id)}
            className={clsx(
              "p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2 relative min-w-[160px] shadow-2xl",
              isEnergized 
                ? "bg-green-500/10 border-green-500 ring-4 ring-green-500/5" 
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
            )}
          >
            {isEnergized && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-4 -right-4 bg-green-500 text-black rounded-full p-2 shadow-[0_0_20px_rgba(34,197,94,0.5)]"
              >
                <Zap size={14} fill="currentColor" />
              </motion.div>
            )}
            
            <span className={clsx(
              "text-[9px] font-black uppercase tracking-[0.2em] transition-colors font-mono",
              isEnergized ? "text-green-500" : "text-zinc-600"
            )}>
              {output.address}
            </span>
            
            <div className={clsx(
              "text-sm font-black tracking-tight px-4 py-2 rounded-xl w-full text-center truncate transition-all uppercase",
              isEnergized ? "text-white bg-green-500/20" : "text-zinc-500 bg-black/40"
            )}>
              {output.tag || output.type.toUpperCase().replace('COIL-', '')}
            </div>

            <div className="mt-2 w-full h-1 bg-black/40 rounded-full overflow-hidden">
               <div className={clsx("h-full transition-all duration-500", isEnergized ? "w-full bg-green-500" : "w-0 bg-zinc-800")} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#0a0a0a] overflow-auto p-12 custom-scrollbar select-none relative">
      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4">
              <Box className="text-blue-500 size-8" />
              FUNCTION BLOCK DIAGRAM (FBD)
            </h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
              Virtual controller Synthesis :: IEC 61131-3 Standard
            </p>
          </div>
          <div className="flex gap-4">
             <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                   <span className="text-[10px] font-black text-white">PLC_ONLINE</span>
                </div>
                <span className="text-[8px] font-bold text-zinc-600 mt-1">SCAN_RATE: 100ms</span>
             </div>
             <div className="w-px h-10 bg-zinc-800 mx-2" />
             <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg flex items-center gap-3">
                <Activity size={18} className="text-blue-500" />
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-zinc-500 uppercase">Load</span>
                   <span className="text-[10px] font-black text-white">4.2%</span>
                </div>
             </div>
          </div>
        </div>

        <div className="grid gap-20">
          {rungCoordinates.map((y, rungIdx) => {
            const rungNodes = state.nodes
              .filter(n => Math.round(n.y) === y)
              .sort((a, b) => a.x - b.x);

            const contacts = rungNodes.filter(n => n.type.startsWith('contact'));
            const output = rungNodes.find(n => 
              n.type.startsWith('coil') || 
              n.type.startsWith('timer') || 
              n.type.startsWith('counter') || 
              n.type.startsWith('math') ||
              n.type.startsWith('compare')
            );

            if (!output) return null;

            const isOutputEnergized = !!state.simulation.values[output.address];

            return (
              <motion.div 
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rungIdx * 0.05 }}
                key={y} 
                className="relative bg-zinc-900/40 border border-zinc-800/40 rounded-3xl p-12 hover:bg-zinc-900/60 transition-all group"
              >
                {/* Rung Badge */}
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 bg-zinc-800 text-zinc-400 text-[9px] font-black px-3 py-1 rounded-full border border-zinc-700 shadow-xl vertical-lr">
                   RUNG_{rungIdx.toString().padStart(3, '0')}
                </div>

                <div className="flex flex-col items-center">
                  {contacts.length > 0 ? (
                    renderLogicGate(
                      'AND', // Simple linear ladder to AND gate conversion
                      contacts.map(c => ({
                        address: c.address,
                        tag: c.tag,
                        active: !!state.simulation.values[c.address],
                        isNC: c.type === 'contact-nc'
                      })),
                      output,
                      isOutputEnergized
                    )
                  ) : (
                    <div className="flex items-center gap-8">
                       <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Power Rail</span>
                          <div className="h-0.5 w-16 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] rounded-full" />
                       </div>
                       <ChevronRight className="text-zinc-700" size={24} />
                       <div 
                        onClick={() => onNodeClick(output.id)}
                        className={clsx(
                          "px-6 py-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/50 text-blue-400 cursor-pointer shadow-2xl hover:border-blue-500 transition-all",
                          isOutputEnergized && "bg-green-500/10 border-green-500 text-green-400"
                        )}
                       >
                         <div className="flex flex-col items-center gap-1">
                            <span className="text-[8px] font-black opacity-60 uppercase">{output.address}</span>
                            <span className="text-sm font-black tracking-tight">{output.tag || 'SYSTEM_INIT'}</span>
                         </div>
                       </div>
                    </div>
                  )}

                  {/* Supplemental Information Footer */}
                  <div className="mt-12 w-full pt-8 border-t border-zinc-800/30 grid grid-cols-3 gap-8">
                     <div className="space-y-3">
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                           <Database size={12} className="text-blue-500" />
                           Registers
                        </div>
                        <div className="bg-black/40 rounded-xl p-4 border border-zinc-800/50 font-mono text-[10px]">
                           <div className="flex justify-between mb-2">
                              <span className="text-zinc-600">STATE:</span>
                              <span className={clsx("font-bold", isOutputEnergized ? "text-green-400" : "text-zinc-700")}>
                                {isOutputEnergized ? 'ENERGIZED' : 'IDLE'}
                              </span>
                           </div>
                           {(output.type.startsWith('timer') || output.type.startsWith('counter')) && (
                             <>
                               <div className="flex justify-between mb-2">
                                  <span className="text-zinc-600">ACC:</span>
                                  <span className="text-white">{state.simulation.values[`${output.address}_ACC`] || 0}</span>
                               </div>
                               <div className="flex justify-between">
                                  <span className="text-zinc-600">PRE:</span>
                                  <span className="text-zinc-400">{output.params?.preset || 0}</span>
                               </div>
                             </>
                           )}
                        </div>
                     </div>

                     <div className="col-span-2 space-y-3">
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                           <Info size={12} className="text-amber-500" />
                           Logic Documentation
                        </div>
                        <div className="bg-zinc-800/20 border border-zinc-800/40 rounded-xl p-4 min-h-[80px]">
                           <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                             {state.rungComments?.[rungIdx] || `Automated logic synthesis for routine routine ${output.address}. No user documentation provided for this rung segment.`}
                           </p>
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {rungCoordinates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 border-4 border-dashed border-zinc-800/50 rounded-[4rem] bg-zinc-900/20">
             <Box size={80} className="text-zinc-800 mb-6" />
             <p className="text-2xl font-black text-zinc-700 tracking-tighter">NO LOGIC DISCOVERED IN MEMORY</p>
             <p className="text-[10px] font-bold text-zinc-800 mt-4 uppercase tracking-[0.4em]">DEPLOY LADDER LOGIC TO INITIALIZE SYNTHESIS</p>
          </div>
        )}
      </div>
    </div>
  );
}
