import React from 'react';
import { Power, Activity, Cpu } from 'lucide-react';
import { LadderState } from '../types';
import { cn } from '../lib/utils';

interface IOSimulatorProps {
  state: LadderState;
  onToggleIO: (address: string) => void;
  onForceIO: (address: string, value?: boolean) => void;
}

export function IOSimulator({ state, onToggleIO, onForceIO }: IOSimulatorProps) {
  // Extract inputs (e.g., tags starting with I: or just collect all B3/Inputs)
  const inputs = state.nodes.filter(n => n.type.startsWith('contact'));
  const outputs = state.nodes.filter(n => n.type === 'coil');

  const renderForceBadge = (addr: string) => {
    const isForced = state.simulation.forces && state.simulation.forces[addr] !== undefined;
    if (!isForced) return null;
    return (
      <span className={cn(
        "absolute -top-1 -right-1 text-[6px] px-1 rounded-sm font-black",
        state.simulation.forcesEnabled ? "bg-amber-500 text-black" : "bg-zinc-500 text-white opacity-50"
      )}>
        F
      </span>
    );
  };

  return (
    <div className="absolute top-24 right-8 z-40 glass shadow-2xl rounded-2xl w-80 overflow-hidden flex flex-col font-sans border-black/5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="panel-header">
        <div className="flex items-center gap-3">
          <Cpu size={14} className={cn("transition-colors", state.simulation.forcesEnabled && Object.keys(state.simulation.forces || {}).length > 0 ? "text-amber-500" : "text-zinc-400")} />
          I/O Chassis
        </div>
        <div className="flex gap-2 items-center">
          {state.simulation.forcesEnabled && Object.keys(state.simulation.forces || {}).length > 0 && (
             <span className="text-[8px] text-amber-500 font-bold animate-pulse mr-2">FORCES ACTIVE</span>
          )}
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
        </div>
      </div>

      <div className="p-4 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
        {/* Local Inputs */}
        <section>
          <h3 className="text-[10px] text-zinc-400 font-bold mb-3 uppercase tracking-widest flex items-center gap-2">
            <Power size={12} className="text-blue-500" /> Local Input Module
          </h3>
          <div className="grid grid-cols-4 gap-2.5">
            {[...Array(16)].map((_, i) => {
              const addr = `I:${i}`;
              const val = state.simulation.values[addr];
              const forcedValue = state.simulation.forces ? state.simulation.forces[addr] : undefined;
              
              return (
                <div key={i} className="relative group">
                  <button
                    onClick={() => onToggleIO(addr)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (forcedValue !== undefined) onForceIO(addr, undefined);
                      else onForceIO(addr, !val);
                    }}
                    className={cn(
                      "w-full flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all active:scale-90",
                      val 
                        ? "bg-amber-100 border-amber-300 text-amber-700 shadow-sm" 
                        : "bg-white border-black/5 text-zinc-400 hover:bg-black/5",
                      forcedValue !== undefined && "ring-2 ring-amber-500 ring-offset-2"
                    )}
                    title="Left-click: Toggle | Right-click: Force"
                  >
                    <span className="text-[10px] font-bold">{i}</span>
                    {renderForceBadge(addr)}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Runtime Specific Inputs (Mapped from Workspace) */}
        {inputs.length > 0 && (
          <section>
            <h3 className="text-[10px] text-zinc-400 font-bold mb-3 uppercase tracking-widest">Workspace Inputs</h3>
            <div className="space-y-1.5">
              {inputs.map((node) => {
                const isForced = state.simulation.forces && state.simulation.forces[node.address] !== undefined;
                return (
                  <div key={node.id} className="flex items-center justify-between premium-card p-3 relative overflow-hidden">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-zinc-800">{node.tag}</span>
                      <span className="text-[9px] text-zinc-400 font-mono">{node.address}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (isForced) onForceIO(node.address, undefined);
                          else onForceIO(node.address, !state.simulation.values[node.address]);
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all active:scale-95",
                          isForced ? "bg-amber-500 border-amber-400 text-black" : "bg-zinc-50 border-black/5 text-zinc-400 hover:text-zinc-600 shadow-sm"
                        )}
                      >
                        FORCE
                      </button>
                      <button 
                        onClick={() => onToggleIO(node.address)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 shadow-sm",
                          state.simulation.values[node.address] ? "bg-blue-600 text-white" : "bg-white border border-black/5 text-zinc-400"
                        )}
                      >
                        {state.simulation.values[node.address] ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Outputs Status */}
        {outputs.length > 0 && (
          <section>
            <h3 className="text-[10px] text-zinc-400 font-bold mb-3 uppercase tracking-widest">Outputs</h3>
            <div className="space-y-1.5">
              {outputs.map((node) => {
                const isForced = state.simulation.forces && state.simulation.forces[node.address] !== undefined;
                return (
                  <div key={node.id} className="flex items-center gap-3 p-3 premium-card justify-between">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                        "w-2.5 h-2.5 rounded-full transition-all duration-300",
                        state.simulation.values[node.address] ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "bg-zinc-100"
                      )} />
                      <span className="text-[11px] font-bold text-zinc-600 truncate max-w-[120px]">{node.tag}</span>
                    </div>
                    <button 
                        onClick={() => {
                          if (isForced) onForceIO(node.address, undefined);
                          else onForceIO(node.address, !state.simulation.values[node.address]);
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all active:scale-95",
                          isForced ? "bg-amber-500 border-amber-400 text-black" : "bg-zinc-50 border-black/5 text-zinc-400 hover:text-zinc-600 shadow-sm"
                        )}
                      >
                        FORCE
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="bg-white/80 backdrop-blur-md p-3 border-t border-black/5 text-[9px] text-zinc-400 flex flex-col gap-2">
        <div className="flex justify-between items-center tabular-nums">
          <span className="font-bold tracking-tight">IO_LINK: ACTIVE</span>
          <Activity size={12} className="text-blue-500" />
        </div>
        {Object.keys(state.simulation.forces || {}).length > 0 && (
          <div className="text-amber-600 font-bold flex items-center gap-2 bg-amber-50 rounded-lg px-2 py-1 border border-amber-100">
             <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
             TOTAL_FORCES: {Object.keys(state.simulation.forces || {}).length}
          </div>
        )}
      </div>
    </div>
  );
}
