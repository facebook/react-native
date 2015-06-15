---
id: testing
title: Testing
layout: docs
category: Guides
permalink: docs/testing.html
next: runningondevice
---

## Running Tests and Contributing

The React Native repo has several tests you can run to verify you haven't caused a regression with your PR.  These tests are run with the [Travis](http://docs.travis-ci.com/) continuous integration system, and will automatically post the results to your PR.  You can also run them locally with cmd+U in the IntegrationTest and UIExplorer apps in Xcode.  You can run the jest tests via `npm test` on the command line.  We don't have great test coverage yet, however, so most changes will still require significant manual verification, but we would love it if you want to help us increase our test coverage!

## Jest Tests

[Jest](http://facebook.github.io/jest/) tests are JS-only tests run on the command line with node.  The tests themselves live in the `__tests__` directories of the files they test, and there is a large emphasis on aggressively mocking out functionality that is not under test for failure isolation and maximum speed.  You can run the existing React Native jest tests with `npm test` from the react-native root, and we encourage you to add your own tests for any components you want to contribute to.  See [`getImageSource-test.js`](https://github.com/facebook/react-native/blob/master/Examples/Movies/__tests__/getImageSource-test.js) for a basic example.

## Integration Tests

React Native provides facilities to make it easier to test integrated components that require both native and JS components to communicate across the bridge.  The two main components are `RCTTestRunner` and `RCTTestModule`.  `RCTTestRunner` sets up the ReactNative environment and provides facilities to run the tests as `XCTestCase`s in Xcode (`runTest:module` is the simplest method).  `RCTTestModule` is exported to JS via `NativeModules` as `TestModule`.  The tests themselves are written in JS, and must call `TestModule.markTestCompleted()` when they are done, otherwise the test will timeout and fail.  Test failures are primarily indicated by throwing an exception.  It is also possible to test error conditions with `runTest:module:initialProps:expectErrorRegex:` or `runTest:module:initialProps:expectErrorBlock:` which will expect an error to be thrown and verify the error matches the provided criteria.  See [`IntegrationTestHarnessTest.js`](https://github.com/facebook/react-native/blob/master/IntegrationTests/IntegrationTestHarnessTest.js) and [`IntegrationTestsTests.m`](https://github.com/facebook/react-native/blob/master/IntegrationTests/IntegrationTestsTests/IntegrationTestsTests.m) for example usage.

## Snapshot Tests

A common type of integration test is the snapshot test.  These tests render a component, and verify snapshots of the screen against reference images using `TestModule.verifySnapshot()`, using the [`FBSnapshotTestCase`](https://github.com/facebook/ios-snapshot-test-case) library behind the scenes.  Reference images are recorded by setting `recordMode = YES` on the `RCTTestRunner`, then running the tests.  Snapshots will differ slightly between 32 and 64 bit, and various OS versions, so it's recommended that you enforce tests are run with the correct configuration.  It's also highly recommended that all network data be mocked out, along with other potentially troublesome dependencies.  See [`SimpleSnapshotTest`](https://github.com/facebook/react-native/blob/master/IntegrationTests/SimpleSnapshotTest.js) for a basic example.

## Testing Components

Jest is a great tool for testing React components, but it requires a little more setup for testing React Native components.  To get started, you'll need to do the following:

1. Transpile ES6 code
2. Mock React Native

### Transpiling ES6 Code

React Native is written in ES6 and there's a very good chance that your component is it too.  So you'll have to make sure to preprocess your source files to ES5 prior to running your tests.  You can do this by configuring Jest with a [`scriptPreprocessor`](https://facebook.github.io/jest/docs/api.html#config-scriptpreprocessor-string) like [this one](https://gist.github.com/naoufal/dd8447646fe6f6fbf426).

### Mocking React Native

As you already know, React Native exposes plenty of native modules written in Objective-C and Swift.  This is problematic when running tests in the command-line with Jest.  Luckily, you can circumvent this by [manually mocking](https://facebook.github.io/jest/docs/manual-mocks.html) React Native with [React](https://facebook.github.io/react/index.html).

```js
// __mocks__/react-native.js

'use strict';

var React = require('react');
var ReactNative = React;

ReactNative.StyleSheet = {
  create: function(styles) {
    return styles;
  }
};

module.exports = ReactNative;
```

This will allow you to test functionality shared between React and React Native.  However, as you can see in the example, you'll need to mock functionalities that are unique to React Native.
