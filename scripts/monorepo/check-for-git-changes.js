/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {spawnSync} = require('child_process');
const path = require('path');

const ROOT_LOCATION = path.join(__dirname, '..', '..');

const checkForGitChanges = () => {
  const {stdout: thereIsSomethingToCommit, stderr} = spawnSync(
    'git',
    ['status', '--porcelain'],
    {
      cwd: ROOT_LOCATION,
      shell: true,
      stdio: 'pipe',
      encoding: 'utf-8',
    },
  );

  if (stderr) {
    console.log(
      '\u274c An error occured while running `git status --porcelain`:',
    );
    console.log(stderr);

    process.exit(1);
  }

  return Boolean(thereIsSomethingToCommit);
};

module.exports = checkForGitChanges;
