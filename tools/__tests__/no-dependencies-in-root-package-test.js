/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import path from 'path';
import fs from 'fs';

const CURRENT_DIR = __dirname;
const PATH_TO_ROOT_PACKAGE_MANIFEST = path.join(
  CURRENT_DIR,
  '..',
  '..',
  'package.json',
);

const manifest = JSON.parse(
  fs.readFileSync(PATH_TO_ROOT_PACKAGE_MANIFEST).toString(),
);

describe('@react-native/monorepo root package', () => {
  it('expected not to list any dependencies', () => {
    expect(manifest).not.toHaveProperty('dependencies');
  });
});
