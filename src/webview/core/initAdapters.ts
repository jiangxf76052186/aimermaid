/**
 * 图表适配器初始化
 * 在应用启动时注册所有支持的图表类型
 */
import { DiagramRegistry } from '../core/registry/DiagramRegistry';
import { SequenceAdapter } from '../diagrams/sequence/adapter';

// 注册时序图适配器
DiagramRegistry.register(SequenceAdapter);

// 设置默认图表类型
DiagramRegistry.setDefault('sequence');

// 后续添加新图表类型时，在此处注册：
// import { FlowchartAdapter } from '../diagrams/flowchart/adapter';
// DiagramRegistry.register(FlowchartAdapter);
