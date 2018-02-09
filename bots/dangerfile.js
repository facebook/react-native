/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
const includesReleaseNotes = danger.github.pr.body.toLowerCase().includes('release notes');
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
  // if (category === 'ios' ){
  //   markdown('@facebook-github-bot label iOS');
  // }

  // if (category === 'android' ){
  //   markdown('@facebook-github-bot label Android');
  // }
}

// Tags PRs that have been submitted by a core contributor.
// TODO: Switch to using an actual MAINTAINERS file.
const taskforce = fs.readFileSync('./IssueCommands.txt', 'utf8').split('\n')[0].split(':')[1];
const isSubmittedByTaskforce = includes(taskforce, danger.github.pr.user.login);
// if (isSubmittedByTaskforce) {
//   markdown('@facebook-github-bot label Core Team');
// }

// Tags big PRs
var bigPRThreshold = 600;
if (danger.github.pr.additions + danger.github.pr.deletions > bigPRThreshold) {
  const title = ':exclamation: Big PR';
  const idea = `This PR is extremely unlikely to get reviewed because it touches ${danger.github.pr.additions + danger.github.pr.deletions} lines.`;
  warn(`${title} - <i>${idea}</i>`);

  // markdown('@facebook-github-bot large-pr');
}
if (danger.git.modified_files + danger.git.added_files + danger.git.deleted_files > bigPRThreshold) {
  const title = ':exclamation: Big PR';
  const idea = `This PR is extremely unlikely to get reviewed because it touches ${danger.git.modified_files + danger.git.added_files + danger.git.deleted_files} files.`;
  warn(`${title} - <i>${idea}</i>`);

  // markdown('@facebook-github-bot large-pr');
}

// Warns if the bots whitelist file is updated.
const issueCommandsFileModified = includes(danger.git.modified_files, 'bots/IssueCommands.txt');
if (issueCommandsFileModified) {
  const title = ':exclamation: Bots';
  const idea = 'This PR appears to modify the list of people that may issue ' + 
  'commands to the GitHub bot.';
  warn(`${title} - <i>${idea}</i>`);
}

// Warns if the PR is opened against stable, as commits need to be cherry picked and tagged by a release maintainer.
// Fails if the PR is opened against anything other than `master` or `-stable`.
const isMergeRefMaster = danger.github.pr.base.ref === 'master';
const isMergeRefStable = danger.github.pr.base.ref.indexOf(`-stable`) !== -1;
if (!isMergeRefMaster && isMergeRefStable) {
  const title = ':grey_question: Base Branch';
  const idea = 'The base branch for this PR is something other than `master`. Are you sure you want to merge these changes into a stable release? If you are interested in backporting updates to an older release, the suggested approach is to land those changes on `master` first and then cherry-pick the commits into the branch for that release. The [Releases Guide](https://github.com/facebook/react-native/blob/master/Releases.md) has more information.';
  warn(`${title} - <i>${idea}</i>`);
} else if (!isMergeRefMaster && !isMergeRefStable) {
  const title = ':exclamation: Base Branch';
  const idea = 'The base branch for this PR is something other than `master`. [Are you sure you want to target something other than the `master` branch?](http://facebook.github.io/react-native/docs/contributing.html#pull-requests)';
  fail(`${title} - <i>${idea}</i>`);
}

// People can add themselves to CODEOWNERS in order to be automatically added as reviewers when a file matching a glob pattern is modified. The following will have the bot add a mention in that case.
const codeowners = fs.readFileSync('../.github/CODEOWNERS', 'utf8').split('\n');
let mentions = [];
codeowners.forEach((codeowner) => {
  const pattern = codeowner.split(' ')[0];
  const owners = codeowner.substring(pattern.length).trim().split(' ');

  const modifiedFileHasOwner = path => minimatch(path, pattern);
  const modifiesOwnedCode = danger.git.modified_files.filter(modifiedFileHasOwner).length > 0;

  if (modifiesOwnedCode) {
    mentions = mentions.concat(owners);
  }
});
const isOwnedCodeModified = mentions.length > 0;
if (isOwnedCodeModified) {
  const uniqueMentions = new Set(mentions);
  markdown('Attention: ' + [...uniqueMentions].join(', '));
}
