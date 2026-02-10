import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { RFStateNodeData } from '@shared/types/stateDiagram';

const StateNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as unknown as RFStateNodeData;
  const name = nodeData?.name || '';
  const description = nodeData?.description;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(name);
  }, [name]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== name) {
      console.log(`Update state ${id} name to: ${editValue}`);
    }
  }, [editValue, name, id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        handleBlur();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setEditValue(name);
      }
    },
    [handleBlur, name]
  );

  return (
    <div
      className={`relative min-w-[120px] min-h-[50px] rounded-lg border-2 bg-vscode-input-bg transition-colors duration-150 ${
        selected ? 'border-blue-500' : 'border-vscode-border'
      }`}
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

      <div className="flex flex-col items-center justify-center p-3 text-center">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full px-1 text-sm text-center bg-transparent outline-none text-vscode-fg"
          />
        ) : (
          <>
            <span className="text-sm font-medium text-vscode-fg select-none">{name}</span>
            {description && description !== name && (
              <span className="text-xs text-gray-400 select-none mt-0.5">{description}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default memo(StateNode);
