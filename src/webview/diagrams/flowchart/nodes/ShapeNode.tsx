import React, { memo, useState, useCallback, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { RFNodeData } from '@shared/types/flowchart';

const ShapeNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as unknown as RFNodeData;
  const label = nodeData?.label || '';
  const shape = nodeData?.shape || 'rect';
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  
  // TODO: Connect to diagramStore when flowchart support is added

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(label);
  }, [label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== label) {
      console.log(`Update node ${id} label to: ${editValue}`);
    }
  }, [editValue, label, id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(label);
    }
  }, [handleBlur, label]);

  const ShapeRenderer = useMemo(() => {
    const commonProps = {
      className: `fill-vscode-input-bg stroke-2 ${selected ? 'stroke-blue-500' : 'stroke-vscode-border'} transition-colors duration-150`,
      vectorEffect: 'non-scaling-stroke',
    };

    switch (shape) {
      case 'rect':
        return <rect x="2" y="2" width="96" height="96" {...commonProps} />;
      case 'rounded':
        return <rect x="2" y="2" width="96" height="96" rx="10" ry="10" {...commonProps} />;
      case 'diamond':
        return <polygon points="50,2 98,50 50,98 2,50" {...commonProps} />;
      case 'circle':
        return <circle cx="50" cy="50" r="48" {...commonProps} />;
      case 'cylinder':
        return (
          <path
            d="M10,15 A40,15 0 0,0 90,15 A40,15 0 0,0 10,15 M10,15 L10,85 A40,15 0 0,0 90,85 L90,15"
            {...commonProps}
          />
        );
      case 'subprocess':
        return (
          <g>
            <rect x="2" y="2" width="96" height="96" {...commonProps} />
            <line x1="15" y1="2" x2="15" y2="98" className={commonProps.className} />
            <line x1="85" y1="2" x2="85" y2="98" className={commonProps.className} />
          </g>
        );
      case 'hexagon':
        return <polygon points="25,2 75,2 98,50 75,98 25,98 2,50" {...commonProps} />;
      case 'parallelogram':
        return <polygon points="20,2 98,2 80,98 2,98" {...commonProps} />;
      case 'parallelogram-alt':
        return <polygon points="2,2 80,2 98,98 20,98" {...commonProps} />;
      case 'trapezoid':
        return <polygon points="20,2 80,2 98,98 2,98" {...commonProps} />;
      case 'trapezoid-alt':
        return <polygon points="2,2 98,2 80,98 20,98" {...commonProps} />;
      default:
        return <rect x="2" y="2" width="96" height="96" {...commonProps} />;
    }
  }, [shape, selected]);

  return (
    <div 
      className="relative w-full h-full min-w-[100px] min-h-[50px] group"
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} id="target-top" className="!bg-transparent !w-full !h-2 !top-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Top} id="source-top" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ top: -4 }} />
      
      <Handle type="target" position={Position.Right} id="target-right" className="!bg-transparent !h-full !w-2 !right-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Right} id="source-right" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ right: -4 }} />

      <Handle type="target" position={Position.Bottom} id="target-bottom" className="!bg-transparent !w-full !h-2 !bottom-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ bottom: -4 }} />

      <Handle type="target" position={Position.Left} id="target-left" className="!bg-transparent !h-full !w-2 !left-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Left} id="source-left" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ left: -4 }} />

      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        {ShapeRenderer}
      </svg>

      <div className="relative z-10 flex items-center justify-center w-full h-full p-4 text-center">
        {isEditing ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full h-full p-1 text-sm text-center bg-transparent outline-none resize-none text-vscode-fg"
            style={{ minHeight: '1.5em' }}
          />
        ) : (
          <span className="text-sm font-medium text-vscode-fg select-none pointer-events-none break-words max-w-full">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default memo(ShapeNode);