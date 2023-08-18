/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const SUPPORTED_PLATFORMS = ['ios', 'android'];

if (process.argv.length !== 3 || !SUPPORTED_PLATFORMS.includes(process.argv[2])) {
  throw new Error(`Invalid platform. Supported platforms are: ${SUPPORTED_PLATFORMS.join(', ')}`);
}

const platform = process.argv[2];
const { execSync } = require('child_process');
execSync(`E2E_DEVICE=${platform} jest --runInBand`, { stdio: 'inherit' });
