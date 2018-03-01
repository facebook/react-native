/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const includes = require('lodash.includes');
const minimatch = require('minimatch');

import { danger, fail, markdown, message, warn } from 'danger';

// Fails if the description is too short.
if (!danger.github.pr.body || danger.github.pr.body.length < 10) {
  fail(':grey_question: This pull request needs a description.');
}

// Warns if the PR title contains [WIP]
const isWIP = includes(danger.github.pr.title, '[WIP]');
if (isWIP) {
  const title = ':construction_worker: Work In Progress';
  const idea = 'This PR appears to be a work in progress, and may not be ready to be merged yet.';
  warn(`${title} - <i>${idea}</i>`);
}

// Warns if there are changes to package.json, and tags the team.
const packageChanged = includes(danger.git.modified_files, 'package.json');
if (packageChanged) {
  const title = ':lock: package.json';
  const idea = 'Changes were made to package.json. ' +
    'This will require a manual import by a Facebook employee.';
  warn(`${title} - <i>${idea}</i>`);
}

// Warns if a test plan is missing.
const includesTestPlan = danger.github.pr.body && danger.github.pr.body.toLowerCase().includes('test plan');
if (!includesTestPlan) {
  const title = ':clipboard: Test Plan';
  const idea = 'This PR appears to be missing a Test Plan.';
  warn(`${title} - <i>${idea}</i>`);
}

// Regex looks for given categories, types, a file/framework/component, and a message - broken into 4 capture groups
const releaseNotesRegex = /\[(ANDROID|CLI|DOCS|GENERAL|INTERNAL|IOS|TVOS|WINDOWS)\]\s*?\[(BREAKING|BUGFIX|ENHANCEMENT|FEATURE|MINOR)\]\s*?\[(.*)\]\s*?\-\s*?(.*)/ig;
const includesReleaseNotes = danger.github.pr.body && danger.github.pr.body.toLowerCase().includes('release notes');
const correctlyFormattedReleaseNotes = releaseNotesRegex.test(danger.github.pr.body);
const releaseNotesCaptureGroups = releaseNotesRegex.exec(danger.github.pr.body);

if (!includesReleaseNotes) {
  const title = ':clipboard: Release Notes';
  const idea = 'This PR appears to be missing Release Notes.';
  warn(`${title} - <i>${idea}</i>`);
} else if (!correctlyFormattedReleaseNotes) {
  const title = ':clipboard: Release Notes';
  const idea = 'This PR may have incorrectly formatted Release Notes.';
  warn(`${title} - <i>${idea}</i>`);
} else if (releaseNotesCaptureGroups) {
  const category = releaseNotesCaptureGroups[1].toLowerCase();

  // Use Release Notes to Tag PRs appropriately
  if (category === 'ios' || category === 'tvos') {
    message('Suggested label: iOS');
  }

  if (category === 'android') {
    message('Suggested label: Android');
  }

  if (category === 'cli') {
    message('Suggested label: Tooling');
  }
}

// Tags big PRs
var bigPRThreshold = 600;
if (danger.github.pr.additions + danger.github.pr.deletions > bigPRThreshold) {
  const title = ':exclamation: Big PR';
  const idea = `This PR is extremely unlikely to get reviewed because it touches ${danger.github.pr.additions + danger.github.pr.deletions} lines.`;
  warn(`${title} - <i>${idea}</i>`);
} else if (danger.git.modified_files + danger.git.added_files + danger.git.deleted_files > bigPRThreshold) {
  const title = ':exclamation: Big PR';
  const idea = `This PR is extremely unlikely to get reviewed because it touches ${danger.git.modified_files + danger.git.added_files + danger.git.deleted_files} files.`;
  warn(`${title} - <i>${idea}</i>`);
}

// Warns if the PR is opened against stable, as commits need to be cherry picked and tagged by a release maintainer.
// Fails if the PR is opened against anything other than `master` or `-stable`.
const isMergeRefMaster = danger.github.pr.base.ref === 'master';
const isMergeRefStable = danger.github.pr.base.ref.indexOf('-stable') !== -1;
if (!isMergeRefMaster && isMergeRefStable) {
  const title = ':grey_question: Base Branch';
  const idea = 'The base branch for this PR is something other than `master`. Are you sure you want to merge these changes into a stable release? If you are interested in backporting updates to an older release, the suggested approach is to land those changes on `master` first and then cherry-pick the commits into the branch for that release. The [Releases Guide](https://github.com/facebook/react-native/blob/master/Releases.md) has more information.';
  warn(`${title} - <i>${idea}</i>`);
} else if (!isMergeRefMaster && !isMergeRefStable) {
  const title = ':exclamation: Base Branch';
  const idea = 'The base branch for this PR is something other than `master`. [Are you sure you want to target something other than the `master` branch?](http://facebook.github.io/react-native/docs/contributing.html#pull-requests)';
  fail(`${title} - <i>${idea}</i>`);
}
