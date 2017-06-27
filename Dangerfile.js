/**
 * Copyright (c) 2016-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const fs = require('fs');
const includes = require('lodash.includes');

// Warns if there are changes to package.json without changes to yarn.lock.
const packageChanged = includes(danger.git.modified_files, 'package.json');
if (packageChanged) {
  const message = 'Changes were made to package.json';
  const idea = 'This will require a manual import by a Facebook employee';
  warn(`${message} - <i>${idea}</i>`);
}

// PR linting
if (danger.github.pr.body.length < 10) {
  fail("This pull request needs an description.")
}

if (!danger.github.pr.body.toLowerCase().includes("test plan")) {
  const message = 'Test Plan';
  const idea = 'This PR appears to be missing a Test Plan';
  warn(`${message} - <i>${idea}</i>`);
}
