/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.dontMock('../parseIOSDevicesList');
var parseIOSDevicesList = require('../parseIOSDevicesList');

describe('parseIOSDevicesList', () => {
  it('parses typical output', () => {
    var devices = parseIOSDevicesList([
      'Known Devices:',
      'Maxs MacBook Pro [11111111-1111-1111-1111-111111111111]',
      "Max's iPhone (9.2) [11111111111111111111aaaaaaaaaaaaaaaaaaaa]",
      'iPad 2 (9.3) [07538CE4-675B-4EDA-90F2-3DD3CD93309D] (Simulator)',
      'iPad Air (9.3) [0745F6D1-6DC5-4427-B9A6-6FBA327ED65A] (Simulator)',
      'iPhone 6s (9.3) [3DBE4ECF-9A86-469E-921B-EE0F9C9AB8F4] (Simulator)',
      'Known Templates:',
      'Activity Monitor',
      'Blank',
      'System Usage',
      'Zombies'
    ].join('\n'));

    expect(devices).toEqual([
      {name: "Max's iPhone", udid: '11111111111111111111aaaaaaaaaaaaaaaaaaaa', version: '9.2'},
    ]);
  });

  it('ignores garbage', () => {
    expect(parseIOSDevicesList('Something went terribly wrong (-42)')).toEqual([]);
  });
});
