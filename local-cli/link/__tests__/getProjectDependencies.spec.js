/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.autoMockOff();

const getProjectDependencies = require('../getProjectDependencies');
const path = require('path');

describe('getProjectDependencies', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  it('should return an array of project dependencies', () => {
    jest.setMock(
      path.join(process.cwd(), './package.json'),
      { dependencies: { lodash: '^6.0.0', 'react-native': '^16.0.0' }}
    );

    expect(getProjectDependencies()).toEqual(['lodash']);
  });

  it('should return an empty array when no dependencies set', () => {
    jest.setMock(path.join(process.cwd(), './package.json'), {});
    expect(getProjectDependencies()).toEqual([]);
  });
});
