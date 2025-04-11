# 👻 React Native Fantom

- [Main doc](../../../__docs__/README.md)

Fantom is the new **integration testing and benchmarking tool for React
Native**.

Its main goal is to allow running JavaScript code as close as possible to a real
React Native application, using its cross-platform architecture (Hermes, Fabric,
C++ TurboModules, Bridgeless, etc.) in a fast headless environment that can run
on CI.

Removing the need for real devices and simulators makes this faster and more
stable than existing e2e testing solutions, while still allowing us to test the
integration between JavaScript and native without the need for mocks.

When compared against Jest, layout is calculated and can be inspected in tests:

```javascript
const root = Fantom.createRoot({viewportWidth: 200, viewportHeight: 600});
let viewElement;

Fantom.runTask(() => {
  root.render(
    <View
      ref={node => {
        viewElement = node;
      }}
      style={{width: '50%', height: '10%'}}
    />,
  );
});

// Without Fantom, getBoundingClientRect would have to be mocked.
const boundingClientRect = viewElement.getBoundingClientRect();
expect(boundingClientRect.height).toBe(60);
expect(boundingClientRect.width).toBe(100);
```

Fantom is designed to make it possible to test the integration between
JavaScript, React and React Native core - platform agnostic parts. When you are
making a change to any of these parts, you should consider writing a Fantom test
for it. It is geared towards engineers working on React Native.

With Fantom you can create scenarios close to those how a real product will
interact with React Native and observe what effects it has on a mock host
platform. It exposes fine grained controls over scheduling, making it possible
to test cases that are hard to reproduce manually.

## Usage

> [!WARNING]
>
> This is experimental!
>
> We are limiting the scope of the project to just React Native internals for
> now, so we can iterate on it quickly and keep the maintenance costs at bay.
>
> In the future, we might explore providing it for testing library/product code
> internally and externally.
>
> This means tests must live in `packages/react-native`.

Create a file with the `-itest.js` suffix anywhere you would normally create a
Jest unit test file.

The high level structure of Fantom tests is similar to Jest unit tests. However,
only a subset of Jest's Global API is currently available. For example,
`test.each` is not yet implemented in Fantom. We are working on adding more Jest
APIs. If you are blocked by the lack of a specific API, please reach out to us.

Most of the interesting APIs are available via the `@react-native/fantom`
package:

```javascript
import * as Fantom from '@react-native/fantom';

describe('My feature', () => {
  it('should do something interesting', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(/* ... */);
    });

    /* some checks */
  });
});
```

For a full API reference, please see the [inline documentation](../src/index.js)
defined for the methods in the `@react-native/fantom` [module](../src/index.js).

You can check out existing files with the `-itest.js` suffix (e.g.:
[`View-itest`](../../react-native/Libraries/Components/View/__tests__/View-itest.js))
for code examples.

Run the test using the following command from the root of the React Native
repository:

```shell
yarn fantom [optional test pattern]
```

Similar to Jest, you can also run Fantom in watch mode using `--watch`:

```shell
yarn fantom --watch [optional test pattern]
```

### FAQ

#### How is this different from Jest tests?

Fantom runs C++ part of React Native, as well as JavaScript. This makes it
possible to test things related to shadow nodes, layout, events, scheduling, C++
state updates to name a few. The results of Fabric are mounted in a mock UI tree
that can be asserted against and individual mounting instructions can be
inspected.

You can even test your C++ code. For example, we have
[Fantom tests for the new View Culling optimization](../../react-native/Libraries/Components/ScrollView/__tests__/ScrollView-viewCulling-itest.js),
which is written in C++.

#### How can I test logic related to &lt;ScrollView /> scrolling?

Fantom exposes the method `Fantom.scrollTo`. This method will trigger an
onScroll event and configure the shadow tree to reflect the new content offset:

```javascript
Fantom.scrollTo(scrollViewElement, {
  x: 0,
  y: 1,
});

expect(scrollViewElement.scrollTop).toBe(1);
```

#### What can be tested with Fantom?

Fantom was designed to make it possible to test integration between React and
Fabric with the Jest API that many people are familiar with. You can write code
to simulate any kind of input into React and assert what the output is from
React Native core to the host platform. Fantom controls the app's message queue,
which gives complete control over scheduling. This makes it possible to write
tests that simulate scenarios where an event interrupts React rendering in a
deterministic fashion.

Even JavaScript only code can be tested with Fantom. We are considering fully
deprecating "vanilla" Jest in favor of Fantom for all JavaScript tests in React
Native.

#### Is Fantom ready for production use cases?

Fantom is stable and will not go away. For testing specific to React Native, it
is the recommended solution.

For now, it is discouraged to use Fantom for product code testing.

#### Where can I find examples of tests?

Look for files with the `-itest.js` suffix to find existing tests. The Fantom
test for its public API ([`Fantom-itest.js`](../src/__tests__/Fantom-itest.js))
has simple examples you can learn from.

---

If you have any questions not answered here, please reach out to us.

## Design

_TODO: Explain how the subsystem is designed, relevant implementation details,
etc. Ideally include an Excalidraw diagram._

## Relationship with other systems

### Part of

- _TODO: A single bullet for the parent subsystem. Link to the documentation of
  that subsystem if it exists._

### Part of this

- _TODO: One bullet point for each subsystem that is part of this one. Link to
  the documentation of those subsystems if it exists._

### Used by this

- _TODO: One bullet point for each subsystem used by this one, explaining why it
  uses it and how. Link to the documentation of those subsystems if it exists._

### Uses this

- _TODO: One bullet point for each subsystem using this one, explaining why it
  uses it and how. Link to the documentation of those subsystems if it exists._
