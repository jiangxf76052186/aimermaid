import React, { memo, useState, useCallback } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import type { RFTransitionEdgeData } from '@shared/types/stateDiagram';

const TransitionEdge: React.FC<EdgeProps> = ({
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
  const edgeData = data as unknown as RFTransitionEdgeData;
  const label = edgeData?.label || '';

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(label);
    },
    [label]
  );

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue !== label) {
      console.log(`Update transition ${id} label to: ${editValue}`);
    }
  }, [editValue, label, id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleBlur();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setEditValue(label);
      }
    },
    [handleBlur, label]
  );

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path ${selected ? 'stroke-[3px]' : ''}`}
        d={edgePath}
        markerEnd="url(#arrowhead)"
        style={{
          fill: 'none',
          stroke: 'var(--vscode-editor-foreground)',
        }}
      />

      <path d={edgePath} fill="none" strokeOpacity={0} strokeWidth={20} />

      {(label || isEditing) && (
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
              className={`px-2 py-1 rounded text-xs bg-vscode-editor-background border border-vscode-border ${
                selected ? 'ring-1 ring-vscode-focusBorder' : ''
              }`}
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
                <span className="text-vscode-editor-foreground">{label}</span>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(TransitionEdge);
