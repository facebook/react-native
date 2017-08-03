---
id: testing
title: Testing your Changes
layout: docs
category: Contributing
permalink: docs/testing.html
next: maintainers
previous: contributing
---

This document is about testing your changes to React Native as a [contributor](docs/contributing.html). If you're interested in testing a React Native app, check out the [React Native Tutorial](http://facebook.github.io/jest/docs/tutorial-react-native.html) on the Jest website.

The React Native repo has several tests you can run to verify you haven't caused a regression with your PR.  These tests are run with the [Travis](https://travis-ci.org/facebook/react-native/builds) and [Circle](https://circleci.com/gh/facebook/react-native) continuous integration systems, which will automatically annotate pull requests with the test results.

Whenever you are fixing a bug or adding new functionality to React Native, you should add a test that covers it. Depending on the change you're making, there are different types of tests that may be appropriate.

- [JavaScript](docs/testing.html#javascript)
- [Android](docs/testing.html#android)
- [iOS](docs/testing.html#ios)
- [Apple TV](docs/testing.html#apple-tv)
- [End-to-end tests](docs/testing.html#end-to-end-tests)
- [Website](docs/testing.html#website)

## JavaScript

### Jest

Jest tests are JavaScript-only tests run on the command line with node. You can run the existing React Native jest tests with:

    $ cd react-native
    $ npm test

It's a good idea to add a Jest test when you are working on a change that only modifies JavaScript code.

The tests themselves live in the `__tests__` directories of the files they test.  See [`TouchableHighlight-test.js`](https://github.com/facebook/react-native/blob/master/Libraries/Components/Touchable/__tests__/TouchableHighlight-test.js) for a basic example.

### Flow

You should also make sure your code passes [Flow](https://flowtype.org/) tests. These can be run using:

    $ cd react-native
    $ npm run flow

## Android

### Unit Tests

The Android unit tests do not run in an emulator. They just use a normal Java installation. The default macOS Java install is insufficient, you may need to install [Java 8 (JDK8)](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html). You can type `javac -version` in a terminal to see what version you have:

```
$ javac -version
javac 1.8.0_111
```

The version string `1.8.x_xxx` corresponds to JDK 8.

You also need to install the [Buck build tool](https://buckbuild.com/setup/install.html).

To run the Android unit tests:

    $ cd react-native
    $ ./scripts/run-android-local-unit-tests.sh

It's a good idea to add an Android unit test whenever you are working on code that can be tested by Java code alone. The Android unit tests live under [`ReactAndroid/src/tests`](https://github.com/facebook/react-native/tree/master/ReactAndroid/src/test/java/com/facebook/react), so you can browse through that directory for good examples of tests.

### Integration Tests

To run the integration tests, you need to install the Android NDK. See [Prerequisites](docs/android-building-from-source.html#prerequisites).

You also need to install the [Buck build tool](https://buckbuild.com/setup/install.html).

We recommend running the Android integration tests in an emulator, although you can also use a real Android device. It's a good idea to keep the emulator running with a visible window. That way if your tests stall, you can look at the emulator to debug.

Some devices and some emulator configurations may not work with the tests. We do maintain an emulator configuration that works, as the standard for testing. To run this emulator config:

    $ cd react-native
    $ ./scripts/run-android-emulator.sh

Once you have an emulator running, to run the integration tests:

    $ cd react-native
    $ ./scripts/run-android-local-integration-tests.sh

The integration tests should only take a few minutes to run on a modern developer machine.

It's a good idea to add an Android integration test whenever you are working on code that needs both JavaScript and Java to be tested in conjunction. The Android integration tests live under [`ReactAndroid/src/androidTest`](https://github.com/facebook/react-native/tree/master/ReactAndroid/src/androidTest/java/com/facebook/react/tests), so you can browse through that directory for good examples of tests.

## iOS

### Integration Tests

React Native provides facilities to make it easier to test integrated components that require both native and JS components to communicate across the bridge.  The two main components are `RCTTestRunner` and `RCTTestModule`.  `RCTTestRunner` sets up the ReactNative environment and provides facilities to run the tests as `XCTestCase`s in Xcode (`runTest:module` is the simplest method).  `RCTTestModule` is exported to JS as `NativeModules.TestModule`.  

The tests themselves are written in JS, and must call `TestModule.markTestCompleted()` when they are done, otherwise the test will timeout and fail.  Test failures are primarily indicated by throwing a JS exception.  It is also possible to test error conditions with `runTest:module:initialProps:expectErrorRegex:` or `runTest:module:initialProps:expectErrorBlock:` which will expect an error to be thrown and verify the error matches the provided criteria.  

See the following for example usage and integration points:

- [`IntegrationTestHarnessTest.js`](https://github.com/facebook/react-native/blob/master/IntegrationTests/IntegrationTestHarnessTest.js)
- [`RNTesterIntegrationTests.m`](https://github.com/facebook/react-native/blob/master/RNTester/RNTesterIntegrationTests/RNTesterIntegrationTests.m)
- [`IntegrationTestsApp.js`](https://github.com/facebook/react-native/blob/master/IntegrationTests/IntegrationTestsApp.js)

You can run integration tests locally with cmd+U in the IntegrationTest and RNTester apps in Xcode, or by running the following in the command line on macOS:

    $ cd react-native
    $ ./scripts/objc-test-ios.sh

> Your Xcode install will come with a variety of Simulators running the latest OS. You may need to manually create a new Simulator to match what the `XCODE_DESTINATION` param in the test script.

### Screenshot/Snapshot Tests

A common type of integration test is the snapshot test.  These tests render a component, and verify snapshots of the screen against reference images using `TestModule.verifySnapshot()`, using the [`FBSnapshotTestCase`](https://github.com/facebook/ios-snapshot-test-case) library behind the scenes.  Reference images are recorded by setting `recordMode = YES` on the `RCTTestRunner`, then running the tests.  Snapshots will differ slightly between 32 and 64 bit, and various OS versions, so it's recommended that you enforce tests are run with the correct configuration.  It's also highly recommended that all network data be mocked out, along with other potentially troublesome dependencies.  See [`SimpleSnapshotTest`](https://github.com/facebook/react-native/blob/master/IntegrationTests/SimpleSnapshotTest.js) for a basic example.

If you make a change that affects a snapshot test in a PR, such as adding a new example case to one of the examples that is snapshotted, you'll need to re-record the snapshot reference image.  To do this, simply change to `_runner.recordMode = YES;` in [RNTester/RNTesterSnapshotTests.m](https://github.com/facebook/react-native/blob/master/RNTester/RNTesterIntegrationTests/RNTesterSnapshotTests.m#L42), re-run the failing tests, then flip record back to `NO` and submit/update your PR and wait to see if the Travis build passes.

## Apple TV

The same tests discussed above for iOS will also run on tvOS.  In the RNTester Xcode project, select the RNTester-tvOS target, and you can follow the same steps above to run the tests in Xcode.

You can run Apple TV unit and integration tests locally by running the following in the command line on macOS:

    $ cd react-native
    $ ./scripts/objc-test-tvos.sh (make sure the line `TEST="test"` is uncommented)

## End-to-end tests

Finally, make sure end-to-end tests run successfully by executing the following script:

    $ cd react-native
    $ ./scripts/test-manual-e2e.sh

## Website

The React Native website is hosted on GitHub pages and is automatically generated from Markdown sources as well as comments in the JavaScript source files. It's always a good idea to check that the website is generated properly whenever you edit the docs.

    $ cd website
    $ npm install
    $ npm start

Then open http://localhost:8079/react-native/index.html in your browser.
