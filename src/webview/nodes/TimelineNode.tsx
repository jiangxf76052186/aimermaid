import React, { memo, useState, useCallback } from 'react';
import { NodeProps } from '@xyflow/react';

interface ActivationRange {
  startY: number;
  endY: number;
}

interface TimelineData {
  participantId: string;
  activations?: ActivationRange[];
  height?: number;
}

const TimelineNode: React.FC<NodeProps> = ({ data }) => {
  const timelineData = (data as unknown) as TimelineData;
  const activations = timelineData?.activations ?? [];
  const baseHeight = timelineData?.height ?? 400;
  
  const [isDragging, setIsDragging] = useState(false);
  const [extraHeight, setExtraHeight] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    const startY = e.clientY;
    const startExtra = extraHeight;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      setExtraHeight(Math.max(0, startExtra + deltaY));
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [extraHeight]);

  const displayHeight = baseHeight + extraHeight;

  return (
    <div
      className="relative w-0.5 bg-gray-500 opacity-50"
      style={{ height: displayHeight }}
    >
      {activations.map((act, idx) => (
        <div
          key={idx}
          className="absolute w-3 bg-blue-500/30 border border-blue-500 rounded-sm"
          style={{
            top: act.startY,
            height: Math.max(act.endY - act.startY, 20),
            left: '-5px',
          }}
        />
      ))}
      
      <div
        className={`
          absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2
          w-4 h-2 rounded-sm cursor-ns-resize
          ${isDragging ? 'bg-blue-500' : 'bg-gray-600 hover:bg-blue-400'}
          transition-colors
        `}
        onMouseDown={handleMouseDown}
        title="拖拽调整时间线长度"
      />
    </div>
  );
};

export default memo(TimelineNode);
