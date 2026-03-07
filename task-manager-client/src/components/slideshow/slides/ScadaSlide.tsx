import React, { useCallback, useEffect, useState, useRef } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Node,
  Edge,
  Position,
  Handle,
  ReactFlowInstance,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Wind, Droplets, Factory, Thermometer, 
  Activity, Save, Download, 
  Palette, Info, Edit3, Plus, X, Trash2
} from 'lucide-react';

// Enhanced equipment node with code, name, and status
const EquipmentNode = ({ data }: { data: any }) => {
  const { asset_code, name, type, status, icon: IconProp, customColor } = data;
  
  const iconMap: Record<string, any> = {
    compressor: Wind,
    chiller: Droplets,
    ahc: Thermometer,
    preform: Factory,
    machine: Factory
  };
  
  const Icon = IconProp && typeof IconProp === 'function' ? IconProp : (iconMap[type] || Factory);
  
  const statusColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    running: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400', glow: 'shadow-emerald-500/50' },
    stopped: { bg: 'bg-slate-500/20', border: 'border-slate-500', text: 'text-slate-400', glow: 'shadow-slate-500/50' },
    maintenance: { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/50' },
    error: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', glow: 'shadow-red-500/50' },
  };

  const typeColors: Record<string, { bg: string; icon: string }> = {
    compressor: { bg: 'from-cyan-600 to-blue-600', icon: 'text-cyan-300' },
    chiller: { bg: 'from-blue-600 to-indigo-600', icon: 'text-blue-300' },
    ahc: { bg: 'from-purple-600 to-pink-600', icon: 'text-purple-300' },
    preform: { bg: 'from-emerald-600 to-teal-600', icon: 'text-emerald-300' },
    machine: { bg: 'from-orange-600 to-red-600', icon: 'text-orange-300' },
  };
  
  const colors = statusColors[status] || statusColors.stopped;
  const typeColor = typeColors[type] || typeColors.machine;
  // Use custom color if available
  const gradientColor = customColor ? 'from-' + customColor + ' to-' + customColor : typeColor.bg;

  return (
    <div
      className={`relative px-3 py-2 rounded-lg bg-gradient-to-br ${gradientColor} border-2 ${colors.border} shadow-lg ${colors.glow} min-w-[130px]`}
      style={customColor ? { background: `linear-gradient(135deg, ${customColor} 0%, ${customColor}99 100%)` } : undefined}
    >
      {(type === 'ahc' || type === 'machine') && (
        <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-2.5 !h-2.5 !-top-1" />
      )}
      
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${typeColor.icon}`} />
        <div className="flex-1 min-w-0">
          <div className="font-mono font-bold text-white text-sm truncate">{asset_code}</div>
          {name && <div className="text-[10px] text-slate-300 truncate max-w-[100px]" title={name}>{name}</div>}
          <span className={`text-[10px] px-1.5 py-0.5 rounded bg-white/10 ${colors.text} uppercase font-bold inline-block mt-0.5`}>
            {status === 'running' ? 'Running' : status === 'stopped' ? 'OFF' : status}
          </span>
        </div>
      </div>

      {type !== 'machine' && (
        <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-2.5 !h-2.5 !-bottom-1" />
      )}
    </div>
  );
};

const nodeTypes = {
  equipment: EquipmentNode,
};

interface ScadaSlideProps {
  data: {
    equipment?: any[];
    flowPaths?: any[];
    lastUpdated?: string;
    systemStatus?: {
      totalEquipment: number;
      runningEquipment: number;
      stoppedEquipment: number;
      errorEquipment?: number;
      maintenanceEquipment?: number;
    };
  };
}

// Edge colors for customization
const edgeColors = [
  { name: 'Purple', value: '#a855f7', label: 'Processed Air' },
  { name: 'Cyan', value: '#06b6d4', label: 'Compressed Air' },
  { name: 'Blue', value: '#3b82f6', label: 'Chilled Water' },
  { name: 'Green', value: '#10b981', label: 'Green Energy' },
  { name: 'Orange', value: '#f97316', label: 'Heating' },
  { name: 'Red', value: '#ef4444', label: 'Warning' },
];

// Node colors for customization
const nodeColors = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Yellow', value: '#eab308' },
];

export const ScadaSlide: React.FC<ScadaSlideProps> = ({ data }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const initialized = useRef(false);
  const [showDesignTools, setShowDesignTools] = useState(false);
  const [edgeColor, setEdgeColor] = useState('#a855f7');
  const [edgeLabel, setEdgeLabel] = useState('');
  const [nodeColor, setNodeColor] = useState('#3b82f6');
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  // Load saved layout from server or localStorage
  const loadSavedLayout = useCallback(async () => {
    try {
      const response = await fetch('/api/v2/public/scada-layout');
      if (response.ok) {
        const serverData = await response.json();
        if (serverData.nodes?.length > 0) {
          return {
            savedNodes: serverData.nodes,
            savedEdges: serverData.edges || []
          };
        }
      }
    } catch (e) {
      console.log('Server not available, using localStorage');
    }
    
    try {
      const savedLayout = localStorage.getItem('scada-layout');
      if (savedLayout) {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedLayout);
        return { savedNodes, savedEdges };
      }
    } catch (e) {
      console.log('No saved layout found');
    }
    return null;
  }, []);

  // Save layout to localStorage
  const saveLayout = useCallback(() => {
    if (reactFlowInstance && nodes.length > 0) {
      const viewport = reactFlowInstance.getViewport();
      localStorage.setItem('scada-layout', JSON.stringify({
        nodes: nodes.map(n => ({ id: n.id, position: n.position, type: n.type, data: n.data })),
        edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, type: e.type, animated: e.animated, style: e.style, label: e.label })),
        viewport
      }));
    }
  }, [reactFlowInstance, nodes, edges]);

  // Initialize nodes and edges from data or saved layout
  useEffect(() => {
    if (initialized.current || !data?.equipment) return;
    initialized.current = true;

    const initLayout = async () => {
      const savedLayout = await loadSavedLayout();
      
      if (savedLayout && savedLayout.savedNodes.length > 0) {
        const savedNodes = savedLayout.savedNodes.map((n: any) => ({
          ...n,
          type: n.type || 'equipment',
          position: n.position || { x: 0, y: 0 }
        }));
        
        // Get valid node IDs
        const validNodeIds = new Set(savedNodes.map((n: any) => n.id));
        
        // Ensure all edges have unique IDs and filter out edges referencing non-existent nodes
        let edgeCounter = 0;
        const savedEdges = savedLayout.savedEdges
          .filter((e: any) => validNodeIds.has(e.source) && validNodeIds.has(e.target))
          .map((e: any) => {
            const edgeId = e.id || `edge-${edgeCounter++}`;
            return {
              ...e,
              id: edgeId,
              type: e.type || 'smoothstep',
              animated: e.animated ?? true,
              style: e.style || { stroke: '#a855f7', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: (e.style as any)?.stroke || '#a855f7' }
            };
          });
        
        setNodes(savedNodes);
        setEdges(savedEdges);
      } else {
        const equipment = data.equipment || [];
        
        const compressors = equipment.filter((e: any) => e.type === 'compressor');
        const chillers = equipment.filter((e: any) => e.type === 'chiller');
        const ahcs = equipment.filter((e: any) => e.type === 'ahc');
        const preforms = equipment.filter((e: any) => e.type === 'preform');
        const machines = equipment.filter((e: any) => e.type === 'machine');

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        const iconMap: Record<string, any> = {
          compressor: Wind,
          chiller: Droplets,
          ahc: Thermometer,
          preform: Factory,
          machine: Factory
        };

        // Position compressors (top left)
        compressors.forEach((eq: any, i: number) => {
          newNodes.push({
            id: eq.id,
            type: 'equipment',
            position: { x: 50 + i * 150, y: 20 },
            data: { ...eq, icon: iconMap[eq.type] || Factory }
          });
        });

        // Position chillers (top right)
        chillers.forEach((eq: any, i: number) => {
          newNodes.push({
            id: eq.id,
            type: 'equipment',
            position: { x: 400 + i * 150, y: 20 },
            data: { ...eq, icon: iconMap[eq.type] || Factory }
          });
        });

        // Position AHC (center top)
        ahcs.forEach((eq: any) => {
          newNodes.push({
            id: eq.id,
            type: 'equipment',
            position: { x: 250 + (compressors.length * 75), y: 180 },
            data: { ...eq, icon: iconMap[eq.type] || Factory }
          });
        });

        // Position Preform Moulding (center bottom)
        preforms.forEach((eq: any, i: number) => {
          newNodes.push({
            id: eq.id,
            type: 'equipment',
            position: { x: 50 + i * 150, y: 350 },
            data: { ...eq, icon: iconMap[eq.type] || Factory }
          });
        });

        // Position machines (bottom)
        machines.forEach((eq: any, i: number) => {
          newNodes.push({
            id: eq.id,
            type: 'equipment',
            position: { x: 50 + (preforms.length + i) * 150, y: 350 },
            data: { ...eq, icon: iconMap[eq.type] || Factory }
          });
        });

        // Generate edges
        const hasAHC = ahcs.length > 0;
        
        if (hasAHC) {
          // Compressors to AHC
          compressors.forEach((eq: any) => {
            newEdges.push({
              id: `e-${eq.id}-${ahcs[0].id}`,
              source: eq.id,
              target: ahcs[0].id,
              type: 'smoothstep',
              animated: eq.status === 'running',
              style: { stroke: '#06b6d4', strokeWidth: 3 },
              label: eq.status === 'running' ? 'Compressed Air' : 'Offline',
              labelStyle: { fill: '#06b6d4', fontWeight: 700 }
            });
          });

          // Chillers to AHC
          chillers.forEach((eq: any) => {
            newEdges.push({
              id: `e-${eq.id}-${ahcs[0].id}`,
              source: eq.id,
              target: ahcs[0].id,
              type: 'smoothstep',
              animated: eq.status === 'running',
              style: { stroke: '#3b82f6', strokeWidth: 3 },
              label: eq.status === 'running' ? 'Chilled Water' : 'Offline',
              labelStyle: { fill: '#3b82f6', fontWeight: 700 }
            });
          });

          // AHC to Preform Moulding
          preforms.forEach((eq: any) => {
            newEdges.push({
              id: `e-${ahcs[0].id}-${eq.id}`,
              source: ahcs[0].id,
              target: eq.id,
              type: 'smoothstep',
              animated: eq.status === 'running',
              style: { stroke: '#10b981', strokeWidth: 3 },
              label: eq.status === 'running' ? 'Preform Air' : 'Offline',
              labelStyle: { fill: '#10b981', fontWeight: 700 }
            });
          });

          // AHC to Machines
          machines.forEach((eq: any) => {
            newEdges.push({
              id: `e-${ahcs[0].id}-${eq.id}`,
              source: ahcs[0].id,
              target: eq.id,
              type: 'smoothstep',
              animated: eq.status === 'running',
              style: { stroke: '#a855f7', strokeWidth: 3 },
              label: eq.status === 'running' ? 'Processed Air' : 'Offline',
              labelStyle: { fill: '#a855f7', fontWeight: 700 }
            });
          });
        } else {
          // Direct connections if no AHC
          compressors.forEach((comp: any) => {
            preforms.forEach((p: any) => {
              newEdges.push({
                id: `e-${comp.id}-${p.id}`,
                source: comp.id,
                target: p.id,
                type: 'smoothstep',
                animated: comp.status === 'running' && p.status === 'running',
                style: { stroke: '#06b6d4', strokeWidth: 2 }
              });
            });
            machines.forEach((machine: any) => {
              newEdges.push({
                id: `e-${comp.id}-${machine.id}`,
                source: comp.id,
                target: machine.id,
                type: 'smoothstep',
                animated: comp.status === 'running' && machine.status === 'running',
                style: { stroke: '#06b6d4', strokeWidth: 2 }
              });
            });
          });
        }

        setNodes(newNodes);
        setEdges(newEdges);
      }
    };
    initLayout();
  }, [data?.equipment, setNodes, setEdges, loadSavedLayout]);

  // Update time
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save layout when it changes
  useEffect(() => {
    if (!reactFlowInstance || nodes.length === 0) return;
    const timeout = setTimeout(saveLayout, 2000);
    return () => clearTimeout(timeout);
  }, [nodes, edges, reactFlowInstance, saveLayout]);

  // Calculate system status
  const systemStatus = data?.systemStatus || {
    totalEquipment: nodes.length,
    runningEquipment: nodes.filter(n => n.data.status === 'running').length,
    stoppedEquipment: nodes.filter(n => n.data.status === 'stopped').length,
    errorEquipment: nodes.filter(n => n.data.status === 'error').length,
    maintenanceEquipment: nodes.filter(n => n.data.status === 'maintenance').length,
  };

  // Load available assets from equipment data
  const loadAvailableAssets = useCallback(() => {
    if (!data?.equipment) return;
    
    // Get current node IDs
    const currentNodeIds = new Set(nodes.map(n => n.id));
    
    // Filter equipment not already in diagram
    const available = data.equipment.filter((eq: any) => !currentNodeIds.has(eq.id));
    setAvailableAssets(available);
  }, [data?.equipment, nodes]);

  // Toggle asset selection
  const toggleAssetSelection = useCallback((assetId: string) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  }, []);

  // Add selected assets to diagram
  const addSelectedAssets = useCallback(() => {
    if (selectedAssets.size === 0) return;
    
    const iconMap: Record<string, any> = {
      compressor: Wind,
      chiller: Droplets,
      ahc: Thermometer,
      preform: Factory,
      machine: Factory
    };
    
    const newNodes: Node[] = [];
    let index = 0;
    
    selectedAssets.forEach((assetId) => {
      const asset = availableAssets.find((a: any) => a.id === assetId);
      if (!asset) return;
      
      // Position based on type
      let x = 50 + (index % 8) * 180;
      let y = 50 + Math.floor(index / 8) * 120;
      
      if (asset.type === 'chiller') {
        x = 400 + (index % 12) * 150;
        y = 20 + Math.floor(index / 12) * 100;
      } else if (asset.type === 'compressor') {
        x = 50 + (index % 8) * 150;
        y = 20 + Math.floor(index / 8) * 100;
      } else if (asset.type === 'preform') {
        x = 50 + (index % 6) * 180;
        y = 300 + Math.floor(index / 6) * 100;
      } else {
        x = 500 + (index % 6) * 180;
        y = 300 + Math.floor(index / 6) * 100;
      }
      
      newNodes.push({
        id: asset.id,
        type: 'equipment',
        position: { x, y },
        data: { ...asset, icon: iconMap[asset.type] || Factory }
      });
      
      index++;
    });
    
    if (newNodes.length > 0) {
      setNodes(prev => [...prev, ...newNodes]);
      setTimeout(saveLayout, 100);
    }
    
    setSelectedAssets(new Set());
    setShowAddAsset(false);
  }, [selectedAssets, availableAssets, setNodes, saveLayout]);

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    if (confirm('Hapus asset ini dari diagram?')) {
      setNodes(prev => prev.filter(n => n.id !== selectedNode));
      setEdges(prev => prev.filter(e => e.source !== selectedNode && e.target !== selectedNode));
      setSelectedNode(null);
      setTimeout(saveLayout, 100);
    }
  }, [selectedNode, setNodes, setEdges, saveLayout]);

  // Connect nodes
  const onConnect = useCallback((params: any) => {
    setEdges((eds) => {
      // Generate unique edge ID
      const edgeId = `e-${params.source}-${params.target}-${Date.now()}`;
      const newEdges = [...eds, { 
        id: edgeId,
        ...params, 
        type: 'smoothstep', 
        animated: true, 
        style: { stroke: edgeColor, strokeWidth: 2 },
        label: edgeLabel || undefined,
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor }
      }];
      setTimeout(saveLayout, 100);
      return newEdges;
    });
  }, [setEdges, saveLayout, edgeColor, edgeLabel]);

  // Handle edge click for selection
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    if (event.button === 2) {
      // Right click - delete
      event.preventDefault();
      if (confirm('Hapus koneksi ini?')) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        setTimeout(saveLayout, 100);
      }
    } else {
      // Left click - select for editing
      setSelectedEdge(edge.id);
      setSelectedNode(null);
      setEdgeColor((edge.style as any)?.stroke || '#a855f7');
      setEdgeLabel((edge.label as string) || '');
    }
  }, [setEdges, saveLayout]);

  // Handle node click
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  // Handle edge context menu
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    event.stopPropagation();
    // Set as selected edge and show in design tools
    setSelectedEdge(edge.id);
    setSelectedNode(null);
    setEdgeColor((edge.style as any)?.stroke || '#a855f7');
    setEdgeLabel((edge.label as string) || '');
    setShowDesignTools(true);
  }, []);

  // Update selected edge properties
  const updateSelectedEdge = useCallback(() => {
    if (!selectedEdge) return;
    setEdges((eds) => eds.map((e) => {
      if (e.id === selectedEdge) {
        return {
          ...e,
          style: { ...e.style, stroke: edgeColor },
          label: edgeLabel || undefined,
          markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor }
        };
      }
      return e;
    }));
    setTimeout(saveLayout, 100);
  }, [selectedEdge, edgeColor, edgeLabel, setEdges, saveLayout]);

  // Delete selected edge
  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdge) return;
    if (confirm('Hapus koneksi ini?')) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge));
      setSelectedEdge(null);
      setTimeout(saveLayout, 100);
    }
  }, [selectedEdge, setEdges, saveLayout]);

  // Update selected node properties
  const updateSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.map((n) => {
      if (n.id === selectedNode) {
        return {
          ...n,
          data: { ...n.data, customColor: nodeColor }
        };
      }
      return n;
    }));
    setTimeout(saveLayout, 100);
  }, [selectedNode, nodeColor, setNodes, saveLayout]);

  // Save layout to localStorage and database
  const saveLayoutToDb = useCallback(async () => {
    const layoutData = {
      nodes: nodes.map(n => ({ id: n.id, position: n.position, type: n.type, data: n.data })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, type: e.type, animated: e.animated, style: e.style, label: e.label }))
    };
    
    localStorage.setItem('scada-layout', JSON.stringify(layoutData));
    
    try {
      await fetch('/api/v2/public/scada-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layoutData)
      });
      alert('Layout berhasil disimpan ke server!');
    } catch (e) {
      console.log('Failed to save to server, localStorage only');
      alert('Layout disimpan ke localStorage (server tidak tersedia)');
    }
  }, [nodes, edges]);

  // Export layout as JSON
  const exportLayout = useCallback(() => {
    const layoutData = {
      nodes: nodes.map(n => ({ id: n.id, position: n.position, type: n.type, data: n.data })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, type: e.type, animated: e.animated, style: e.style, label: e.label })),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(layoutData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scada-layout-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  // Reset layout
  const resetLayout = useCallback(() => {
    if (confirm('Reset ke layout default? Semua perubahan akan hilang.')) {
      localStorage.removeItem('scada-layout');
      initialized.current = false;
      setNodes([]);
      setEdges([]);
      window.location.reload();
    }
  }, [setNodes, setEdges]);

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="flex justify-between items-start p-4 pb-2">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-400 bg-clip-text text-transparent">
            <Activity className="w-8 h-8 text-blue-500" />
            SCADA System
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-Time Equipment Flow Monitoring</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 ${systemStatus.runningEquipment > 0 ? 'bg-emerald-500 rounded-full animate-pulse' : 'bg-slate-500 rounded-full'}`}></div>
              <span className="text-xs text-slate-400">Running</span>
              <span className="text-sm font-bold text-emerald-400">{systemStatus.runningEquipment}</span>
            </div>
            <div className="w-px h-6 bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
              <span className="text-xs text-slate-400">OFF</span>
              <span className="text-sm font-bold text-slate-400">{systemStatus.stoppedEquipment}</span>
            </div>
            <div className="w-px h-6 bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-xs text-slate-400">Maint</span>
              <span className="text-sm font-bold text-amber-400">{systemStatus.maintenanceEquipment || 0}</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            {currentTime}
          </div>
        </div>
      </div>

      {/* React Flow Diagram */}
      <div className="flex-1 relative">
        {/* Toolbar */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button 
            onClick={() => { loadAvailableAssets(); setShowAddAsset(true); }}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
            title="Tambah Asset"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
          <button 
            onClick={() => setShowDesignTools(!showDesignTools)}
            className={`flex items-center gap-2 px-3 py-2 ${showDesignTools ? 'bg-purple-600' : 'bg-slate-700'} hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors`}
            title="Design Tools"
          >
            <Edit3 className="w-4 h-4" />
            Design
          </button>
          <button 
            onClick={saveLayoutToDb}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            title="Simpan Layout"
          >
            <Save className="w-4 h-4" />
            Simpan
          </button>
          <button 
            onClick={exportLayout}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            title="Export JSON"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={resetLayout}
            className="flex items-center gap-2 px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
            title="Reset Layout"
          >
            <Trash2 className="w-4 h-4" />
            Reset
          </button>
        </div>
        
        {/* Add Asset Panel */}
        {showAddAsset && (
          <div className="absolute top-4 left-4 z-10 bg-slate-800/95 border border-slate-700 rounded-xl p-4 w-80 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Tambah Asset</span>
              </div>
              <button 
                onClick={() => setShowAddAsset(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {availableAssets.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-4">
                Semua asset sudah ada di diagram
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => {
                      const allIds = availableAssets.map((a: any) => a.id);
                      if (selectedAssets.size === allIds.length) {
                        setSelectedAssets(new Set());
                      } else {
                        setSelectedAssets(new Set(allIds));
                      }
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {selectedAssets.size === availableAssets.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                  <span className="text-xs text-slate-500">
                    {selectedAssets.size} dipilih
                  </span>
                </div>
                
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {availableAssets.map((asset: any) => (
                    <div 
                      key={asset.id}
                      onClick={() => toggleAssetSelection(asset.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedAssets.has(asset.id) 
                          ? 'bg-emerald-600/30 border border-emerald-500' 
                          : 'bg-slate-700/50 hover:bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedAssets.has(asset.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'
                      }`}>
                        {selectedAssets.has(asset.id) && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono font-bold text-white text-sm">{asset.asset_code}</div>
                        <div className="text-xs text-slate-400 truncate">{asset.name}</div>
                        <div className="text-xs text-slate-500 capitalize">{asset.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700">
                  <button
                    onClick={() => setShowAddAsset(false)}
                    className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={addSelectedAssets}
                    disabled={selectedAssets.size === 0}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedAssets.size > 0 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Tambah ({selectedAssets.size})
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Design Tools Panel */}
        {showDesignTools && (
          <div className="absolute top-16 right-4 z-10 bg-slate-800/95 border border-slate-700 rounded-xl p-4 w-72 shadow-xl">
            <div className="flex items-center gap-2 mb-3 text-white font-semibold">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>Design Tools</span>
            </div>
            
            {/* Edge Color Selection */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 block mb-2">Warna Garis:</label>
              <div className="flex flex-wrap gap-2">
                {edgeColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      setEdgeColor(color.value);
                      if (selectedEdge) {
                        updateSelectedEdge();
                      }
                    }}
                    className={`w-6 h-6 rounded border-2 ${edgeColor === color.value ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            {/* Edge Label */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 block mb-2">Label Garis:</label>
              <input
                type="text"
                value={edgeLabel}
                onChange={(e) => {
                  setEdgeLabel(e.target.value);
                  if (selectedEdge) {
                    // Debounce the update
                    setTimeout(updateSelectedEdge, 300);
                  }
                }}
                onBlur={selectedEdge ? updateSelectedEdge : undefined}
                placeholder="Contoh: Compressed Air"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            
            {/* Selected Edge Actions */}
            {selectedEdge ? (
              <div className="border-t border-slate-700 pt-3 mt-3">
                <div className="text-xs text-green-400 mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>Koneksi Dipilih</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={updateSelectedEdge}
                    className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={deleteSelectedEdge}
                    className="flex items-center gap-1 px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-slate-700 pt-3 mt-3">
                <div className="text-xs text-slate-500 mb-2">
                  Klik pada garis untuk memilih, lalu ubah warna/label di atas.
                </div>
              </div>
            )}
            
            {/* Selected Node Actions */}
            {selectedNode ? (
              <div className="border-t border-slate-700 pt-3 mt-3">
                <div className="text-xs text-blue-400 mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>Asset Dipilih</span>
                </div>
                {(() => {
                  const node = nodes.find(n => n.id === selectedNode);
                  if (!node) return null;
                  return (
                    <div className="mb-2">
                      <div className="text-xs text-slate-300">{node.data.asset_code}</div>
                      <div className="text-xs text-slate-400 truncate">{node.data.name}</div>
                    </div>
                  );
                })()}
                
                {/* Node Color Selection */}
                <div className="mb-3">
                  <label className="text-xs text-slate-400 block mb-2">Warna Box:</label>
                  <div className="flex flex-wrap gap-2">
                    {nodeColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => {
                          setNodeColor(color.value);
                          updateSelectedNode();
                        }}
                        className={`w-6 h-6 rounded border-2 ${nodeColor === color.value ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={deleteSelectedNode}
                  className="flex items-center gap-1 px-3 py-2 w-full bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Hapus dari Diagram
                </button>
              </div>
            ) : null}
            
            <div className="border-t border-slate-700 pt-3 mt-3">
              <div className="text-xs text-slate-400 mb-2">Petunjuk:</div>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Drag antar node untuk menghubungkan</li>
                <li>• Klik pada garis untuk edit (warna/label)</li>
                <li>• Klik Simpan untuk menyimpan ke server</li>
              </ul>
            </div>
          </div>
        )}
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onEdgeContextMenu={onEdgeContextMenu}
          onNodeClick={onNodeClick}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          onNodeDragStop={saveLayout}
          onPaneClick={() => { setSelectedEdge(null); setSelectedNode(null); }}
        >
          <Controls className="!bg-slate-800 !border-slate-700 !fill-white" />

          <Background color="#334155" gap={20} />
        </ReactFlow>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
            <span className="text-xs text-cyan-400 font-medium">Compressed Air</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-blue-400 font-medium">Chilled Water</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs text-emerald-400 font-medium">Preform Air</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-xs text-purple-400 font-medium">Processed Air</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-500 font-medium">SYSTEM ONLINE</span>
          <span className="text-xs text-slate-600 ml-2">(Layout saved)</span>
        </div>
      </div>
    </div>
  );
};

export default ScadaSlide;
