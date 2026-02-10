/**
 * 图表适配器初始化
 * 在应用启动时注册所有支持的图表类型
 */
import { DiagramRegistry } from '../core/registry/DiagramRegistry';
import { SequenceAdapter } from '../diagrams/sequence/adapter';
import { FlowchartAdapter } from '../diagrams/flowchart/adapter';
import { StateDiagramAdapter } from '../diagrams/stateDiagram/adapter';

// 注册时序图适配器
DiagramRegistry.register(SequenceAdapter);

// 注册流程图适配器
DiagramRegistry.register(FlowchartAdapter);

// 注册状态图适配器
DiagramRegistry.register(StateDiagramAdapter);

// 设置默认图表类型
DiagramRegistry.setDefault('sequence');
