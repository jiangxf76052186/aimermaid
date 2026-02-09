import React, { memo, useState, useCallback } from 'react';
import { NodeProps } from '@xyflow/react';
import { useDiagramStore } from '../../../stores/diagramStore';
import { NotePosition } from '@shared/types';

interface NoteNodeData {
  text: string;
  notePosition: NotePosition;
  participantIds: string[];
}

const NoteNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const noteData = (data as unknown) as NoteNodeData;
  const text = noteData?.text ?? '';
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  
  const updateNote = useDiagramStore((s) => s.updateNote);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(text);
  }, [text]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() !== text) {
      updateNote(id, { text: editValue.trim() });
    }
  }, [editValue, text, id, updateNote]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(text);
    }
  }, [handleBlur, text]);

  return (
    <div
      className={`
        relative
        min-w-[120px] max-w-[150px]
        p-3
        bg-yellow-100 
        border border-yellow-400
        text-gray-800 text-sm
        shadow-sm
        ${selected ? 'ring-2 ring-blue-500' : ''}
        transition-all duration-150
      `}
      onDoubleClick={handleDoubleClick}
    >
      <div 
        className="absolute top-0 right-0 border-t-[12px] border-l-[12px] border-t-white/50 border-l-transparent shadow-sm"
        style={{ filter: 'drop-shadow(-1px 1px 1px rgba(0,0,0,0.1))' }}
      />
      
      <div 
        className="absolute -top-[1px] -right-[1px] w-0 h-0 
        border-b-[12px] border-r-[12px] 
        border-b-yellow-200 border-r-white 
        bg-transparent"
      />

      <div className="flex flex-col w-full h-full">
        {isEditing ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full min-h-[60px] p-1 bg-yellow-50 border border-yellow-500 rounded outline-none resize-none text-sm leading-tight"
          />
        ) : (
          <div className="whitespace-pre-wrap break-words leading-tight min-h-[1.25rem]">
            {text || <span className="text-yellow-700/50 italic">Empty note</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(NoteNode);
