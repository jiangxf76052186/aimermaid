# WebView Integration Tests - Learnings

## Summary
Created comprehensive integration tests for `MermaidEditorPanel` class at `src/extension/__tests__/integration/webview.test.ts`.

**Test Results:** 23/23 tests passing ✅

## Test Coverage

### 1. createOrShow() - Singleton Pattern (2 tests)
- Verifies panel creation when currentPanel is undefined
- Confirms retainContextWhenHidden configuration (state preservation)

### 2. _sendInitData() - Theme Detection (4 tests)
- Dark theme detection and message sending
- Light theme detection and message sending
- Correct mermaidCode inclusion in init data
- Diagram type detection from mermaid code

### 3. _handleMessage() - Message Handling (4 tests)
- Handles 'ready' message to trigger init data send
- Handles 'save' message to save document
- Handles 'cancel' message to dispose panel
- Gracefully ignores unknown message types

### 4. _saveToDocument() - Document Updates (4 tests)
- Applies WorkspaceEdit to replace mermaid code
- Saves document after applying edit
- Calculates correct new endLine based on content lines
- Shows success message after save

### 5. _getMermaidContent() - Content Extraction (3 tests)
- Extracts content between start/end lines correctly
- Handles single-line mermaid blocks
- Preserves line breaks in extracted content

### 6. dispose() - Resource Cleanup (4 tests)
- Sets currentPanel to undefined
- Disposes the webview panel
- Disposes all registered disposables
- Handles multiple dispose calls gracefully

### 7. Integration - Full Workflow (2 tests)
- Complete workflow: create > ready > save > dispose
- Alternative workflow: create > cancel

## Key Testing Techniques

### Mock Structure
- Properly mocked `vscode` module with all required classes and functions
- Custom `createMockWebviewPanel()` helper to simulate WebviewPanel lifecycle
- Added WorkspaceEdit, Position, Range mocks for document manipulation
- Theme mock using Object.defineProperty to handle read-only properties

### Helper Functions
- `createMockWebviewPanel()`: Creates realistic mock panels with listener tracking
- `createMockExtensionContext()`: Provides extension context fixture
- `triggerWebviewMessage()`: Simulates webview message handling
- `createMockDocument()`: Reused from existing test mocks

### Key Challenges Solved
1. **Infinite recursion with dispose()**: Solved by using plain vi.fn() instead of nested listener callbacks
2. **Theme property read-only**: Used Object.defineProperty to override readonly kind property
3. **Message listener registration**: Tracked listeners in _messageListeners array for test triggering
4. **File structure**: Properly setup integration tests in `__tests__/integration/` directory

## Best Practices Applied
- Comprehensive test isolation with beforeEach/afterEach
- Async handling for Promise-based operations
- Clear test names describing expected behavior
- Proper cleanup of singleton state between tests
- No modification of source code (webview.ts remains untouched)

## All Tests Pass
```
Test Files: 15 passed (15)
Tests: 346 passed (346)
```

The integration test file complements existing unit tests and ensures the MermaidEditorPanel lifecycle works correctly with mocked vscode APIs.
