## Tips on reviewing pull requests

Does the PR miss info required in the [Pull request template](https://github.com/facebook/react-native/blob/master/PULL_REQUEST_TEMPLATE.md)? Example: [#6395](https://github.com/facebook/react-native/pull/6395). Add labels 'Needs revision' and 'Needs response from author'. Add a response like:

> Hey @author, thanks for sending the pull request.
> Can you please add all the info specified in the [template](https://github.com/facebook/react-native/blob/master/PULL_REQUEST_TEMPLATE.md)? This is necessary for people to be able to understand and review your pull request.

Does the code style match the [Style guide](https://github.com/facebook/react-native/blob/master/CONTRIBUTING.md#style-guide), especially consistency (formatting, naming) with the rest of the codebase? If not, link to the style guide and add the label 'Needs revision'.

Does the pull request add a completely new feature we don't want to add to the core and maintain? Ask the author to release it a separate npm module and close the PR. Example: [#2648](https://github.com/facebook/react-native/pull/2648).

Does the pull request do several unrelated things at the same time? Ask the author to split it.