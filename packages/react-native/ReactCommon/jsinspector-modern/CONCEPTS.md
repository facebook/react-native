# jsinspector-modern concepts

## CDP object model

### Target

A debuggable entity that a debugger frontend can connect to.

### Target Delegate

An interface between a Target class and the underlying debuggable entity. For example, PageTargetDelegate is used by PageTarget to send page-related events to the native platform implementation.

### Target Controller

A private interface exposed by a Target class to its Sessions/Agents. For example, PageTargetController is used by PageAgent to safely access the page's PageTargetDelegate, without exposing PageTarget's other private state.

### Session

A single connection between a debugger frontend and a target. There can be multiple active sessions connected to the same target.

### Agent

A handler for a subset of CDP messages for a specific target as part of a specific session.

### Agent Delegate

An interface between an Agent class and some integration-specific, per-session logic/state it relies on (that does not fit in a Target Delegate). For example, a RuntimeAgentDelegate is used by RuntimeAgent to host Hermes's native CDP handler and delegate messages to it. The interface may look exactly like an Agent (purely CDP messages in/out) or there may be a more involved API to expose state/functionality needed by the Agent.
