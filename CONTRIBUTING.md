# Contributing to React Native

Thank you for your interest in contributing to React Native! From commenting on and triaging issues, to reviewing and sending PRs, all contributions are welcome.

[Open Source Guides][gh-oss-guide] are a collection of resources for individuals, communities, and companies who want to learn how to run and contribute to an open source project. Contributors and people new to open source alike will find the following guides useful:

- [How to Contribute to Open Source][gh-how-to-contribute]
- [Building Welcoming Communities][gh-building-community]

[gh-oss-guide]: https://opensource.guide/
[gh-how-to-contribute]: https://opensource.guide/how-to-contribute/
[gh-building-community]: https://opensource.guide/building-community/

### [Code of Conduct][conduct]

As a reminder, all contributors are expected to adhere to the [Code of Conduct][conduct].

[conduct]: https://code.facebook.com/codeofconduct

## Ways to Contribute

If you are eager to start contributing code right away, we have a list of [good first issues][gfi] that contain bugs which have a relatively limited scope. As you gain more experience and demonstrate a commitment to evolving React Native, you may be granted issue management permissions in the main repository.

There are other ways you can contribute without writing a single line of code. Here's a sample of things you can do to help out:

1. **Replying and handling open issues.** We get a lot of issues every day, and some of them may lack necessary information. You can help out by guiding people through the process of filling out the issue template, asking for clarifying information, or pointing them to existing issues that match their description of the problem. We'll cover more about this process later, in [**Triaging Issues**](#triaging-issues).

2. **Reviewing pull requests for the docs.** Reviewing [documentation updates][docs-prs] can be as simple as checking for spelling and grammar. If you encounter sitations that can be explained better in the docs, click **Edit** at the top of most docs pages to get started with your own contribution.

3. **Help people write test plans.** Some pull requests sent to the main repository [may lack a proper test plan][pr-no-test-plan]. These help reviewers understand how the change was tested, and can speed up the time it takes for a contribution to be accepted.

Each of these tasks is highly impactful, and maintainers will appreciate your help.

[gfi]: https://github.com/facebook/react-native/labels/good%20first%20issue
[docs-prs]: https://github.com/facebook/react-native-website/pulls
[pr-no-test-plan]: https://github.com/facebook/react-native/pulls?utf8=%E2%9C%93&q=is%3Aopen+is%3Apr+-label%3A%22PR%3A+Includes+Test+Plan%22+
<!-- END: Ways to Contribute -->


### Our Development Process

Most changes from engineers at Facebook will sync to [GitHub][facebook/react-native] through a bridge with Facebook's internal source control. Changes from the community are handled through GitHub pull requests. Once a change made on GitHub is approved, it will first be imported into Facebook's internal source control. The change will eventually sync back to GitHub as a single commit once it has passed Facebook's internal tests.

[facebook/react-native]: https://github.com/facebook/react-native
<!-- END: Development Process -->

### Repositories
The main repository, <https://github.com/facebook/react-native>, contains the core React Native framework, and it is here where we keep track of bug reports and manage pull requests.

There's a few other repositories you might want to familiarize yourself with:

- The source code for the **React Native website**, including the documentation, is located at <https://github.com/facebook/react-native-website>
- **Releases** are coordinated through the <https://github.com/react-native-community/react-native-releases> repository. This includes important documents such as the Changelog.
- **Discussions** about the future of React Native take place in the <https://github.com/react-native-community/discussions-and-proposals> repository.

Browsing through these repositories should provide some insight into how the React Native open source project is managed.
<!-- END: Repositories. -->

<!-- START: GitHub Issues -->
# GitHub Issues

We use GitHub issues to track public bugs. Please ensure your description is clear and has sufficient instructions to be able to reproduce the issue.

## Security Bugs

Facebook has a [bounty program](https://www.facebook.com/whitehat/) for the safe disclosure of security bugs. In those cases, please go through the process outlined on that page and do not file a public issue.
<!-- END: GitHub Issues -->

<!-- START: Code Contributions -->
# Code Contributions

- [Step-by-step Guide](#step-by-step-guide)
- [Style Guide](#style-guide)
- [Testing your Changes](#tests)

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

## Style Guide

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

## Tests

Tests help us prevent regressions from being introduced to the codebase. The GitHub repository is continuously tested using Circle and Appveyor, the results of which are available through the Checks functionality on [commits](https://github.com/facebook/react-native/commits/master) and pull requests. You can learn more about running and writing tests in the [Tests wiki](http://github.com/facebook/react-native/wiki/Tests).

<!-- END: Code Contributions -->

<!-- START: Where to Get Help -->
# Where to Get Help

As you work on React Native, it is natural that sooner or later you may require help. In addition to the resources listed in [SUPPORT][support], people interested in contributing may take advantage of the following:

* **Twitter**. The React Native team at Facebook has its own account at [**@reactnative**][at-reactnative], and the React Native Community uses [**@reactnativecomm**][at-reactnativecomm]. If you are stuck, or need help contributing, please do not hesitate to reach out.

* **Proposals Repository**. If you are considering working on a feature large in scope, consider [creating a proposal first][meta]. The community is highly willing to help you figure out the right approach, and we'd be happy to help.

* **React Native Community Discord**. While we try to hold most discussions in public, sometimes it can be beneficial to have conversations in real time with other contributors. People who have demonstrated a commitment to moving React Native forward through sustained contributions to the project may eventually be invited to join the React Native Community Discord.

[at-reactnative]: https://twitter.com/reactnative
[at-reactnativecomm]: https://twitter.com/reactnativecomm
[support]: http://github.com/facebook/react-native/blob/master/.github/SUPPORT.md
[meta]: https://github.com/react-native-community/discussions-and-proposals
<!-- END: Where to Get Help -->
