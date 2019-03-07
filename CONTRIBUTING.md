# Contributing to React Native

We want to make contributing to this project as easy and transparent as possible. Read on to learn more about our development process and how to propose bug fixes and improvements.

## What’s in this document?

- [Getting Started](#getting-started)
- [Where to Get Help](#where-to-get-help)
- [Triaging Issues](#issues)
- [Our Development Process](#our-development-process)
- [Pull Requests](#pull-requests)
- [Running and Writing Tests](#running-and-writing-tests)
- [Helping with Documentation](#helping-with-documentation)
- [Core Contributors](#core-contributors)
- [Appendix](#appendix)

## Getting Started

Thanks for your interest in contributing to React Native! From commenting on and triaging issues, to reviewing and sending PRs, we are here to help you every step of the way.

[Open Source Guides][gh-oss-guide] are a collection of resources for individuals, communities, and companies who want to learn how to run and contribute to an open source project. Contributors and people new to open source alike will find the following guides useful:

- [How to Contribute to Open Source][gh-how-to-contribute]
- [Building Welcoming Communities][gh-building-community]

[gh-oss-guide]: https://opensource.guide/
[gh-how-to-contribute]: https://opensource.guide/how-to-contribute/
[gh-building-community]: https://opensource.guide/building-community/

The main repository, <https://github.com/facebook/react-native>, contains the core React Native framework, and it is where we keep track of bug reports and manage pull requests.

There's a handful of additional repositories that you should know of:

- The source code for the **React Native website**, including the documentation, is located at <https://github.com/facebook/react-native-website>
- **Releases** are coordinated through the <https://github.com/react-native-community/react-native-releases> repository. This includes important documents such as the Changelog.
- **Discussions** about the future of React Native take place in the <https://github.com/react-native-community/discussions-and-proposals> repository.

Browsing through these repositories might provide some insight into how the React Native open source project is managed. You may want to start by sending a pull request to fix a typo in the release notes, or by participating in discussions with other collaborators.

If you are eager to start contributing code right away, we have a list of [good first issues][gfi] that contain bugs which have a relatively limited scope. As you gain more experience and demonstrate a commitment to evolving React Native, you may be granted issue management permissions in the main repository.

There are other ways you can contribute without writing a single line of code. Here's a sample of things you can do to help out:

1. **Replying and handling open issues.** We get a lot of issues every day, and some of them may lack necessary information. You can help out by guiding people through the process of filling out the issue template, asking for clarifying information, or pointing them to existing issues that match their description of the problem. We'll cover more about this process later, in [**Triaging Issues**](#triaging-issues).

2. **Reviewing pull requests for the docs.** Reviewing [documentation updates][docs-prs] can be as simple as checking for spelling and grammar. If you encounter sitations that can be explained better in the docs, click **Edit** at the top of most docs pages to get started with your own contribution.

3. **Help people write test plans.** Some pull requests sent to the main repository [may lack a proper test plan][pr-no-test-plan]. These help reviewers understand how the change was tested, and can speed up the time it takes for a contribution to be accepted.

Each of these tasks is highly impactful, and maintainers will appreciate your help.

[gfi]: https://github.com/facebook/react-native/labels/good%20first%20issue
[docs-prs]: https://github.com/facebook/react-native-website/pulls
[pr-no-test-plan]: https://github.com/facebook/react-native/pulls?utf8=%E2%9C%93&q=is%3Aopen+is%3Apr+-label%3A%22PR%3A+Includes+Test+Plan%22+


### Our Development Process

Most changes from engineers at Facebook will sync to [GitHub][facebook/react-native] through a bridge with Facebook's internal source control. Changes from the community are handled through GitHub pull requests. Once a change made on GitHub is approved, it will first be imported into Facebook's internal source control. The change will eventually sync back to GitHub as a single commit once it has passed Facebook's internal tests.

[facebook/react-native]: https://github.com/facebook/react-native


## Where to Get Help

As you work on React Native, it is natural that sooner or later you may require help. In addition to the resources listed in [SUPPORT][support], people interested in contributing may take advantage of the following:

* **Twitter**. The React Native team at Facebook has its own account at [**@reactnative**][at-reactnative], and the React Native Community uses [**@reactnativecomm**][at-reactnativecomm]. If you are stuck, or need help contributing, please do not hesitate to reach out.

* **Proposals Repository**. If you are considering working on a feature large in scope, consider [creating a proposal first][meta]. The community is highly willing to help you figure out the right approach, and we'd be happy to help.

* **React Native Community Discord**. While we try to hold most discussions in public, sometimes it can be beneficial to have conversations in real time with other contributors. People who have demonstrated a commitment to moving React Native forward through sustained contributions to the project may eventually be invited to join the React Native Community Discord.

[at-reactnative]: https://twitter.com/reactnative
[at-reactnativecomm]: https://twitter.com/reactnativecomm
[support]: http://github.com/facebook/react-native/blob/master/.github/SUPPORT.md
[meta]: https://github.com/react-native-community/discussions-and-proposals


## Issues

We use GitHub issues to track public bugs. Please ensure your description is clear and has sufficient instructions to be able to reproduce the issue.

Facebook has a [bounty program](https://www.facebook.com/whitehat/) for the safe disclosure of security bugs. In those cases, please go through the process outlined on that page and do not file a public issue.

### Triaging Issues

TODO: Incoming.

## Pull Requests

### Quick Start

Code-level contributions to React Native generally come in the form of [pull requests][pr]. The process of proposing a change to React Native can be summarized as follows:

1. Fork the React Native repository and create your branch from `master`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. If you haven't already, complete the Contributor License Agreement ("CLA").
7. Push the changes to your fork.
8. Create a pull request to the core React Native repository.
9. Review and address comments on your pull request.

If all goes well, your pull request will be merged. If it is not merged, maintainers will do their best to explain the reason why.

Up next, we'll go deeper into each of these steps.

[pr]: https://help.github.com/en/articles/about-pull-requests

### Step-by-Step Guide

These instructions provide the step-by-step process to set up your machine to make contributions to the core React Native repository, and create your first pull request.

#### 1. Install `git`

The React Native source code is hosted on GitHub. You can interact with the git version control through the `git` command line program. We recommend you follow [GitHub's instructions][git] to set up git on your machine.

[git]: https://help.github.com/articles/set-up-git/

#### 2. Get the source code

While you can browse the source code for React Native on [GitHub][facebook/react-native], we recommend you set up a fork on your local machine.

1. Go to <https://github.com/facebook/react-native>.
2. Click on Fork on the upper right.
3. When asked, select your username as the host for this fork.

You will now have a fork of React Native on GitHub at <https://github.com/your_username/react-native>. Next, you will grab a copy of the source code for your local machine. Open a shell and type the following commands:

```bash
git clone https://github.com/facebook/react-native.git
git remote add fork https://github.com/your_username/react-native.git
```

> If the above seems new to you, do not be scared. You can access a shell through the Terminal application on macOS and linux, or PowerShell on Windows.

A new `react-native/` directory will be created with the contents of the core React Native repository. This directory is actually a clone of the React Native git repository. It is set up with two remotes: `origin` for the upstream @facebook/react-native repository, and `fork` for the fork of React Native on your own GitHub account.

#### 3. Set up your development environment

There's a few additional tools you will need in order to build and develop for React Native. These are covered as part of the [Getting Started](https://facebook.github.io/react-native/docs/getting-started) guide under the "Building Projects with Native Code" section.

#### 4. Create a branch

We recommend creating a new branch in your fork to keep track of your changes:

```bash
git checkout --branch my_feature_branch --track origin/master
```


#### 5. Make changes to the code

You can now make any changes deemed necessary using your code editor of choice. Many popular editors integrate with source control in some way. You can also use `git status` and `git diff` on the command line to keep track of what has changed.

#### 6. Test your changes

Make sure your changes are correct and do not introduce any test failures. You can learn more in [Running and Writing Tests](#running-and-writing-tests).

#### 7. Lint your code

We understand it can take a while to ramp up and get a sense of the style followed for each of the languages in use in the core React Native repository. Developers should not need to worry about minor nits, so whenever possible, we use tools that automate the process of rewriting your code to follow conventions.

For example, we use [Prettier](https://prettier.io/) to format our JavaScript code. This saves you time and energy as you can let Prettier fix up any formatting issues automatically through its editor integrations, or by manually running `npm run prettier`. We also use a linter to catch styling issues that may exist in your code. You can check the status of your code styling by simply running `npm run lint`.

To learn more about coding conventions, refer to the [Coding Style](#coding-style) reference in the Appendix.

#### 8. Commit your changes

Once you're satisfied, make sure to add your changes to version control using `git`:

```bash
git add <filename>
git commit -m <message>
```

You can use a short descriptive sentence as your commit message.

> Worried about writing good git commit messages? Do not fret. Later, when your pull request is merged, all your commits will be squashed into a single commit. It is your pull request description which will be used to populate the message for this squashed commit.

This guide covers just enough to help you along with your first contribution. GitHub has several resources to help you get started with git:

- [Using Git](https://help.github.com/en/categories/using-git)
- [The GitHub Flow](https://guides.github.com/introduction/flow/)

#### 9. Complete the Contributor License Agreement ("CLA")

In order to accept your pull request, we need you to submit a CLA. You only need to do this once to work on any of Facebook's open source projects.

Complete your CLA here: <https://code.facebook.com/cla>

#### 10. Push your changes to GitHub

Once your changes have been commited to version control, you can push them to GitHub.

```bash
git push fork <my_feature_branch>
```

If all goes well, you will see a message encouraging you to open a pull request:

```bash
remote:
remote: Create a pull request for 'your_feature_branch' on GitHub by visiting:
remote:      https://github.com/your_username/react-native/pull/new/your_feature_branch
remote:
```

Visit the provided URL to proceed to the next step.

#### 11. Create your pull request

You are almost there! The next step is to fill out the pull request. Use a descriptive title that is not too long. Then, make sure to fill out all of the fields provided by the default pull request template:

**Summary:** Use this field to provide your motivation for sending this pull request. What are you fixing?

**Changelog:** Help release maintainers write release notes by providing a short description of what will be changed should the pull request get merged.

**Test Plan:** Let reviewers know how you tested your changes. Did you consider any edge cases? Which steps did you follow to make sure your changes have the desired effect?

TODO: Link to an article on writing a good test plan.

#### 12. Review and address feedback

Keep an eye on any comments and review feedback left on your pull request on GitHub. Maintainers will do their best to provide constructive, actionable feedback to help get your changes ready to be merged into the core React Native repository.

TODO: Review process, how a PR gets merged, congratulations on your first contribution, next steps, etc.

## Running and Writing Tests

This section is about testing your changes to React Native as a contributor. If you haven't yet, go through the steps to set up your development environment for [building projects with native code][env-setup]. If you are intested in writing tests for a React Native app, you can follow Jest's [Testing React Native Apps][jest-tutorial] tutorial.

[env-setup]: http://facebook.github.io/react-native/docs/getting-started
[jest-tutorial]: https://jestjs.io/docs/en/tutorial-react-native

### Running Tests

#### JavaScript Tests

The simplest way to run the JavaScript test suite is by using the following command at the root of your React Native checkout:

```bash
npm test
```

This will run tests using [Jest](https://jestjs.io).

You should also make sure your code passes [Flow](https://flowtype.org/) tests:

```bash
npm run flow
```

#### iOS Tests

To run the iOS tests, invoke the following script from the root of your React Native checkout:

```bash
./scripts/objc-test-ios.sh
```

You can also open the Xcode project at `RNTester/RNTester.xcodeproj` and run tests locally by pressing Command + U.

#### Android Tests

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

#### End-to-end Tests

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



#### Continuous Integration Tests

TODO: Talk about Circle CI, Appveyor.

### Writing Tests

Whenever you are fixing a bug or adding new functionality to React Native, it is a good idea to add a test that covers it. Depending on the change you're making, there are different types of tests that may be appropriate.

#### JavaScript Jest Tests

The JavaScript tests can be found inside `__test__` directories, colocated next to the files that are being tested. See [`TouchableHighlight-test.js`][js-jest-test] for a basic example.

[js-jest-test]: https://github.com/facebook/react-native/blob/master/Libraries/Components/Touchable/__tests__/TouchableHighlight-test.js

#### iOS Integration Tests

React Native provides facilities to make it easier to test integrated components that require both native and JS components to communicate across the bridge. The two main components are `RCTTestRunner` and `RCTTestModule`. `RCTTestRunner` sets up the React Native environment and provides facilities to run the tests as `XCTestCase`s in Xcode (`runTest:module` is the simplest method). `RCTTestModule` is exported to JavaScript as `NativeModules.TestModule`.

The tests themselves are written in JS, and must call `TestModule.markTestCompleted()` when they are done, otherwise the test will timeout and fail. Test failures are primarily indicated by throwing a JS exception. It is also possible to test error conditions with `runTest:module:initialProps:expectErrorRegex:` or `runTest:module:initialProps:expectErrorBlock:` which will expect an error to be thrown and verify the error matches the provided criteria.

See the following for example usage and integration points:

- [`IntegrationTestHarnessTest.js`][f-ios-test-harness]
- [`RNTesterIntegrationTests.m`][f-ios-integration-tests]
- [`IntegrationTestsApp.js`][f-ios-integration-test-app]

[f-ios-test-harness]: https://github.com/facebook/react-native/blob/master/IntegrationTests/IntegrationTestHarnessTest.js
[f-ios-integration-tests]: https://github.com/facebook/react-native/blob/master/RNTester/RNTesterIntegrationTests/RNTesterIntegrationTests.m
[f-ios-integration-test-app]: https://github.com/facebook/react-native/blob/master/IntegrationTests/IntegrationTestsApp.js

#### iOS Snapshot Tests

A common type of integration test is the snapshot test. These tests render a component, and verify snapshots of the screen against reference images using `TestModule.verifySnapshot()`, using the [`FBSnapshotTestCase`](https://github.com/facebook/ios-snapshot-test-case) library behind the scenes. Reference images are recorded by setting `recordMode = YES` on the `RCTTestRunner`, then running the tests.

Snapshots will differ slightly between 32 and 64 bit, and various OS versions, so it's recommended that you enforce tests are run with the [correct configuration](https://github.com/facebook/react-native/blob/master/scripts/.tests.env). It's also highly recommended that all network data be mocked out, along with other potentially troublesome dependencies. See [`SimpleSnapshotTest`](https://github.com/facebook/react-native/blob/master/IntegrationTests/SimpleSnapshotTest.js) for a basic example.

If you make a change that affects a snapshot test in a pull request, such as adding a new example case to one of the examples that is snapshotted, you'll need to re-record the snapshot reference image. To do this, simply change to `_runner.recordMode = YES;` in [RNTester/RNTesterSnapshotTests.m](https://github.com/facebook/react-native/blob/136666e2e7d2bb8d3d51d599fc1384a2f68c43d3/RNTester/RNTesterIntegrationTests/RNTesterSnapshotTests.m#L29), re-run the failing tests, then flip record back to `NO` and submit/update your pull request and wait to see if the Circle build passes.

#### Android Unit Tests

It's a good idea to add an Android unit test whenever you are working on code that can be tested by Java code alone. The Android unit tests are located in `ReactAndroid/src/tests`. We recommend browsing through these to get an idea of what a good unit test might look like.

#### Android Integration Tests

It's a good idea to add an Android integration test whenever you are working on code that needs both JavaScript and Java to be tested in conjunction. The Android integration tests can be found in `ReactAndroid/src/androidTest`. We recommend browsing through these to get an idea of what a good integration test might look like.

## Helping with Documentation

TODO: Flesh this out a bit more.

If you are adding new functionality or introducing a change in behavior, we will ask you to update the documentation to reflect your changes. The docs are hosted as part of the React Native website. The website itself is hosted on GitHub Pages and is automatically generated [from the Markdown sources](https://github.com/facebook/react-native-website/tree/master/docs).

To update the documentation, you will need to clone the [`facebook/react-native-website`](https://github.com/facebook/react-native-website) repository, make your changes in the `docs/` directory, and then send a pull request. For lightweight changes to a single file, you may also click on "Edit" at the top of any doc right here on the website.


## Core Contributors

TODO: Incoming.

## Appendix

### Coding Style

We use Prettier to format our JavaScript code. This saves you time and energy as you can let Prettier fix up any formatting issues automatically through its editor integrations, or by manually running `npm run prettier`. We also use a linter to catch styling issues that may exist in your code. You can check the status of your code styling by simply running `npm run lint`.

However, there are still some styles that the linter cannot pick up, notably in Java or Objective-C code.

**Objective-C:**

* Space after `@property` declarations
* Brackets on *every* `if`, on the *same* line
* `- method`, `@interface`, and `@implementation` brackets on the following line
* *Try* to keep it around 80 characters line length (sometimes it's just not possible...)
* `*` operator goes with the variable name (e.g. `NSObject *variableName;`)

**Java:**

* If a method call spans multiple lines closing bracket is on the same line as the last argument.
* If a method header doesn't fit on one line each argument goes on a separate line.
* 100 character line length
