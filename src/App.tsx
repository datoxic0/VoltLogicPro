import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Download, 
  Upload, 
  Trash2, 
  MousePointer2, 
  Plus,
  Minus,
  X,
  Settings2,
  Info,
  ChevronRight,
  Database,
  Cpu,
  PanelLeft,
  PanelRight,
  Monitor,
  Maximize2,
  Activity,
  ChevronDown,
  Zap,
  Search
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { 
  LineChart, 
  Line, 
  ResponsiveContainer 
} from 'recharts';

import { LadderState, LadderNode, NodeType, GRID_SIZE, NODE_WIDTH, NODE_HEIGHT, LEFT_RAIL_X, RIGHT_RAIL_X, RUNG_HEIGHT } from './types';
import { TagManager } from './components/TagManager';
import { solveCircuit } from './simulator';
import { Sidebar } from './components/Sidebar';
import { LadderCanvas } from './components/LadderCanvas';
import { PropertyInspector } from './components/PropertyInspector';
import { Toolbar } from './components/Toolbar';
import { BlockView } from './components/BlockView';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_STATE: LadderState = {
  nodes: [
    {
      id: 'init-1',
      type: 'contact-no',
      x: 160,
      y: (RUNG_HEIGHT/2) - (NODE_HEIGHT/2),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      tag: 'START_PB',
      address: 'I:0/1'
    },
    {
      id: 'init-2',
      type: 'coil',
      x: 704,
      y: (RUNG_HEIGHT/2) - (NODE_HEIGHT/2),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      tag: 'MOTOR_RUN',
      address: 'O:0/1'
    }
  ],
  wires: [],
  rungComments: { 0: 'START/STOP MOTOR LOGIC' },
  simulation: {
    isRunning: false,
    forcesEnabled: true,
    forces: {},
    values: {
      'I:0/1': false,
      'O:0/1': false
    },
    history: {},
    logs: [
      { id: 'l1', timestamp: Date.now(), message: 'Kernel Buffer Initialized', type: 'info' },
      { id: 'l2', timestamp: Date.now(), message: 'System Ready', type: 'info' }
    ]
  }
};

import { IOSimulator } from './components/IOSimulator';

export default function App() {
  const [state, setState] = useState<LadderState>(() => {
    try {
      const saved = localStorage.getItem('voltlogic_circuit_v3');
      const parsed = saved ? JSON.parse(saved) : INITIAL_STATE;
      
      // Migration: Ensure all simulation properties exist
      if (parsed.simulation) {
        if (!parsed.simulation.logs) parsed.simulation.logs = INITIAL_STATE.simulation.logs || [];
        if (!parsed.simulation.forces) parsed.simulation.forces = {};
        if (!parsed.simulation.history) parsed.simulation.history = {};
        if (!parsed.simulation.values) parsed.simulation.values = INITIAL_STATE.simulation.values;
      }
      
      return parsed;
    } catch (e) {
      return INITIAL_STATE;
    }
  });
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placementType, setPlacementType] = useState<NodeType | null>(null);
  const [viewport, setViewport] = useState({ x: 50, y: 50, zoom: 0.9 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [consoleTab, setConsoleTab] = useState<'watch' | 'cross' | 'forces' | 'trends' | 'logs'>('watch');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isPropertyOpen, setIsPropertyOpen] = useState(true);
  const [inspectorWidth, setInspectorWidth] = useState(350);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(250);
  
  const resizingPanel = useRef<'sidebar' | 'inspector' | 'console' | null>(null);

  const startResizing = useCallback((panel: 'sidebar' | 'inspector' | 'console') => {
    resizingPanel.current = panel;
    document.body.style.cursor = panel === 'console' ? 'row-resize' : 'col-resize';
  }, []);

  const stopResizing = useCallback(() => {
    resizingPanel.current = null;
    document.body.style.cursor = 'default';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (resizingPanel.current === 'inspector') {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 250 && newWidth < 700) {
        setInspectorWidth(newWidth);
      }
    } else if (resizingPanel.current === 'sidebar') {
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 500) {
        setSidebarWidth(newWidth);
      }
    } else if (resizingPanel.current === 'console') {
      const newHeight = window.innerHeight - e.clientY - 32; // adjusted for footer
      if (newHeight > 100 && newHeight < 600) {
        setConsoleHeight(newHeight);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);
  const [currentView, setCurrentView] = useState<'routine' | 'tags' | 'blocks'>('routine');
  const [showIOSim, setShowIOSim] = useState(false);
  const [isCommunicating, setIsCommunicating] = useState<string | null>(null);
  const [showWhoActive, setShowWhoActive] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: 'info' | 'error' | 'success' }[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'F2') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setIsPropertyOpen(prev => !prev);
      } else if (e.key === 'F6') {
        e.preventDefault();
        setIsConsoleOpen(prev => !prev);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          deleteNode(selectedId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const addLog = (message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => ({
      ...prev,
      simulation: {
        ...prev.simulation,
        logs: [{ id, timestamp: Date.now(), message, type }, ...prev.simulation.logs.slice(0, 99)]
      }
    }));
  };

  const addNotification = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, text, type }]);
    
    // Also log it
    addLog(text, type === 'error' ? 'error' : (type === 'success' ? 'info' : 'info'));
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000); 
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.menu-container')) {
        setActiveMenu(null);
      }
    };
    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  const handleVerify = () => {
    const errors: string[] = [];
    state.nodes.forEach(node => {
      if (!node.tag || node.tag.trim() === '') {
        errors.push(`Empty tag at ${node.address || 'unassigned address'}`);
      }
    });

    if (errors.length > 0) {
      addNotification(`Verification failed: ${errors.length} errors found.`, 'error');
    } else {
      addNotification("Routine verified: 0 errors, 0 warnings.", "success");
    }
    setActiveMenu(null);
  };

  const handleExport = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `controller_logic_${new Date().toISOString().split('T')[0]}.vlp`;
    a.click();
    URL.revokeObjectURL(url);
    setActiveMenu(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedState = JSON.parse(event.target?.result as string);
        if (importedState.nodes) {
          setState(importedState);
          setPlacementType(null);
          setSelectedId(null);
        }
      } catch (err) {
        console.error("Failed to import project:", err);
        alert("Invalid project file format.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveMenu(null);
  };

  const disableAllForces = () => {
    setState(prev => ({
      ...prev,
      simulation: {
        ...prev.simulation,
        forcesEnabled: false
      }
    }));
    addNotification("Forces Disabled Globally", "info");
    setActiveMenu(null);
  };

  const removeAllForces = () => {
    setState(prev => ({
      ...prev,
      simulation: {
        ...prev.simulation,
        forces: {}
      }
    }));
    addNotification("All Forces Removed", "info");
    setActiveMenu(null);
  };

  const enableForces = () => {
    setState(prev => ({
      ...prev,
      simulation: {
        ...prev.simulation,
        forcesEnabled: true
      }
    }));
    addNotification("Forces Enabled Globally", "success");
    setActiveMenu(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setIsPropertyOpen(prev => !prev);
      } else if (e.key === 'F6') {
        e.preventDefault();
        setIsConsoleOpen(prev => !prev);
      } else if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // Focus search if added
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('voltlogic_circuit_v3', JSON.stringify(state));
  }, [state]);

  // Keyboard shortcuts and Global clicks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && !isModalOpen) {
          const target = document.activeElement;
          if (target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
            setSelectedId(null);
            setState(prev => ({
               ...prev,
               nodes: prev.nodes.filter(n => n.id !== selectedId)
            }));
          }
        }
      }
      if (e.key === 'Escape') {
        setPlacementType(null);
        setActiveMenu(null);
        if (isModalOpen) setIsModalOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('header') && !target.closest('.menu-container')) {
        setActiveMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedId, isModalOpen]);

  // Simulation loop
  useEffect(() => {
    if (!state.simulation.isRunning) return;

    const interval = setInterval(() => {
      setState(prev => {
        const nextValues = solveCircuit(prev);
        const nextHistory = { ...prev.simulation.history };
        
        let changed = JSON.stringify(nextValues) !== JSON.stringify(prev.simulation.values);

        // Record history for visualization trends
        Object.entries(nextValues).forEach(([addr, val]) => {
          const numVal = typeof val === 'boolean' ? (val ? 1 : 0) : val as number;
          const h = nextHistory[addr] || [];
          
          // Always add sample for smooth scrolling
          nextHistory[addr] = [...h.slice(-49), numVal];
          changed = true;
        });

        if (!changed) return prev;

        return {
          ...prev,
          simulation: {
            ...prev.simulation,
            values: nextValues,
            history: nextHistory
          }
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [state.simulation.isRunning]);

  const addNode = (type: NodeType, x: number, y: number) => {
    let address = `B3:0/${state.nodes.length}`;
    if (type === 'coil' || type === 'coil-latch' || type === 'coil-unlatch') address = `O:0/${state.nodes.length}`;
    else if (type.startsWith('contact') || type === 'one-shot') address = `I:0/${state.nodes.length}`;
    else if (type.startsWith('timer')) address = `T4:${state.nodes.length}`;
    else if (type.startsWith('counter')) address = `C5:${state.nodes.length}`;
    else if (type.startsWith('compare') || type.startsWith('math')) address = `N7:${state.nodes.length}`;

    const newNode: LadderNode = {
      id: `node-${Date.now()}`,
      type,
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round((y - RUNG_HEIGHT/2) / RUNG_HEIGHT) * RUNG_HEIGHT + (RUNG_HEIGHT/2 - NODE_HEIGHT/2),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      tag: `${type.toUpperCase().replace('-', '_')}_${state.nodes.length + 1}`,
      address,
      params: {
        preset: type.startsWith('timer') ? 5 : (type.startsWith('counter') ? 10 : undefined),
        sourceA: (type.startsWith('compare') || type.startsWith('math')) ? `N7:0` : undefined,
        sourceB: (type.startsWith('compare') || type.startsWith('math')) ? 0 : undefined,
        dest: type.startsWith('math') ? `N7:1` : undefined
      }
    };
    setState(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    setSelectedId(newNode.id);
  };

  const updateNode = (id: string, updates: Partial<LadderNode>) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === id ? { ...n, ...updates } : n)
    }));
  };

  const deleteNode = (id: string) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== id)
    }));
    if (selectedId === id) setSelectedId(null);
  };

  const toggleSimulation = () => {
    setState(prev => ({
      ...prev,
      simulation: {
        ...prev.simulation,
        isRunning: !prev.simulation.isRunning
      }
    }));
  };

  const toggleAddress = (address: string) => {
    if (!state.simulation.isRunning) return;
    setState(prev => ({
      ...prev,
      simulation: {
        ...prev.simulation,
        values: {
          ...prev.simulation.values,
          [address]: !prev.simulation.values[address]
        }
      }
    }));
  };

  const simulateCommAction = (type: 'UPLOAD' | 'DOWNLOAD') => {
    setIsCommunicating(type);
    
    setTimeout(() => {
      setIsCommunicating(null);
      addNotification(`${type} COMPLETED SUCCESSFULLY`, "success");
      if (type === 'DOWNLOAD') {
        setState(prev => ({ ...prev, simulation: { ...prev.simulation, isRunning: true } }));
      }
    }, 2500);
  };

  const handleForceIO = (address: string, value?: boolean) => {
    setState(prev => {
      const nextForces = { ...(prev.simulation.forces || {}) };
      if (value === undefined) {
        delete nextForces[address];
      } else {
        nextForces[address] = value;
      }
      return {
        ...prev,
        simulation: {
          ...prev.simulation,
          forces: nextForces
        }
      };
    });
  };

  const updateTagByAddress = (address: string, newTag: string) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.address === address ? { ...n, tag: newTag } : n)
    }));
    addNotification(`Tag updated: ${address} -> ${newTag}`, "success");
  };

  const handleRungAction = (index: number, action: 'delete' | 'edit-comment') => {
    if (action === 'delete') {
      const y = index * RUNG_HEIGHT + (RUNG_HEIGHT/2 - NODE_HEIGHT/2);
      setState(prev => ({
        ...prev,
        nodes: prev.nodes.filter(n => Math.round(n.y) !== Math.round(y)),
        rungComments: Object.fromEntries(
           Object.entries(prev.rungComments || {}).filter(([k]) => Number(k) !== index)
        )
      }));
      addNotification(`Rung ${index} cleared`, "info");
    } else {
      const comment = prompt("Enter Rung Comment:", state.rungComments[index] || "");
      if (comment !== null) {
        setState(prev => ({
          ...prev,
          rungComments: { ...prev.rungComments, [index]: comment }
        }));
      }
    }
  };

  const handleSearch = (term: string) => {
    const node = state.nodes.find(n => 
      n.tag?.toLowerCase().includes(term.toLowerCase()) || 
      n.address?.toLowerCase().includes(term.toLowerCase())
    );
    if (node) {
      setViewport({
        x: -node.x * viewport.zoom + 400,
        y: -node.y * viewport.zoom + 300,
        zoom: viewport.zoom
      });
      setSelectedId(node.id);
      addNotification(`Moved to ${node.tag || node.address}`, "info");
    } else {
       addNotification(`Search term "${term}" not found`, "error");
    }
  };

  const deleteTagByAddress = (address: string) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.address !== address)
    }));
    addNotification(`All instructions with address ${address} removed`, "info");
  };

  const handleClear = () => {
    setState({ ...INITIAL_STATE, nodes: [] });
    setSelectedId(null);
  };

  const handleCanvasClick = (x: number, y: number) => {
    if (placementType) {
      addNode(placementType, x, y);
      setPlacementType(null); 
    } else {
      setSelectedId(null);
      setActiveMenu(null);
    }
  };

  const handleNodeDoubleClick = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen font-sans overflow-hidden bg-[#fbfbfd] text-[#1d1d1f] select-none">
      {/* System Status Bar (Topmost) */}
      <div className="h-7 bg-white flex items-center justify-between px-6 text-[10px] font-medium tracking-tight border-b border-black/5 shrink-0 z-[60]">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", state.simulation.isRunning ? "bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" : "bg-zinc-700")} />
                <span className="text-zinc-500">SYS_KERNEL: <span className="text-white">AIS_3000_RT</span></span>
             </div>
             <div className="w-px h-3 bg-zinc-800" />
             <span className="text-zinc-500">MODE: <span className={state.simulation.isRunning ? "text-green-500" : "text-amber-500"}>{state.simulation.isRunning ? "RUN_REMOTE" : "PROGRAM_LOCAL"}</span></span>
          </div>
          <div className="flex items-center gap-6">
             <span className="text-zinc-600">I/O_SYNC: <span className="text-zinc-400 font-mono">1.2ms</span></span>
             <span className="text-zinc-600 font-mono">LOCAL_IP: 127.0.0.1</span>
          </div>
      </div>

      {/* Main Header / View Selector */}
      <header className="h-14 bg-white/50 backdrop-blur-xl border-b border-black/5 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
             <div className="bg-black p-2 rounded-xl shadow-lg shadow-black/5">
                <Zap size={16} className="text-white fill-white" />
             </div>
             <div className="flex flex-col leading-tight">
                <h1 className="text-sm font-bold tracking-tight">VoltLogic Pro</h1>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Industrial Studio</span>
             </div>
          </div>
          
          <div className="flex bg-black/5 rounded-xl p-1 border border-black/5">
              <button 
                onClick={() => setCurrentView('routine')}
                className={cn(
                  "px-6 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                  currentView === 'routine' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                )}
              >Routine</button>
              <button 
                onClick={() => setCurrentView('blocks')}
                className={cn(
                  "px-6 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                  currentView === 'blocks' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                )}
              >Blocks</button>
              <button 
                onClick={() => setCurrentView('tags')}
                className={cn(
                  "px-6 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                  currentView === 'tags' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                )}
              >Tags</button>
          </div>

          <div className="flex items-center px-1 bg-black/5 rounded-lg border border-black/5">
            {['File', 'Edit', 'View', 'Logic', 'Comm', 'Help'].map((menu) => (
              <div key={menu} className="relative menu-container">
                <button 
                  className={cn(
                    "text-[11px] font-medium hover:bg-black/5 transition-all px-3 h-8 flex items-center rounded-md",
                    activeMenu === menu && "bg-white shadow-sm text-black"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(activeMenu === menu ? null : menu);
                  }}
                >
                  {menu}
                </button>
                {activeMenu === menu && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-black/5 rounded-xl shadow-2xl py-2 z-[100] text-zinc-900 ring-1 ring-black/5 backdrop-blur-xl">
                     {menu === 'File' && (
                       <>
                         <button onClick={() => { handleClear(); setActiveMenu(null); addNotification("New Project Created"); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors">New Project <span className="opacity-40 text-[10px]">⌘N</span></button>
                         <button onClick={() => { fileInputRef.current?.click(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[12px] font-medium transition-colors">Open Project...</button>
                         <hr className="my-1 border-black/5" />
                         <button onClick={() => { handleExport(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[12px] font-medium transition-colors">Save As VLP...</button>
                         <button onClick={() => { setActiveMenu(null); if(confirm("Close application?")) window.location.reload(); }} className="w-full text-left px-4 py-2 hover:bg-red-600 hover:text-white text-[12px] font-medium transition-colors">Exit Application</button>
                       </>
                     )}
                     {menu === 'Edit' && (
                       <>
                         <button onClick={() => setActiveMenu(null)} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors">Undo <span className="opacity-40 text-[10px]">⌘Z</span></button>
                         <button onClick={() => setActiveMenu(null)} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors">Redo <span className="opacity-40 text-[10px]">⌘Y</span></button>
                         <hr className="my-1 border-black/5" />
                         <button onClick={() => setActiveMenu(null)} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors">Cut <span className="opacity-40 text-[10px]">⌘X</span></button>
                         <button onClick={() => setActiveMenu(null)} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors">Copy <span className="opacity-40 text-[10px]">⌘C</span></button>
                         <button onClick={() => setActiveMenu(null)} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors">Paste <span className="opacity-40 text-[10px]">⌘V</span></button>
                         <button 
                           onClick={() => { if(selectedId){ deleteNode(selectedId); addNotification("Element deleted"); } setActiveMenu(null); }} 
                           className={cn("w-full text-left px-4 py-2 hover:bg-red-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors", !selectedId && "opacity-30 pointer-events-none")}
                         >
                           Delete <span className="opacity-40 text-[10px]">⌫</span>
                         </button>
                       </>
                     )}
                     {menu === 'View' && (
                       <>
                         <button onClick={() => { setViewport(v => ({ ...v, zoom: v.zoom + 0.1 })); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[12px] font-medium transition-colors">Zoom In (+)</button>
                         <button onClick={() => { setViewport(v => ({ ...v, zoom: Math.max(0.2, v.zoom - 0.1) })); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[12px] font-medium transition-colors">Zoom Out (-)</button>
                         <button onClick={() => { setViewport(v => ({ ...v, zoom: 0.9 })); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[12px] font-medium transition-colors">Reset Zoom (0)</button>
                         <hr className="my-1 border-black/5" />
                         <button onClick={() => { setIsSidebarOpen(!isSidebarOpen); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors">
                           Controller Organizer <span>{isSidebarOpen ? '✔' : ''}</span>
                         </button>
                         <button onClick={() => { setIsConsoleOpen(!isConsoleOpen); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors">
                           Service Monitor <span>{isConsoleOpen ? '✔' : ''}</span>
                         </button>
                         <button onClick={() => { setShowIOSim(!showIOSim); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[12px] font-medium transition-colors">
                           I/O Simulator <span>{showIOSim ? '✔' : ''}</span>
                         </button>
                       </>
                     )}
                     {menu === 'Logic' && (
                       <>
                         <button onClick={() => { handleVerify(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium">Verify Routine</button>
                         <hr className="my-1 border-zinc-800" />
                         <button onClick={() => { state.simulation.forcesEnabled ? disableAllForces() : enableForces(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex justify-between items-center text-[11px] font-medium">
                            {state.simulation.forcesEnabled ? "Disable" : "Enable"} Forces
                            <span className={cn("text-[8px] font-bold px-1 rounded", state.simulation.forcesEnabled ? "bg-amber-500 text-black" : "bg-zinc-700")}>
                               {state.simulation.forcesEnabled ? "ACTIVE" : "OFF"}
                            </span>
                         </button>
                         <button onClick={() => { removeAllForces(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium">Remove All Forces</button>
                         <hr className="my-1 border-zinc-800" />
                         <button onClick={() => { addNotification("Memory re-optimized"); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium">Compact Memory</button>
                       </>
                     )}
                     {menu === 'Comm' && (
                       <>
                         <button onClick={() => { setShowWhoActive(true); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium">Who Active...</button>
                         <button onClick={() => { toggleSimulation(); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium">
                           {state.simulation.isRunning ? "Go Offline" : "Go Online"}
                         </button>
                         <hr className="my-1 border-zinc-800" />
                         <button onClick={() => { simulateCommAction('UPLOAD'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium">Upload...</button>
                         <button onClick={() => { simulateCommAction('DOWNLOAD'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium">Download...</button>
                       </>
                     )}
                     {menu === 'Help' && (
                       <>
                         <button onClick={() => { alert("VoltLogic Pro Industrial Studio v5.0\nEngine: VoltV7000-RT"); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium">About System</button>
                         <button onClick={() => { addNotification("Help content redirected to console"); setActiveMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white text-[11px] font-medium">Instruction Help</button>
                       </>
                     )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1 bg-black/5 px-2 py-1 rounded-lg border border-black/5 mr-2">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={cn("p-2 rounded-md transition-all active:scale-95", isSidebarOpen ? "bg-white shadow-sm text-blue-600" : "text-zinc-500 hover:bg-black/5")}
                title="Project Explorer (F2)"
              ><PanelLeft size={18} /></button>
              <button 
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                className={cn("p-2 rounded-md transition-all active:scale-95", isConsoleOpen ? "bg-white shadow-sm text-blue-600" : "text-zinc-500 hover:bg-black/5")}
                title="Service Monitor (F6)"
              ><Monitor size={18} /></button>
              <button 
                onClick={() => setIsPropertyOpen(!isPropertyOpen)}
                className={cn("p-2 rounded-md transition-all active:scale-95", isPropertyOpen ? "bg-white shadow-sm text-blue-600" : "text-zinc-500 hover:bg-black/5")}
                title="Properties (F4)"
              ><PanelRight size={18} /></button>
           </div>

           <button 
            onClick={toggleSimulation}
            className={cn(
              "pl-4 pr-6 py-2 rounded-xl text-[11px] font-bold tracking-tight transition-all shadow-sm active:scale-95 flex items-center gap-2 border",
              state.simulation.isRunning 
                ? "bg-blue-600 border-blue-500 text-white" 
                : "bg-white border-black/10 text-zinc-600 hover:bg-zinc-50"
            )}
           >
             <div className={cn("w-2 h-2 rounded-full", state.simulation.isRunning ? "bg-white animate-pulse" : "bg-zinc-300")} />
             {state.simulation.isRunning ? "Online: Run" : "Offline / Program"}
           </button>
        </div>
      </header>

      {/* Primary Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence>
          {isSidebarOpen && (
            <div className="flex shrink-0">
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: sidebarWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-zinc-50 border-r border-black/5 flex flex-col overflow-hidden"
              >
                <Sidebar 
                  onAddNode={(type) => setPlacementType(type)}
                  placementType={placementType}
                  currentView={currentView}
                  onViewChange={setCurrentView}
                />
              </motion.div>
              {/* Resizer Handle Left */}
              <div 
                  onMouseDown={() => startResizing('sidebar')}
                  className="w-1.5 h-full bg-black hover:bg-blue-600 cursor-col-resize transition-colors flex items-center justify-center group z-10"
              >
                  <div className="w-[1px] h-10 bg-zinc-800 group-hover:bg-blue-400 opacity-50" />
              </div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
             {currentView === 'routine' && (
               <>
                 <Toolbar 
                    isRunning={state.simulation.isRunning}
                    hasActiveForces={Object.keys(state.simulation.forces || {}).length > 0}
                    forcesEnabled={state.simulation.forcesEnabled}
                    onToggleSim={toggleSimulation}
                    onReset={() => setState(prev => ({ ...prev, simulation: { ...prev.simulation, values: {} } }))}
                    onClear={handleClear}
                    onAddNode={(type) => setPlacementType(type)}
                    onSave={handleExport}
                    onSearch={handleSearch}
                  />
                  <div className="flex-1 relative overflow-hidden">
                     <LadderCanvas 
                        state={state}
                        selectedId={selectedId}
                        viewport={viewport}
                        placementType={placementType}
                        onSelect={setSelectedId}
                        onUpdateNode={updateNode}
                        onToggleAddress={toggleAddress}
                        onViewportChange={setViewport}
                        onCanvasClick={handleCanvasClick}
                        onNodeDoubleClick={handleNodeDoubleClick}
                        onRungAction={handleRungAction}
                      />
                      
                       {/* Diagnostic Overlay */}
                       <div className="absolute top-6 left-6 z-40 flex flex-col gap-1.5 p-3 glass rounded-2xl shadow-xl pointer-events-none font-sans">
                          <div className="flex items-center gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Logic Scan: <span className="text-black">{(Math.random() * 0.3 + 0.05).toFixed(2)}ms</span></span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Kernel Mem: <span className="text-black">{Math.floor(state.nodes.length * 1.2 + 38)}kb / 2MB</span></span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Threads: <span className="text-black">{state.simulation.isRunning ? "8" : "0"}</span></span>
                          </div>
                       </div>

                       {/* Floating Zoom Controls */}
                       <div className="absolute bottom-8 right-8 z-40 flex flex-col gap-1 p-1 bg-white/70 backdrop-blur-xl rounded-2xl border border-black/5 shadow-2xl overflow-hidden active:scale-[0.98] transition-transform">
                          <button 
                            onClick={() => setViewport(v => ({...v, zoom: Math.min(2, v.zoom + 0.1)}))}
                            className="w-10 h-10 flex items-center justify-center hover:bg-black/5 transition-colors text-zinc-800"
                            title="Zoom In"
                          >
                             <Plus size={18} />
                          </button>
                          <div className="h-px bg-black/5 mx-2" />
                          <button 
                            onClick={() => setViewport(v => ({...v, zoom: Math.max(0.2, v.zoom - 0.1)}))}
                            className="w-10 h-10 flex items-center justify-center hover:bg-black/5 transition-colors text-zinc-800"
                            title="Zoom Out"
                          >
                             <Minus size={18} />
                          </button>
                          <div className="h-px bg-black/5 mx-2" />
                          <button 
                             onClick={() => setViewport(v => ({...v, zoom: 0.9}))}
                             className="w-10 h-10 flex items-center justify-center text-[10px] font-bold text-zinc-400 hover:bg-black/5 transition-colors"
                             title="Reset Zoom"
                          >
                             100%
                          </button>
                       </div>
                       
                       <div className="absolute bottom-6 left-6 z-40 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold text-white tracking-widest shadow-lg">
                          CANVAS_VIEW: {Math.round(viewport.zoom * 100)}%
                       </div>
                  </div>
               </>
             )}

             {currentView === 'blocks' && (
               <BlockView 
                 state={state}
                 onNodeClick={(id) => {
                    const node = state.nodes.find(n => n.id === id);
                    if (node) {
                      setViewport({ x: -node.x * viewport.zoom + 400, y: -node.y * viewport.zoom + 300, zoom: viewport.zoom });
                      setSelectedId(id);
                      setCurrentView('routine');
                    }
                 }}
               />
             )}

             {currentView === 'tags' && (
                <TagManager state={state} onUpdateTag={updateTagByAddress} onDeleteTag={deleteTagByAddress} />
             )}

          <AnimatePresence>
            {isConsoleOpen && (
              <div className="flex flex-col shrink-0">
                {/* Resizer Handle Top (Console) */}
                <div 
                   onMouseDown={() => startResizing('console')}
                   className="h-1 w-full bg-black/5 hover:bg-blue-400 cursor-row-resize transition-colors flex items-center justify-center group z-10"
                >
                   <div className="h-[1px] w-8 bg-black/10 group-hover:bg-blue-400 opacity-50" />
                </div>
                
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: consoleHeight }}
                  exit={{ height: 0 }}
                  className="bg-white border-t border-black/5 flex flex-col overflow-hidden"
                >
                  <div className="h-10 bg-zinc-50/50 border-b border-black/5 flex items-center px-4 justify-between">
                   <div className="flex bg-black/5 rounded-lg p-0.5">
                       {['watch', 'trends', 'forces', 'cross', 'logs'].map(tab => (
                         <button 
                            key={tab}
                            onClick={() => setConsoleTab(tab as any)}
                            className={cn(
                              "px-4 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                              consoleTab === tab ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                            )}
                         >{tab}</button>
                       ))}
                   </div>
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Buffer: Optimal</span>
                      <button onClick={() => setIsConsoleOpen(false)} className="text-zinc-400 hover:text-black transition-colors"><X size={14} /></button>
                   </div>
                </div>
                <div className="flex-1 overflow-auto bg-white custom-scrollbar">
                   {consoleTab === 'watch' && (
                      <table className="w-full text-left text-[11px] border-collapse">
                         <thead className="bg-zinc-50 text-zinc-400 sticky top-0 uppercase tracking-widest font-bold">
                           <tr>
                             <th className="px-6 py-2 border-b border-black/5">Address</th>
                             <th className="px-6 py-2 border-b border-black/5">Tag</th>
                             <th className="px-6 py-2 border-b border-black/5 text-right">Value</th>
                             <th className="px-6 py-2 border-b border-black/5 text-right">Status</th>
                           </tr>
                         </thead>
                         <tbody>
                            {state.nodes.map(n => (
                              <tr key={n.id} className="border-b border-zinc-900/50 hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-1.5 text-blue-400 font-bold">{n.address}</td>
                                <td className="px-6 py-1.5 text-zinc-500 italic">{n.tag}</td>
                                <td className="px-6 py-1.5 text-right font-black tabular-nums">
                                   <span className={cn(
                                     "px-2 py-0.5 rounded",
                                     typeof state.simulation.values[n.address] === 'boolean' 
                                       ? (state.simulation.values[n.address] ? "bg-green-500/20 text-green-500" : "bg-zinc-800 text-zinc-600")
                                       : "text-blue-500"
                                   )}>
                                      {typeof state.simulation.values[n.address] === 'boolean' 
                                        ? (state.simulation.values[n.address] ? 'ON' : 'OFF') 
                                        : (state.simulation.values[n.address]?.toString() || '0')}
                                   </span>
                                </td>
                                <td className="px-6 py-1.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button 
                                     onClick={() => setSelectedId(n.id)}
                                     className="text-blue-500 hover:underline font-black uppercase text-[8px]"
                                   >Inspect</button>
                                </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   )}

                   {consoleTab === 'trends' && (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {state.nodes.filter(n => n.type.startsWith('timer') || n.type.startsWith('counter') || n.address.startsWith('N7:')).map(n => {
                            const addr = n.type.startsWith('timer') || n.type.startsWith('counter') ? `${n.address}_ACC` : n.address;
                            const hist = state.simulation.history?.[addr] || [];
                            return (
                               <div key={n.id} className="bg-black/40 border border-zinc-800 p-3 rounded-xl flex flex-col gap-2">
                                  <div className="flex justify-between items-center">
                                     <span className="text-[10px] font-black text-white">{n.tag}</span>
                                     <span className="text-[9px] font-mono text-zinc-500">{addr}</span>
                                  </div>
                                  <div className="h-16 w-full">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={hist.slice(-40).map((v, i) => ({ v, i }))}>
                                           <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                                        </LineChart>
                                     </ResponsiveContainer>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   )}

                   {consoleTab === 'forces' && (
                      <table className="w-full text-left text-[10px] font-mono border-collapse">
                         <thead className="bg-black text-zinc-600 sticky top-0 uppercase tracking-widest">
                           <tr>
                             <th className="px-6 py-2 border-b border-zinc-900">Forced Address</th>
                             <th className="px-6 py-2 border-b border-zinc-900">Force Value</th>
                             <th className="px-6 py-2 border-b border-zinc-900 text-right">Action</th>
                           </tr>
                         </thead>
                         <tbody>
                            {Object.entries(state.simulation.forces || {}).map(([addr, val]) => (
                               <tr key={addr} className="border-b border-zinc-900/50 bg-amber-500/5">
                                 <td className="px-6 py-2 text-amber-500 font-black">{addr}</td>
                                 <td className="px-6 py-2">
                                    <span className="bg-amber-500 text-black px-2 py-0.5 rounded font-black">
                                       {val ? 'FORCE ON' : 'FORCE OFF'}
                                    </span>
                                 </td>
                                 <td className="px-6 py-2 text-right">
                                    <button 
                                      onClick={() => handleForceIO(addr, undefined)}
                                      className="text-red-500 hover:bg-red-500/10 px-3 py-1 rounded-full font-black border border-red-500/20"
                                    >REMOVE</button>
                                 </td>
                               </tr>
                            ))}
                            {Object.keys(state.simulation.forces || {}).length === 0 && (
                               <tr>
                                  <td colSpan={3} className="px-6 py-8 text-center text-zinc-700 italic">No forces active in current kernel state</td>
                               </tr>
                            )}
                         </tbody>
                      </table>
                   )}

                   {consoleTab === 'cross' && (
                      <div className="p-6 h-full flex flex-col">
                         <div className="max-w-2xl mx-auto w-full space-y-4 flex flex-col h-full">
                            <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest text-center">Tag Cross-Reference Engine</h3>
                            <div className="relative shrink-0">
                               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                               <input 
                                 type="text" 
                                 placeholder="Search for Address (e.g. I:0/1), Tag Name, or Instruction Type..." 
                                 className="w-full bg-black border-2 border-zinc-800 rounded-2xl py-4 px-12 text-sm text-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                                 autoFocus
                                 onChange={(e) => setSearchQuery(e.target.value)}
                               />
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                               {state.nodes
                                 .filter(n => {
                                   if (!searchQuery) return true;
                                   const query = searchQuery.toLowerCase();
                                   return n.address.toLowerCase().includes(query) || 
                                          n.tag.toLowerCase().includes(query) || 
                                          n.type.toLowerCase().includes(query);
                                 })
                                 .map(n => (
                                  <div 
                                    key={n.id} 
                                    onClick={() => {
                                       setSelectedId(n.id);
                                       setViewport(v => ({ ...v, x: -n.x + 300, y: -n.y + 200 }));
                                    }}
                                    className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-between group hover:border-blue-600 cursor-pointer transition-all"
                                  >
                                     <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                          <div className="text-blue-500 font-black text-xs font-mono">{n.address}</div>
                                          <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">{n.type}</div>
                                        </div>
                                        <div className="h-8 w-[1px] bg-zinc-800" />
                                        <div className="text-zinc-400 font-bold text-[11px] tracking-tight">{n.tag}</div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                        <div className="text-[9px] font-black text-zinc-700 uppercase bg-black px-2 py-1 rounded-md">
                                           Rung {Math.floor(n.y / 150)}
                                        </div>
                                        <ChevronRight size={14} className="text-zinc-800 group-hover:text-blue-600" />
                                     </div>
                                  </div>
                               ))}
                               {state.nodes.length === 0 && (
                                 <div className="text-center py-12 text-zinc-700 italic text-xs">No project tags available for cross-reference</div>
                               )}
                            </div>
                         </div>
                      </div>
                   )}

                   {consoleTab === 'logs' && (
                      <div className="p-2 h-full overflow-auto custom-scrollbar">
                         <div className="space-y-1">
                            {(state.simulation.logs || []).map(log => (
                               <div key={log.id} className="flex items-center gap-4 px-4 py-1.5 bg-black/20 border-l-2 border-transparent hover:border-blue-500 transition-all font-mono text-[10px]">
                                  <span className="text-zinc-600 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase shrink-0",
                                    log.type === 'error' ? "bg-red-500 text-white" : 
                                    log.type === 'warning' ? "bg-amber-500 text-black" : "bg-blue-500/20 text-blue-400"
                                  )}>{log.type}</span>
                                  <span className="text-zinc-400">{log.message}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isPropertyOpen && (
          <div className="flex shrink-0">
               {/* Resizer Handle Right */}
               <div 
                  onMouseDown={() => startResizing('inspector')}
                  className="w-1 h-full bg-black/5 hover:bg-blue-400 cursor-col-resize transition-colors flex items-center justify-center group z-10"
               >
                  <div className="w-[1px] h-8 bg-black/10 group-hover:bg-blue-400 opacity-50" />
               </div>

               <motion.div 
                 initial={{ width: 0, opacity: 0 }}
                 animate={{ width: inspectorWidth, opacity: 1 }}
                 exit={{ width: 0, opacity: 0 }}
                 className="bg-zinc-50 border-l border-black/5 flex flex-col overflow-hidden"
               >
                 <PropertyInspector 
                    selectedNode={state.nodes.find(n => n.id === selectedId) || null}
                    values={state.simulation.values}
                    history={state.simulation.history || {}}
                    onUpdate={updateNode}
                    onDelete={deleteNode}
                    onForceIO={handleForceIO}
                    forces={state.simulation.forces || {}}
                  />
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Final System Footer */}
      <footer className="h-8 bg-white border-t border-black/5 flex items-center justify-between px-6 text-[10px] font-medium text-zinc-400 shrink-0">
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                <span className="tracking-tight">Station: LAB_CONTROL_RACK_01</span>
             </div>
             <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", state.simulation.isRunning ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]" : "bg-zinc-200")} />
                <span className="tracking-tight">PLC_LINK: <span className={state.simulation.isRunning ? "text-green-600 font-bold" : ""}>{state.simulation.isRunning ? "CONNECTED" : "OFFLINE"}</span></span>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <span className="opacity-50">v5.0.21-LTS</span>
             <span className="font-mono tracking-tighter tabular-nums">{new Date().toLocaleTimeString()}</span>
          </div>
      </footer>

      {/* Common Modals & Overlays */}
      <AnimatePresence>
          {isModalOpen && selectedId && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
               <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full"
               >
                  <PropertyInspector 
                    selectedNode={state.nodes.find(n => n.id === selectedId) || null}
                    values={state.simulation.values}
                    history={state.simulation.history || {}}
                    onUpdate={updateNode}
                    onDelete={(id) => { deleteNode(id); setIsModalOpen(false); }}
                    onForceIO={handleForceIO}
                    forces={state.simulation.forces || {}}
                    isEmbedded
                  />
                  <div className="mt-8 flex justify-end">
                     <button onClick={() => setIsModalOpen(false)} className="px-8 py-2 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-xl hover:bg-blue-500">Apply Configuration</button>
                  </div>
               </motion.div>
            </div>
          )}
          
          {isCommunicating && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-lg flex items-center justify-center">
                <div className="text-center space-y-4">
                   <div className="inline-block p-4 bg-blue-600/20 rounded-full animate-bounce">
                      <Zap size={48} className="text-blue-500" />
                   </div>
                   <h2 className="text-2xl font-black text-white tracking-[0.4em] uppercase">Synchronizing Controller</h2>
                   <div className="w-64 h-1 bg-zinc-800 rounded-full overflow-hidden mx-auto">
                      <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2 }} className="h-full bg-blue-500" />
                   </div>
                   <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Applying station routine to virtual L32E kernel...</p>
                </div>
             </motion.div>
          )}

          {showWhoActive && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowWhoActive(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 shadow-2xl rounded-lg overflow-hidden flex flex-col h-[500px]"
            >
              <div className="bg-black p-3 flex justify-between items-center text-white">
                <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Cpu size={16} className="text-blue-400" />
                  Who Active - Controller Discovery
                </span>
                <button onClick={() => setShowWhoActive(false)} className="hover:bg-zinc-700 p-1 rounded-sm">
                   <Square size={12} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                 <div className="w-1/3 border-r border-zinc-800 bg-black/20 p-4 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                         <ChevronRight size={10} /> Workstation
                      </div>
                      <div className="ml-4 space-y-1">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600">
                           <ChevronRight size={10} className="rotate-90" /> PLC Gateways
                         </div>
                      </div>
                    </div>
                 </div>
                 <div className="flex-1 p-4 overflow-y-auto">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Discovered Devices on Local Network</h4>
                    <div className="space-y-2">
                       {[
                         { name: 'AIS_PLC_01', ip: '192.168.1.10', type: 'ControlLogix 5580', status: 'Online' },
                         { name: 'PACK_SIM_04', ip: '192.168.1.15', type: 'CompactLogix 5370', status: 'Online' },
                         { name: 'LAB_TEST_RACK', ip: '192.168.1.42', type: 'ControlLogix 5570', status: 'Busy' }
                       ].map(device => (
                         <div 
                           key={device.ip} 
                           className="p-3 bg-black/40 border border-zinc-800 rounded-xl hover:border-blue-500 hover:bg-blue-600/10 cursor-pointer transition-all group"
                           onClick={() => {
                             addNotification(`Connected to ${device.name}`, "success");
                             setShowWhoActive(false);
                           }}
                         >
                           <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-white">{device.name}</span>
                              <span className={cn(
                                "text-[8px] font-black px-2 py-0.5 rounded-full uppercase",
                                device.status === 'Online' ? "bg-green-500/20 text-green-500" : "bg-amber-500/20 text-amber-500"
                              )}>
                                {device.status}
                              </span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-zinc-500">{device.ip}</span>
                              <span className="text-[9px] text-zinc-600">SLOT 0{device.ip.slice(-1)}</span>
                           </div>
                           <div className="mt-2 text-[9px] text-zinc-500 font-medium">Model: {device.type}</div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-12 right-6 z-[200] flex flex-col-reverse gap-2">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div 
              key={n.id}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className={cn(
                "px-4 py-2 rounded-lg shadow-xl text-xs font-bold border flex items-center gap-3",
                n.type === 'success' ? "bg-green-600 border-green-500 text-white shadow-green-500/20" :
                n.type === 'error' ? "bg-red-600 border-red-500 text-white shadow-red-500/20" :
                "bg-zinc-800 border-zinc-700 text-zinc-300 shadow-black/50"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full animate-pulse", 
                n.type === 'success' ? "bg-green-300" : n.type === 'error' ? "bg-red-300" : "bg-blue-400")} />
              {n.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".vlp" />
    </div>
  );
}
