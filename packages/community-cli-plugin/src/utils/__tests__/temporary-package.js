/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

export function createTempPackage(
  packageJson: {...},
  packagePath: string = fs.mkdtempSync(
    path.join(os.tmpdir(), 'rn-metro-config-test-'),
  ),
): string {
  fs.mkdirSync(packagePath, {recursive: true});
  if (typeof packageJson === 'object') {
    fs.writeFileSync(
      path.join(packagePath, 'package.json'),
      JSON.stringify(packageJson),
      'utf8',
    );
  }

  // Wrapping path in realpath to resolve any symlinks introduced by mkdtemp
  return fs.realpathSync(packagePath);
}
