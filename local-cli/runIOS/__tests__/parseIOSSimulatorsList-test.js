/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.dontMock('../parseIOSSimulatorsList');
var parseIOSSimulatorsList = require('../parseIOSSimulatorsList');

describe('parseIOSSimulatorsList', () => {
  it('parses typical output', () => {
    var simulators = parseIOSSimulatorsList([
      '== Devices ==',
      '-- iOS 8.1 --',
      '    iPhone 4s (4FE43B33-EF13-49A5-B6A6-658D32F20988) (Shutdown)',
      '-- iOS 8.4 --',
      '    iPhone 4s (EAB622C7-8ADE-4FAE-A911-94C0CA4709BB) (Shutdown)',
      '    iPhone 5 (AE1CD3D0-A85B-4A73-B320-9CA7BA4FAEB0) (Shutdown)',
    ].join('\n'));

    expect(simulators).toEqual([
      {name: 'iPhone 4s', udid: '4FE43B33-EF13-49A5-B6A6-658D32F20988', version: '8.1'},
      {name: 'iPhone 4s', udid: 'EAB622C7-8ADE-4FAE-A911-94C0CA4709BB', version: '8.4'},
      {name: 'iPhone 5',  udid: 'AE1CD3D0-A85B-4A73-B320-9CA7BA4FAEB0', version: '8.4'},
    ]);
  });

  it('ignores unavailable simulators', () => {
    var simulators = parseIOSSimulatorsList([
      '== Devices ==',
      '-- iOS 8.1 --',
      '    iPhone 4s (4FE43B33-EF13-49A5-B6A6-658D32F20988) (Shutdown)',
      '-- Unavailable: com.apple.CoreSimulator.SimRuntime.iOS-8-3 --',
      '    iPhone 5s (EAB622C7-8ADE-4FAE-A911-94C0CA4709BB) (Shutdown)',
    ].join('\n'));

    expect(simulators).toEqual([{
      name: 'iPhone 4s',
      udid: '4FE43B33-EF13-49A5-B6A6-658D32F20988',
      version: '8.1',
    }]);

  });

  it('ignores garbage', () => {
    expect(parseIOSSimulatorsList('Something went terribly wrong (-42)')).toEqual([]);
  });
});
