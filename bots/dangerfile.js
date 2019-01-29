/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const includes = require('lodash.includes');

const {danger, fail, warn} = require('danger');

// Fails if the description is too short.
if (!danger.github.pr.body || danger.github.pr.body.length < 50) {
  fail(':grey_question: This pull request needs a description.');
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

// Warns if a test plan is missing.
const includesTestPlan =
  danger.github.pr.body &&
  danger.github.pr.body.toLowerCase().includes('test plan');
if (!includesTestPlan) {
  const title = ':clipboard: Test Plan';
  const idea =
    'This PR appears to be missing a Test Plan. ' +
    'Please add a section called "test plan" describing ' +
    'how to verify your changes are correct.';
  warn(`${title} - <i>${idea}</i>`);
}

// Regex looks for given categories, types, a file/framework/component, and a message - broken into 4 capture groups
const changelogRegex = /\[\s?(ANDROID|GENERAL|IOS)\s?\]\s*?\[\s?(ADDED|CHANGED|DEPRECATED|REMOVED|FIXED|SECURITY)\s?\]\s*?\-\s*?(.*)/gi;
const includesChangelog =
  danger.github.pr.body &&
  danger.github.pr.body.toLowerCase().includes('changelog');
const correctlyFormattedChangelog = changelogRegex.test(danger.github.pr.body);

if (!includesChangelog) {
  const title = ':clipboard: Changelog';
  const idea =
    'This PR appears to be missing Changelog. ' +
    'Please add a section called "changelog" and ' +
    'format it as explained in the [contributing guidelines](http://facebook.github.io/react-native/docs/contributing#changelog).';
  warn(`${title} - <i>${idea}</i>`);
} else if (!correctlyFormattedChangelog) {
  const title = ':clipboard: Changelog';
  const idea =
    'This PR may have incorrectly formatted Changelog. Please ' +
    'format it as explained in the [contributing guidelines](http://facebook.github.io/react-native/docs/contributing#changelog).';
  warn(`${title} - <i>${idea}</i>`);
}

// Tags big PRs
var bigPRThreshold = 600;
if (danger.github.pr.additions + danger.github.pr.deletions > bigPRThreshold) {
  const title = ':exclamation: Big PR';
  const idea =
    `This PR is unlikely to get reviewed because it touches too many lines (${danger
      .github.pr.additions + danger.github.pr.deletions}). ` +
    'Consider sending smaller Pull Requests and stack them on top of each other.';
  warn(`${title} - <i>${idea}</i>`);
} else if (
  danger.git.modified_files +
    danger.git.added_files +
    danger.git.deleted_files >
  bigPRThreshold
) {
  const title = ':exclamation: Big PR';
  const idea =
    `This PR is unlikely to get reviewed because it touches too many files (${danger
      .git.modified_files +
      danger.git.added_files +
      danger.git.deleted_files}). ` +
    'Consider sending smaller Pull Requests and stack them on top of each other.';
  warn(`${title} - <i>${idea}</i>`);
}

// Warns if the PR is opened against stable, as commits need to be cherry picked and tagged by a release maintainer.
// Fails if the PR is opened against anything other than `master` or `-stable`.
const isMergeRefMaster = danger.github.pr.base.ref === 'master';
const isMergeRefStable = danger.github.pr.base.ref.indexOf('-stable') !== -1;
if (!isMergeRefMaster && isMergeRefStable) {
  const title = ':grey_question: Base Branch';
  const idea =
    'The base branch for this PR is something other than `master`. Are you sure you want to merge these changes into a stable release? If you are interested in backporting updates to an older release, the suggested approach is to land those changes on `master` first and then cherry-pick the commits into the branch for that release. The [Releases Guide](https://github.com/facebook/react-native/blob/master/Releases.md) has more information.';
  warn(`${title} - <i>${idea}</i>`);
} else if (!isMergeRefMaster && !isMergeRefStable) {
  const title = ':exclamation: Base Branch';
  const idea =
    'The base branch for this PR is something other than `master`. [Are you sure you want to target something other than the `master` branch?](http://facebook.github.io/react-native/docs/contributing.html#pull-requests)';
  fail(`${title} - <i>${idea}</i>`);
}
