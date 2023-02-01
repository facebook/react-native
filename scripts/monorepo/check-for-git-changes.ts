/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import path from 'path';
import {spawnSync} from 'child_process';

const ROOT_LOCATION = path.join(__dirname, '..', '..');

export const checkForGitChanges = (): boolean => {
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

export default checkForGitChanges;
