import { useState } from 'react';
import { Circle, Share2, PlayCircle, Flag, Trash2, ZoomIn } from 'lucide-react';
import { cn } from '../../lib/utils';

type GraphInputProps = {
  onSubmit: (data: any) => void;
  mode: string;
  setMode: (mode: string) => void;
  currentData?: any;
  zoom: number;
  setZoom: (z: number) => void;
};

export default function GraphInput({ onSubmit, mode, setMode, currentData, zoom, setZoom }: GraphInputProps) {
  const [nodeCount, setNodeCount] = useState(10); 
  const [edgeDensity, setEdgeDensity] = useState(3); 

  const isValidPosition = (x: number, y: number, existingNodes: any[], minDistance: number = 80) => {
    for (const key in existingNodes) {
        const node = existingNodes[key];
        const dist = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2));
        if (dist < minDistance) return false;
    }
    return true;
  };

  const applyRepulsion = (nodes: any, width: number, height: number) => {
      const keys = Object.keys(nodes);
      const iterations = 50; 
      const minDesc = 100;
      const padding = 50;

      for (let k = 0; k < iterations; k++) {
          let moved = false;
          for (let i = 0; i < keys.length; i++) {
              for (let j = i + 1; j < keys.length; j++) {
                  const u = nodes[keys[i]];
                  const v = nodes[keys[j]];
                  const dx = u.x - v.x;
                  const dy = u.y - v.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist < minDesc && dist > 0) {
                      const force = (minDesc - dist) / 2;
                      const nx = (dx / dist) * force;
                      const ny = (dy / dist) * force;
                      u.x += nx; u.y += ny;
                      v.x -= nx; v.y -= ny;
                      moved = true;
                  }
              }
          }
          for (const key of keys) {
              const n = nodes[key];
              n.x = Math.max(padding, Math.min(width - padding, n.x));
              n.y = Math.max(padding, Math.min(height - padding, n.y));
          }
          if (!moved) break;
      }
      return nodes;
  };

  const handleRandomTree = () => {
    const nodes: any = {};
    const adjacency: any = {};
    const width = 1000; 
    const height = 600;

    nodes["A"] = { x: width / 2, y: 50 };
    adjacency["A"] = {};
    
    let queue = ["A"];
    const getLabel = (idx: number) => idx < 26 ? String.fromCharCode(65 + idx) : String.fromCharCode(97 + idx - 26);
    let nodeIdx = 1;

    while (queue.length > 0 && nodeIdx < nodeCount) {
        const parentId = queue.shift();
        if (!parentId) break;
        const parentY = nodes[parentId].y;
        const numChildren = Math.floor(Math.random() * 2) + 1; 
        const levelWidth = 200 / (1 + (parentY / 200)); 

        for (let i = 0; i < numChildren; i++) {
            if (nodeIdx >= nodeCount) break;
            const childId = getLabel(nodeIdx++);
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 15) {
                 const offsetX = (i - (numChildren - 1) / 2) * levelWidth;
                 const candidateX = nodes[parentId].x + offsetX + (Math.random() * 60 - 30);
                 const candidateY = parentY + 100 + (Math.random() * 30);
                 if (isValidPosition(candidateX, candidateY, nodes)) {
                     nodes[childId] = { x: candidateX, y: candidateY };
                     placed = true;
                 }
                 attempts++;
            }
            if (!placed) nodes[childId] = { x: nodes[parentId].x, y: parentY + 100 };
            adjacency[childId] = {};
            adjacency[parentId][childId] = Math.floor(Math.random() * 10) + 1;
            queue.push(childId);
        }
    }
    applyRepulsion(nodes, width, height);
    const keys = Object.keys(nodes);
    onSubmit({ nodes, adjacency, start: keys[0], end: keys[keys.length - 1] });
  };

  const handleRandomNetwork = () => {
     let nodes: any = {};
     const width = 1000;
     const height = 600;
     const getLabel = (idx: number) => idx < 26 ? String.fromCharCode(65 + idx) : String.fromCharCode(97 + idx - 26);

     if (currentData && currentData.nodes && Object.keys(currentData.nodes).length > 0) {
         nodes = JSON.parse(JSON.stringify(currentData.nodes));
     } else {
         const cols = Math.ceil(Math.sqrt(nodeCount));
         const rows = Math.ceil(nodeCount / cols);
         const cellW = width / cols;
         const cellH = height / rows;
         for(let i=0; i<nodeCount; i++) {
             const id = getLabel(i);
             const r = Math.floor(i / cols);
             const c = i % cols;
             nodes[id] = { 
                 x: (c * cellW) + (cellW/2) + (Math.random() * 40 - 20), 
                 y: (r * cellH) + (cellH/2) + (Math.random() * 40 - 20)
             };
         }
     }
     applyRepulsion(nodes, width, height);

     const adjacency: any = {};
     const keys = Object.keys(nodes);
     keys.forEach(id => adjacency[id] = {});

     keys.forEach((u) => {
         const distances = keys
            .filter(v => v !== u)
            .map(v => {
                const dx = nodes[u].x - nodes[v].x;
                const dy = nodes[u].y - nodes[v].y;
                return { id: v, dist: Math.sqrt(dx*dx + dy*dy) };
            })
            .sort((a, b) => a.dist - b.dist);

         const candidates = distances.slice(0, edgeDensity * 2);
         for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
         }
         const neighbors = candidates.slice(0, edgeDensity);
         neighbors.forEach(n => {
             if (!adjacency[u][n.id] && !adjacency[n.id][u]) {
                 const weight = Math.floor(Math.random() * 10) + 1;
                 adjacency[u][n.id] = weight;
                 adjacency[n.id][u] = weight; 
             }
         });
     });
     
     let start = currentData?.start;
     let end = currentData?.end;
     if (!start || !nodes[start]) start = keys[0];
     if (!end || !nodes[end]) end = keys[keys.length-1];

     onSubmit({ nodes, adjacency, start, end });
  };

  const handleClear = () => {
      onSubmit({ nodes: {}, adjacency: {}, start: null, end: null });
  };

  return (
    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 w-full">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Graph Generator</span>
        <div className="flex items-center bg-gray-900 rounded-lg border border-gray-700 p-1">
            <div className="flex items-center px-2 gap-1 border-r border-gray-700 mr-2">
                <span className="text-xs text-gray-500">Nodes:</span>
                <input type="number" value={nodeCount} onChange={e => { let val = parseInt(e.target.value, 10); if (val > 50) val = 50; setNodeCount(val); }} className="w-10 bg-transparent text-white text-xs text-center focus:outline-none" min="3" max="50"/>
            </div>
            <div className="flex items-center px-2 gap-1 border-r border-gray-700 mr-2">
                <span className="text-xs text-gray-500">Dens%:</span>
                <input type="number" value={edgeDensity} onChange={e => { let val = parseInt(e.target.value, 10); if (val > 8) val = 8; if (val < 1) val = 1; setEdgeDensity(val); }} className="w-8 bg-transparent text-white text-xs text-center focus:outline-none" min="1" max="8"/>
            </div>
             <button onClick={handleRandomTree} className="px-2 py-1 hover:bg-gray-800 rounded text-purple-400 text-xs font-medium transition-colors">Tree</button>
             <button onClick={handleRandomNetwork} className="px-2 py-1 hover:bg-gray-800 rounded text-blue-400 text-xs font-medium transition-colors">Mesh</button>
            <div className="w-px h-5 bg-gray-700 mx-1"></div>
            <button onClick={handleClear} className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors" title="Clear"><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 flex-grow">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tools</span>
        <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-gray-900 rounded-lg border border-gray-700 p-1">
                <ToolButton active={mode === 'node'} onClick={() => setMode('node')} icon={<Circle size={14} />} label="Node" color="text-blue-400" />
                <div className="w-px h-4 bg-gray-700 mx-1"></div>
                <ToolButton active={mode === 'edge'} onClick={() => setMode('edge')} icon={<Share2 size={14} />} label="Connect" color="text-yellow-400" />
                <div className="w-px h-4 bg-gray-700 mx-1"></div>
                <ToolButton active={mode === 'start'} onClick={() => setMode('start')} icon={<PlayCircle size={14} />} label="Start" color="text-green-500" />
                <ToolButton active={mode === 'end'} onClick={() => setMode('end')} icon={<Flag size={14} />} label="End" color="text-red-500" />
            </div>

            <div className="flex items-center gap-2 px-2">
                 <ZoomIn size={16} className="text-gray-500" />
                 <input 
                    type="range" 
                    min="0.5" 
                    max="1.5" 
                    step="0.1" 
                    value={zoom} 
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                 />
                 <span className="text-xs text-gray-500 w-8">{Math.round(zoom * 100)}%</span>
            </div>
        </div>
      </div>
    </div>
  );
}

const ToolButton = ({ active, onClick, icon, label, color }: any) => (
  <button onClick={onClick} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all", active ? "bg-gray-700 text-white shadow-sm" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800")}>
    <span className={cn(active ? color : "text-gray-500")}>{icon}</span>
    <span>{label}</span>
  </button>
);