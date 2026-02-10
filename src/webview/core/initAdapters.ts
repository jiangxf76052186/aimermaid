/**
 * 图表适配器初始化
 * 在应用启动时注册所有支持的图表类型
 */
import { DiagramRegistry } from '../core/registry/DiagramRegistry';
import { SequenceAdapter } from '../diagrams/sequence/adapter';
import { FlowchartAdapter } from '../diagrams/flowchart/adapter';

// 注册时序图适配器
DiagramRegistry.register(SequenceAdapter);

// 注册流程图适配器
DiagramRegistry.register(FlowchartAdapter);

// 设置默认图表类型
DiagramRegistry.setDefault('sequence');
