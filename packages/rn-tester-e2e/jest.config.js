/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

module.exports = {
  testTimeout: 120000,
  bail: 0,
  setupFilesAfterEnv: ['./jest.setup.js'],
  testMatch: ['**/specs/**/*.js'],
  maxWorkers: 1,
  verbose: true,
};
