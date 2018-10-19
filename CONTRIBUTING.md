# Contributing to React Native

We want to make contributing to this project as easy and transparent as possible. Read on to learn more about our development process and how to propose bug fixes and improvements. The [How to Contribute](https://facebook.github.io/react-native/docs/contributing.html) guide on the website goes into more detail for each of these areas.

## Our Development Process

Most changes from engineers at Facebook will sync to [GitHub](https://github.com/facebook/react-native) through a bridge with Facebook's internal source control. Changes from the community are handled through GitHub pull requests. Once a change made on GitHub is approved, it will first be imported into Facebook's internal source control. The change will eventually sync back to GitHub as a single commit once it has passed Facebook's internal tests.

## Pull Requests

Please make sure the following is done when submitting a pull request:

1. Fork the repo and create your branch from `master`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. If you haven't already, complete the Contributor License Agreement ("CLA").

## Contributor License Agreement ("CLA")

In order to accept your pull request, we need you to submit a CLA. You only need to do this once to work on any of Facebook's open source projects.

Complete your CLA here: <https://code.facebook.com/cla>

## Issues

We use GitHub issues to track public bugs. Please ensure your description is clear and has sufficient instructions to be able to reproduce the issue.

Facebook has a [bounty program](https://www.facebook.com/whitehat/) for the safe disclosure of security bugs. In those cases, please go through the process outlined on that page and do not file a public issue.

## Coding Style

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

## License

By contributing to React Native, you agree that your contributions will be licensed
under the LICENSE file in the root directory of this source tree.
