import React, { useState } from 'react';
import { 
  Square, 
  CircleDot, 
  Timer, 
  Hash, 
  ChevronRight,
  HandMetal,
  Database,
  FileCode,
  Folder,
  Cpu,
  Activity,
  Box,
  Settings,
  Minus,
  ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { NodeType } from '../types';

interface SidebarProps {
  onAddNode: (type: NodeType | 'wire') => void;
  placementType: NodeType | 'wire' | null;
  currentView: 'routine' | 'tags' | 'blocks';
  onViewChange: (view: 'routine' | 'tags' | 'blocks') => void;
}

const COMPONENTS: { type: NodeType | 'wire'; label: string; icon: any; category: string }[] = [
  { type: 'contact-no', label: 'Examine if Closed', icon: Square, category: 'Bit' },
  { type: 'contact-nc', label: 'Examine if Open', icon: HandMetal, category: 'Bit' },
  { type: 'coil', label: 'Output Energize', icon: CircleDot, category: 'Bit' },
  { type: 'wire' as any, label: 'Manual Connection', icon: Activity, category: 'Bit' },
  { type: 'branch-start', label: 'Branch Start', icon: ChevronRight, category: 'Bit' },
  { type: 'wire-vertical', label: 'Vertical Wire', icon: Minus, category: 'Bit' },
  { type: 'wire-junction', label: 'Wiring Junction', icon: CircleDot, category: 'Bit' },
  { type: 'timer-on', label: 'Timer On Delay', icon: Timer, category: 'Timer/Counter' },
];

export function Sidebar({ onAddNode, placementType, currentView, onViewChange }: SidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    project: true,
    tasks: true,
    mainTask: true,
    mainProg: true,
    io: true
  });

  const toggle = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-64 bg-zinc-50 border-r border-black/5 flex flex-col z-20 text-[12px] select-none h-full font-sans">
      <div className="h-10 px-4 flex items-center justify-between border-b border-black/5 bg-white/50 backdrop-blur-sm">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">Organizer</span>
        <div className="flex gap-1">
           <div className="w-2 h-2 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
           <div className="w-2 h-2 rounded-full bg-[#febc2e] border border-[#d8a023]" />
           <div className="w-2 h-2 rounded-full bg-[#28c840] border border-[#1a8c2e]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
        {/* Project Tree */}
        <div className="px-2 space-y-0.5">
          <div 
            className="flex items-center gap-2 text-zinc-800 font-semibold px-2 py-1.5 hover:bg-black/5 cursor-pointer rounded-lg transition-colors"
            onClick={() => toggle('project')}
          >
             {expanded.project ? <ChevronDown size={14} className="text-zinc-400" /> : <ChevronRight size={14} className="text-zinc-400" />}
             <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                <Database size={12} className="text-blue-600" />
             </div>
             <span>Controller Logic</span>
          </div>
          
          {expanded.project && (
            <div className="pl-6 space-y-0.5">
              <div 
                className={clsx(
                  "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer",
                  currentView === 'tags' ? "bg-white shadow-sm text-blue-600 font-bold border border-black/5" : "text-zinc-500 hover:bg-black/5"
                )}
                onClick={() => onViewChange('tags')}
              >
                 <Folder size={14} className={currentView === 'tags' ? "text-blue-500" : "text-zinc-400"} /> 
                 <span>Project Tags</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 px-2 py-1.5 hover:bg-black/5 cursor-pointer rounded-lg opacity-60">
                 <Settings size={14} /> 
                 <span>System Configuration</span>
              </div>

              {/* Tasks Section */}
              <div 
                className="flex items-center gap-2 text-zinc-800 font-semibold px-2 py-1.5 hover:bg-black/5 cursor-pointer rounded-lg transition-colors"
                onClick={() => toggle('tasks')}
              >
                 {expanded.tasks ? <ChevronDown size={14} className="text-zinc-400" /> : <ChevronRight size={14} className="text-zinc-400" />}
                 <div className="w-5 h-5 bg-zinc-100 rounded flex items-center justify-center">
                    <Cpu size={12} className="text-zinc-500" />
                 </div>
                 <span>Tasks</span>
              </div>

              {expanded.tasks && (
                <div className="pl-6 space-y-0.5">
                  <div 
                    className="flex items-center gap-2 text-zinc-700 font-medium px-2 py-1.5 hover:bg-black/5 cursor-pointer rounded-lg transition-colors"
                    onClick={() => toggle('mainTask')}
                  >
                     {expanded.mainTask ? <ChevronDown size={14} className="text-zinc-400" /> : <ChevronRight size={14} className="text-zinc-400" />}
                     <Activity size={14} className="text-green-500" />
                     <span>MainTask</span>
                  </div>

                  {expanded.mainTask && (
                    <div className="pl-4 space-y-0.5 border-l border-black/5 ml-3 my-1">
                      <div 
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-black/5 cursor-pointer rounded-lg transition-colors"
                        onClick={() => toggle('mainProg')}
                      >
                         {expanded.mainProg ? <ChevronDown size={14} className="text-zinc-400" /> : <ChevronRight size={14} className="text-zinc-400" />}
                         <Folder size={14} className="text-amber-500" />
                         <span>MainProgram</span>
                      </div>
                      
                      {expanded.mainProg && (
                        <div className="pl-6 space-y-0.5">
                           <div 
                            className={clsx(
                              "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer",
                              currentView === 'routine' ? "bg-white shadow-sm text-blue-600 font-bold border border-black/5" : "text-zinc-500 hover:bg-black/5"
                            )}
                            onClick={() => onViewChange('routine')}
                           >
                              <FileCode size={14} className={currentView === 'routine' ? "text-blue-500" : "text-zinc-400"} />
                              <span>Routine (LAD)</span>
                           </div>
                           <div 
                            className={clsx(
                              "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer",
                              currentView === 'blocks' ? "bg-white shadow-sm text-blue-600 font-bold border border-black/5" : "text-zinc-500 hover:bg-black/5"
                            )}
                            onClick={() => onViewChange('blocks')}
                           >
                              <Box size={14} className={currentView === 'blocks' ? "text-blue-500" : "text-zinc-400"} />
                              <span>Blocks (FBD)</span>
                           </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Instructions Palette */}
        <div className="mt-8 px-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400 mb-3 px-2">Palette</div>
          <div className="grid grid-cols-2 gap-2">
            {COMPONENTS.map((comp) => (
              <button
                key={comp.type}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNode(comp.type);
                }}
                className={clsx(
                  "flex flex-col items-center justify-center py-4 rounded-xl border transition-all active:scale-95",
                  placementType === comp.type 
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30" 
                    : "bg-white border-black/5 hover:bg-zinc-50 text-zinc-500 shadow-sm"
                )}
                title={comp.label}
              >
                <comp.icon size={18} strokeWidth={2.5} />
                <span className="text-[10px] font-bold mt-1.5">
                  {comp.type === 'contact-no' ? 'XIC' : 
                   comp.type === 'contact-nc' ? 'XIO' : 
                   comp.type === 'coil' ? 'OTE' : 
                   comp.type === 'wire' ? 'WIRE' :
                   comp.type === 'branch-start' ? 'BST' :
                   comp.type === 'wire-vertical' ? 'VERT' :
                   comp.type === 'wire-junction' ? 'JUNC' : 'TON'}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-[10px] text-blue-600 leading-relaxed">
             Select instruction above then tap on a rung to implement logic.
          </div>
        </div>
      </div>
    </div>
  );
}
