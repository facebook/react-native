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
const SKIP_ISSUES_OLDER_THAN = '2023-07-01T00:00:00Z';

module.exports = async (github, context) => {
  const issueData = {
    issue_number: context.payload.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
  };

  const issue = await github.rest.issues.get(issueData);
  const comments = await github.rest.issues.listComments(issueData);

  const author = issue.data.user.login;

  const issueDate = issue.data.created_at;
  if (isDateBefore(issueDate, SKIP_ISSUES_OLDER_THAN)) {
    return;
  }

  const maintainerChangedLabel = await hasMaintainerChangedLabel(
    github,
    issueData,
    author,
  );

  if (maintainerChangedLabel) {
    return;
  }

  const botComment = comments.data.find(comment =>
    comment.body.includes(NEEDS_REPRO_HEADER),
  );

  const entities = [issue.data, ...comments.data];

  // Look for Snack or a GH repo associated with the user that added an issue or comment
  const hasValidReproducer = entities.some(entity => {
    const hasExpoSnackLink = containsPattern(
      entity.body,
      `https?:\\/\\/snack\\.expo\\.dev\\/[^\\s)\\]]+`,
    );

    const hasGithubRepoLink = containsPattern(
      entity.body,
      `https?:\\/\\/github\\.com\\/(${entity.user.login})\\/[^/]+\\/?\\s?`,
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

// Prevents the bot from responding when maintainer has changed Needs: Repro the label
async function hasMaintainerChangedLabel(github, issueData, author) {
  const timeline = await github.rest.issues.listEventsForTimeline(issueData);

  const labeledEvents = timeline.data.filter(
    event => event.event === 'labeled' || event.event === 'unlabeled',
  );
  const userEvents = labeledEvents.filter(event => event.actor.type !== 'Bot');

  return userEvents.some(
    event =>
      event.actor.login !== author && event.label.name === NEEDS_REPRO_LABEL,
  );
}

function isDateBefore(firstDate, secondDate) {
  const date1 = new Date(firstDate);
  const date2 = new Date(secondDate);

  return date1.getTime() < date2.getTime();
}
