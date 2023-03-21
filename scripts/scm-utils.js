/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {cp, echo, exec, exit} = require('shelljs');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

function isGitRepo() {
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

function exitIfNotOnGit(command, errorMessage, gracefulExit = false) {
  if (isGitRepo()) {
    return command();
  } else {
    echo(errorMessage);
    exit(gracefulExit ? 0 : 1);
  }
}

function isTaggedLatest(commitSha) {
  return (
    exec(`git rev-list -1 latest | grep ${commitSha}`, {
      silent: true,
    }).stdout.trim() === commitSha
  );
}

function getBranchName() {
  return exec('git rev-parse --abbrev-ref HEAD', {
    silent: true,
  }).stdout.trim();
}

function getCurrentCommit() {
  return isGitRepo()
    ? exec('git rev-parse HEAD', {
        silent: true,
      }).stdout.trim()
    : 'TEMP';
}

function saveFiles(filePaths, tmpFolder) {
  for (const filePath of filePaths) {
    const dirName = path.dirname(filePath);
    if (dirName !== '.') {
      const destFolder = `${tmpFolder}/${dirName}`;
      mkdirp.sync(destFolder);
    }
    cp(filePath, `${tmpFolder}/${filePath}`);
  }
}

function revertFiles(filePaths, tmpFolder) {
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

module.exports = {
  exitIfNotOnGit,
  getCurrentCommit,
  getBranchName,
  isTaggedLatest,
  revertFiles,
  saveFiles,
};
