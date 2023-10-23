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
const fetch = require('node-fetch');
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
if (!isFromPhabricator) {
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

// Wait for statuses and post a message if there are failures.
async function handleStatuses() {
  const regex = /Test Suites: \d+ failed/;
  let startChecking = Date.now();
  let done = false;
  while (!done) {
    let now = Date.now();
    if (now - startChecking > 90 * 60 * 1000) {
      warn(
        "One hour and a half have passed and the E2E jobs haven't finished yet.",
      );
      done = true;
      continue;
    }

    const githubBaseURL = `https://api.github.com/repos/${danger.github.pr.base.repo.owner.login}/${danger.github.pr.base.repo.name}`;
    const statusesURL = `${githubBaseURL}/commits/${danger.github.pr.head.sha}/statuses?per_page=100`;

    const response = await fetch(statusesURL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${process.env.DANGER_GITHUB_API_TOKEN}`,
      },
    });

    const data = await response.json();
    const e2e_jobs = data.filter(job => {
      return (
        job.context === 'ci/circleci: test_e2e_ios'
        // test_e2e_android does not currently tun
        // || job.context === 'ci/circleci: test_e2e_android'
      );
    });
    if (e2e_jobs.length <= 0) {
      console.log('No e2e jobs found yet, retrying in 5 minutes.');
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      continue;
    }

    const jobFinished = e2e_jobs.every(job => job.state !== 'pending');
    if (!jobFinished) {
      console.log("E2E jobs haven't finished yet, retrying in 5 minutes.");
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      continue;
    }

    e2e_jobs.forEach(async job => {
      const url = job.target_url;
      const components = url.split('/');
      const jobId = components[components.length - 1];
      const jobUrl = `https://circleci.com/api/v2/project/gh/facebook/react-native/${jobId}`;
      const artifactUrl = `${jobUrl}/artifacts`;
      const artifactResponse = await fetch(artifactUrl);
      const artifactData = await artifactResponse.json();
      const testLogs = artifactData.items.filter(
        item => item.path === 'tmp/test_log',
      );
      if (testLogs.length !== 1) {
        warn(
          `Can't find the E2E test log for ${job.context}. <a href=${jobUrl}>Job link</a>`,
        );
        return;
      }

      const logUrl = testLogs[0].url;
      const logResponseText = await fetch(logUrl);
      const logText = await logResponseText.text();

      if (regex.test(logText)) {
        warn(
          `E2E tests for ${job.context} failed with errors. See the <a href="${logUrl}">logs for details<a/>`,
        );
      }
    });
    done = true;
  }
}

// handleStatuses();
