/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

describe('DevTools', () => {
  /**
   * Test whether Chrome Debugger works by turning it on
   * and seeing whether it refreshes the app correctly
   */
  it('should have `Debug In Chrome` working', async () => {
    await device.shake();
    await element(by.text('Debug JS Remotely')).tap();
    await expect(element(by.text('RNTester'))).toBeVisible();
    await device.shake();
    await element(by.text('Stop Remote JS Debugging')).tap();
    await waitFor(element(by.text('RNTester'))).toBeVisible().withTimeout(2000);
  });
});
