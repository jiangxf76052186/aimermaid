import React, { useEffect, useRef } from 'react';
import { ArrowUpToLine, ArrowDownToLine, Trash2 } from 'lucide-react';
import { useDiagramStore } from '../../stores/diagramStore';

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  nodeType: string;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, nodeId, nodeType, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { bringToFront, sendToBack, deleteSelected, setSelectedNode } = useDiagramStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleBringToFront = () => {
    bringToFront(nodeId);
    onClose();
  };

  const handleSendToBack = () => {
    sendToBack(nodeId);
    onClose();
  };

  const handleDelete = () => {
    setSelectedNode(nodeId);
    setTimeout(() => deleteSelected(), 0);
    onClose();
  };

  const getNodeTypeName = () => {
    switch (nodeType) {
      case 'participant': return '参与者';
      case 'note': return '注释';
      case 'block': return '块';
      default: return '元素';
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-vscode-input-bg border border-vscode-border rounded-lg shadow-xl py-1 z-[1000] min-w-[140px]"
      style={{ left: x, top: y }}
    >
      <div className="px-3 py-1.5 text-xs text-gray-400 border-b border-vscode-border">
        {getNodeTypeName()}
      </div>
      <button
        onClick={handleBringToFront}
        className="w-full px-3 py-2 text-sm text-left hover:bg-vscode-list-hover flex items-center gap-2"
      >
        <ArrowUpToLine className="w-4 h-4" />
        置顶
      </button>
      <button
        onClick={handleSendToBack}
        className="w-full px-3 py-2 text-sm text-left hover:bg-vscode-list-hover flex items-center gap-2"
      >
        <ArrowDownToLine className="w-4 h-4" />
        置底
      </button>
      <div className="border-t border-vscode-border my-1" />
      <button
        onClick={handleDelete}
        className="w-full px-3 py-2 text-sm text-left hover:bg-vscode-list-hover flex items-center gap-2 text-red-400"
      >
        <Trash2 className="w-4 h-4" />
        删除
      </button>
    </div>
  );
};

export default ContextMenu;
