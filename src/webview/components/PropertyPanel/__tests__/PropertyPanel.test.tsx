import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PropertyPanel from '../PropertyPanel';
import { useDiagramStore } from '../../../stores/diagramStore';
import { Participant, Message, Note, Block, SequenceDiagram } from '@shared/types';

vi.mock('../../../stores/diagramStore');

describe('PropertyPanel Component', () => {
  const mockParticipant: Participant = {
    id: 'p1',
    name: 'Alice',
    alias: 'A',
    type: 'participant',
    order: 0,
  };

  const mockParticipant2: Participant = {
    id: 'p2',
    name: 'Bob',
    alias: 'B',
    type: 'actor',
    order: 1,
  };

  const mockMessage: Message = {
    id: 'm1',
    from: 'p1',
    to: 'p2',
    text: 'Hello',
    type: 'sync',
    order: 0,
    activateTarget: false,
    deactivateTarget: false,
  };

  const mockMessage2: Message = {
    id: 'm2',
    from: 'p2',
    to: 'p1',
    text: 'Hi',
    type: 'syncDotted',
    order: 1,
    activateTarget: true,
    deactivateTarget: false,
  };

  const mockNote: Note = {
    id: 'n_1',
    text: 'Note content',
    position: 'left',
    participantIds: ['p1'],
    order: 0,
  };

  const mockBlock: Block = {
    id: 'b_1',
    type: 'loop',
    label: 'retry',
    messageIds: ['m1'],
    children: [],
  };

  const mockDiagram: SequenceDiagram = {
    type: 'sequence',
    participants: [mockParticipant, mockParticipant2],
    messages: [mockMessage, mockMessage2],
    notes: [mockNote],
    activations: [],
    blocks: [mockBlock],
  };

  const mockStoreActions = {
    updateParticipant: vi.fn(),
    updateMessage: vi.fn(),
    removeParticipant: vi.fn(),
    removeMessage: vi.fn(),
    moveMessageUp: vi.fn(),
    moveMessageDown: vi.fn(),
    updateNote: vi.fn(),
    removeNote: vi.fn(),
    updateBlock: vi.fn(),
    removeBlock: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should display empty state message when nothing selected', () => {
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: null,
        selectedEdgeId: null,
        diagram: mockDiagram,
        ...mockStoreActions,
      });

      render(<PropertyPanel />);
      expect(screen.getByText('选择元素以编辑属性')).toBeInTheDocument();
    });
  });

  describe('Participant Form', () => {
    beforeEach(() => {
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: 'p1',
        selectedEdgeId: null,
        diagram: mockDiagram,
        ...mockStoreActions,
      });
    });

    it('should display participant form when participant selected', () => {
      render(<PropertyPanel />);
      expect(screen.getByText('参与者属性')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A')).toBeInTheDocument();
    });

    it('should update participant name on input change', async () => {
      render(<PropertyPanel />);

      const nameInput = screen.getByDisplayValue('Alice') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Charlie' } });

      expect(mockStoreActions.updateParticipant).toHaveBeenCalledWith('p1', {
        name: 'Charlie',
      });
    });

    it('should update participant alias on input change', async () => {
      render(<PropertyPanel />);

      const aliasInput = screen.getByDisplayValue('A') as HTMLInputElement;
      fireEvent.change(aliasInput, { target: { value: 'C' } });

      expect(mockStoreActions.updateParticipant).toHaveBeenCalledWith('p1', {
        alias: 'C',
      });
    });

    it('should update participant type on select change', async () => {
      const user = userEvent.setup();
      render(<PropertyPanel />);

      const selects = screen.getAllByRole('combobox');
      const typeSelect = selects[0] as HTMLSelectElement;
      await user.selectOptions(typeSelect, 'actor');

      expect(mockStoreActions.updateParticipant).toHaveBeenCalledWith('p1', {
        type: 'actor',
      });
    });

    it('should delete participant when delete button clicked', async () => {
      const user = userEvent.setup();
      render(<PropertyPanel />);

      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      expect(mockStoreActions.removeParticipant).toHaveBeenCalledWith('p1');
    });

    it('should clear alias when empty and update to undefined', async () => {
      render(<PropertyPanel />);

      const aliasInput = screen.getByDisplayValue('A') as HTMLInputElement;
      fireEvent.change(aliasInput, { target: { value: '' } });

      expect(mockStoreActions.updateParticipant).toHaveBeenCalledWith('p1', {
        alias: undefined,
      });
    });
  });

  describe('Message Form', () => {
    beforeEach(() => {
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: null,
        selectedEdgeId: 'm1',
        diagram: mockDiagram,
        ...mockStoreActions,
      });
    });

    it('should display message form when message selected', () => {
      render(<PropertyPanel />);
      expect(screen.getByText('消息属性')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    });

    it('should display message participant names', () => {
      render(<PropertyPanel />);
      const fromElement = screen.getByText(/从:/);
      const toElement = screen.getByText(/到:/);
      expect(fromElement.textContent).toContain('A');
      expect(toElement.textContent).toContain('B');
    });

    it('should update message text on input change', async () => {
      render(<PropertyPanel />);

      const textInput = screen.getByDisplayValue('Hello') as HTMLInputElement;
      fireEvent.change(textInput, { target: { value: 'Updated message' } });

      expect(mockStoreActions.updateMessage).toHaveBeenCalledWith('m1', {
        text: 'Updated message',
      });
    });

    it('should update message type on select change', async () => {
      const user = userEvent.setup();
      render(<PropertyPanel />);

      const selects = screen.getAllByRole('combobox');
      const typeSelect = selects[0] as HTMLSelectElement;
      await user.selectOptions(typeSelect, 'asyncDotted');

      expect(mockStoreActions.updateMessage).toHaveBeenCalledWith('m1', {
        type: 'asyncDotted',
      });
    });

    it('should delete message when delete button clicked', async () => {
      const user = userEvent.setup();
      render(<PropertyPanel />);

      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons[buttons.length - 1];
      await user.click(deleteButton);

      expect(mockStoreActions.removeMessage).toHaveBeenCalledWith('m1');
    });

    it('should move message up when up button clicked', async () => {
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: null,
        selectedEdgeId: 'm2',
        diagram: mockDiagram,
        ...mockStoreActions,
      });

      const user = userEvent.setup();
      render(<PropertyPanel />);

      const buttons = screen.getAllByRole('button');
      const upButton = buttons[0];
      await user.click(upButton);

      expect(mockStoreActions.moveMessageUp).toHaveBeenCalledWith('m2');
    });

    it('should move message down when down button clicked', async () => {
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: null,
        selectedEdgeId: 'm1',
        diagram: mockDiagram,
        ...mockStoreActions,
      });

      const user = userEvent.setup();
      render(<PropertyPanel />);

      const buttons = screen.getAllByRole('button');
      const downButton = buttons[1];
      await user.click(downButton);

      expect(mockStoreActions.moveMessageDown).toHaveBeenCalledWith('m1');
    });

    it('should disable up button when message is first', () => {
      render(<PropertyPanel />);

      const upButton = screen.getAllByRole('button')[0];
      expect(upButton).toBeDisabled();
    });

    it('should disable down button when message is last', () => {
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: null,
        selectedEdgeId: 'm2',
        diagram: mockDiagram,
        ...mockStoreActions,
      });

      render(<PropertyPanel />);

      const downButton = screen.getAllByRole('button')[1];
      expect(downButton).toBeDisabled();
    });

    it('should toggle activateTarget checkbox', async () => {
      const user = userEvent.setup();
      render(<PropertyPanel />);

      const checkboxes = screen.getAllByRole('checkbox');
      const activateCheckbox = checkboxes[0];
      await user.click(activateCheckbox);

      expect(mockStoreActions.updateMessage).toHaveBeenCalledWith('m1', {
        activateTarget: true,
        deactivateTarget: false,
      });
    });

    it('should toggle deactivateTarget checkbox', async () => {
      const user = userEvent.setup();
      render(<PropertyPanel />);

      const checkboxes = screen.getAllByRole('checkbox');
      const deactivateCheckbox = checkboxes[1];
      await user.click(deactivateCheckbox);

      expect(mockStoreActions.updateMessage).toHaveBeenCalledWith('m1', {
        deactivateTarget: true,
        activateTarget: false,
      });
    });

    it('should prevent both activate and deactivate from being true', async () => {
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: null,
        selectedEdgeId: 'm2',
        diagram: mockDiagram,
        ...mockStoreActions,
      });

      const user = userEvent.setup();
      render(<PropertyPanel />);

      const checkboxes = screen.getAllByRole('checkbox');
      const deactivateCheckbox = checkboxes[1];
      await user.click(deactivateCheckbox);

      expect(mockStoreActions.updateMessage).toHaveBeenCalledWith('m2', {
        deactivateTarget: true,
        activateTarget: false,
      });
    });
  });

  describe('Note Form', () => {
    beforeEach(() => {
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: 'n_1',
        selectedEdgeId: null,
        diagram: mockDiagram,
        ...mockStoreActions,
      });
    });

    it('should display note form when note selected', () => {
      render(<PropertyPanel />);
      expect(screen.getByText('注释属性')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Note content')).toBeInTheDocument();
    });

    it('should update note text on textarea change', async () => {
      render(<PropertyPanel />);

      const textArea = screen.getByDisplayValue('Note content') as HTMLTextAreaElement;
      fireEvent.change(textArea, { target: { value: 'Updated note' } });

      expect(mockStoreActions.updateNote).toHaveBeenCalledWith('n_1', {
        text: 'Updated note',
      });
    });

    it('should update note position on select change', async () => {
      const user = userEvent.setup();
      render(<PropertyPanel />);

      const selects = screen.getAllByRole('combobox');
      const positionSelect = selects[0] as HTMLSelectElement;
      await user.selectOptions(positionSelect, 'right');

      expect(mockStoreActions.updateNote).toHaveBeenCalledWith('n_1', {
        position: 'right',
      });
    });

    it('should delete note when delete button clicked', async () => {
      const user = userEvent.setup();
      render(<PropertyPanel />);

      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      expect(mockStoreActions.removeNote).toHaveBeenCalledWith('n_1');
    });

    it('should display associated participant names', () => {
      render(<PropertyPanel />);
      const participantDiv = screen.getByText('Alice');
      expect(participantDiv).toBeInTheDocument();
    });

    it('should display multiple associated participants', () => {
      const multiParticipantNote: Note = {
        ...mockNote,
        participantIds: ['p1', 'p2'],
      };

      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: 'n_1',
        selectedEdgeId: null,
        diagram: { ...mockDiagram, notes: [multiParticipantNote] },
        ...mockStoreActions,
      });

      render(<PropertyPanel />);
      expect(screen.getByText('Alice, Bob')).toBeInTheDocument();
    });
  });

  describe('Block Form', () => {
    beforeEach(() => {
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: 'b_1',
        selectedEdgeId: null,
        diagram: mockDiagram,
        ...mockStoreActions,
      });
    });

    it('should display block form when block selected', () => {
      render(<PropertyPanel />);
      expect(screen.getByText('块属性')).toBeInTheDocument();
      expect(screen.getByDisplayValue('retry')).toBeInTheDocument();
    });

    it('should update block type on select change', async () => {
      const user = userEvent.setup();
      render(<PropertyPanel />);

      const selects = screen.getAllByRole('combobox');
      const typeSelect = selects[0] as HTMLSelectElement;
      await user.selectOptions(typeSelect, 'alt');

      expect(mockStoreActions.updateBlock).toHaveBeenCalledWith('b_1', {
        type: 'alt',
      });
    });

    it('should update block label on input change', async () => {
      render(<PropertyPanel />);

      const labelInput = screen.getByDisplayValue('retry') as HTMLInputElement;
      fireEvent.change(labelInput, { target: { value: 'retry 5 times' } });

      expect(mockStoreActions.updateBlock).toHaveBeenCalledWith('b_1', {
        label: 'retry 5 times',
      });
    });

    it('should delete block when delete button clicked', async () => {
      const user = userEvent.setup();
      render(<PropertyPanel />);

      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      expect(mockStoreActions.removeBlock).toHaveBeenCalledWith('b_1');
    });

    it('should display contained messages', () => {
      render(<PropertyPanel />);
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('should display empty message for block with no messages', () => {
      const emptyBlock: Block = {
        ...mockBlock,
        messageIds: [],
      };

      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: 'b_1',
        selectedEdgeId: null,
        diagram: { ...mockDiagram, blocks: [emptyBlock] },
        ...mockStoreActions,
      });

      render(<PropertyPanel />);
      expect(screen.getByText('无消息')).toBeInTheDocument();
    });

    it('should display all block types in select', () => {
      render(<PropertyPanel />);

      const selects = screen.getAllByRole('combobox');
      const typeSelect = selects[0] as HTMLSelectElement;
      const options = Array.from(typeSelect.options).map(opt => opt.value);

      expect(options).toContain('loop');
      expect(options).toContain('alt');
      expect(options).toContain('opt');
      expect(options).toContain('par');
      expect(options).toContain('critical');
      expect(options).toContain('break');
    });
  });

  describe('Message Move Actions', () => {
    it('should correctly identify first message and disable up button', () => {
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: null,
        selectedEdgeId: 'm1',
        diagram: mockDiagram,
        ...mockStoreActions,
      });

      render(<PropertyPanel />);
      const upButton = screen.getAllByRole('button')[0];
      expect(upButton).toBeDisabled();
    });

    it('should correctly identify last message and disable down button', () => {
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: null,
        selectedEdgeId: 'm2',
        diagram: mockDiagram,
        ...mockStoreActions,
      });

      render(<PropertyPanel />);
      const downButton = screen.getAllByRole('button')[1];
      expect(downButton).toBeDisabled();
    });

    it('should enable both buttons for middle message', () => {
      const messages = [
        { ...mockMessage, id: 'm1', order: 0 },
        { ...mockMessage, id: 'm2', order: 1 },
        { ...mockMessage, id: 'm3', order: 2 },
      ];

      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: null,
        selectedEdgeId: 'm2',
        diagram: { ...mockDiagram, messages },
        ...mockStoreActions,
      });

      render(<PropertyPanel />);
      const buttons = screen.getAllByRole('button');
      const upButton = buttons[0];
      const downButton = buttons[1];

      expect(upButton).not.toBeDisabled();
      expect(downButton).not.toBeDisabled();
    });
  });

  describe('Delete Actions', () => {
    it('should call removeParticipant when participant deleted', async () => {
      const user = userEvent.setup();
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: 'p1',
        selectedEdgeId: null,
        diagram: mockDiagram,
        ...mockStoreActions,
      });

      render(<PropertyPanel />);
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      expect(mockStoreActions.removeParticipant).toHaveBeenCalledWith('p1');
      expect(mockStoreActions.removeParticipant).toHaveBeenCalledTimes(1);
    });

    it('should call removeMessage when message deleted', async () => {
      const user = userEvent.setup();
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: null,
        selectedEdgeId: 'm1',
        diagram: mockDiagram,
        ...mockStoreActions,
      });

      render(<PropertyPanel />);
      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons[buttons.length - 1];
      await user.click(deleteButton);

      expect(mockStoreActions.removeMessage).toHaveBeenCalledWith('m1');
      expect(mockStoreActions.removeMessage).toHaveBeenCalledTimes(1);
    });

    it('should call removeNote when note deleted', async () => {
      const user = userEvent.setup();
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: 'n_1',
        selectedEdgeId: null,
        diagram: mockDiagram,
        ...mockStoreActions,
      });

      render(<PropertyPanel />);
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      expect(mockStoreActions.removeNote).toHaveBeenCalledWith('n_1');
      expect(mockStoreActions.removeNote).toHaveBeenCalledTimes(1);
    });

    it('should call removeBlock when block deleted', async () => {
      const user = userEvent.setup();
      (useDiagramStore as any).mockReturnValue({
        selectedNodeId: 'b_1',
        selectedEdgeId: null,
        diagram: mockDiagram,
        ...mockStoreActions,
      });

      render(<PropertyPanel />);
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      expect(mockStoreActions.removeBlock).toHaveBeenCalledWith('b_1');
      expect(mockStoreActions.removeBlock).toHaveBeenCalledTimes(1);
    });
  });
});
