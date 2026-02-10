import React, { memo, useState, useCallback } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { RFEdgeData } from '@shared/types/flowchart';

// TODO: Replace with import from '../store' when available
const useFlowchartStore = <T,>(selector: (state: any) => T): T => {
  return selector({
    updateEdge: () => {},
  });
};

const FlowEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const edgeData = data as unknown as RFEdgeData;
  const { text, edgeType } = edgeData || {};
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text || '');
  const updateEdge = useFlowchartStore((s) => s.updateEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getStrokeStyle = () => {
    switch (edgeType) {
      case 'dotted-arrow':
      case 'dotted-open':
        return { strokeDasharray: '5,5' };
      case 'thick-arrow':
      case 'thick-open':
        return { strokeWidth: 3 };
      default:
        return {};
    }
  };

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(text || '');
  }, [text]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue !== text) {
      updateEdge(id, { text: editValue });
    }
  }, [editValue, text, id, updateEdge]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(text || '');
    }
  }, [handleBlur, text]);

  const hasArrow = edgeType?.includes('arrow');

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path ${selected ? 'stroke-[3px]' : ''}`}
        d={edgePath}
        markerEnd={hasArrow ? 'url(#arrowhead)' : undefined}
        style={{
          ...getStrokeStyle(),
          fill: 'none',
          stroke: 'var(--vscode-editor-foreground)',
        }}
      />
      
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
      />

      {(text || isEditing) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div 
              className={`
                px-2 py-1 rounded text-xs
                bg-vscode-editor-background border border-vscode-border
                ${selected ? 'ring-1 ring-vscode-focusBorder' : ''}
              `}
              onDoubleClick={handleDoubleClick}
            >
              {isEditing ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="w-24 bg-transparent outline-none text-vscode-editor-foreground"
                />
              ) : (
                <span className="text-vscode-editor-foreground">{text}</span>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(FlowEdge);
