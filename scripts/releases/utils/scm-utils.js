/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {cp, echo, exec, exit} = require('shelljs');

/*::
type Commit = string;
*/

function isGitRepo() /*: boolean */ {
  try {
    return (
      exec('git rev-parse --is-inside-work-tree', {
        silent: true,
      }).stdout.trim() === 'true'
    );
  } catch (error) {
    echo(
      `It wasn't possible to check if we are in a git repository. Details: ${error}`,
    );
  }
  return false;
}

function exitIfNotOnGit /*::<T>*/(
  command /*: () => T */,
  errorMessage /*: string */,
  gracefulExit /*: boolean */ = false,
  // $FlowFixMe[incompatible-return] Asserts return value
) /*: T */ {
  if (isGitRepo()) {
    return command();
  } else {
    echo(errorMessage);
    exit(gracefulExit ? 0 : 1);
  }
}

function isTaggedLatest(commitSha /*: Commit */) /*: boolean */ {
  return (
    exec(`git rev-list -1 latest | grep ${commitSha}`, {
      silent: true,
    }).stdout.trim() === commitSha
  );
}

function getBranchName() /*: string */ {
  return exec('git rev-parse --abbrev-ref HEAD', {
    silent: true,
  }).stdout.trim();
}

function getCurrentCommit() /*: Commit */ {
  return isGitRepo()
    ? exec('git rev-parse HEAD', {
        silent: true,
      }).stdout.trim()
    : 'TEMP';
}

function saveFiles(filePaths /*: Array<string> */, tmpFolder /*: string */) {
  for (const filePath of filePaths) {
    const dirName = path.dirname(filePath);
    if (dirName !== '.') {
      const destFolder = `${tmpFolder}/${dirName}`;
      fs.mkdirSync(destFolder, {recursive: true});
    }
    cp(filePath, `${tmpFolder}/${filePath}`);
  }
}

function revertFiles(filePaths /*: Array<string> */, tmpFolder /*: string */) {
  for (const filePath of filePaths) {
    const absoluteTmpPath = `${tmpFolder}/${filePath}`;
    if (fs.existsSync(absoluteTmpPath)) {
      cp(absoluteTmpPath, filePath);
    } else {
      echo(
        `It was not possible to revert ${filePath} since ${absoluteTmpPath} does not exist.`,
      );
      exit(1);
    }
  }
}

// git restore for local path
function restore(repoPath /*: string */) {
  const result = exec('git restore .', {
    cwd: repoPath,
  });

  if (result.code !== 0) {
    throw new Error(result.stderr);
  }

  return;
}

module.exports = {
  exitIfNotOnGit,
  getCurrentCommit,
  getBranchName,
  isGitRepo,
  isTaggedLatest,
  revertFiles,
  saveFiles,
  restore,
};
