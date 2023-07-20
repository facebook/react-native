/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const NEEDS_REPRO_LABEL = 'Needs: Repro';
const NEEDS_REPRO_HEADER = 'Missing Reproducible Example';
const NEEDS_REPRO_MESSAGE =
  `| :warning: | Missing Reproducible Example |\n` +
  `| --- | --- |\n` +
  `| :information_source: | We could not detect a reproducible example in your issue report. Please provide either: <br /><ul><li>If your bug is UI related: a [Snack](https://snack.expo.dev)</li><li> If your bug is build/update related: use our [Reproducer Template](https://github.com/react-native-community/reproducer-react-native/generate). A reproducer needs to be in a GitHub repository under your username.</li></ul> |`;

module.exports = async (github, context) => {
  const issueData = {
    issue_number: context.payload.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
  };

  const issue = await github.rest.issues.get(issueData);
  const comments = await github.rest.issues.listComments(issueData);

  const botComment = comments.data.find(comment =>
    comment.body.includes(NEEDS_REPRO_HEADER),
  );

  let commentBodies = comments.data.map(comment => comment.body);
  if (botComment) {
    commentBodies = commentBodies.filter(body => body !== botComment.body);
  }

  const issueAndComments = [issue.data.body, ...commentBodies];
  const issueAndCommentsUniq = [...new Set(issueAndComments)];

  const user = issue.data.user.login;

  const hasValidReproducer = issueAndCommentsUniq.some(body => {
    const hasExpoSnackLink = containsPattern(
      body,
      `https?:\\/\\/snack\\.expo\\.dev\\/[^\\s)\\]]+`,
    );
    const hasGithubRepoLink = containsPattern(
      body,
      `https?:\\/\\/github\\.com\\/(${user})\\/[^/]+\\/?\\s?`,
    );

    return hasExpoSnackLink || hasGithubRepoLink;
  });

  if (hasValidReproducer) {
    try {
      await github.rest.issues.removeLabel({
        ...issueData,
        name: NEEDS_REPRO_LABEL,
      });
    } catch (error) {
      if (!/Label does not exist/.test(error.message)) {
        throw error;
      }
    }

    if (!botComment) return;

    await github.rest.issues.deleteComment({
      ...issueData,
      comment_id: botComment.id,
    });
  } else {
    await github.rest.issues.addLabels({
      ...issueData,
      labels: [NEEDS_REPRO_LABEL],
    });

    if (botComment) return;

    await github.rest.issues.createComment({
      ...issueData,
      body: NEEDS_REPRO_MESSAGE,
    });
  }
};

function containsPattern(body, pattern) {
  const regexp = new RegExp(pattern, 'gm');
  return body.search(regexp) !== -1;
}
