# Contributing to React Native

Thank you for your interest in contributing to React Native! From commenting on and triaging issues, to reviewing and sending Pull Requests, all contributions are welcome. We aim to build a vibrant and inclusive [ecosystem of partners, core contributors, and community](ECOSYSTEM.md) that goes beyond the main React Native GitHub repository.

The [Open Source Guides](https://opensource.guide/) website has a collection of resources for individuals, communities, and companies who want to learn how to run and contribute to an open source project. Contributors and people new to open source alike will find the following guides especially useful:

* [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
* [Building Welcoming Communities](https://opensource.guide/building-community/)


### [Code of Conduct](https://code.fb.com/codeofconduct/)

As a reminder, all contributors are expected to adhere to the [Code of Conduct](https://code.facebook.com/codeofconduct).

## Ways to Contribute

If you are eager to start contributing code right away, we have a list of [good first issues](https://github.com/facebook/react-native/labels/good%20first%20issue) that contain bugs which have a relatively limited scope. As you gain more experience and demonstrate a commitment to evolving React Native, you may be granted issue management permissions in the repository.

There are other ways you can contribute without writing a single line of code. Here are a few things you can do to help out:

1. **Replying and handling open issues.** We get a lot of issues every day, and some of them may lack necessary information. You can help out by guiding people through the process of filling out the issue template, asking for clarifying information, or pointing them to existing issues that match their description of the problem. We cover more about this process in the [Issue Triage wiki](https://github.com/facebook/react-native/wiki/Issues#triage).
2. **Reviewing pull requests for the docs.** Reviewing [documentation updates](https://github.com/facebook/react-native-website/pulls) can be as simple as checking for spelling and grammar. If you encounter situations that can be explained better in the docs, click **Edit** at the top of most docs pages to get started with your own contribution.
3. **Help people write test plans.** Some pull requests sent to the main repository may lack a proper test plan. These help reviewers understand how the change was tested, and can speed up the time it takes for a contribution to be accepted.

Each of these tasks is highly impactful, and maintainers will greatly appreciate your help.

### Our Development Process

We use GitHub issues and pull requests to keep track of bug reports and contributions from the community. All changes from engineers at Facebook will sync to [GitHub](https://github.com/facebook/react-native) through a bridge with Facebook's internal source control. Changes from the community are handled through GitHub pull requests. Once a change made on GitHub is approved, it will first be imported into Facebook's internal source control and tested against Facebook's codebase. Once merged at Facebook, the change will eventually sync back to GitHub as a single commit once it has passed Facebook's internal tests.

You can learn more about the contribution process in the following documents:

* [Issues](https://github.com/facebook/react-native/wiki/Issues)
* [Pull Requests](https://github.com/facebook/react-native/wiki/Pull-Requests)

We also have a thriving community of contributors who would be happy to help you get set up. You can reach out to us through [@ReactNative](http://twitter.com/reactnative) (the React Native team) and [@ReactNativeComm](http://twitter.com/reactnativecomm) (the React Native Community organization).

### Repositories

The main repository, <https://github.com/facebook/react-native>, contains the React Native framework itself and it is here where we keep track of bug reports and manage pull requests.

There are a few other repositories you might want to familiarize yourself with:

* **React Native website** which contains the source code for the website, including the documentation, located at <https://github.com/facebook/react-native-website>
* **Releases** are coordinated through the <https://github.com/react-native-community/react-native-releases> repository. This includes important documents such as the Changelog.
* **Discussions** about the future of React Native take place in the <https://github.com/react-native-community/discussions-and-proposals> repository.
* **High-quality plugins** for React Native can be found throughout the [React Native Community GitHub Organization](http://github.com/react-native-community/).

Browsing through these repositories should provide some insight into how the React Native open source project is managed.

## GitHub Issues

We use GitHub issues to track bugs exclusively. We have documented our issue handling processes in the [Issues wiki](https://github.com/facebook/react-native/wiki/Issues).

### Security Bugs

Facebook has a [bounty program](https://www.facebook.com/whitehat/) for the safe disclosure of security bugs. In those cases, please go through the process outlined on that page and do not file a public issue.

## Helping with Documentation

The React Native documentation is hosted as part of the React Native website repository at https://github.com/facebook/react-native-website. The website itself is located at <https://facebook.github.io/react-native> and it is built using [Docusaurus](https://docusaurus.io/). If there's anything you'd like to change in the docs, you can get started by clicking on the "Edit" button located on the upper right of most pages in the website.

If you are adding new functionality or introducing a change in behavior, we will ask you to update the documentation to reflect your changes.

### Contributing to the Blog

The React Native blog is generated [from the Markdown sources for the blog](https://github.com/facebook/react-native-website/tree/master/website/blog).

Please open an issue in the https://github.com/facebook/react-native-website repository or tag us on [@ReactNative on Twitter](http://twitter.com/reactnative) and get the go-ahead from a maintainer before writing an article intended for the React Native blog. In most cases, you might want to share your article on your own blog or writing medium instead. It's worth asking, though, in case we find your article is a good fit for the blog.

We recommend referring to the [CONTRIBUTING](https://github.com/facebook/react-native-website/blob/master/CONTRIBUTING.md) document for the `react-native-website` repository to learn more about contributing to the website in general.

## Contributing Code

Code-level contributions to React Native generally come in the form of [pull requests](https://help.github.com/en/articles/about-pull-requests). The process of proposing a change to React Native can be summarized as follows:

1. Fork the React Native repository and create your branch from `master`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes, either locally or on CI once you opened a pull request.
5. Make sure your code lints (for example via `yarn lint --fix`).
6. Push the changes to your fork.
7. Create a pull request to the React Native repository.
8. Review and address comments on your pull request.
    1. A bot may comment with suggestions. Generally we ask you to resolve these first before a maintainer will review your code.
9. If you haven't already, complete the Contributor License Agreement ("CLA").

If all goes well, your pull request will be merged. If it is not merged, maintainers will do their best to explain the reason why.

### Step-by-step Guide

Whenever you are ready to contribute code, check out our [step-by-step guide to sending your first pull request](https://github.com/facebook/react-native/wiki/Pull-Requests#getting-ready-to-submit-your-first-pull-request), or read the [How to Contribute Code](https://github.com/facebook/react-native/wiki/How-to-Contribute) wiki for more details.

### Tests

Tests help us prevent regressions from being introduced to the codebase. The GitHub repository is continuously tested using Circle and Appveyor, the results of which are available through the Checks functionality on [commits](https://github.com/facebook/react-native/commits/master) and pull requests. You can learn more about running and writing tests in the [Tests wiki](http://github.com/facebook/react-native/wiki/Tests).

## Community Contributions

Contributions to React Native are not limited to GitHub. You can help others by sharing your experience using React Native, whether that is through blog posts, presenting talks at conferences, or simply sharing your thoughts on Twitter and tagging @ReactNative.

## Where to Get Help

As you work on React Native, it is natural that sooner or later you may require help. In addition to the resources listed in [SUPPORT](.github/SUPPORT.md), people interested in contributing may take advantage of the following:

* **Twitter**. The React Native team at Facebook has its own account at [@reactnative](https://twitter.com/reactnative), and the React Native Community uses [@reactnativecomm](https://twitter.com/reactnativecomm). If you feel stuck, or need help contributing, please do not hesitate to reach out.
* **Proposals Repository**. If you are considering working on a feature large in scope, consider [creating a proposal first](https://github.com/react-native-community/discussions-and-proposals). The community can help you figure out the right approach, and we'd be happy to help.
* **React Native Community Discord**. While we try to hold most discussions in public, sometimes it can be beneficial to have conversations in real time with other contributors. People who have demonstrated a commitment to moving React Native forward through sustained contributions to the project may eventually be invited to join the React Native Community Discord.
