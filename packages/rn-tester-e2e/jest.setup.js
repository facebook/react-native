/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const wdio = require('webdriverio');
import capabilities from './e2e-config.js';
import {beforeEach, afterEach, jest} from '@jest/globals';
jest.retryTimes(3);

let driver;
const config = {
  path: '/wd/hub',
  host: 'localhost',
  port: 4723,
  waitforTimeout: 60000,
  logLevel: 'error',
  capabilities: {
    ...capabilities,
  },
};

beforeEach(async () => {
  driver = await wdio.remote(config);
});

afterEach(async () => {
  console.info('[afterAll] Done with testing!');
  await driver.deleteSession();
});

export {driver};
