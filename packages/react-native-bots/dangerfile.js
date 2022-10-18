/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {danger, fail, /*message,*/ warn} = require('danger');
const includes = require('lodash.includes');
const eslint = require('@seadub/danger-plugin-eslint');

const isFromPhabricator =
  danger.github.pr.body &&
  danger.github.pr.body.toLowerCase().includes('differential revision:');

// Provides advice if a summary section is missing, or body is too short
const includesSummary =
  danger.github.pr.body &&
  danger.github.pr.body.toLowerCase().includes('## summary');
if (!danger.github.pr.body || danger.github.pr.body.length < 50) {
  fail(':grey_question: This pull request needs a description.');
} else if (!includesSummary && !isFromPhabricator) {
  // PRs from Phabricator always includes the Summary by default.
  const title = ':clipboard: Missing Summary';
  const idea =
    'Can you add a Summary? ' +
    'To do so, add a "## Summary" section to your PR description. ' +
    'This is a good place to explain the motivation for making this change.';
  warn(`${title} - <i>${idea}</i>`);
}

// Warns if there are changes to package.json, and tags the team.
const packageChanged = includes(danger.git.modified_files, 'package.json');
if (packageChanged) {
  const title = ':lock: package.json';
  const idea =
    'Changes were made to package.json. ' +
    'This will require a manual import by a Facebook employee.';
  warn(`${title} - <i>${idea}</i>`);
}

// Provides advice if a test plan is missing.
const includesTestPlan =
  danger.github.pr.body &&
  danger.github.pr.body.toLowerCase().includes('## test plan');
if (!includesTestPlan && !isFromPhabricator) {
  // PRs from Phabricator never exports the Test Plan so let's disable this check.
  const title = ':clipboard: Missing Test Plan';
  const idea =
    'Can you add a Test Plan? ' +
    'To do so, add a "## Test Plan" section to your PR description. ' +
    'A Test Plan lets us know how these changes were tested.';
  warn(`${title} - <i>${idea}</i>`);
}

// Regex looks for given categories, types, a file/framework/component, and a message - broken into 4 capture groups
const changelogRegex =
  /\[\s?(ANDROID|GENERAL|IOS|JS|JAVASCRIPT|INTERNAL)\s?\]\s?\[\s?(ADDED|CHANGED|DEPRECATED|REMOVED|FIXED|SECURITY)\s?\]\s*?-?\s*?(.*)/gi;
const internalChangelogRegex = /\[\s?(INTERNAL)\s?\].*/gi;
const includesChangelog =
  danger.github.pr.body &&
  (danger.github.pr.body.toLowerCase().includes('## changelog') ||
    danger.github.pr.body.toLowerCase().includes('release notes') ||
    // PR exports from Phabricator have a `Changelog:` entry for the changelog.
    danger.github.pr.body.toLowerCase().includes('changelog:'));
const correctlyFormattedChangelog = changelogRegex.test(danger.github.pr.body);
const containsInternalChangelog = internalChangelogRegex.test(
  danger.github.pr.body,
);

// Provides advice if a changelog is missing
const changelogInstructions =
  'A changelog entry has the following format: `[CATEGORY] [TYPE] - Message`.\n\n<details>CATEGORY may be:\n\n- General\n- iOS\n- Android\n- JavaScript\n- Internal (for changes that do not need to be called out in the release notes)\n\nTYPE may be:\n\n- Added, for new features.\n- Changed, for changes in existing functionality.\n- Deprecated, for soon-to-be removed features.\n- Removed, for now removed features.\n- Fixed, for any bug fixes.\n- Security, in case of vulnerabilities.\n\nMESSAGE may answer "what and why" on a feature level.   Use this to briefly tell React Native users about notable changes.</details>';
if (!includesChangelog) {
  const title = ':clipboard: Missing Changelog';
  const idea =
    'Can you add a Changelog? ' +
    'To do so, add a "## Changelog" section to your PR description. ' +
    changelogInstructions;
  fail(`${title} - <i>${idea}</i>`);
} else if (!correctlyFormattedChangelog && !containsInternalChangelog) {
  const title = ':clipboard: Verify Changelog Format';
  const idea = changelogInstructions;
  fail(`${title} - <i>${idea}</i>`);
}

// Warns if the PR is opened against stable, as commits need to be cherry picked and tagged by a release maintainer.
// Fails if the PR is opened against anything other than `main` or `-stable`.
const isMergeRefMain = danger.github.pr.base.ref === 'main';
const isMergeRefStable = danger.github.pr.base.ref.endsWith('-stable');
if (!isMergeRefMain && !isMergeRefStable) {
  const title = ':exclamation: Base Branch';
  const idea =
    'The base branch for this PR is something other than `main` or a `-stable` branch. [Are you sure you want to target something other than the `main` branch?](https://reactnative.dev/docs/contributing#pull-requests)';
  fail(`${title} - <i>${idea}</i>`);
}

// If the PR is opened against stable should add `Pick Request` label
if (isMergeRefStable) {
  danger.github.api.issues.addLabels({
    owner: danger.github.pr.base.repo.owner.login,
    repo: danger.github.pr.base.repo.name,
    issue_number: danger.github.pr.number,
    labels: ['Pick Request'],
  });
}

// Ensures that eslint is run from root folder and that it can find .eslintrc
process.chdir('../../');
eslint.default();
