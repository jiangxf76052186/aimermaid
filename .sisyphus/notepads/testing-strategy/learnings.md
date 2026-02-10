## Extension Test Infrastructure - Learnings

### Mock Architecture Pattern

**Key Decision**: Use internal factories (`_createDocument()`, etc.) with exported wrappers to avoid declaration conflicts.

- Internal functions: `_createXxx()` - used internally within mockVscode object
- Exported functions: `createMockXxx()` - public API for test files to create fresh instances
- This pattern allows tests to create independent mock instances without shared state

### VS Code API Mock Coverage

Created comprehensive mocks for:
- **languages API**: registerCodeLensProvider, registerHoverProvider, etc.
- **commands API**: registerCommand, executeCommand, getCommands
- **window API**: activeTextEditor, showErrorMessage, createWebviewPanel, activeColorTheme
- **workspace API**: applyEdit, openTextDocument, getConfiguration, file operations
- **Type constructors**: Range, Position, Uri
- **Enums**: ViewColumn, ColorThemeKind

All 14+ essential APIs used by Extension source files are mocked.

### Mock Configuration Strategy

**vi.fn() usage**:
- All mock functions use `vi.fn()` for spyability
- Enables tests to assert on calls, arguments, and return values
- Clean test setup: `expect(vscode.commands.registerCommand).toHaveBeenCalled()`

**Factory function pattern**:
- Each mock has a factory function for creating independent instances
- Prevents test pollution from shared mock state
- Example: `createMockDocument(['line1', 'line2'])` creates a document with exact line count

### Document Mock Strategy

**Key feature**: `createMockDocument(lines: string[])` accepts exact line content.

- `lineAt()` returns proper TextLine with text, range, isEmptyOrWhitespace
- Validates line bounds with proper error messages
- Supports dynamic lineCount based on input
- Used for testing parser functions that iterate through documents

### Fixture File Design

**sample.md contains**:
- 1 sequenceDiagram (core diagram type)
- 1 flowchart (validates detection)
- 1 stateDiagram (validates detection)
- 1 classDiagram (validates detection)
- 1 regular javascript block (tests filtering - should NOT detect as mermaid)
- Total: 4 mermaid blocks for testing CodeLens detection

**Line structure**:
- Proper fence markers: ````mermaid` and ```
- Indented content (matches real user code)
- Regular text/code between blocks (realistic document structure)
- Can be used in end-to-end tests with full line-by-line parsing

### Integration Points

**How tests will use these mocks**:
1. Import: `vi.mock('vscode', () => require('./mocks/vscode').mockVscode)`
2. Create: `const doc = createMockDocument(['```mermaid', 'sequenceDiagram', '```'])`
3. Spy: `expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('...')`

### Future Considerations

- Add mock data for ExtensionMode, LanguageConfiguration as needed
- Consider creating `createMockDocument()` variants for common patterns (e.g., withMermaidBlocks())
- Mock EventEmitter listeners can be triggered manually in tests for state change simulation

## Task 1.1: diagram-detector Tests - Implementation Notes

### Pure Function Testing Pattern

**Test Structure**:
- No mocks required - `detectDiagramType()` is a pure function
- Direct input-output testing with `describe`/`it`/`expect`
- Test cases organized by functional categories with comment headers

### Test Coverage (19 test cases)

**Category Breakdown**:
1. **Basic Type Detection** (6 cases): sequenceDiagram, graph, flowchart, stateDiagram, classDiagram, erDiagram
2. **Unknown Type Handling** (2 cases): unknown diagram types, empty strings
3. **Whitespace Handling** (3 cases): leading spaces, tabs, mixed whitespace  
4. **Case Insensitivity** (3 cases): uppercase variants, mixed case for each major type
5. **Edge Cases** (5 cases): keyword only, trailing spaces, graph/flowchart with suffixes (TB, TD, LR)

### Key Insights

**String Processing Flow**:
```typescript
code.trim()           // Remove outer whitespace
.split('\n')[0]       // Get first line
.toLowerCase()        // Normalize case
.trim()              // Clean first line
.startsWith(...)     // Match diagram keywords
```

This pattern handles:
- Leading whitespace (spaces/tabs) → `.trim()` on outer string
- Blank lines followed by keyword → `.split('\n')[0]` selects first line
- Case variations → `.toLowerCase()`
- Extra spaces in first line → `.split('\n')[0].trim()`

**Why Tests Pass**:
- All test inputs match the documented flow
- All diagram type keywords are covered
- Edge cases like empty strings, tabs, and mixed whitespace are validated

### Integration with Future Tests

These pure function tests serve as foundation for:
- **Task 1.2 (CodeLens tests)**: Will use `detectDiagramType()` to validate CodeLens Provider
- **Task 3.1 (E2E tests)**: Will verify that detected types match rendered diagrams in Webview

### Testing Best Practices Applied

✓ **Arrange-Act-Assert Pattern**: Each test has clear input → function call → assertion
✓ **Single Responsibility**: Each test validates one scenario
✓ **Descriptive Names**: Chinese descriptions clearly indicate what's being tested
✓ **Comprehensive Coverage**: All branches of if-else chain are tested
✓ **Boundary Cases**: Empty strings, whitespace-only strings, and edge formatting covered

