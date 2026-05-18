import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Download, 
  Trash2,
  Share2,
  Star,
  Search
} from 'lucide-react';
import { clsx } from 'clsx';

interface ToolbarProps {
  isRunning: boolean;
  forcesEnabled: boolean;
  hasActiveForces: boolean;
  onToggleSim: () => void;
  onReset: () => void;
  onClear: () => void;
  onSave: () => void;
  onSearch: (term: string) => void;
  onAddNode: (type: any) => void;
}

const TABS = ['Favorites', 'Bit', 'Timer/Counter', 'Input/Output', 'Compare', 'Math'];

export function Toolbar({ 
  isRunning, 
  forcesEnabled, 
  hasActiveForces, 
  onToggleSim, 
  onReset, 
  onClear, 
  onSave, 
  onSearch,
  onAddNode 
}: ToolbarProps) {
  const [activeTab, setActiveTab] = useState('Favorites');
  const [searchTerm, setSearchTerm] = useState('');

  const renderInstructions = () => {
    switch (activeTab) {
      case 'Favorites':
        return (
          <>
            <button onClick={() => onAddNode('contact-no')} className="px-4 py-2 hover:bg-black/5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-black/5 font-mono text-[11px] font-bold text-zinc-600" title="Examine if Closed (XIC)">--[ ]--</button>
            <button onClick={() => onAddNode('contact-nc')} className="px-4 py-2 hover:bg-black/5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-black/5 font-mono text-[11px] font-bold text-zinc-600" title="Examine if Open (XIO)">--[/]--</button>
            <button onClick={() => onAddNode('coil')} className="px-4 py-2 hover:bg-black/5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-black/5 font-mono text-[11px] font-bold text-zinc-600" title="Output Energize (OTE)">--( )--</button>
            <button onClick={() => onAddNode('branch-start')} className="px-4 py-2 hover:bg-black/5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-black/5 font-mono text-[11px] font-bold text-zinc-600" title="Branch Start (BST)">--+--</button>
            <button onClick={() => onAddNode('wire' as any)} className="px-4 py-2 hover:bg-black/5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-black/5 font-mono text-[11px] font-bold text-blue-600" title="Manual Wire Tool">WIRE</button>
            <button onClick={() => onAddNode('timer-on')} className="px-4 py-2 hover:bg-black/5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-black/5 font-mono text-[11px] font-bold text-zinc-600" title="Timer On Delay (TON)">TON</button>
          </>
        );

      case 'Bit':
        return (
          <>
            <button onClick={() => onAddNode('contact-no')} className="px-4 py-2 hover:bg-black/5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-black/5 font-mono text-[11px] font-bold text-zinc-600" title="Examine if Closed (XIC)">--[ ]--</button>
            <button onClick={() => onAddNode('contact-nc')} className="px-4 py-2 hover:bg-black/5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-black/5 font-mono text-[11px] font-bold text-zinc-600" title="Examine if Open (XIO)">--[/]--</button>
            <button onClick={() => onAddNode('coil')} className="px-4 py-2 hover:bg-black/5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-black/5 font-mono text-[11px] font-bold text-zinc-600" title="Output Energize (OTE)">--( )--</button>
            <button onClick={() => onAddNode('coil-latch')} className="px-4 py-2 hover:bg-black/5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-black/5 font-mono text-[11px] font-bold text-zinc-600" title="Output Latch (OTL)">--(L)--</button>
            <button onClick={() => onAddNode('coil-unlatch')} className="px-4 py-2 hover:bg-black/5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-black/5 font-mono text-[11px] font-bold text-zinc-600" title="Output Unlatch (OTU)">--(U)--</button>
            <button onClick={() => onAddNode('one-shot')} className="px-4 py-2 hover:bg-black/5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-black/5 font-mono text-[11px] font-bold text-zinc-600" title="One Shot (ONS)">[ONS]</button>
            <button onClick={() => onAddNode('branch-start')} className="px-4 py-2 hover:bg-black/5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-black/5 font-mono text-[11px] font-bold text-zinc-600" title="Branch Start (BST)">--+--</button>
          </>
        );

      case 'Timer/Counter':
        return (
          <>
            <button onClick={() => onAddNode('timer-on')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500" title="Timer On Delay (TON)">TON</button>
            <button onClick={() => onAddNode('timer-off')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500" title="Timer Off Delay (TOF)">TOF</button>
            <button onClick={() => onAddNode('retentive-timer')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500" title="Retentive Timer (RTO)">RTO</button>
            <button onClick={() => onAddNode('counter-up')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500" title="Count Up (CTU)">CTU</button>
            <button onClick={() => onAddNode('counter-down')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500" title="Count Down (CTD)">CTD</button>
            <button onClick={() => onAddNode('reset')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500" title="Reset (RES)">RES</button>
          </>
        );
      case 'Input/Output':
        return (
          <>
            <button className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-400 opacity-50 cursor-not-allowed">MSG</button>
            <button className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-400 opacity-50 cursor-not-allowed">GSV</button>
            <button className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-400 opacity-50 cursor-not-allowed">SSV</button>
          </>
        );
      case 'Compare':
        return (
          <>
            <button onClick={() => onAddNode('compare-eq')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500">EQU</button>
            <button onClick={() => onAddNode('compare-ne')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500">NEQ</button>
            <button onClick={() => onAddNode('compare-lt')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500">LES</button>
            <button onClick={() => onAddNode('compare-gt')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500">GRT</button>
            <button className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-400 opacity-50 cursor-not-allowed">LIM</button>
          </>
        );
      case 'Math':
        return (
          <>
            <button onClick={() => onAddNode('math-add')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500">ADD</button>
            <button onClick={() => onAddNode('math-sub')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500">SUB</button>
            <button onClick={() => onAddNode('math-mul')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500">MUL</button>
            <button onClick={() => onAddNode('math-div')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500">DIV</button>
            <button onClick={() => onAddNode('math-mov')} className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-500" title="Move (MOV)">MOV</button>
            <button className="industrial-button font-mono text-[9px] px-2 font-bold text-zinc-400 opacity-50 cursor-not-allowed">CPT</button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col bg-white border-b border-black/5 z-30 select-none shadow-sm">
      {/* Top Controls */}
      <div className="flex items-center space-x-2 px-6 py-2 border-b border-black/5">
        <div className="flex bg-black/5 p-1 rounded-xl">
          <button
            onClick={onToggleSim}
            className={clsx(
              "flex items-center gap-2 px-6 py-1.5 text-[11px] font-bold rounded-lg transition-all active:scale-95",
              isRunning 
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
                : "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
            )}
          >
            {isRunning ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            {isRunning ? 'Offline' : 'Go Online'}
          </button>
        </div>

        <div className="w-px h-6 bg-black/5 mx-2" />

        <button onClick={onSave} className="p-2 hover:bg-black/5 rounded-lg text-zinc-500 transition-all active:scale-90" title="Save Project">
          <Download size={18} />
        </button>
        
        <button onClick={onReset} disabled={!isRunning} className="p-2 hover:bg-black/5 rounded-lg text-zinc-500 transition-all active:scale-90 disabled:opacity-20" title="Reset Simulation">
          <RotateCcw size={18} />
        </button>

        <div className="flex items-center gap-3 px-3 border-l border-black/5 ml-2">
            <div className="relative flex items-center group">
              <Search size={14} className="absolute left-3 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Find tag..."
                className="bg-black/5 border border-transparent rounded-xl px-3 py-1.5 pl-9 text-[11px] font-medium w-48 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch(searchTerm)}
              />
            </div>
        </div>

        <div className="flex-1 px-4">
           <div className="bg-zinc-50 border border-black/5 rounded-xl px-4 py-1.5 text-[10px] text-zinc-500 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="font-bold tracking-tight uppercase opacity-60">Engine_3000 :: {isRunning ? "Scanning..." : "Idle"}</span>
              </div>
              {hasActiveForces && (
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "px-3 py-0.5 rounded-full text-[9px] font-bold tracking-tight",
                    forcesEnabled ? "bg-amber-100 text-amber-700 animate-pulse border border-amber-200" : "bg-zinc-100 text-zinc-500"
                  )}>
                    Forces {forcesEnabled ? "Active" : "Disabled"}
                  </div>
                </div>
              )}
           </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg transition-all active:scale-90"
            title="Clear Routine"
          >
            <Trash2 size={18} />
          </button>
          <button className="p-2 hover:bg-black/5 text-zinc-400 hover:text-black rounded-lg transition-all active:scale-90" title="Share Project">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Instruction Tabs */}
      <div className="flex bg-zinc-50/50 px-6 pt-1 border-b border-black/5">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-t-xl mr-1",
              activeTab === tab 
                ? "bg-white text-blue-600 shadow-sm border-t border-x border-black/5" 
                : "text-zinc-500 hover:text-zinc-900 hover:bg-black/5"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dynamic Instruction Palette */}
      <div className="flex items-center space-x-2 px-6 py-2.5 bg-white min-h-[48px] overflow-x-auto custom-scrollbar">
        {renderInstructions()}
      </div>
    </div>
  );

}
