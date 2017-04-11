/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.autoMockOff();

const onWindows = /^win/.test(process.platform);
const { spawnSync } = require('child_process');

describe('packager launcher', () => {
  it('should be able to pass all arguments to the command-line script', () => {
    // Determine the appropriate script to test based on the host OS
    const cmd = `./packager/__tests__/launchPackagerMock.${onWindows ? 'bat' : 'sh'}`;

    // Let's try to pass some args
    const args = ['--arg1', '--arg2'];
    const proc = spawnSync(cmd, args);

    // We should've gotten the args from the mock script
    const outArgs = proc.stdout.toString().trim().split(";;");

    // We account for an extra arg in the mock scripts
    expect(outArgs[1]).toEqual(args[0]);
    expect(outArgs[2]).toEqual(args[1]);
  });
});
