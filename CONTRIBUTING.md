# Contributing to React Native

React Native is one of Facebook's first open source projects that is both under very active development and is also being used to ship code to everybody on [facebook.com](https://facebook.com). We're still working out the kinks to make contributing to this project as easy and transparent as possible, but we're not quite there yet. Hopefully this document makes the process for contributing clear and preempts some questions you may have.

## Our Development Process

Some of the core team will be working directly on GitHub. These changes will be public from the beginning. Other changesets will come via a bridge with Facebook's internal source control. This is a necessity as it allows engineers at Facebook outside of the core team to move fast and contribute from an environment they are comfortable in.

### `master` is unsafe

We will do our best to keep `master` in good shape, with tests passing at all times. But in order to move fast, we will make API changes that your application might not be compatible with. We will do our best to communicate these changes and version appropriately so you can lock into a specific version if need be.

### Pull Requests

The core team will be monitoring for pull requests. When we get one, we'll run some Facebook-specific integration tests on it first. From here, we'll need to get another person to sign off on the changes and then merge the pull request. For API changes we may need to fix internal uses, which could cause some delay. We'll do our best to provide updates and feedback throughout the process.

**Please submit your pull request on the `master` branch**. If the fix is critical and should be included in a stable branch please mention it and it will be cherry picked into it by a project maintainer.

*Before* submitting a pull request, please make sure the following is done…

1. Fork the repo and create your branch from `master`.
2. **Describe your test plan in your commit.**
  - If you've added code that should be tested, add tests!
  - If you've changed APIs, update the documentation.
  - If you've updated the docs, verify the website locally and submit screenshots if applicable.

  ```
  $ cd website
  $ npm install && npm start
  Open the following in your browser: http://localhost:8079/react-native/index.html
  ```

3. Add the copyright notice to the top of any new files you've added.
4. Ensure tests pass on Travis and Circle CI.
5. Make sure your code lints (`node linter.js <files touched>`).
6. If you haven't already, sign the [CLA](https://code.facebook.com/cla).
7. Squash your commits (`git rebase -i`).
   One intent alongside one commit makes it clearer for people to review and easier to understand your intention.

> **Note:** It is not necessary to keep clicking `Merge master to your branch` on the PR page. You would want to merge master if there are conflicts or tests are failing. The Facebook-GitHub-Bot ultimately squashes all commits to a single one before merging your PR.

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

[Complete your CLA here](https://code.facebook.com/cla)

## Bugs

### Where to Find Known Issues

We are using GitHub Issues for our public bugs. We keep a close eye on this and try to make it clear when we have an internal fix in progress. Before filing a new task, try to make sure your problem doesn't already exist.

### Reporting New Issues

The best way to get your bug fixed is to provide a reduced test case. Please provide either a public repository with a runnable example or a [Sketch](https://sketch.expo.io/).

### Security Bugs

Facebook has a [bounty program](https://www.facebook.com/whitehat/) for the safe disclosure of security bugs. With that in mind, please do not file public issues; go through the process outlined on that page.

## How to Get in Touch

* [Facebook](https://www.facebook.com/groups/react.native.community/)
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
