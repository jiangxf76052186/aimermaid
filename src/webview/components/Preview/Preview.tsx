import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useDiagramStore } from '../../stores/diagramStore';
import { useFlowchartStore } from '../../diagrams/flowchart/store';
import { useStateStore } from '../../diagrams/stateDiagram/store';

const Preview: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeDiagramType = useEditorStore((s) => s.activeDiagramType);

  // 根据图表类型选择对应的 store
  const sequenceDiagram = useDiagramStore((s) => s.diagram);
  const sequenceToMermaid = useDiagramStore((s) => s.toMermaid);
  const flowchartDiagram = useFlowchartStore((s) => s.diagram);
  const flowchartToMermaid = useFlowchartStore((s) => s.toMermaid);
  const stateDiagram = useStateStore((s) => s.diagram);
  const stateToMermaid = useStateStore((s) => s.toMermaid);

  // 根据激活的图表类型获取对应的数据
  const diagram = 
    activeDiagramType === 'sequence' ? sequenceDiagram :
    activeDiagramType === 'flowchart' ? flowchartDiagram :
    stateDiagram;

  const toMermaid = 
    activeDiagramType === 'sequence' ? sequenceToMermaid :
    activeDiagramType === 'flowchart' ? flowchartToMermaid :
    stateToMermaid;

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
      
      // 空态判断：检查生成的 mermaid 代码是否有实质内容
      // 不再依赖 diagram.participants（时序图特有）
      const isEmpty = !code.trim() || code.split('\n').length <= 1;
      if (isEmpty) {
        containerRef.current.innerHTML = '<div class="text-gray-500 text-sm">添加元素开始绘图</div>';
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
