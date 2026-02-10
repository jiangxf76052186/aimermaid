import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { RFChoiceNodeData } from '@shared/types/stateDiagram';

const ChoiceNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as RFChoiceNodeData;
  const name = nodeData?.name || '';

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <Handle type="target" position={Position.Top} id="target-top" className="!bg-transparent !w-full !h-2 !top-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Top} id="source-top" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ top: -4 }} />

      <Handle type="target" position={Position.Right} id="target-right" className="!bg-transparent !h-full !w-2 !right-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Right} id="source-right" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ right: -4 }} />

      <Handle type="target" position={Position.Bottom} id="target-bottom" className="!bg-transparent !w-full !h-2 !bottom-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ bottom: -4 }} />

      <Handle type="target" position={Position.Left} id="target-left" className="!bg-transparent !h-full !w-2 !left-0 !border-none !rounded-none hover:!bg-blue-500/20 transition-colors" />
      <Handle type="source" position={Position.Left} id="source-left" className="!w-2 !h-2 !bg-blue-500 !border-white" style={{ left: -4 }} />

      <div
        className={`w-12 h-12 rotate-45 border-2 bg-vscode-input-bg transition-colors duration-150 ${
          selected ? 'border-blue-500' : 'border-vscode-border'
        }`}
      >
        <div className="-rotate-45 flex items-center justify-center w-full h-full">
          <span className="text-xs text-vscode-fg select-none truncate max-w-[40px]">{name}</span>
        </div>
      </div>
    </div>
  );
};

export default memo(ChoiceNode);
