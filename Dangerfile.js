/**
 * Copyright (c) 2016-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const fs = require('fs');
const includes = require('lodash.includes');

const isDocsFile = path => includes(path, '/docs/');
const editsDocs = danger.git.modified_files.filter(isDocsFile).length > 0;
const addsDocs = danger.git.created_files.filter(isDocsFile).length > 0;
if (addsDocs || editsDocs) {
  markdown(`:page_facing_up: Thanks for your contribution to the docs!`);
}

const isBlogFile = path => includes(path, '/blog/');
const addsBlogPost = danger.git.created_files.filter(isBlogFile).length > 0;
if (addsBlogPost) {
  const message = ':memo: Blog post';
  const idea = 'This PR appears to add a new blog post, and may require further review from the React Native team.';
  warn(`${message} - <i>${idea}</i>`);
  markdown(`:memo: This PR requires attention from the @facebook/react-native team.`);
}
const editsBlogPost = danger.git.modified_files.filter(isBlogFile).length > 0;
if (editsBlogPost) {
  const message = ':memo: Blog post';
  const idea = 'This PR appears to edit an existing blog post, and may require further review from the React Native team.';
  warn(`${message} - <i>${idea}</i>`);
  markdown(`This PR requires attention from the @facebook/react-native team.`);
}

// Fails if the description is too short.
if (danger.github.pr.body.length < 10) {
  fail(":grey_question: This pull request needs a description.")
}

// Warns if the PR title contains [WIP]
const isWIP = includes(danger.github.pr.title, "[WIP]")
if (isWIP) {
  const message = ':construction_worker: Work In Progress';
  const idea = 'Do not merge yet.';
  warn(`${message} - <i>${idea}</i>`);
}

// Warns if there are changes to package.json, and tags the team.
const packageChanged = includes(danger.git.modified_files, 'package.json');
if (packageChanged) {
  const message = ':lock: Changes were made to package.json';
  const idea = 'This will require a manual import. Once approved, a Facebook employee should import the PR, then run `yarn add` for any new packages.';
  warn(`${message} - <i>${idea}</i>`);
  markdown(`This PR requires attention from the @facebook/react-native team.`);
}

// Warns if a test plan is missing.
if (!danger.github.pr.body.toLowerCase().includes("test plan")) {
  const message = ':clipboard: Test Plan';
  const idea = 'This PR appears to be missing a Test Plan';
  warn(`${message} - <i>${idea}</i>`);
}

// Tags the React Native team is the PR is submitted by a core contributor
const taskforce = fs.readFileSync("bots/IssueCommands.txt").split("\n")[0].split(":")[1];
const isSubmittedByTaskforce = includes(taskforce, danger.github.pr.user.login);
if (isSubmittedByTaskforce) {
  markdown(`This PR has been submitted by a core contributor. Notifying @facebook/react-native.`);
}
