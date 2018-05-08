/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+javascript_foundation
 */

'use strict';

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
