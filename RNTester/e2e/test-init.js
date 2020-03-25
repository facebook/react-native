/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/* eslint-env jasmine */
/* global device */

const detox = require('detox');
const config = require('../../package.json').detox;
const adapter = require('detox/runners/jest/adapter');
jest.setTimeout(120000);
jasmine.getEnv().addReporter(adapter);

beforeAll(async () => {
  await detox.init(config, {launchApp: false});
  await device.launchApp({
    launchArgs: {
      newInstance: true,
      // see https://github.com/wix/Detox/blob/master/docs/Troubleshooting.Synchronization.md
      // and uncomment below if app fails to launch
      // detoxPrintBusyIdleResources: 'YES',
    },
    permissions: {
      notifications: 'YES',
      camera: 'YES',
      medialibrary: 'YES',
      photos: 'YES',
      microphone: 'YES',
    },
  });
});

beforeEach(async function() {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
