/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = async (github, context, labelWithContext) => {
  const closeIssue = async () => {
    await github.rest.issues.update({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      state: 'closed',
    });
  };

  const addComment = async comment => {
    await github.rest.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: comment,
    });
  };

  const requestAuthorFeedback = async () => {
    // Remove the triage label if it exists (ignore the 404 if not; it's not expected to always be there)
    try {
      await github.rest.issues.removeLabel({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        name: 'Needs: Triage :mag:',
      });
    } catch {}

    await github.rest.issues.addLabels({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      labels: ['Needs: Author Feedback'],
    });
  };

  switch (labelWithContext.label) {
    case 'Type: Invalid':
      await addComment(
        `| :warning: | Issue is Invalid |\n` +
          `| --- | --- |\n` +
          `| :information_source: | This issue doesn't match any of the expected types for this repository - closing. |`,
      );
      await closeIssue();
      return;
    case 'Type: Question':
      await addComment(
        `| :warning: | Issue is a Question |\n` +
          `| --- | --- |\n` +
          `| :information_source: | We are using GitHub issues exclusively to track bugs in React Native. GitHub may not be the ideal place to ask a question, but you can try asking over on [Stack Overflow](http://stackoverflow.com/questions/tagged/react-native), or on [Reactiflux](https://www.reactiflux.com/). |`,
      );
      await closeIssue();
      return;
    case 'Type: Docs':
      await addComment(
        `| :warning: | Documentation Issue |\n` +
          `| --- | --- |\n` +
          `| :information_source: | Please report documentation issues in the [react-native-website](https://github.com/facebook/react-native-website/issues) repository. |`,
      );
      await closeIssue();
      return;
    case 'Resolution: For Stack Overflow':
      await addComment(
        `| :warning: | Issue is a Question |\n` +
          `| --- | --- |\n` +
          `| :information_source: | We are using GitHub issues exclusively to track bugs in the core React Native library. Please try asking over on [Stack Overflow](http://stackoverflow.com/questions/tagged/react-native) as it is better suited for this type of question. |`,
      );
      await closeIssue();
      return;
    case 'Type: Expo':
      await addComment(
        `| :warning: | Issue is Related to Expo |\n` +
          `| --- | --- |\n` +
          `| :information_source: | It looks like your issue is related to Expo and not React Native core. Please open your issue in [Expo's repository](https://github.com/expo/expo/issues/new). If you are able to create a repro that showcases that this issue is also happening in React Native vanilla, we will be happy to re-open. |`,
      );
      await closeIssue();
      return;
    case 'Needs: Issue Template':
      await addComment(
        `| :warning: | Missing Required Fields |\n` +
          `| --- | --- |\n` +
          `| :information_source: | It looks like your issue may be missing some necessary information. GitHub provides an example template whenever a [new issue is created](https://github.com/facebook/react-native/issues/new?template=bug_report.md). Could you go back and make sure to fill out the template? You may edit this issue, or close it and open a new one. |`,
      );
      await requestAuthorFeedback();
      return;
    case 'Needs: Environment Info':
      await addComment(
        `| :warning: | Missing Environment Information |\n` +
          `| --- | --- |\n` +
          `| :information_source: | Your issue may be missing information about your development environment. You can obtain the missing information by running <code>react-native info</code> in a console. |`,
      );
      await requestAuthorFeedback();
      return;
    case 'Newer Patch Available':
      await addComment(
        `| :warning: | Newer Version of React Native is Available! |\n` +
          `| --- | --- |\n` +
          `| :information_source: | You are on a supported minor version, but it looks like there's a newer patch available - ${labelWithContext.newestPatch}. Please [upgrade](https://reactnative.dev/docs/upgrading) to the highest patch for your minor or latest and verify if the issue persists (alternatively, create a new project and repro the issue in it). If it does not repro, please let us know so we can close out this issue. This helps us ensure we are looking at issues that still exist in the most recent releases. |`,
      );
      return;
    case 'Needs: Version Info':
      await addComment(
        `| :warning: | Add or Reformat Version Info |\n` +
          `| --- | --- |\n` +
          `| :information_source: | We could not find or parse the version number of React Native in your issue report. Please use the template, and report your version including major, minor, and patch numbers - e.g. 0.70.2 |`,
      );
      await requestAuthorFeedback();
      return;
    case 'Needs: Repro':
      await addComment(
        `| :warning: | Missing Reproducible Example |\n` +
          `| --- | --- |\n` +
          `| :information_source: | We could not detect a reproducible example in your issue report. Please provide either: <br /><ul><li>If your bug is UI related: a [Snack](https://snack.expo.dev)</li><li> If your bug is build/update related: use our [Reproducer Template](https://github.com/react-native-community/reproducer-react-native/generate)</li></ul> |`,
      );
      await requestAuthorFeedback();
      return;
    case 'Type: Unsupported Version':
      await addComment(
        `| :warning: | Unsupported Version of React Native |\n` +
          `| --- | --- |\n` +
          `| :information_source: | It looks like your issue or the example you provided uses an [unsupported version of React Native](https://github.com/reactwg/react-native-releases/blob/main/README.md#releases-support-policy).<br/><br/>Due to the number of issues we receive, we're currently only accepting new issues against one of the supported versions. Please [upgrade](https://reactnative.dev/docs/upgrading) to latest and verify if the issue persists (alternatively, create a new project and repro the issue in it). If you cannot upgrade, please open your issue on [StackOverflow](https://stackoverflow.com/questions/tagged/react-native) to get further community support. |`,
      );
      await requestAuthorFeedback();
      return;
    case 'Type: Too Old Version':
      await addComment(
        `| :warning: | Too Old Version of React Native |\n` +
          `| --- | --- |\n` +
          `| :information_source: | It looks like your issue or the example you provided uses a [**Too Old Version of React Native**](https://github.com/reactwg/react-native-releases/blob/main/README.md#releases-support-policy).<br/><br/>Due to the number of issues we receive, we're currently only accepting new issues against one of the supported versions. Please [upgrade](https://reactnative.dev/docs/upgrading) to latest and verify if the issue persists (alternatively, create a new project and repro the issue in it). If you cannot upgrade, please open your issue on [StackOverflow](https://stackoverflow.com/questions/tagged/react-native) to get further community support. |`,
      );
      await closeIssue();
      return;
    default:
      // No action needed
      return;
  }
};
