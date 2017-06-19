# Contributing to React Native

React Native is one of Facebook's first open source projects that is both under very active development and is also being used to ship code to everybody on https://facebook.com. We're still working out the kinks to make contributing to this project as easy and transparent as possible, but we're not quite there yet. Hopefully this document makes the process for contributing clear and preempts some questions you may have.

## Our Development Process

Some of the core team will be working directly on GitHub. These changes will be public from the beginning. Other changesets will come via a bridge with Facebook's internal source control. This is a necessity as it allows engineers at Facebook outside of the core team to move fast and contribute from an environment they are comfortable in.

### `master` is unsafe

We will do our best to keep `master` in good shape, with tests passing at all times. But in order to move fast, we will make API changes that your application might not be compatible with. We will do our best to communicate these changes and version appropriately so you can lock into a specific version if need be.

## Pull Requests

The core team will be monitoring for pull requests. When we get one, we'll run some Facebook-specific integration tests on it first. From here, we'll need to get another person to sign off on the changes and then merge the pull request. For API changes we may need to fix internal uses, which could cause some delay. We'll do our best to provide updates and feedback throughout the process.

Small pull requests are much easier to review and more likely to get merged. Make sure the PR does only one thing, otherwise please split it.

**Please submit your pull request on the `master` branch**. If the fix is critical and should be included in a stable branch please mention it and it will be cherry picked into it by a project maintainer.

*Before* submitting a pull request, please make sure the following is done…

1. Fork the repo and create your branch from `master`.
2. Add the copyright notice to the top of any new files you've added.
3. Describe your **test plan** in your commit.
4. Ensure **tests pass** on Travis and Circle CI.
5. Make sure your code lints (`node linter.js <files touched>`).
6. If you haven't already, sign the CLA: https://code.facebook.com/cla
7. Squash your commits (`git rebase -i`).
   One intent alongside one commit makes it clearer for people to review and easier to understand your intention.

> **Note:** It is not necessary to keep clicking `Merge master to your branch` on the PR page. You would want to merge master if there are conflicts or tests are failing. The Facebook-GitHub-Bot ultimately squashes all commits to a single one before merging your PR.

#### Test plan

A good test plan has the exact commands you ran and their output, provides screenshots or videos if the pull request changes UI or updates the website.

  - If you've added code that should be tested, add tests!
  - If you've changed APIs, update the documentation.
  - If you've updated the docs, verify the website locally and submit screenshots if applicable (see `website/README.md`)

See "What is a Test Plan?" to learn more:
https://medium.com/@martinkonicek/what-is-a-test-plan-8bfc840ec171#.y9lcuqqi9

#### Continuous integration tests

Make sure all **tests pass** on both [Travis][travis] and [Circle CI][circle]. PRs that break tests are unlikely to be merged.

You can learn more about running tests and contributing to React Native here: https://facebook.github.io/react-native/docs/testing.html

[travis]: https://travis-ci.org/facebook/react-native
[circle]: http://circleci.com/gh/facebook/react-native

#### Copyright Notice for files

Copy and paste this to the top of your new file(s):

```JS
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
```

If you've added a new module, add a `@providesModule <moduleName>` at the end of the comment. This will allow the haste package manager to find it.

### Contributor License Agreement (CLA)

In order to accept your pull request, we need you to submit a CLA. You only need to do this once, so if you've done this for another Facebook open source project, you're good to go. If you are submitting a pull request for the first time, just let us know that you have completed the CLA and we can cross-check with your GitHub username.

Complete your CLA here: https://code.facebook.com/cla

## Bugs

We use GitHub Issues exclusively for tracking bugs in React Native. Questions and feature requests are tracked elsewhere:

  - Have a question? Ask on Stack Overflow: http://stackoverflow.com/questions/tagged/react-native
  - If you have a question regarding future plans, check out the roadmap: https://github.com/facebook/react-native/wiki/Roadmap
  - Have a feature request that is not covered in the roadmap? Submit it here: https://react-native.canny.io/feature-requests

### Reporting Bugs

The best way to get your bug fixed is to provide a reduced test case. Please provide either a [Sketch](https://sketch.expo.io/) or a public repository with a runnable example.

Please report a single bug per issue. Always provide reproduction steps. You can use Snack in many cases to demonstrate an issue: https://snack.expo.io/. If the bug cannot be reproduced using Snack, verify that the issue can be reproduced locally by targeting the latest release candidate. Ideally, check if the issue is present in master as well.

Do not forget to include sample code that reproduces the issue. Only open issues for bugs affecting either the latest stable release, or the current release candidate, or master (see http://facebook.github.io/react-native/versions.html). If it is not clear from your report that the issue can be reproduced in one of these releases, your issue will be closed.

We're not able to provide support through GitHub Issues. If you're looking for help with your code, consider asking on Stack Overflow:  http://stackoverflow.com/questions/tagged/react-native

### Security Bugs

Facebook has a [bounty program](https://www.facebook.com/whitehat/) for the safe disclosure of security bugs. With that in mind, please do not file public issues; go through the process outlined on that page.

## How to Get Help

Refer to the official [React Native docs](https://facebook.github.io/react-native) to learn more about using React Native. The Getting Started Guide is a good place to start.

Many React Native users are active on Stack Overflow. Browse
[existing questions](http://stackoverflow.com/questions/tagged/react-native), or ask your own technical question.

If you have an open-ended question or you just want to get a general sense of what React Native folks talk about, check out the [React Native Community](https://www.facebook.com/groups/react.native.community) Facebook group. It has thousands of developers and almost all posts get a response.

If you need an answer right away, check out the [#react-native](https://discord.gg/0ZcbPKXt5bZjGY5n) channel. There are usually a number of React Native experts there who can help out or point you to somewhere you might want to look.

The React Native team sends out periodical updates through the following channels:

* [Blog](https://facebook.github.io/react-native/blog/)
* [Twitter](https://www.twitter.com/reactnative)

## Style Guide

### Code

#### General

* **Most important: Look around.** Match the style you see used in the rest of the project. This includes formatting, naming things in code, naming things in documentation.
* Add trailing commas,
* 2 spaces for indentation (no tabs)
* "Attractive"

#### JavaScript

* Use semicolons;
* `'use strict';`
* Prefer `'` over `"`
* Do not use the optional parameters of `setTimeout` and `setInterval`
* 80 character line length

#### JSX

* Prefer `"` over `'` for string literal props
* When wrapping opening tags over multiple lines, place one prop per line
* `{}` of props should hug their values (no spaces)
* Place the closing `>` of opening tags on the same line as the last prop
* Place the closing `/>` of self-closing tags on their own line and left-align them with the opening `<`

#### Objective-C

* Space after `@property` declarations
* Brackets on *every* `if`, on the *same* line
* `- method`, `@interface`, and `@implementation` brackets on the following line
* *Try* to keep it around 80 characters line length (sometimes it's just not possible...)
* `*` operator goes with the variable name (e.g. `NSObject *variableName;`)

#### Java

* If a method call spans multiple lines closing bracket is on the same line as the last argument.
* If a method header doesn't fit on one line each argument goes on a separate line.
* 100 character line length

### Documentation

* Do not wrap lines at 80 characters - configure your editor to soft-wrap when editing documentation.

## License

By contributing to React Native, you agree that your contributions will be licensed under its BSD license.
