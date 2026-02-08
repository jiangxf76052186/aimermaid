import React, { memo, useState, useCallback } from 'react';
import { EdgeProps, EdgeLabelRenderer } from '@xyflow/react';
import { useDiagramStore } from '../stores/diagramStore';
import { MessageType } from '@shared/types';

interface MessageData {
  text: string;
  messageType: MessageType;
  order: number;
  yOffset: number;
}

const messageTypeStyles: Record<MessageType, { stroke: string; strokeDasharray?: string }> = {
  sync: { stroke: '#3b82f6' },
  syncDotted: { stroke: '#3b82f6', strokeDasharray: '5,5' },
  asyncOpen: { stroke: '#10b981' },
  asyncDotted: { stroke: '#10b981', strokeDasharray: '5,5' },
  syncCross: { stroke: '#ef4444' },
  syncDottedCross: { stroke: '#ef4444', strokeDasharray: '5,5' },
};

const MessageEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}) => {
  const messageData = (data ?? {}) as Partial<MessageData>;
  const text = messageData.text ?? '';
  const messageType = messageData.messageType ?? 'sync';
  const yOffset = messageData.yOffset ?? 80;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const updateMessage = useDiagramStore((s) => s.updateMessage);

  const adjustedSourceY = sourceY + yOffset;
  const adjustedTargetY = targetY + yOffset;
  
  const labelX = (sourceX + targetX) / 2;
  const labelY = (adjustedSourceY + adjustedTargetY) / 2;

  const style = messageTypeStyles[messageType] || messageTypeStyles.sync;

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(text);
  }, [text]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== text) {
      updateMessage(id, { text: editValue.trim() });
    }
  }, [editValue, text, id, updateMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(text);
    }
  }, [handleBlur, text]);

  const arrowSize = 8;
  const dx = targetX - sourceX;
  const dy = adjustedTargetY - adjustedSourceY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const unitX = len > 0 ? dx / len : 1;
  const unitY = len > 0 ? dy / len : 0;
  
  const arrowTipX = targetX;
  const arrowTipY = adjustedTargetY;
  const arrowBase1X = arrowTipX - unitX * arrowSize - unitY * arrowSize * 0.5;
  const arrowBase1Y = arrowTipY - unitY * arrowSize + unitX * arrowSize * 0.5;
  const arrowBase2X = arrowTipX - unitX * arrowSize + unitY * arrowSize * 0.5;
  const arrowBase2Y = arrowTipY - unitY * arrowSize - unitX * arrowSize * 0.5;

  const isAsync = messageType === 'asyncOpen' || messageType === 'asyncDotted';
  
  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path ${selected ? 'stroke-[3px]' : 'stroke-2'}`}
        d={`M ${sourceX} ${adjustedSourceY} L ${targetX} ${adjustedTargetY}`}
        style={{
          stroke: style.stroke,
          strokeDasharray: style.strokeDasharray,
          fill: 'none',
        }}
      />
      
      {isAsync ? (
        <polygon
          points={`${arrowTipX},${arrowTipY} ${arrowBase1X},${arrowBase1Y} ${arrowBase2X},${arrowBase2Y}`}
          fill="var(--vscode-editor-background, #1e1e1e)"
          stroke={style.stroke}
          strokeWidth={2}
        />
      ) : (
        <polygon
          points={`${arrowTipX},${arrowTipY} ${arrowBase1X},${arrowBase1Y} ${arrowBase2X},${arrowBase2Y}`}
          fill={style.stroke}
        />
      )}
      
      <EdgeLabelRenderer>
        <div
          className={`
            absolute px-2 py-1 rounded text-xs
            bg-vscode-input-bg border border-vscode-border
            ${selected ? 'ring-2 ring-blue-500' : ''}
            transform -translate-x-1/2 -translate-y-1/2
            pointer-events-auto cursor-pointer
          `}
          style={{
            left: labelX,
            top: labelY - 15,
          }}
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-24 px-1 bg-vscode-input-bg border border-blue-500 rounded outline-none"
            />
          ) : (
            <span className="text-vscode-fg">{text}</span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(MessageEdge);
