# RNTester PlatformTest

A barebones manual testing framework designed to work as a mechanism for recreating [Web Platform Tests](https://github.com/web-platform-tests/wpt) in React Native in order to verify their compliance with W3C specifications.

## Usage

Any new test case will start as a new React component which at the very least accepts a `harness` prop which will contain all of the framework's testing APIs. This component you write will be passed into the `component` prop of a `RNTesterPlatformTest` element whose other props are used for documenting your test. Rendering this `RNTesterPlatformTest` will look similar to something like this:

```js
function ExampleTestCase ({ harness }) { /* ... */ }

<RNTesterPlatformTest
  title="Example Test"
  description="Imagine there's a detailed description of this example test here"
  instructions={[
    "This is the example test's first step",
    "A second step",
    "A third step",
  ]}
  component={ExampleTestCase}
/>
```


As of writing this README there are 2 different types of tests that the `harness` prop provides:

### `test(testcase: (TestContext) => void, testName: string, options?: TestOptions)`

This is a method to create "regular" test reminiscent of other frameworks such as Jest. These are meant to be run imperatively, and while that means that they technically could work in a `useEffect` hook as a way to run the test "on mount" — it is instead recommended to try and keep these tests in callbacks instead. A good alternative to running the test on mount would be to instead put the test in a callback and render a "Start Test" button which executes the callback.

The first argument is the closure in which you will run your test and make assertions. The assertions are contained in the `TestContext` object which is provided in the test closure's first argument and contains the following assertions:

* `assert_true(a: boolean, description: string): void`
* `assert_equals(a: any, b: any, description: string): void`
* `assert_greater_than_equal(a: number, b: number, description: string): void`
* `assert_less_than_equal(a: number, b: number, description: string): void`

An optional third argument can be used for specifying additional options to the test — that object currently has the following properties (all of which are optional themselves):

* `skip: boolean`: In cases where we want the test to be registered but we don't want it to contribute to the pass/fail count.

Here's what a basic/contrived example which verifies the layout of a basic view:

```js
const EXPECTED_WIDTH = 100;
const EXPECTED_HEIGHT = 200;

function BasicLayoutTestCase({harness}) {
  const viewRef = useRef(null);

  const runTest = useCallback(() => {
    const view = viewRef.current;
    if (view != null) {
      view.measureInWindow(({width, height}) => {
        harness.test(({assert_equals}) => {
          assert_equals(
            width,
            EXPECTED_WIDTH,
            `view's computed width should be ${EXPECTED_WIDTH}`,
          );
          assert_equals(
            height,
            EXPECTED_HEIGHT,
            `view's computed width should be ${EXPECTED_HEIGHT}`,
          );
        }, "view's width and height are correct");
      });
    }
  }, [harness]);

  return (
    <>
      <View
        ref={viewRef}
        style={{width: EXPECTED_WIDTH, height: EXPECTED_HEIGHT}}
      />
      <Button title="Start Test" onPress={runTest} />
    </>
  );
}
```

### `useAsyncTest(description: string, timeoutMs?: number): AsyncPlatformTest`

This is a hook which can be used to represent tests that expect something to happen *some time* in the future. If the test isn't marked as "done" within a certain amount of time (10 seconds by default but can be optionally specified in the hook's second argument). This hook returns an object containing a `done` function which is used for marking the completion of the async test.

Here's what a basic example would look like for verifying that `pointermove` events are emitted:

```js
function BasicPointerMoveTestCase({harness}) {
  const testPointerMove = harness.useAsyncTest('pointermove event received');

  return (
    <View
      style={{width: 100, height: 100, backgroundColor: 'black'}}
      onPointerMove={() => testPointerMove.done()}
    />
  );
}
```
