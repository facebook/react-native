/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const glob = require('glob');
const path = require('path');

/**
 * Glob pattern to look for solution file
 */
const GLOB_PATTERN = '**/*.sln';

/**
 * Regexp matching all test projects
 */
const TEST_PROJECTS = /test|example|sample/i;

/**
 * Base windows folder
 */
const WINDOWS_BASE = 'windows';

/**
 * These folders will be excluded from search to speed it up
 */
const GLOB_EXCLUDE_PATTERN = ['**/@(node_modules)/**'];

/**
 * Finds windows project by looking for all .sln files
 * in given folder.
 *
 * Returns first match if files are found or null
 *
 * Note: `./windows/*.sln` are returned regardless of the name
 */
module.exports = function findSolution(folder) {
  const projects = glob
    .sync(GLOB_PATTERN, {
      cwd: folder,
      ignore: GLOB_EXCLUDE_PATTERN,
    })
    .filter(project => {
      return path.dirname(project) === WINDOWS_BASE || !TEST_PROJECTS.test(project);
    })
    .sort((projectA, projectB) => {
      return path.dirname(projectA) === WINDOWS_BASE ? -1 : 1;
    });

  if (projects.length === 0) {
    return null;
  }

  return projects[0];
};
