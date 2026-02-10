import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { RFStartEndNodeData } from '@shared/types/stateDiagram';

const StartEndNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as RFStartEndNodeData;
  const isStart = nodeData?.stateType === 'start';

  return (
    <div className="relative flex items-center justify-center">
      <Handle type="target" position={Position.Top} id="target-top" className="!bg-transparent !w-full !h-2 !top-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Top} id="source-top" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ top: -4 }} />

      <Handle type="target" position={Position.Right} id="target-right" className="!bg-transparent !h-full !w-2 !right-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Right} id="source-right" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ right: -4 }} />

      <Handle type="target" position={Position.Bottom} id="target-bottom" className="!bg-transparent !w-full !h-2 !bottom-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ bottom: -4 }} />

      <Handle type="target" position={Position.Left} id="target-left" className="!bg-transparent !h-full !w-2 !left-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Left} id="source-left" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ left: -4 }} />

      {isStart ? (
        <div
          className={`w-8 h-8 rounded-full bg-current transition-colors ${
            selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent' : ''
          }`}
        />
      ) : (
        <div
          className={`w-10 h-10 rounded-full border-[3px] border-current flex items-center justify-center transition-colors ${
            selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent' : ''
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-current" />
        </div>
      )}
    </div>
  );
};

export default memo(StartEndNode);
