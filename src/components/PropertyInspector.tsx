import React from 'react';
import { 
  Settings, 
  Trash2, 
  Tag, 
  MapPin, 
  Clock,
  ChevronDown,
  Activity,
  FileText,
  Info,
  Database,
  Cpu,
  Monitor,
  TrendingUp
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LadderNode, LadderState } from '../types';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer,
  YAxis
} from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PropertyInspectorProps {
  selectedNode: LadderNode | null;
  values: Record<string, boolean | number>;
  history: Record<string, number[]>;
  onUpdate: (id: string, updates: Partial<LadderNode>) => void;
  onDelete: (id: string) => void;
  onForceIO: (address: string, value?: boolean) => void;
  forces: Record<string, boolean | number>;
  isEmbedded?: boolean;
}

export function PropertyInspector({ selectedNode, values, history, onUpdate, onDelete, onForceIO, forces, isEmbedded }: PropertyInspectorProps) {
  if (!selectedNode) {
    if (isEmbedded) return null;
    return (
      <div className="h-full bg-zinc-950 flex flex-col items-center justify-center p-8 text-center text-zinc-600 select-none">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl">
          <Settings size={24} className="opacity-20" />
        </div>
        <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">System Idle</p>
        <p className="text-[9px] mt-2 opacity-30">Select an element to inspect kernel parameters</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-zinc-950 flex flex-col text-[11px] select-none h-full",
      !isEmbedded ? "border-l border-zinc-800/50 z-20" : "w-full"
    )}>
      {!isEmbedded && (
        <div className="p-4 bg-black/40 font-black border-b border-zinc-800 flex justify-between items-center text-zinc-400 tracking-widest text-[10px] uppercase">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Property Inspector
          </div>
          <button 
            onClick={() => onDelete(selectedNode.id)}
            className="p-1.5 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded-lg transition-all"
            title="Remove Component"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div className={cn("flex-1 space-y-8 overflow-y-auto custom-scrollbar", !isEmbedded ? "p-6" : "")}>
        {/* Header Section */}
        <div className="pb-6 border-b border-zinc-800/50">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                 <div className="px-2 py-0.5 bg-blue-600/20 border border-blue-500/50 rounded text-[9px] font-black text-blue-400 uppercase tracking-tighter">
                   {selectedNode.type.split('-')[0]}
                 </div>
                 <span className="text-zinc-600 font-mono text-[9px] tracking-widest">{selectedNode.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-1">
                 <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Synchronized</span>
              </div>
           </div>
           <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
             {selectedNode.type.toUpperCase().replace('COIL-', '').replace('-', ' ')}
           </h3>
           <p className="text-[10px] text-zinc-500 font-medium">Standard IEC-61131 Logic Primitive</p>
        </div>

        <div className="space-y-6">
          {/* General Properties Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <Info size={10} className="text-blue-500" />
               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Identification</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Symbolic Tag</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                  <Tag size={12} />
                </div>
                <input 
                  type="text"
                  value={selectedNode.tag}
                  onChange={(e) => onUpdate(selectedNode.id, { tag: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-[13px]"
                  placeholder="PLC_SYMBOL_01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Hardware Address</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                  <MapPin size={12} />
                </div>
                <input 
                  type="text"
                  value={selectedNode.address}
                  onChange={(e) => onUpdate(selectedNode.id, { address: e.target.value })}
                  className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-blue-400 focus:border-blue-500 outline-none transition-all font-mono font-bold text-[13px]"
                />
              </div>
            </div>
          </section>

          {/* Logic Forcing Section */}
          <section className="space-y-4 p-5 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Activity size={10} className="text-amber-500" />
                   <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Live Interaction</span>
                </div>
                <span className={cn(
                  "text-[8px] font-black px-1.5 py-0.5 rounded uppercase",
                  forces[selectedNode.address] !== undefined ? "bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-zinc-800 text-zinc-500"
                )}>
                  {forces[selectedNode.address] !== undefined ? "FORCED" : "UNLOCKED"}
                </span>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => onForceIO(selectedNode.address, forces[selectedNode.address] === undefined ? !values[selectedNode.address] : undefined)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 group/force",
                    forces[selectedNode.address] !== undefined 
                      ? "bg-amber-500 border-amber-400 text-black" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-amber-500/50 hover:text-amber-500/50"
                  )}
                >
                  <Activity size={16} className={cn(forces[selectedNode.address] !== undefined && "animate-pulse")} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">Force Override</span>
                </button>

                <button 
                  className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-blue-500 hover:border-blue-500/50 transition-all gap-2"
                >
                  <Monitor size={16} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">Pulse Test</span>
                </button>
             </div>
          </section>

          {/* Configuration Parameters */}
          {(selectedNode.type.startsWith('timer') || selectedNode.type.startsWith('counter')) && (
            <section className="space-y-4">
               <div className="flex items-center gap-2 mb-2">
                  <Cpu size={10} className="text-purple-500" />
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Kernel Parameters</span>
               </div>
               <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-4">
                  <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <label className="text-[8px] font-black text-blue-400/60 uppercase tracking-widest pl-1">
                          {selectedNode.type.startsWith('timer') ? 'Preset Delay (ms)' : 'Target Terminal Count'}
                        </label>
                        <Clock size={12} className="text-blue-500/40" />
                     </div>
                     <div className="relative">
                       <input 
                         type="number"
                         value={selectedNode.params?.preset || 0}
                         onChange={(e) => onUpdate(selectedNode.id, { 
                           params: { ...selectedNode.params, preset: parseInt(e.target.value) } 
                         })}
                         className="w-full bg-black/60 border-2 border-blue-500/30 rounded-xl p-4 text-white font-mono text-center text-2xl font-black focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
                       />
                     </div>
                  </div>
               </div>
            </section>
          )}

          {(selectedNode.type.startsWith('compare') || selectedNode.type.startsWith('math')) && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <Database size={10} className="text-emerald-500" />
                 <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Math/Logical Context</span>
              </div>
              <div className="space-y-4 p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest pl-1">Source A</label>
                    <input 
                      type="text"
                      value={selectedNode.params?.sourceA || ''}
                      onChange={(e) => onUpdate(selectedNode.id, { 
                        params: { ...selectedNode.params, sourceA: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } 
                      })}
                      className="w-full bg-black/40 border border-zinc-800 rounded-lg p-3 text-zinc-200 font-mono focus:border-blue-500 outline-none text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest pl-1">Source B</label>
                    <input 
                      type="text"
                      value={selectedNode.params?.sourceB || ''}
                      onChange={(e) => onUpdate(selectedNode.id, { 
                        params: { ...selectedNode.params, sourceB: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } 
                      })}
                      className="w-full bg-black/40 border border-zinc-800 rounded-lg p-3 text-zinc-200 font-mono focus:border-blue-500 outline-none text-center"
                    />
                  </div>
                </div>
                {selectedNode.type.startsWith('math') && (
                  <div className="pt-4 border-t border-zinc-800 space-y-2">
                    <label className="text-[8px] font-black text-blue-500 uppercase tracking-widest pl-1">Target Destination</label>
                    <input 
                      type="text"
                      value={selectedNode.params?.dest || ''}
                      onChange={(e) => onUpdate(selectedNode.id, { 
                        params: { ...selectedNode.params, dest: e.target.value } 
                      })}
                      className="w-full bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-3 text-blue-400 font-mono font-black focus:border-blue-500 outline-none text-center"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Documentation Section */}
          <section className="space-y-3">
             <div className="flex items-center gap-2 mb-2">
                <FileText size={10} className="text-zinc-500" />
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Engineering Notes</span>
             </div>
             <textarea 
               value={selectedNode.description || ''}
               onChange={(e) => onUpdate(selectedNode.id, { description: e.target.value })}
               className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 text-[11px] text-zinc-400 focus:border-zinc-700 outline-none min-h-[100px] resize-none border-dashed transition-all"
               placeholder="Enter functional description or maintenance notes for this instruction..."
             />
          </section>
        </div>

        {/* Real-time Data & Trends */}
        <div className="pt-8 mt-auto sticky bottom-0 bg-zinc-950 pb-4 space-y-4">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                 <TrendingUp size={10} className="text-blue-500" />
                 <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Historical Bus Trend</span>
              </div>
              <span className="text-[8px] font-bold text-zinc-700 uppercase">Live Sampling: 50ms</span>
           </div>

           <div className="h-24 w-full bg-black/40 rounded-2xl border border-zinc-800/50 overflow-hidden relative group/chart">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={(history[selectedNode.type.startsWith('timer') || selectedNode.type.startsWith('counter') ? `${selectedNode.address}_ACC` : (selectedNode.params?.dest || selectedNode.address)] || []).slice(-40).map((v, i) => ({ val: v, time: i }))}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line 
                      type="monotone" 
                      dataKey="val" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={false} 
                      animationDuration={300}
                      isAnimationActive={false}
                    />
                 </LineChart>
              </ResponsiveContainer>
              <div className="absolute top-2 right-4 flex items-center gap-1.5">
                 <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
                 <span className="text-[7px] font-black text-blue-500/60 uppercase">Streaming: {selectedNode.type.startsWith('timer') || selectedNode.type.startsWith('counter') ? 'ACC' : 'VAL'}</span>
              </div>
           </div>

           <div className="relative group/monitor">
              <div className="absolute inset-0 bg-blue-500/10 blur-2xl opacity-50 group-hover/monitor:opacity-100 transition-opacity" />
              <div className="relative bg-black border border-zinc-800/50 rounded-[2rem] p-6 flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Runtime Value</span>
                </div>
                <div className="text-4xl font-black text-blue-500 font-mono tracking-tighter drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  {selectedNode.type.startsWith('timer') 
                    ? (Number(values[`${selectedNode.address}_ACC`] || 0) / 1000).toFixed(1) 
                    : (values[`${selectedNode.address}_ACC`] !== undefined 
                        ? values[`${selectedNode.address}_ACC`] 
                        : (values[selectedNode.params?.dest || selectedNode.address] || 0))}
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
