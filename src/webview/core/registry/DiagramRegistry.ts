import type { DiagramAdapter, DiagramType, BaseDiagramState } from '@shared/types';

class DiagramRegistryImpl {
  private adapters = new Map<DiagramType, DiagramAdapter<BaseDiagramState>>();
  private defaultType: DiagramType = 'sequence';

  register<T extends BaseDiagramState>(adapter: DiagramAdapter<T>): void {
    this.adapters.set(adapter.type, adapter as unknown as DiagramAdapter<BaseDiagramState>);
  }

  get(type: DiagramType): DiagramAdapter<BaseDiagramState> | undefined {
    return this.adapters.get(type);
  }

  getOrDefault(type: DiagramType): DiagramAdapter<BaseDiagramState> {
    return this.adapters.get(type) ?? this.adapters.get(this.defaultType)!;
  }

  detect(code: string): DiagramType {
    for (const adapter of this.adapters.values()) {
      if (adapter.detect(code)) {
        return adapter.type;
      }
    }
    return 'unknown';
  }

  getAllTypes(): DiagramType[] {
    return Array.from(this.adapters.keys());
  }

  setDefault(type: DiagramType): void {
    this.defaultType = type;
  }
}

export const DiagramRegistry = new DiagramRegistryImpl();
