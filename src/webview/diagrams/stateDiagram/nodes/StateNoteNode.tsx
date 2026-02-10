import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { RFStateNoteNodeData } from '@shared/types/stateDiagram';

const StateNoteNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as unknown as RFStateNoteNodeData;
  const text = nodeData?.text || '';

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(text);
  }, [text]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== text) {
      console.log(`Update note ${id} text to: ${editValue}`);
    }
  }, [editValue, text, id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditing(false);
        setEditValue(text);
      }
    },
    [text]
  );

  return (
    <div
      className={`relative bg-yellow-100 border shadow-sm rounded px-3 py-2 min-w-[80px] max-w-[180px] transition-colors duration-150 ${
        selected ? 'border-blue-500' : 'border-yellow-300'
      }`}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Left} id="target-left" className="!bg-transparent !h-full !w-2 !left-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Left} id="source-left" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ left: -4 }} />

      <Handle type="target" position={Position.Right} id="target-right" className="!bg-transparent !h-full !w-2 !right-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Right} id="source-right" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ right: -4 }} />

      {isEditing ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full text-xs bg-transparent outline-none resize-none text-gray-800"
          rows={3}
        />
      ) : (
        <span className="text-xs text-gray-800 select-none whitespace-pre-wrap">{text}</span>
      )}
    </div>
  );
};

export default memo(StateNoteNode);
