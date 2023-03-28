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
const {validate: validateChangelog} =
  require('@rnx-kit/rn-changelog-generator').default;

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

// Check if there is a changelog and validate it
const status = validateChangelog(danger.github.pr.body);
const changelogInstructions =
  'See <a target="_blank" href="https://reactnative.dev/contributing/changelogs-in-pull-requests">Changelog format</a>';
if (status === 'missing') {
  // Provides advice if a changelog is missing
  const title = ':clipboard: Missing Changelog';
  const idea =
    'Please add a Changelog to your PR description. ' + changelogInstructions;
  fail(`${title} - <i>${idea}</i>`);
} else if (status === 'invalid') {
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
