---
id: contributing
title: How to Contribute
layout: docs
category: Guides
permalink: docs/contributing.html
next: testing
previous: upgrading
---

React Native is one of Facebook's first open source projects that is both under very active development and is also being used to ship code to everybody using Facebook's mobile apps. We're still working out the kinks to make contributing to this project as easy and transparent as possible, but we're not quite there yet. Hopefully this document makes the process for contributing clear and preempts some questions you may have.

## Code of Conduct

Facebook has adopted a Code of Conduct that we expect project participants to adhere to. Please read [the full text](https://code.facebook.com/codeofconduct) so that you can understand what actions will and will not be tolerated.

## Our Development Process

Some of the core team will be working directly on [GitHub](https://github.com/facebook/react-native). These changes will be public from the beginning. Other changesets will come via a bridge with Facebook's internal source control. This is a necessity as it allows engineers at Facebook outside of the core team to move fast and contribute from an environment they are comfortable in.

## Branch Organization

We will do our best to keep `master` in good shape, with tests passing at all times. But in order to move fast, we will make API changes that your application might not be compatible with. We will do our best to [communicate these changes](https://github.com/facebook/react-native/releases) and version appropriately so you can lock into a specific version if need be.

To see what changes are coming and provide better feedback to React Native contributors, use the [latest release candidate](http://facebook.github.io/react-native/versions.html) when possible. By the time a release candidate is released, the changes it contains will have been shipped in production Facebook apps for over two weeks.

## Bugs

### Where to Find Known Issues

We are using [GitHub Issues](https://github.com/facebook/react-native/issues) for our public bugs. Before filing a new task, try to make sure your problem doesn't already exist.

Questions and feature requests are tracked elsewhere:

  - Have a question? [Ask on Stack Overflow](http://stackoverflow.com/questions/tagged/react-native).
  - If you have a question regarding future plans, check out the [roadmap](https://github.com/facebook/react-native/wiki/Roadmap).
  - Have a feature request that is not covered in the roadmap? [Add it here](https://react-native.canny.io/feature-requests).

### Reporting New Issues

The best way to get your bug fixed is to provide a reduced test case. Please provide either a [Snack](https://snack.expo.io/) or a public repository with a runnable example.

Please report a single bug per issue. Always provide reproduction steps. You can use [Snack](https://snack.expo.io/) in many cases to demonstrate an issue. If the bug cannot be reproduced using Snack, verify that the issue can be reproduced locally by targeting the latest release candidate. Ideally, check if the issue is present in `master` as well.

Do not forget to include sample code that reproduces the issue. Only open issues for bugs affecting either the latest stable release, or the current release candidate, or master (see the [list of versions](http://facebook.github.io/react-native/versions.html)). If it is not clear from your report that the issue can be reproduced in one of these releases, your issue will be closed.

We're not able to provide support through GitHub Issues. If you're looking for help with your code, consider asking on [Stack Overflow](http://stackoverflow.com/questions/tagged/react-native).

### Security Bugs

Facebook has a [bounty program](https://www.facebook.com/whitehat/) for the safe disclosure of security bugs. With that in mind, please do not file public issues; go through the process outlined on that page.

## Triaging issues and pull requests

One great way you can contribute to the project without writing any code is to help triage issues and pull requests as they come in. Ask for more information if the issue does not provide all the details required by the template. Suggest [labels](https://github.com/facebook/react-native/labels). Flag issues that are stale or that should be closed. Ask for test plans and review code.

Adding labels, closing and reopening issues, and merging pull requests is, as you may expect, limited to a subset of contributors. Simply commenting on the issue or pull request can still go a long way towards helping us keep the number of outstanding issues under control.

### Using the Facebook GitHub Bot

The Facebook GitHub Bot allows certain active members of the community to perform administrative actions such as labeling and closing issues. The list of community members with this kind of access can be found at the top of [`IssueCommands.txt`](https://github.com/facebook/react-native/blob/master/bots/IssueCommands.txt). The bot can be triggered by adding any of the following commands as a standalone comment on an issue:

- `@facebook-github-bot close`: **Closes** an issue without providing a particular explanation.
- `@facebook-github-bot label (.*)`: Use this command to add a [label](https://github.com/facebook/react-native/labels), such as "iOS" or "Android", to an issue.
- `@facebook-github-bot duplicate (#[0-9]+)`: Marks an issue as a duplicate. Requires a issue number to be provided. The bot will **close** the issue.
- `@facebook-github-bot stack-overflow`: Mark issues that do not belong in the bug tracker, and redirect to Stack Overflow. The bot will **close** the issue after adding the _For Stack Overflow_ label.
- `@facebook-github-bot feature`: Use this when an issue describes a feature request, as opposed to a reproducible bug. The bot will point the author to the feature request tracker, add the _Feature Request_ label, then **close** the issue.
- `@facebook-github-bot expected`: Use this when an issue describes a type of expected behavior. The bot will **close** the issue.
- `@facebook-github-bot answered`: Use this when an issue appears to be a question that has already been answered by someone on the thread. The bot will **close** the issue.
- `@facebook-github-bot no-reply`: Use this when an issue requires more information from the author but they have not added a comment in over two weeks. The bot will **close** the issue.
- `@facebook-github-bot reopen`: **Re-opens** a previously closed issue.
- `@facebook-github-bot bugfix`: Mark issues that describe a reproducible bug. The bot will prompt the author to submit a pull request with a fix.
- `@facebook-github-bot icebox`: Use this when an issue has been open for over 30 days with no activity. The bot will **close** the issue after adding the _Icebox_ label.

Additionally, the following commands can be used on a pull request:

- `@facebook-github-bot cla`: Remind the author that the CLA needs to be signed.
- `@facebook-github-bot shipit`: Flag the PR for merging. If used by a core contributor, the bot will attempt to import the pull request. In general, core contributors are those who have consistently submitted high quality contributions to the project.

## How to Get in Touch

Many React Native users are active on [Stack Overflow](http://stackoverflow.com/questions/tagged/react-native). If you  want to get a general sense of what React Native folks talk about, check out the [React Native Community](https://www.facebook.com/groups/react.native.community) Facebook group. There is also [an active community of React and React Native users on the Discord chat platform](https://discord.gg/0ZcbPKXt5bZjGY5n) in case you need help.

The React Native team sends out periodical updates through the following channels:

* [React Native Blog](https://facebook.github.io/react-native/blog/)
* [@ReactNative on Twitter](https://www.twitter.com/reactnative)

Core contributors to React Native meet monthly and post their meeting notes on the React Native blog. You can also find ad hoc discussions in the [React Native Core Contributors](https://www.facebook.com/groups/reactnativeoss/) Facebook group.

## Proposing a Change

If you intend to change the public API, or make any non-trivial changes to the implementation, we recommend [filing an issue](https://github.com/facebook/react-native/issues/new). This lets us reach an agreement on your proposal before you put significant effort into it.

If you're only fixing a bug, it's fine to submit a pull request right away but we still recommend to file an issue detailing what you're fixing. This is helpful in case we don't accept that specific fix but want to keep track of the issue.

## Pull Requests

### Your First Pull Request

Working on your first Pull Request? You can learn how from this free video series:

[**How to Contribute to an Open Source Project on GitHub**](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github)

To help you get your feet wet and get you familiar with our contribution process, we have a list of [beginner friendly issues](https://github.com/facebook/react-native/labels/Good%20First%20Task) that contain bugs which are fairly easy to fix. This is a great place to get started.

If you decide to fix an issue, please be sure to check the comment thread in case somebody is already working on a fix. If nobody is working on it at the moment, please leave a comment stating that you intend to work on it so other people don't accidentally duplicate your effort.

If somebody claims an issue but doesn't follow up for more than two weeks, it's fine to take over it but you should still leave a comment.

### Sending a Pull Request

If you send a pull request, please do it against the master branch. We maintain stable branches for stable releases separately but we don't accept pull requests to them directly. Instead, we cherry-pick non-breaking changes from master to the latest stable version.

The core team will be monitoring for pull requests. When we get one, we'll run some Facebook-specific integration tests on it first. From here, we'll need to get another person to sign off on the changes and then merge the pull request. For API changes we may need to fix internal uses, which could cause some delay. We'll do our best to provide updates and feedback throughout the process.

Small pull requests are much easier to review and more likely to get merged. Make sure the PR does only one thing, otherwise please split it.

**Before submitting a pull request**, please make sure the following is done…

1. Fork [the repository](https://github.com/facebook/react-native) and create your branch from `master`.
2. Add the copyright notice to the top of any new files you've added.
3. Describe your **test plan** in your commit.
4. Ensure **tests pass** on both Travis and Circle CI.
5. Make sure your code lints (`node linter.js <files touched>`).
6. If you haven't already, [sign the CLA](https://code.facebook.com/cla).

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

You can learn more about running tests and contributing to React Native [next](docs/testing.html).

[travis]: https://travis-ci.org/facebook/react-native
[circle]: http://circleci.com/gh/facebook/react-native

#### Breaking changes

When adding a new breaking change, follow this template in your pull request:

```
### New breaking change here

- **Who does this affect**:
- **How to migrate**:
- **Why make this breaking change**:
- **Severity (number of people affected x effort)**:
```

If your pull request is merged, a core contributor will update the [list of breaking changes](https://github.com/facebook/react-native/wiki/Breaking-Changes) which is then used to populate the release notes.

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

## Style Guide

Our linter will catch most styling issues that may exist in your code. You can check the status of your code styling by simply running `node linter.js <files touched>`.

However, there are still some styles that the linter cannot pick up.

### Code Conventions

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

## What Next?

Read the [next section](docs/testing.html) to learn how to test your changes.
