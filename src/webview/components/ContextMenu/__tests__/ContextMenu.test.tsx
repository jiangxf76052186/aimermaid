import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ContextMenu from '../ContextMenu';
import { useDiagramStore } from '../../../stores/diagramStore';

vi.mock('../../../stores/diagramStore');

describe('ContextMenu Component', () => {
  const mockStoreActions = {
    bringToFront: vi.fn(),
    sendToBack: vi.fn(),
    deleteSelected: vi.fn(),
    setSelectedNode: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useDiagramStore as any).mockReturnValue(mockStoreActions);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders at correct coordinates', () => {
    const mockOnClose = vi.fn();
    const { container } = render(
      <ContextMenu
        x={100}
        y={200}
        nodeId="p1"
        nodeType="participant"
        onClose={mockOnClose}
      />
    );

    const contextMenu = container.querySelector('.fixed');
    expect(contextMenu).toBeInTheDocument();
    expect(contextMenu).toHaveStyle({ left: '100px', top: '200px' });
  });

  it('shows correct node type name for participant', () => {
    const mockOnClose = vi.fn();
    render(
      <ContextMenu
        x={50}
        y={50}
        nodeId="p1"
        nodeType="participant"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('参与者')).toBeInTheDocument();
  });

  it('shows correct node type name for note', () => {
    const mockOnClose = vi.fn();
    render(
      <ContextMenu
        x={50}
        y={50}
        nodeId="n1"
        nodeType="note"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('注释')).toBeInTheDocument();
  });

  it('shows correct node type name for block', () => {
    const mockOnClose = vi.fn();
    render(
      <ContextMenu
        x={50}
        y={50}
        nodeId="b1"
        nodeType="block"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('块')).toBeInTheDocument();
  });

  it('shows default node type name for unknown type', () => {
    const mockOnClose = vi.fn();
    render(
      <ContextMenu
        x={50}
        y={50}
        nodeId="unknown"
        nodeType="unknown"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('元素')).toBeInTheDocument();
  });

  it('clicking "置顶" calls bringToFront and closes menu', async () => {
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ContextMenu
        x={50}
        y={50}
        nodeId="p1"
        nodeType="participant"
        onClose={mockOnClose}
      />
    );

    const bringToFrontButton = screen.getByRole('button', { name: /置顶/ });
    await user.click(bringToFrontButton);

    expect(mockStoreActions.bringToFront).toHaveBeenCalledWith('p1');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('clicking "置底" calls sendToBack and closes menu', async () => {
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ContextMenu
        x={50}
        y={50}
        nodeId="p1"
        nodeType="participant"
        onClose={mockOnClose}
      />
    );

    const sendToBackButton = screen.getByRole('button', { name: /置底/ });
    await user.click(sendToBackButton);

    expect(mockStoreActions.sendToBack).toHaveBeenCalledWith('p1');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('clicking "删除" calls setSelectedNode and deleteSelected and closes menu', async () => {
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ContextMenu
        x={50}
        y={50}
        nodeId="p1"
        nodeType="participant"
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /删除/ });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockStoreActions.setSelectedNode).toHaveBeenCalledWith('p1');
      expect(mockStoreActions.deleteSelected).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('clicking outside calls onClose', async () => {
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(
      <div>
        <ContextMenu
          x={50}
          y={50}
          nodeId="p1"
          nodeType="participant"
          onClose={mockOnClose}
        />
        <div data-testid="outside-element">Outside</div>
      </div>
    );

    const outsideElement = screen.getByTestId('outside-element');
    await user.click(outsideElement);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('component unmount removes event listener', () => {
    const mockOnClose = vi.fn();
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(
      <ContextMenu
        x={50}
        y={50}
        nodeId="p1"
        nodeType="participant"
        onClose={mockOnClose}
      />
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mousedown',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it('renders menu with correct structure and styling', () => {
    const mockOnClose = vi.fn();
    const { container } = render(
      <ContextMenu
        x={50}
        y={50}
        nodeId="p1"
        nodeType="participant"
        onClose={mockOnClose}
      />
    );

    const menu = container.querySelector('.fixed');
    expect(menu).toHaveClass('bg-vscode-input-bg');
    expect(menu).toHaveClass('border');
    expect(menu).toHaveClass('border-vscode-border');
    expect(menu).toHaveClass('rounded-lg');
    expect(menu).toHaveClass('shadow-xl');
    expect(menu).toHaveClass('z-[1000]');
  });

  it('renders all three menu buttons', () => {
    const mockOnClose = vi.fn();

    render(
      <ContextMenu
        x={50}
        y={50}
        nodeId="p1"
        nodeType="participant"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole('button', { name: /置顶/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /置底/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /删除/ })).toBeInTheDocument();
  });

  it('delete button has red text styling', () => {
    const mockOnClose = vi.fn();

    render(
      <ContextMenu
        x={50}
        y={50}
        nodeId="p1"
        nodeType="participant"
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /删除/ });
    expect(deleteButton).toHaveClass('text-red-400');
  });

  it('calls bringToFront with correct nodeId', async () => {
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ContextMenu
        x={50}
        y={50}
        nodeId="custom-node-id"
        nodeType="participant"
        onClose={mockOnClose}
      />
    );

    const bringToFrontButton = screen.getByRole('button', { name: /置顶/ });
    await user.click(bringToFrontButton);

    expect(mockStoreActions.bringToFront).toHaveBeenCalledWith('custom-node-id');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls sendToBack with correct nodeId', async () => {
    const mockOnClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ContextMenu
        x={50}
        y={50}
        nodeId="custom-node-id"
        nodeType="note"
        onClose={mockOnClose}
      />
    );

    const sendToBackButton = screen.getByRole('button', { name: /置底/ });
    await user.click(sendToBackButton);

    expect(mockStoreActions.sendToBack).toHaveBeenCalledWith('custom-node-id');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('different node types display correct labels', async () => {
    const mockOnClose = vi.fn();

    const nodeTypes = [
      { type: 'participant', label: '参与者' },
      { type: 'note', label: '注释' },
      { type: 'block', label: '块' },
    ];

    for (const { type, label } of nodeTypes) {
      const { unmount } = render(
        <ContextMenu
          x={50}
          y={50}
          nodeId={`id-${type}`}
          nodeType={type}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});
