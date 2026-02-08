import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useDiagramStore } from '../../stores/diagramStore';

const Preview: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toMermaid = useDiagramStore((s) => s.toMermaid);
  const diagram = useDiagramStore((s) => s.diagram);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || isCollapsed) return;

      const code = toMermaid();
      console.log('[AIMermaid] Preview mermaid code:', code);
      if (!code.trim() || diagram.participants.length === 0) {
        containerRef.current.innerHTML = '<div class="text-gray-500 text-sm">添加参与者开始绘图</div>';
        setError(null);
        return;
      }

      try {
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        containerRef.current.innerHTML = svg;
        
        const svgElement = containerRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.maxWidth = '100%';
          svgElement.style.height = 'auto';
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Render error');
      }
    };

    renderDiagram();
  }, [diagram, toMermaid, isCollapsed]);

  return (
    <div className="border-t border-vscode-border bg-vscode-bg">
      <div 
        className="px-4 py-2 text-xs text-gray-400 border-b border-vscode-border flex items-center justify-between cursor-pointer hover:bg-vscode-list-hover"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="flex items-center gap-2">
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          实时预览
        </span>
        {error && <span className="text-red-400">渲染错误</span>}
      </div>
      {!isCollapsed && (
        <div
          ref={containerRef}
          className="p-4 overflow-auto flex items-start justify-center"
          style={{ maxHeight: '300px', minHeight: '100px' }}
        />
      )}
    </div>
  );
};

export default Preview;
