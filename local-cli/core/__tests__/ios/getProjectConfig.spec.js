/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

jest.mock('fs');

const getProjectConfig = require('../../ios').projectConfig;
const fs = require('fs');
const projects = require('../../__fixtures__/projects');

describe('ios::getProjectConfig', () => {
  const userConfig = {};

  beforeEach(() => {
    fs.__setMockFilesystem({testDir: projects});
  });

  it('returns an object with ios project configuration', () => {
    const folder = '/testDir/nested';

    expect(getProjectConfig(folder, userConfig)).not.toBeNull();
    expect(typeof getProjectConfig(folder, userConfig)).toBe('object');
  });

  it('returns `null` if ios project was not found', () => {
    const folder = '/testDir/empty';

    expect(getProjectConfig(folder, userConfig)).toBeNull();
  });

  it('returns normalized shared library names', () => {
    const projectConfig = getProjectConfig('/testDir/nested', {
      sharedLibraries: ['libc++', 'libz.tbd', 'HealthKit', 'HomeKit.framework'],
    });

    expect(projectConfig.sharedLibraries).toEqual([
      'libc++.tbd',
      'libz.tbd',
      'HealthKit.framework',
      'HomeKit.framework',
    ]);
  });
});
