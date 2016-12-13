---
id: testing
title: Testing
layout: docs
category: Guides
permalink: docs/testing.html
next: running-on-device
previous: debugging
---

## Running Tests and Contributing

The React Native repo has several tests you can run to verify you haven't caused a regression with your PR.  These tests are run with the [Travis](http://docs.travis-ci.com/) and [CircleCI](https://circleci.com/) continuous integration systems, and will automatically post the results to your PR.

Whenever you are fixing a bug or adding new functionality to React Native, you should add a test that covers it.

## Jest Tests

[Jest](http://facebook.github.io/jest/) tests are JS-only tests run on the command line with node.  The tests themselves live in the `__tests__` directories of the files they test, and there is a large emphasis on aggressively mocking out functionality that is not under test for failure isolation and maximum speed.  You can run the existing React Native jest tests with

```
npm test
```

from the react-native root, and we encourage you to add your own tests for any components you want to contribute to.  See [`getImageSource-test.js`](https://github.com/facebook/react-native/blob/master/Examples/Movies/__tests__/getImageSource-test.js) for a basic example.

To use Jest for your react-native projects we recommend following the [React-Native Tutorial](http://facebook.github.io/jest/docs/tutorial-react-native.html) on the Jest website.

## Android Unit Tests

The Android unit tests do not run in an emulator. They just use a normal Java installation. You do need to install Java 8, which you might have already. The default OS X Java install is insufficient.

You also need to install the [Buck build tool](https://buckbuild.com/setup/install.html).

To run the Android unit tests:

    $ cd react-native
    $ ./scripts/run-android-local-unit-tests.sh

## Android Integration Tests

To run the integration tests, you need to install the Android NDK. See [Prerequisites](/react-native/docs/android-building-from-source.html#prerequisites).

You also need to install the [Buck build tool](https://buckbuild.com/setup/install.html).

We recommend running the Android integration tests in an emulator, although you can also use a real Android device. It's a good idea to keep the emulator running with a visible window. That way if your tests stall, you can look at the emulator to debug.

Some devices and some emulator configurations may not work with the tests. We do maintain an emulator configuration that works, as the standard for testing. To run this emulator config:

    $ cd react-native
    $ ./scripts/run-android-emulator.sh

Once you have an emulator running, to run the integration tests:

    $ cd react-native
    $ ./scripts/run-android-local-integration-tests.sh

The integration tests should only take a few minutes to run on a modern developer machine.

## iOS Integration Tests

React Native provides facilities to make it easier to test integrated components that require both native and JS components to communicate across the bridge.  The two main components are `RCTTestRunner` and `RCTTestModule`.  `RCTTestRunner` sets up the ReactNative environment and provides facilities to run the tests as `XCTestCase`s in Xcode (`runTest:module` is the simplest method).  `RCTTestModule` is exported to JS as `NativeModules.TestModule`.  The tests themselves are written in JS, and must call `TestModule.markTestCompleted()` when they are done, otherwise the test will timeout and fail.  Test failures are primarily indicated by throwing a JS exception.  It is also possible to test error conditions with `runTest:module:initialProps:expectErrorRegex:` or `runTest:module:initialProps:expectErrorBlock:` which will expect an error to be thrown and verify the error matches the provided criteria.  See [`IntegrationTestHarnessTest.js`](https://github.com/facebook/react-native/blob/master/IntegrationTests/IntegrationTestHarnessTest.js), [`UIExplorerIntegrationTests.m`](https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/UIExplorerIntegrationTests/UIExplorerIntegrationTests.m), and [IntegrationTestsApp.js](https://github.com/facebook/react-native/blob/master/IntegrationTests/IntegrationTestsApp.js) for example usage and integration points.

You can run integration tests locally with cmd+U in the IntegrationTest and UIExplorer apps in Xcode.

## iOS Screenshot/Snapshot Tests

A common type of integration test is the snapshot test.  These tests render a component, and verify snapshots of the screen against reference images using `TestModule.verifySnapshot()`, using the [`FBSnapshotTestCase`](https://github.com/facebook/ios-snapshot-test-case) library behind the scenes.  Reference images are recorded by setting `recordMode = YES` on the `RCTTestRunner`, then running the tests.  Snapshots will differ slightly between 32 and 64 bit, and various OS versions, so it's recommended that you enforce tests are run with the correct configuration.  It's also highly recommended that all network data be mocked out, along with other potentially troublesome dependencies.  See [`SimpleSnapshotTest`](https://github.com/facebook/react-native/blob/master/IntegrationTests/SimpleSnapshotTest.js) for a basic example.

If you make a change that affects a snapshot test in a PR, such as adding a new example case to one of the examples that is snapshotted, you'll need to re-record the snapshot reference image.  To do this, simply change to `_runner.recordMode = YES;` in [UIExplorer/UIExplorerSnapshotTests.m](https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/UIExplorerIntegrationTests/UIExplorerSnapshotTests.m#L42), re-run the failing tests, then flip record back to `NO` and submit/update your PR and wait to see if the Travis build passes.
