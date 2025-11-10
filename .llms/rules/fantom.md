---
llms-gk: 'devmate_react_native_md'
oncalls: ['react_native']
apply_to_regex: '.*\.js'
apply_to_content: 'Fantom' # Helps apply to existing Fantom tests (by detecting importing Fantom)
apply_to_user_prompt: 'fantom' # Helps apply to queries specifically asking for Fantom rules.
---

# Fantom Integration Testing Framework

Fantom is React Native's integration testing and benchmarking tool that runs JavaScript code as close as possible to a real React Native application, using its cross-platform architecture (Hermes, Fabric, C++ TurboModules, Bridgeless) in a fast headless environment.

## When to Use Fantom

- Testing integration between JavaScript, React, and React Native core
- Testing React Native internals and platform-agnostic parts
- Testing layout calculations and shadow nodes
- Testing event dispatching and scheduling
- Testing C++ code integration with JavaScript
- When you need real layout metrics (not mocked)
- **IMPORTANT**: Tests must live in `xplat/js/react-native-github/packages/react-native` directory

## File Naming Convention

- Fantom tests use the `-itest.js` suffix (e.g., `View-itest.js`, `Pressable-itest.js`)
- Place tests in `__tests__` directories alongside the code being tested
- Benchmark tests use `-benchmark-itest.js` suffix

## Running Tests

**IMPORTANT**: Running Fantom tests must be done from the `xplat/js/react-native-github` working directory.

```bash
# Run specific test
yarn fantom <regexForTestFiles>

# Watch mode
yarn fantom <regexForTestFiles> --watch

# From React Native repository root
yarn fantom View-itest
```

## Best Practices

- **Import setup first**: `import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment'` (never use `InitializeCore` - it installs LogBox which breaks error handling)
- **Use component-specific instance types**: Import `TextInputInstance`, `ScrollViewInstance`, etc. instead of generic `HostInstance` when available.
- **Test imperative APIs thoroughly**: Components with instance methods (focus, blur, clear, etc.) need comprehensive testing
- **Verify command dispatch**: Use `root.takeMountingManagerLogs()` to verify native commands are sent correctly
- **Test method timing**: Verify methods work from refs, `useLayoutEffect`, and `useEffect`
- **Test edge cases**: Verify methods handle invalid states correctly (e.g., blur when not focused)
- **Use `Fantom.runTask()` for rendering**: Ensures synchronous execution
- **Use refs for element access**: When you need to interact with elements directly
- **Use `ensureInstance()` helper**: For type-safe element access (`import ensureInstance from 'react-native/src/private/__tests__/utilities/ensureInstance'`)
- **Test layout metrics and use `getRenderedOutput()`**: Real `getBoundingClientRect()` without mocks, clean JSX/JSON assertions
- **Don't oversimplify assertions**: When tests fail, understand what should render instead of simplifying assertions to pass
- **Tests must live in `xplat/js/react-native-github/packages/react-native`**: Not for application code testing


## Key Limitations

- Cannot nest `runTask()` calls (will throw)
- Limited Jest API (e.g., `test.each` not available)
- You cannot write Fantom tests outside of the `xplat/js/react-native-github/packages/react-native` directory

## Basic Test Structure

**CRITICAL**: Always import `@react-native/fantom/src/setUpDefaultReactNativeEnvironment` at the top of test files. Never use `InitializeCore` as it installs LogBox which interferes with Fantom's error handling.

Minimal Example:

```javascript
/**
 * @flow strict-local
 * @format
 */
import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';

describe('Component Name', () => {
  it('should test specific behavior', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(<View style={{width: 100}} />);
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view width="100"/>
    );
  });
});
```

## Test Configuration Pragmas

Add pragmas in the docblock at the top of the file:

```javascript
/**
 * @flow strict-local
 * @fantom_flags enableNativeCSSParsing:*
 * @fantom_mode opt
 * @format
 */
```

### Available Pragmas

- `@fantom_flags name:value`: Override ReactNativeFeatureFlags
  - Multiple flags: `@fantom_flags flag1:true flag2:false`
  - Wildcard: `@fantom_flags flag:*` (runs test with all values)
- `@fantom_mode dev|opt`: Compilation mode
  - `dev`: development (default for tests)
  - `opt`: optimized with Hermes bytecode (default for benchmarks)
  - Wildcard: `@fantom_mode *` (runs with both modes)
- `@fantom_react_fb_flags`: Override internal React flags (Meta only)

## Core Fantom APIs

### Root Management

- `Fantom.createRoot(options?)`: Create a test root
  - Options: `{viewportWidth: number, viewportHeight: number}`
  - Default viewport: varies by configuration
- `root.render(element)`: Render React elements
- `root.getRenderedOutput(options?)`: Get rendered output for assertions
  - Options: `{includeLayoutMetrics: boolean, props: string[]}`
- `root.document`: Access the ReactNativeDocument

### Task Scheduling

- `Fantom.runTask(callback)`: Run a task synchronously, exhausting microtask queue
  - Use for rendering and synchronous operations
  - Cannot be nested (will throw error)
  - Runs async tasks synchronously
- `Fantom.scheduleTask(callback)`: Schedule a task to run later
  - Does not run immediately
  - Use with `Fantom.runWorkLoop()` to execute
- `Fantom.runWorkLoop()`: Execute all scheduled tasks
- `Fantom.runOnUIThread(callback)`: Run code on the UI thread

### Event Dispatching

- `Fantom.dispatchNativeEvent(element, eventName, payload?)`: Dispatch events synchronously
  - Example: `Fantom.dispatchNativeEvent(element, 'click')`
- `Fantom.enqueueNativeEvent(ref, eventName, payload, options?)`: Enqueue events for later
  - Options: `{isUnique: boolean}` - if true, replaces previous events of same type
  - Must be called within `Fantom.runOnUIThread()`
  - Use `Fantom.runWorkLoop()` to process enqueued events

### ScrollView Testing

- `Fantom.scrollTo(scrollViewElement, {x: number, y: number})`: Simulate scrolling
  - Triggers onScroll event
  - Updates shadow tree with new content offset
  - Access scroll position via `element.scrollTop` / `element.scrollLeft`

### Memory Profiling

- `Fantom.takeJSMemoryHeapSnapshot()`: Take JS heap snapshot
  - Forces garbage collection
  - Saves snapshot to `.out/js-heap-snapshots/`
  - Use for detecting memory leaks (3-snapshot method)

### LogBox Validation

- `Fantom.setLogBoxCheckEnabled(enabled: boolean)`: Control LogBox validation

## Assertions and Output

### Rendered Output Assertions

**IMPORTANT**: Prefer evaluating rendered output inline, avoid using `.toMatchSnapshot()` or a numeric assertion on eg `element.childNodes.length`. Instead, use the `.toEqual()` assertion with inline JSX of the expected output.

```javascript
// Get JSX representation
expect(root.getRenderedOutput().toJSX()).toEqual(
  <rn-view width="100" height="50" />
);

// Include layout metrics
expect(root.getRenderedOutput({includeLayoutMetrics: true}).toJSX()).toEqual(
  <rn-view
    layoutMetrics-frame="{x:0,y:0,width:100,height:50}"
    layoutMetrics-displayType="Flex"
  />
);

// Filter specific props, use for minimal assertions
expect(root.getRenderedOutput({props: ['backgroundColor']}).toJSX()).toEqual(
  <rn-view backgroundColor="rgba(255, 0, 0, 1)" />
);
```

### Element Assertions

```javascript
const elementRef = createRef<HostInstance>();

Fantom.runTask(() => {
  root.render(<View ref={elementRef}><Text>the quick brown fox</Text></View>);
});

// Type checking
expect(elementRef.current).toBeInstanceOf(ReactNativeElement);

// Tag name
const element = ensureInstance(elementRef.current, ReactNativeElement);
expect(element.tagName).toBe('RN:View');

// Layout metrics
const bounds = element.getBoundingClientRect();
expect(bounds.width).toBe(100);
expect(bounds.height).toBe(50);

// Ensure component includes children
expect(element.childNodes.length).toBe(2);
expect(root.getRenderedOutput().toJSX()).toEqual(
  <rn-view>
    <rn-paragraph>
      the quick brown fox
    </rn-paragraph>
  </rn-view>,
);
```

## Additional Resources

- Full API reference: `xplat/js/react-native-github/private/react-native-fantom/src/index.js`
- Example tests: Search for `-itest.js` files in `xplat/js/react-native-github/packages/react-native`
- Documentation: `xplat/js/react-native-github/private/react-native-fantom/__docs__/README.md`
