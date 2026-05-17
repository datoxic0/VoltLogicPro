import React, { useState } from 'react';
import { Database, Search, Filter, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { LadderState } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TagManagerProps {
  state: LadderState;
  onUpdateTag: (address: string, newTag: string) => void;
  onDeleteTag: (address: string) => void;
}

export function TagManager({ state, onUpdateTag, onDeleteTag }: TagManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INPUT' | 'OUTPUT' | 'TIMER' | 'COUNTER' | 'FORCED'>('ALL');
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Extract all unique addresses from the nodes
  const allTags = Array.from(new Set([
    ...state.nodes.map(n => n.address),
    ...Object.keys(state.simulation.forces || {})
  ])).map(addr => {
    const node = state.nodes.find(n => n.address === addr);
    const isForced = state.simulation.forces && state.simulation.forces[addr] !== undefined;
    
    return {
      address: addr,
      tag: node?.tag || (isForced ? 'FORCED_IO' : 'UNNAMED'),
      type: addr.startsWith('I:') ? 'INPUT' : 
            addr.startsWith('O:') ? 'OUTPUT' : 
            addr.startsWith('T4:') ? 'TIMER' : 
            addr.startsWith('C5:') ? 'COUNTER' : 
            addr.startsWith('B3:') ? 'BINARY' : 'DATA',
      value: state.simulation.values[addr],
      isForced
    };
  });

  const filteredTags = allTags.filter(t => {
    const matchesSearch = t.tag.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || 
                         (filterType === 'FORCED' ? t.isForced : t.type === filterType);
    return matchesSearch && matchesFilter;
  });

  const startEditing = (address: string, currentTag: string) => {
    setEditingAddress(address);
    setEditValue(currentTag);
  };

  const saveEdit = () => {
    if (editingAddress) {
      onUpdateTag(editingAddress, editValue);
      setEditingAddress(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-100 overflow-hidden font-sans">
      <div className="bg-white border-b border-zinc-300 p-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-800">Controller Tag Database</h2>
              <p className="text-[10px] text-zinc-500 font-bold">Manage all data points for Offline/Online synchronization</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 text-white rounded text-[10px] font-bold hover:bg-zinc-700 transition-colors">
            <Plus size={14} /> NEW TAG
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Filter by Tag Name or Address (e.g. MOTOR_START, I:0/1)"
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 bg-white border border-zinc-300 rounded text-xs font-bold text-zinc-600 flex items-center gap-2 outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="ALL">ALL TAGS</option>
            <option value="INPUT">INPUTS</option>
            <option value="OUTPUT">OUTPUTS</option>
            <option value="TIMER">TIMERS</option>
            <option value="COUNTER">COUNTERS</option>
            <option value="FORCED">FORCED ONLY</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm border border-zinc-300">
          <thead className="bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest text-left sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 border-b border-zinc-700">Type</th>
              <th className="px-4 py-3 border-b border-zinc-700">Tag Name</th>
              <th className="px-4 py-3 border-b border-zinc-700">Address</th>
              <th className="px-4 py-3 border-b border-zinc-700">Value (Live)</th>
              <th className="px-4 py-3 border-b border-zinc-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {filteredTags.map((tag) => (
              <tr key={tag.address} className="hover:bg-blue-50 transition-colors group">
                <td className="px-4 py-3">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter",
                    tag.type === 'INPUT' ? "bg-amber-100 text-amber-700" :
                    tag.type === 'OUTPUT' ? "bg-blue-100 text-blue-700" :
                    tag.type === 'TIMER' ? "bg-green-100 text-green-700" :
                    tag.type === 'COUNTER' ? "bg-purple-100 text-purple-700" :
                    "bg-zinc-100 text-zinc-600"
                  )}>
                    {tag.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {editingAddress === tag.address ? (
                    <div className="flex items-center gap-2">
                       <input 
                         autoFocus
                         className="px-2 py-1 border border-blue-500 rounded text-xs w-full outline-none"
                         value={editValue}
                         onChange={(e) => setEditValue(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                       />
                       <button onClick={saveEdit} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check size={14} /></button>
                       <button onClick={() => setEditingAddress(null)} className="text-red-600 hover:bg-red-100 p-1 rounded"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900">{tag.tag}</span>
                      {tag.isForced && (
                        <span className={cn(
                          "px-1 rounded text-[7px] font-black tracking-tighter",
                          state.simulation.forcesEnabled ? "bg-amber-500 text-black" : "bg-zinc-400 text-white"
                        )}>
                          FORCED
                        </span>
                      )}
                      <button onClick={() => startEditing(tag.address, tag.tag)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-600 transition-all"><Edit2 size={12} /></button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <code className="text-[10px] font-mono bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-500">
                    {tag.address}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      tag.value ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-zinc-300"
                    )} />
                    <span className="text-[10px] font-mono font-bold">
                       {typeof tag.value === 'boolean' ? (tag.value ? '1' : '0') : tag.value || '0'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => onDeleteTag(tag.address)}
                    className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredTags.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                   <div className="flex flex-col items-center gap-2 opacity-30">
                      <Database size={48} />
                      <p className="text-sm font-bold">No controller tags found matching your search</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="bg-zinc-800 text-zinc-400 p-2 text-[9px] font-mono flex justify-between tracking-tighter shrink-0 border-t border-zinc-700">
         <span>PLC_MEMORY_USAGE: {(allTags.length * 4).toFixed(2)} KB / 64.00 KB</span>
         <span className="text-green-500">DATABASE_SYNC_STATUS: IDEAL</span>
      </div>
    </div>
  );
}
