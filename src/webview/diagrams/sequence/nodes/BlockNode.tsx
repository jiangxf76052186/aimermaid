import React, { memo, useState, useCallback } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { BlockType } from '@shared/types';
import { useDiagramStore } from '../../../stores/diagramStore';

interface BlockNodeData {
  blockType: BlockType;
  label: string;
  width: number;
  height: number;
}

const blockTypeColors: Record<BlockType, { border: string; bg: string; text: string }> = {
  loop: { border: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', text: 'text-green-500' },
  alt: { border: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', text: 'text-orange-500' },
  else: { border: '#fb923c', bg: 'rgba(251, 146, 60, 0.1)', text: 'text-orange-400' },
  opt: { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', text: 'text-purple-500' },
  par: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', text: 'text-blue-500' },
  critical: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', text: 'text-red-500' },
  break: { border: '#f87171', bg: 'rgba(248, 113, 113, 0.1)', text: 'text-red-400' },
};

const blockTypeLabels: Record<BlockType, string> = {
  loop: 'loop',
  alt: 'alt',
  else: 'else',
  opt: 'opt',
  par: 'par',
  critical: 'critical',
  break: 'break',
};

const BlockNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const blockData = (data as unknown) as BlockNodeData;
  const { blockType, label } = blockData;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  
  const updateBlock = useDiagramStore((s) => s.updateBlock);
  const syncBlockContents = useDiagramStore((s) => s.syncBlockContents);

  const colors = blockTypeColors[blockType] || { border: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', text: 'text-gray-500' };

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(label);
  }, [label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() !== label) {
      updateBlock(id, { label: editValue.trim() });
    }
  }, [editValue, label, id, updateBlock]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(label);
    }
  }, [handleBlur, label]);

  const handleResizeEnd = useCallback((_event: unknown, params: { x: number; y: number; width: number; height: number }) => {
    syncBlockContents(id, params);
  }, [id, syncBlockContents]);

  return (
    <>
      <NodeResizer
        color={colors.border}
        isVisible={selected}
        minWidth={100}
        minHeight={60}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
        }}
        lineStyle={{
          borderWidth: 1,
        }}
        onResizeEnd={handleResizeEnd}
      />
      <div
        className={`
          relative rounded-lg border-2 border-dashed
          w-full h-full
          ${selected ? 'ring-2 ring-blue-500' : ''}
          transition-all duration-150
        `}
        style={{ 
          borderColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <div  
          className={`
            absolute -top-3 left-2 px-2 py-0.5
            text-xs font-medium
            bg-vscode-bg rounded
            ${colors.text}
            flex items-center gap-1
            cursor-pointer
          `}
          onDoubleClick={handleDoubleClick}
        >
          <span>{blockTypeLabels[blockType]}</span>
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-24 px-1 bg-vscode-input-bg border border-blue-500 rounded outline-none text-vscode-fg"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            label && <span className="text-vscode-fg font-normal">[{label}]</span>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(BlockNode);
