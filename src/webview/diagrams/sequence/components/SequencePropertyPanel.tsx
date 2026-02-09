import React from 'react';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useDiagramStore } from '../../../stores/diagramStore';
import { MessageType, NotePosition, BlockType } from '@shared/types';

const messageTypes: { value: MessageType; label: string }[] = [
  { value: 'sync', label: '同步 (→)' },
  { value: 'syncDotted', label: '同步虚线 (⇢)' },
  { value: 'asyncOpen', label: '异步 (→)' },
  { value: 'asyncDotted', label: '异步虚线 (⇢)' },
  { value: 'syncCross', label: '同步叉 (→✕)' },
  { value: 'syncDottedCross', label: '同步叉虚线 (⇢✕)' },
];

const blockTypes: { value: BlockType; label: string }[] = [
  { value: 'loop', label: '循环 (loop)' },
  { value: 'alt', label: '条件 (alt)' },
  { value: 'opt', label: '可选 (opt)' },
  { value: 'par', label: '并行 (par)' },
  { value: 'critical', label: '关键 (critical)' },
  { value: 'break', label: '中断 (break)' },
];

const SequencePropertyPanel: React.FC = () => {
  const {
    selectedNodeId,
    selectedEdgeId,
    diagram,
    updateParticipant,
    updateMessage,
    removeParticipant,
    removeMessage,
    moveMessageUp,
    moveMessageDown,
    updateNote,
    removeNote,
    updateBlock,
    removeBlock,
  } = useDiagramStore();

  const selectedParticipant = selectedNodeId
    ? diagram.participants.find((p) => p.id === selectedNodeId)
    : null;

  const selectedNote = selectedNodeId?.startsWith('n_')
    ? diagram.notes.find((n) => n.id === selectedNodeId)
    : null;

  const selectedBlock = selectedNodeId?.startsWith('b_')
    ? diagram.blocks.find((b) => b.id === selectedNodeId)
    : null;

  const selectedMessage = selectedEdgeId
    ? diagram.messages.find((m) => m.id === selectedEdgeId)
    : null;

  if (!selectedParticipant && !selectedMessage && !selectedNote && !selectedBlock) {
    return (
      <div className="w-64 bg-vscode-input-bg border-l border-vscode-border p-4">
        <div className="text-sm text-gray-400">选择元素以编辑属性</div>
      </div>
    );
  }

  if (selectedParticipant) {
    return (
      <div className="w-64 bg-vscode-input-bg border-l border-vscode-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">参与者属性</h3>
          <button
            onClick={() => removeParticipant(selectedParticipant.id)}
            className="p-1 text-red-400 hover:bg-red-400/20 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">名称 (ID)</label>
            <input
              type="text"
              value={selectedParticipant.name}
              onChange={(e) =>
                updateParticipant(selectedParticipant.id, { name: e.target.value })
              }
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">显示名称</label>
            <input
              type="text"
              value={selectedParticipant.alias || ''}
              onChange={(e) =>
                updateParticipant(selectedParticipant.id, {
                  alias: e.target.value || undefined,
                })
              }
              placeholder={selectedParticipant.name}
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">类型</label>
            <select
              value={selectedParticipant.type}
              onChange={(e) =>
                updateParticipant(selectedParticipant.id, {
                  type: e.target.value as 'participant' | 'actor',
                })
              }
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
            >
              <option value="participant">参与者 (方框)</option>
              <option value="actor">角色 (人形)</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (selectedNote) {
    return (
      <div className="w-64 bg-vscode-input-bg border-l border-vscode-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">注释属性</h3>
          <button
            onClick={() => removeNote(selectedNote.id)}
            className="p-1 text-red-400 hover:bg-red-400/20 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">文本内容</label>
            <textarea
              value={selectedNote.text}
              onChange={(e) =>
                updateNote(selectedNote.id, { text: e.target.value })
              }
              rows={3}
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">位置</label>
            <select
              value={selectedNote.position}
              onChange={(e) =>
                updateNote(selectedNote.id, { position: e.target.value as NotePosition })
              }
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
            >
              <option value="over">上方 (over)</option>
              <option value="left">左侧 (left of)</option>
              <option value="right">右侧 (right of)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">关联参与者</label>
            <div className="text-xs text-gray-500">
              {selectedNote.participantIds
                .map((id) => diagram.participants.find((p) => p.id === id)?.name || id)
                .join(', ')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedBlock) {
    return (
      <div className="w-64 bg-vscode-input-bg border-l border-vscode-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">块属性</h3>
          <button
            onClick={() => removeBlock(selectedBlock.id)}
            className="p-1 text-red-400 hover:bg-red-400/20 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">块类型</label>
            <select
              value={selectedBlock.type}
              onChange={(e) =>
                updateBlock(selectedBlock.id, { type: e.target.value as BlockType })
              }
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
            >
              {blockTypes.map((bt) => (
                <option key={bt.value} value={bt.value}>
                  {bt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">标签文本</label>
            <input
              type="text"
              value={selectedBlock.label}
              onChange={(e) =>
                updateBlock(selectedBlock.id, { label: e.target.value })
              }
              placeholder="例如: 重试3次"
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">包含消息</label>
            <div className="text-xs text-gray-500 space-y-1 max-h-32 overflow-y-auto">
              {selectedBlock.messageIds.length === 0 ? (
                <div className="italic">无消息</div>
              ) : (
                selectedBlock.messageIds.map((msgId) => {
                  const msg = diagram.messages.find((m) => m.id === msgId);
                  return msg ? (
                    <div key={msgId} className="truncate">
                      {msg.text || '(无文本)'}
                    </div>
                  ) : null;
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedMessage) {
    const fromParticipant = diagram.participants.find((p) => p.id === selectedMessage.from);
    const toParticipant = diagram.participants.find((p) => p.id === selectedMessage.to);
    const sortedMessages = [...diagram.messages].sort((a, b) => a.order - b.order);
    const messageIndex = sortedMessages.findIndex(m => m.id === selectedMessage.id);
    const isFirst = messageIndex === 0;
    const isLast = messageIndex === sortedMessages.length - 1;

    return (
      <div className="w-64 bg-vscode-input-bg border-l border-vscode-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">消息属性</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => moveMessageUp(selectedMessage.id)}
              disabled={isFirst}
              className="p-1 text-gray-400 hover:bg-gray-600/20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="上移"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => moveMessageDown(selectedMessage.id)}
              disabled={isLast}
              className="p-1 text-gray-400 hover:bg-gray-600/20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="下移"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => removeMessage(selectedMessage.id)}
              className="p-1 text-red-400 hover:bg-red-400/20 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">消息文本</label>
            <input
              type="text"
              value={selectedMessage.text}
              onChange={(e) =>
                updateMessage(selectedMessage.id, { text: e.target.value })
              }
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">消息类型</label>
            <select
              value={selectedMessage.type}
              onChange={(e) =>
                updateMessage(selectedMessage.id, { type: e.target.value as MessageType })
              }
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
            >
              {messageTypes.map((mt) => (
                <option key={mt.value} value={mt.value}>
                  {mt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">激活控制</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedMessage.activateTarget || false}
                  onChange={(e) =>
                    updateMessage(selectedMessage.id, {
                      activateTarget: e.target.checked,
                      deactivateTarget: e.target.checked ? false : selectedMessage.deactivateTarget
                    })
                  }
                  className="w-4 h-4 rounded border-vscode-border"
                />
                <span>激活目标 (+)</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedMessage.deactivateTarget || false}
                  onChange={(e) =>
                    updateMessage(selectedMessage.id, {
                      deactivateTarget: e.target.checked,
                      activateTarget: e.target.checked ? false : selectedMessage.activateTarget
                    })
                  }
                  className="w-4 h-4 rounded border-vscode-border"
                />
                <span>停用目标 (-)</span>
              </label>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <div>从: {fromParticipant?.alias || fromParticipant?.name || selectedMessage.from}</div>
            <div>到: {toParticipant?.alias || toParticipant?.name || selectedMessage.to}</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SequencePropertyPanel;
