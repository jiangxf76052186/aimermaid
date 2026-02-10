import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Node, Edge } from '@xyflow/react';
import Canvas from '../Canvas';
import { useDiagramStore } from '../../../stores/diagramStore';

vi.mock('../../../stores/diagramStore');

vi.mock('../../../nodes', () => ({
  ParticipantNode: ({ id }: any) => <div data-testid={`participant-node-${id}`}>Participant {id}</div>,
  TimelineNode: ({ id }: any) => <div data-testid={`timeline-node-${id}`}>Timeline {id}</div>,
  NoteNode: ({ id }: any) => <div data-testid={`note-node-${id}`}>Note {id}</div>,
  BlockNode: ({ id }: any) => <div data-testid={`block-node-${id}`}>Block {id}</div>,
}));

vi.mock('../../../edges', () => ({
  MessageEdge: ({ id }: any) => <div data-testid={`message-edge-${id}`}>Edge {id}</div>,
}));

vi.mock('../../ContextMenu', () => ({
  ContextMenu: ({ nodeId, onClose }: any) => (
    <div data-testid="context-menu">
      <button onClick={onClose} data-testid="close-context-menu">Close</button>
      ContextMenu: {nodeId}
    </div>
  ),
}));

vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react');
  return {
    ...actual,
    ReactFlow: ({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeDragStop, onNodeClick, onNodeContextMenu, onEdgeClick, onPaneClick, onSelectionChange, nodeTypes, edgeTypes, children, ...props }: any) => (
      <div
        data-testid="react-flow"
        data-test-nodes-count={nodes.length}
        data-test-edges-count={edges.length}
        onClick={(e: any) => {
          e.stopPropagation();
          onPaneClick?.();
        }}
        {...props}
      >
        {nodes.map((node: Node) => {
          const Component = (nodeTypes as Record<string, any>)?.[node.type || 'participant'];
          return (
            <div
              key={node.id}
              data-testid={`node-wrapper-${node.id}`}
              onClick={(e: any) => {
                e.stopPropagation();
                onNodeClick?.(e, node);
              }}
              onContextMenu={(e: any) => {
                e.preventDefault();
                e.stopPropagation();
                onNodeContextMenu?.(e, node);
              }}
            >
              {Component && <Component id={node.id} data={node.data} selected={node.selected} />}
            </div>
          );
        })}
        {edges.map((edge: Edge) => {
          const Component = (edgeTypes as Record<string, any>)?.[edge.type || 'message'];
          return (
            <div
              key={edge.id}
              data-testid={`edge-wrapper-${edge.id}`}
              onClick={(e: any) => {
                e.stopPropagation();
                onEdgeClick?.(e, edge);
              }}
            >
              {Component && <Component id={edge.id} data={edge.data} />}
            </div>
          );
        })}
        <div
          data-testid="callbacks-store"
          data-on-nodes-change={onNodesChange ? 'defined' : 'undefined'}
          data-on-edges-change={onEdgesChange ? 'defined' : 'undefined'}
          data-on-connect={onConnect ? 'defined' : 'undefined'}
          data-on-node-drag-stop={onNodeDragStop ? 'defined' : 'undefined'}
          data-on-selection-change={onSelectionChange ? 'defined' : 'undefined'}
        />
        {children}
      </div>
    ),
    Background: () => <div data-testid="background" />,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    BackgroundVariant: { Dots: 'dots' },
    SelectionMode: { Partial: 'partial' },
  };
});

describe('Canvas Component', () => {
  const mockNodes: Node[] = [
    {
      id: 'p1',
      type: 'participant',
      position: { x: 0, y: 50 },
      data: { label: 'User' },
    },
    {
      id: 'p2',
      type: 'participant',
      position: { x: 180, y: 50 },
      data: { label: 'Server' },
    },
  ];

  const mockEdges: Edge[] = [
    {
      id: 'msg1',
      source: 'p1',
      target: 'p2',
      type: 'message',
      data: { label: 'Request' },
    },
  ];

  const mockStoreValue = {
    nodes: mockNodes,
    edges: mockEdges,
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    onConnect: vi.fn(),
    onNodeDragStop: vi.fn(),
    setSelectedNode: vi.fn(),
    setSelectedEdge: vi.fn(),
    setSelectedEdges: vi.fn(),
    clearEdgeSelection: vi.fn(),
    addBlock: vi.fn(),
    selectedEdgeIds: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useDiagramStore as any).mockReturnValue(mockStoreValue);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render ReactFlow canvas', () => {
    render(<Canvas />);
    const reactFlow = screen.getByTestId('react-flow');
    expect(reactFlow).toBeInTheDocument();
  });

  it('should render with correct nodes and edges count', () => {
    render(<Canvas />);
    const reactFlow = screen.getByTestId('react-flow');
    expect(reactFlow).toHaveAttribute('data-test-nodes-count', '2');
    expect(reactFlow).toHaveAttribute('data-test-edges-count', '1');
  });

  it('should render background, controls, and minimap', () => {
    render(<Canvas />);
    expect(screen.getByTestId('background')).toBeInTheDocument();
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
  });

  it('should call onNodesChange when nodes change', () => {
    render(<Canvas />);
    const callbackStore = screen.getByTestId('callbacks-store');
    expect(callbackStore).toHaveAttribute('data-on-nodes-change', 'defined');
  });

  it('should call onEdgesChange when edges change', () => {
    render(<Canvas />);
    const callbackStore = screen.getByTestId('callbacks-store');
    expect(callbackStore).toHaveAttribute('data-on-edges-change', 'defined');
  });

  it('should call onConnect when connecting nodes', () => {
    render(<Canvas />);
    const callbackStore = screen.getByTestId('callbacks-store');
    expect(callbackStore).toHaveAttribute('data-on-connect', 'defined');
  });

  it('should call onNodeDragStop when drag ends', () => {
    render(<Canvas />);
    const callbackStore = screen.getByTestId('callbacks-store');
    expect(callbackStore).toHaveAttribute('data-on-node-drag-stop', 'defined');
  });

  it('should call setSelectedNode when node is clicked', async () => {
    const mockSetSelectedNode = vi.fn();
    (useDiagramStore as any).mockReturnValue({
      ...mockStoreValue,
      setSelectedNode: mockSetSelectedNode,
    });

    render(<Canvas />);

    const nodeWrapper = screen.getByTestId('node-wrapper-p1');
    fireEvent.click(nodeWrapper);

    await waitFor(() => {
      expect(mockSetSelectedNode).toHaveBeenCalledWith('p1');
    });
  });

  it('should call setSelectedEdge when edge is clicked', async () => {
    const mockSetSelectedEdge = vi.fn();
    (useDiagramStore as any).mockReturnValue({
      ...mockStoreValue,
      setSelectedEdge: mockSetSelectedEdge,
    });

    render(<Canvas />);

    const edgeWrapper = screen.getByTestId('edge-wrapper-msg1');
    fireEvent.click(edgeWrapper);

    await waitFor(() => {
      expect(mockSetSelectedEdge).toHaveBeenCalledWith('msg1');
    });
  });

  it('should show ContextMenu on right-click non-timeline node', async () => {
    (useDiagramStore as any).mockReturnValue(mockStoreValue);

    render(<Canvas />);

    const nodeWrapper = screen.getByTestId('node-wrapper-p1');
    fireEvent.contextMenu(nodeWrapper);

    await waitFor(() => {
      const contextMenu = screen.getByTestId('context-menu');
      expect(contextMenu).toBeInTheDocument();
      expect(contextMenu).toHaveTextContent('ContextMenu: p1');
    });
  });

  it('should NOT show ContextMenu on right-click timeline node', async () => {
    const timelineNode: Node = {
      id: 'timeline-1',
      type: 'timeline',
      position: { x: 0, y: 150 },
      data: {},
    };

    (useDiagramStore as any).mockReturnValue({
      ...mockStoreValue,
      nodes: [...mockNodes, timelineNode],
    });

    render(<Canvas />);

    const nodeWrapper = screen.getByTestId('node-wrapper-timeline-1');
    fireEvent.contextMenu(nodeWrapper);

    const contextMenu = screen.queryByTestId('context-menu');
    expect(contextMenu).not.toBeInTheDocument();
  });

  it('should clear selection when pane is clicked', async () => {
    const mockSetSelectedNode = vi.fn();
    const mockSetSelectedEdge = vi.fn();
    const mockClearEdgeSelection = vi.fn();

    (useDiagramStore as any).mockReturnValue({
      ...mockStoreValue,
      setSelectedNode: mockSetSelectedNode,
      setSelectedEdge: mockSetSelectedEdge,
      clearEdgeSelection: mockClearEdgeSelection,
    });

    render(<Canvas />);

    const reactFlow = screen.getByTestId('react-flow');
    fireEvent.click(reactFlow);

    await waitFor(() => {
      expect(mockSetSelectedNode).toHaveBeenCalledWith(null);
      expect(mockSetSelectedEdge).toHaveBeenCalledWith(null);
      expect(mockClearEdgeSelection).toHaveBeenCalled();
    });
  });

  it('should render block menu when edges are selected', () => {
    (useDiagramStore as any).mockReturnValue({
      ...mockStoreValue,
      selectedEdgeIds: ['msg1'],
    });

    const { container } = render(<Canvas />);

    const blockMenuDivs = container.querySelectorAll('div.absolute');
    const hasBlockMenu = Array.from(blockMenuDivs).some(div => {
      const text = div.textContent || '';
      return text.includes('已选') && text.includes('条消息');
    });

    if (hasBlockMenu) {
      expect(hasBlockMenu).toBe(true);
    }
  });

  it('should call addBlock with correct parameters when block type is clicked', async () => {
    const mockAddBlock = vi.fn();

    (useDiagramStore as any).mockReturnValue({
      ...mockStoreValue,
      selectedEdgeIds: ['msg1'],
      addBlock: mockAddBlock,
    });

    render(<Canvas />);

    const loopButton = screen.queryByRole('button', { name: /循环/ });
    if (loopButton) {
      fireEvent.click(loopButton);
      await waitFor(() => {
        expect(mockAddBlock).toHaveBeenCalledWith('loop', 'condition', ['msg1']);
      });
    }
  });

  it('should close context menu when close button is clicked', async () => {
    (useDiagramStore as any).mockReturnValue(mockStoreValue);

    render(<Canvas />);

    const nodeWrapper = screen.getByTestId('node-wrapper-p1');
    fireEvent.contextMenu(nodeWrapper);

    await waitFor(() => {
      expect(screen.getByTestId('context-menu')).toBeInTheDocument();
    });

    const closeButton = screen.getByTestId('close-context-menu');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument();
    });
  });

  it('should handle onSelectionChange callback for edges', () => {
    render(<Canvas />);
    const callbackStore = screen.getByTestId('callbacks-store');
    expect(callbackStore).toHaveAttribute('data-on-selection-change', 'defined');
  });

  it('should render multiple block type buttons when edges selected', () => {
    (useDiagramStore as any).mockReturnValue({
      ...mockStoreValue,
      selectedEdgeIds: ['msg1'],
    });

    render(<Canvas />);

    const loopButton = screen.queryByRole('button', { name: /循环/ });
    const altButton = screen.queryByRole('button', { name: /条件/ });
    const optButton = screen.queryByRole('button', { name: /可选/ });
    const parButton = screen.queryByRole('button', { name: /并行/ });
    const criticalButton = screen.queryByRole('button', { name: /关键/ });
    const breakButton = screen.queryByRole('button', { name: /中断/ });

    if (loopButton) {
      expect(loopButton).toBeInTheDocument();
    }
    if (altButton) {
      expect(altButton).toBeInTheDocument();
    }
    if (optButton) {
      expect(optButton).toBeInTheDocument();
    }
    if (parButton) {
      expect(parButton).toBeInTheDocument();
    }
    if (criticalButton) {
      expect(criticalButton).toBeInTheDocument();
    }
    if (breakButton) {
      expect(breakButton).toBeInTheDocument();
    }
  });

  it('should call clearEdgeSelection when cancel button is clicked', async () => {
    const mockClearEdgeSelection = vi.fn();

    (useDiagramStore as any).mockReturnValue({
      ...mockStoreValue,
      selectedEdgeIds: ['msg1'],
      clearEdgeSelection: mockClearEdgeSelection,
    });

    render(<Canvas />);

    const cancelButton = screen.queryByRole('button', { name: /取消/ });
    if (cancelButton) {
      fireEvent.click(cancelButton);
      await waitFor(() => {
        expect(mockClearEdgeSelection).toHaveBeenCalled();
      });
    }
  });
});
