import React, { memo, useState } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import type { RFSubgraphData } from '@shared/types/flowchart';

const SubgraphNode: React.FC<NodeProps> = ({
  data,
  selected,
}) => {
  const nodeData = (data as unknown) as RFSubgraphData;
  const label = nodeData?.label || 'Subgraph';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);

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

      <div className="absolute -top-6 left-0 right-0">
        <div className="bg-gray-700 text-white px-3 py-1 rounded-t-lg text-sm font-medium">
          {isEditing ? (
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => {
                setIsEditing(false);
              }}
              autoFocus
              className="bg-gray-600 text-white px-2 py-0.5 rounded text-sm w-32"
            />
          ) : (
            <span
              onDoubleClick={() => {
                setIsEditing(true);
                setEditValue(label);
              }}
            >
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(SubgraphNode);