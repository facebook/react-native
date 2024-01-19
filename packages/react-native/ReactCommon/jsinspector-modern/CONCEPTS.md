# jsinspector-modern concepts

## CDP object model

### Target

A debuggable entity that a debugger frontend can connect to.

### Session

A single connection between a debugger frontend and a target. There can be multiple active sessions connected to the same target.

### Agent

A handler for a subset of CDP messages for a specific target as part of a specific session.
