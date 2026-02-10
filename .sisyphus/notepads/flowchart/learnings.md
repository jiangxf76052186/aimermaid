# Learnings - Flowchart

## Component Design
- **ShapeNode**:
  - Implemented as a generic node that renders different SVG shapes based on `data.shape`.
  - Uses `viewBox="0 0 100 100"` in SVG to allow scalable vector graphics that adapt to the node dimensions.
  - Handles 8 connection points (4 sides * 2 types) to support flexible connections.
  - Uses `z-index` to ensure text is above the shape.
  - Interaction matches Sequence Diagram nodes (double-click to edit).

## Shapes Implemented
- **rect**: Simple rectangle.
- **rounded**: Rectangle with `rx`/`ry`.
- **diamond**: Polygon.
- **circle**: Circle.
- **cylinder**: Path for cylinder effect.
- **subprocess**: Double vertical lines.
- **hexagon**: Polygon.

## Challenges
- **Update Mechanism**: `diagramStore` currently only supports Sequence Diagram. Flowchart node updates are currently local-only or need a new store action.
- **Handle Placement**: 8 handles on 4 sides require careful CSS positioning or absolute positioning within the node.

## Edges
- **FlowEdge**: Implemented custom edge component with Bezier path and HTML label using `EdgeLabelRenderer`.
- **Dependencies**: Used a local store stub inside the component to ensure compilation and isolation, as the full `flowchartStore` is not yet available.
