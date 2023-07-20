/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const NEEDS_REPRO_LABEL = 'Needs: Repro';
const NEEDS_REPRO_MESSAGE = '| Missing Reproducible Example |';

module.exports = async (github, context) => {
  const issueData = {
    issue_number: context.payload.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
  };

  const issue = await github.rest.issues.get(issueData);
  const comments = await github.rest.issues.listComments(issueData);

  const botComment = comments.data.find(comment =>
    comment.body.includes(NEEDS_REPRO_MESSAGE),
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
  }
};

function containsPattern(body, pattern) {
  const regexp = new RegExp(pattern, 'gm');
  return body.search(regexp) !== -1;
}
