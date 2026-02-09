import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { User, Server } from 'lucide-react';
import { useDiagramStore } from '../../../stores/diagramStore';

interface ParticipantData {
  label: string;
  name: string;
  participantType: 'participant' | 'actor';
}

const ParticipantNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const participantData = (data as unknown) as ParticipantData;
  const label = participantData?.label ?? '';
  const participantType = participantData?.participantType ?? 'participant';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const updateParticipant = useDiagramStore((s) => s.updateParticipant);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(label);
  }, [label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== label) {
      updateParticipant(id, { alias: editValue.trim() });
    }
  }, [editValue, label, id, updateParticipant]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(label);
    }
  }, [handleBlur, label]);

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[100px] text-center
        bg-vscode-input-bg text-vscode-fg
        ${selected ? 'border-blue-500 shadow-lg' : 'border-vscode-border'}
        transition-all duration-150
      `}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="source" position={Position.Left} id="source-left" className="!bg-blue-500" />
      <Handle type="target" position={Position.Left} id="target-left" className="!bg-blue-500" />
      <Handle type="source" position={Position.Right} id="source-right" className="!bg-blue-500" />
      <Handle type="target" position={Position.Right} id="target-right" className="!bg-blue-500" />
      
      <div className="flex flex-col items-center gap-1">
        {participantType === 'actor' ? (
          <User className="w-6 h-6 text-blue-400" />
        ) : (
          <Server className="w-6 h-6 text-green-400" />
        )}
        
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full px-1 py-0.5 text-center text-sm bg-vscode-input-bg border border-blue-500 rounded outline-none"
          />
        ) : (
          <span className="text-sm font-medium">{label}</span>
        )}
      </div>
    </div>
  );
};

export default memo(ParticipantNode);
