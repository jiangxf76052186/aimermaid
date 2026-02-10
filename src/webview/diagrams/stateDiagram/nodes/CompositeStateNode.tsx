import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import type { RFCompositeNodeData } from '@shared/types/stateDiagram';

const CompositeStateNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as RFCompositeNodeData;
  const name = nodeData?.name || 'State';

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);

  return (
    <div
      className={`relative bg-gray-200/15 border-2 p-4 rounded-lg ${
        selected ? 'border-blue-500' : 'border-gray-400 border-dashed'
      }`}
      style={{ width: 300, height: 200, zIndex: -1 }}
    >
      {selected && (
        <NodeResizer
          minWidth={200}
          minHeight={150}
          lineClassName="!border-blue-500"
          handleClassName="!bg-blue-500"
        />
      )}

      <Handle type="target" position={Position.Top} id="target-top" className="!bg-transparent !w-full !h-2 !top-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Top} id="source-top" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ top: -4 }} />

      <Handle type="target" position={Position.Right} id="target-right" className="!bg-transparent !h-full !w-2 !right-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Right} id="source-right" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ right: -4 }} />

      <Handle type="target" position={Position.Bottom} id="target-bottom" className="!bg-transparent !w-full !h-2 !bottom-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ bottom: -4 }} />

      <Handle type="target" position={Position.Left} id="target-left" className="!bg-transparent !h-full !w-2 !left-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Left} id="source-left" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ left: -4 }} />

      <div className="absolute -top-6 left-0 right-0">
        <div className="bg-gray-700 text-white px-3 py-1 rounded-t-lg text-sm font-medium">
          {isEditing ? (
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => setIsEditing(false)}
              autoFocus
              className="bg-gray-600 text-white px-2 py-0.5 rounded text-sm w-32"
            />
          ) : (
            <span
              onDoubleClick={() => {
                setIsEditing(true);
                setEditValue(name);
              }}
            >
              {name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(CompositeStateNode);
