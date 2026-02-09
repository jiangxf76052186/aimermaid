import React from 'react';
import { User, Server, StickyNote, Repeat, GitBranch } from 'lucide-react';
import { useDiagramStore } from '../../../stores/diagramStore';

interface ToolItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

const SequenceToolbar: React.FC = () => {
  const { addParticipant, addNote, addBlock, diagram, getSelectedBlockId } = useDiagramStore();

  const tools: ToolItem[] = [
    {
      id: 'participant',
      label: '参与者',
      icon: <Server className="w-5 h-5" />,
      action: () => addParticipant(`Service${diagram.participants.length + 1}`, 'participant'),
    },
    {
      id: 'actor',
      label: '角色',
      icon: <User className="w-5 h-5" />,
      action: () => addParticipant(`User${diagram.participants.length + 1}`, 'actor'),
    },
    {
      id: 'note',
      label: '注释',
      icon: <StickyNote className="w-5 h-5" />,
      action: () => {
        if (diagram.participants.length > 0) {
          const firstParticipant = diagram.participants[0];
          const parentBlockId = getSelectedBlockId();
          addNote('New Note', 'over', [firstParticipant.id], parentBlockId ?? undefined);
        }
      },
    },
    {
      id: 'loop',
      label: '循环',
      icon: <Repeat className="w-5 h-5" />,
      action: () => {
        const parentBlockId = getSelectedBlockId();
        addBlock('loop', 'condition', [], parentBlockId ?? undefined);
      },
    },
    {
      id: 'alt',
      label: '分支',
      icon: <GitBranch className="w-5 h-5" />,
      action: () => {
        const parentBlockId = getSelectedBlockId();
        addBlock('alt', 'condition', [], parentBlockId ?? undefined);
      },
    },
  ];

  return (
    <div className="w-20 bg-vscode-input-bg border-r border-vscode-border flex flex-col items-center py-4 gap-2">
      <div className="text-xs text-gray-400 mb-2">元素</div>
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={tool.action}
          className="
            w-14 h-14 flex flex-col items-center justify-center gap-1
            rounded-lg border border-vscode-border
            hover:bg-vscode-list-hover hover:border-blue-500
            transition-colors duration-150
          "
          title={tool.label}
        >
          {tool.icon}
          <span className="text-[10px] text-gray-400">{tool.label}</span>
        </button>
      ))}
      
      <div className="border-t border-vscode-border w-12 my-2" />
      
      <div className="text-xs text-gray-400 mb-2">提示</div>
      <div className="text-[10px] text-gray-500 px-2 text-center">
        从参与者拖拽连线创建消息
      </div>
    </div>
  );
};

export default SequenceToolbar;
