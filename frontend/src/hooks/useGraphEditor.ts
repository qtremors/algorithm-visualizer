import { useState, useCallback } from 'react';

export const useGraphEditor = (inputData: any, handleInputUpdate: (data: any) => void) => {
  const [graphTool, setGraphTool] = useState<string>('node');
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [tempLine, setTempLine] = useState<{start: any, end: any} | null>(null);

  const handleWeightChange = useCallback((sourceId: string, targetId: string, currentWeight: number) => {
    const newWeightStr = prompt(`Enter new weight for connection ${sourceId} -> ${targetId}:`, String(currentWeight));
    if (newWeightStr === null) return;
    
    const newWeight = parseInt(newWeightStr, 10);
    if (!isNaN(newWeight) && newWeight >= 0) {
        const newData = JSON.parse(JSON.stringify(inputData));
        if(newData.adjacency[sourceId]) newData.adjacency[sourceId][targetId] = newWeight;
        if(newData.adjacency[targetId] && newData.adjacency[targetId][sourceId] !== undefined) {
            newData.adjacency[targetId][sourceId] = newWeight;
        }
        handleInputUpdate(newData);
    }
  }, [inputData, handleInputUpdate]);

  // Graph Interactions (Add, Connect, Move)
  const handleGraphInteraction = useCallback((action: string, payload: any) => {
      if (!inputData) return;
      const newData = JSON.parse(JSON.stringify(inputData));
      
      if (action === 'addNode') {
          if (graphTool === 'node') {
              const id = String.fromCharCode(65 + Object.keys(newData.nodes).length); 
              newData.nodes[id] = { x: payload.x, y: payload.y };
              newData.adjacency[id] = {};
              handleInputUpdate(newData);
          }
      } 
      else if (action === 'nodeClick') {
          const nodeId = payload;
          if (graphTool === 'start') {
              newData.start = nodeId;
              handleInputUpdate(newData);
          } else if (graphTool === 'end') {
              newData.end = nodeId;
              handleInputUpdate(newData);
          }
      }
      else if (action === 'connectStart') {
          if (graphTool === 'edge') {
              setDraggedNode(payload.nodeId);
          }
      }
      else if (action === 'connectMove') {
           if (graphTool === 'edge' && draggedNode && inputData.nodes[draggedNode]) {
               const startNode = inputData.nodes[draggedNode];
               setTempLine({ 
                   start: { x: startNode.x, y: startNode.y }, 
                   end: { x: payload.x, y: payload.y } 
               });
           }
      }
      else if (action === 'connectEnd') {
          if (graphTool === 'edge' && draggedNode && payload.nodeId) {
              const u = draggedNode;
              const v = payload.nodeId;
              if (u !== v) {
                  if (!newData.adjacency[u]) newData.adjacency[u] = {};
                  const weight = Math.floor(Math.random() * 10) + 1;
                  newData.adjacency[u][v] = weight;
                  
                  if (!newData.adjacency[v]) newData.adjacency[v] = {};
                  newData.adjacency[v][u] = weight;

                  handleInputUpdate(newData);
              }
          }
          setDraggedNode(null);
          setTempLine(null);
      }
      else if (action === 'connectCancel') {
          setDraggedNode(null);
          setTempLine(null);
      }
  }, [inputData, graphTool, draggedNode, handleInputUpdate]);

  return {
      graphTool,
      setGraphTool,
      draggedNode,
      tempLine,
      handleGraphInteraction,
      handleWeightChange
  };
};