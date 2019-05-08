<!--
  About this guide:
  The goals of this document are two-fold: it documents what sort of tests run against code-level open source contributions, and it documents best-practices for writing your own tests.
-->

## Running Tests
This section is about testing your changes to React Native as a contributor. If you haven't yet, go through the steps to set up your development environment for [building projects with native code][env-setup]. If you are intested in [writing tests](#writing-tests) for a React Native app, proceed to the next section.

[env-setup]: http://facebook.github.io/react-native/docs/getting-started


### JavaScript Tests

The simplest way to run the JavaScript test suite is by using the following command at the root of your React Native checkout:

```bash
npm test
```

This will run tests using [Jest](https://jestjs.io).

You should also make sure your code passes [Flow](https://flowtype.org/) and lint tests:

```bash
npm run flow
npm run lint
```

### iOS Tests

To run the iOS tests, invoke the following script from the root of your React Native checkout:

```bash
./scripts/objc-test-ios.sh test
```

You can also open the Xcode project at `RNTester/RNTester.xcodeproj` and run tests locally by pressing Command + U.

### Android Tests

The Android unit tests do not run in an emulator. They just use a normal Java installation. The test suite is built using the [Buck build tool][buck-install].

[buck-install]: https://buckbuild.com/setup/install.html

To run the Android unit tests, invoke the following script from the root of your React Native checkout:

```bash
./scripts/run-android-local-unit-tests.sh
```

The Android integration tests, on the other hand, need additional setup. We recommend going through the instructions to [set up your environment for building React Native from source](http://facebook.github.io/react-native/docs/building-from-source#prerequisites).

Once you've done that, you can start the Android emulator using:

```bash
./scripts/run-android-emulator.sh
```

Then, run the Android integration tests:

```bash
./scripts/run-android-local-integration-tests.sh
```

### End-to-end Tests

Finally, make sure end-to-end tests run successfully by executing the following script:

```bash
./scripts/test-manual-e2e.sh
```

End-to-end tests written in [Detox](https://github.com/wix/Detox) confirm that React Native components and APIs function correctly in the context of a running app. They run the RNTester app in the simulator and simulate a user interacting with the app.

You can run Detox end-to-end tests locally by [installing the Detox CLI](https://github.com/wix/Detox/blob/master/docs/Introduction.GettingStarted.md#step-1-install-dependencies) on macOS, then running the following in the command line:

```bash
npm run build-ios-e2e
npm run test-ios-e2e
```

If you work on a component or API that isn't convered by a Detox test, please consider adding one. Detox tests are stored under [`RNTester/e2e/__tests__`](https://github.com/facebook/react-native/tree/master/RNTester/e2e/__tests__).

### Continuous Testing

We use [Appveyor][config-appveyor] and [Circle CI][config-circleci] to automatically run our open source tests. Appveyor and Circle CI will run these tests whenever a commit is added to a pull request, as a way to help maintainers understand whether a code change introduces a regression. The tests also run on commits to the master and `*-stable` branches in order to keep track of the health of these branches.

[config-appveyor]: https://github.com/facebook/react-native/blob/master/.appveyor/config.yml
[config-circleci]: https://github.com/facebook/react-native/blob/master/.circleci/config.yml

There's another set of tests that run within Facebook's internal test infrastructure. Some of these tests are integration tests defined by internal consumers of React Native (e.g. unit tests for a React Native surface in the Facebook app). These tests run on every commit to the copy of React Native hosted on Facebook's source control. They also run when a pull request is imported to Facebook's source control. As it happens, should one of these tests fail, you'll need someone at Facebook to take a look. Since pull requests can only be imported by Facebook employees, whoever imported the pull request should be able to facilitate any details.

> **Running CI tests locally**
>
> Most open source collaborators rely on Circle CI and Appveyor to see the results of these tests. If you'd rather verify your changes locally using the same configuration as Circle CI, Circle CI provides a [command line interface](https://circleci.com/docs/2.0/local-cli/) with the ability to run jobs locally.

## Writing Tests

Whenever you are fixing a bug or adding new functionality to React Native, it is a good idea to add a test that covers it. Depending on the change you're making, there are different types of tests that may be appropriate.

### JavaScript Tests

The JavaScript tests can be found inside `__test__` directories, colocated next to the files that are being tested. See [`TouchableHighlight-test.js`][js-jest-test] for a basic example. You can also follow Jest's [Testing React Native Apps][jest-tutorial] tutorial to learn more.

[js-jest-test]: https://github.com/facebook/react-native/blob/master/Libraries/Components/Touchable/__tests__/TouchableHighlight-test.js
[jest-tutorial]: https://jestjs.io/docs/en/tutorial-react-native

### iOS Integration Tests

React Native provides facilities to make it easier to test integrated components that require both native and JS components to communicate across the bridge. The two main components are `RCTTestRunner` and `RCTTestModule`. `RCTTestRunner` sets up the React Native environment and provides facilities to run the tests as `XCTestCase`s in Xcode (`runTest:module` is the simplest method). `RCTTestModule` is exported to JavaScript as `NativeModules.TestModule`.

The tests themselves are written in JS, and must call `TestModule.markTestCompleted()` when they are done, otherwise the test will timeout and fail. Test failures are primarily indicated by throwing a JS exception. It is also possible to test error conditions with `runTest:module:initialProps:expectErrorRegex:` or `runTest:module:initialProps:expectErrorBlock:` which will expect an error to be thrown and verify the error matches the provided criteria.

See the following for example usage and integration points:

- [`IntegrationTestHarnessTest.js`][f-ios-test-harness]
- [`RNTesterIntegrationTests.m`][f-ios-integration-tests]
- [`IntegrationTestsApp.js`][f-ios-integration-test-app]

[f-ios-test-harness]: https://github.com/facebook/react-native/blob/master/IntegrationTests/IntegrationTestHarnessTest.js
[f-ios-integration-tests]: https://github.com/facebook/react-native/blob/master/RNTester/RNTesterIntegrationTests/RNTesterIntegrationTests.m
[f-ios-integration-test-app]: https://github.com/facebook/react-native/blob/master/IntegrationTests/IntegrationTestsApp.js

### iOS Snapshot Tests

A common type of integration test is the snapshot test. These tests render a component, and verify snapshots of the screen against reference images using `TestModule.verifySnapshot()`, using the [`FBSnapshotTestCase`](https://github.com/facebook/ios-snapshot-test-case) library behind the scenes. Reference images are recorded by setting `recordMode = YES` on the `RCTTestRunner`, then running the tests.

Snapshots will differ slightly between 32 and 64 bit, and various OS versions, so it's recommended that you enforce tests are run with the [correct configuration](https://github.com/facebook/react-native/blob/master/scripts/.tests.env). It's also highly recommended that all network data be mocked out, along with other potentially troublesome dependencies. See [`SimpleSnapshotTest`](https://github.com/facebook/react-native/blob/master/IntegrationTests/SimpleSnapshotTest.js) for a basic example.

If you make a change that affects a snapshot test in a pull request, such as adding a new example case to one of the examples that is snapshotted, you'll need to re-record the snapshot reference image. To do this, simply change to `_runner.recordMode = YES;` in [RNTester/RNTesterSnapshotTests.m](https://github.com/facebook/react-native/blob/136666e2e7d2bb8d3d51d599fc1384a2f68c43d3/RNTester/RNTesterIntegrationTests/RNTesterSnapshotTests.m#L29), re-run the failing tests, then flip record back to `NO` and submit/update your pull request and wait to see if the Circle build passes.

### Android Unit Tests

It's a good idea to add an Android unit test whenever you are working on code that can be tested by Java code alone. The Android unit tests are located in `ReactAndroid/src/tests`. We recommend browsing through these to get an idea of what a good unit test might look like.

### Android Integration Tests

It's a good idea to add an Android integration test whenever you are working on code that needs both JavaScript and Java to be tested in conjunction. The Android integration tests can be found in `ReactAndroid/src/androidTest`. We recommend browsing through these to get an idea of what a good integration test might look like.
