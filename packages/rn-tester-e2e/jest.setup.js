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

let driver: any;

const config = {
  path: '/wd/hub',
  host: 'localhost',
  port: 4723,
  waitforTimeout: 60000,
  capabilities: {
    ...capabilities,
  },
};

beforeEach(async () => {
  // $FlowFixMe
  let testName: any = expect.getState().currentTestName;
  console.info(
    '------------------------------------------------------------ Test is starting... ------------------------------------------------------------',
  );
  console.info(
    '------------------------------ Test name: ' +
      testName +
      ' ------------------------------',
  );
  driver = await wdio.remote(config);
});

afterEach(async () => {
  await driver.deleteSession();
  console.info(
    '------------------------------------------------------------ Done with testing. ------------------------------------------------------------',
  );
});

export {driver};
