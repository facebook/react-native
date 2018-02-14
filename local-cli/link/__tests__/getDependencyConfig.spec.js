/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * All rights reserved.
 *
 * @emails oncall+javascript_foundation
 */

'use strict';

const getDependencyConfig = require('../getDependencyConfig');
const sinon = require('sinon');

describe('getDependencyConfig', () => {
  it('should return an array of dependencies\' rnpm config', () => {
    const config = {
      getDependencyConfig: sinon.stub(),
    };

    expect(Array.isArray(getDependencyConfig(config, ['abcd']))).toBeTruthy();
    expect(config.getDependencyConfig.callCount).toEqual(1);
  });

  it('should filter out invalid react-native projects', () => {
    const config = {
      getDependencyConfig: sinon.stub().throws(new Error('Cannot require')),
    };

    expect(getDependencyConfig(config, ['abcd'])).toEqual([]);
  });
});
