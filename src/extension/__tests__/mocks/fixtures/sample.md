# Test Document for Mermaid Editor

This is a test markdown file used for testing the Mermaid editor extension.

## First Mermaid Diagram - Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Server
    User->>Server: Request data
    Server-->>User: Return response
    User->>Server: Acknowledge
```

Some text between diagrams.

```javascript
console.log('This is a regular code block, not mermaid');
```

## Second Mermaid Diagram - Flowchart

```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E
```

## Third Mermaid Diagram - State Diagram

```mermaid
stateDiagram
    [*] --> State1
    State1 --> State2
    State2 --> [*]
```

Some final text.

```mermaid
classDiagram
    class Animal {
        name: string
        age: int
    }
```
