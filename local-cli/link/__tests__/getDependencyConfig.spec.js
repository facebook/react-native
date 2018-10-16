/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

const getDependencyConfig = require('../getDependencyConfig');

describe('getDependencyConfig', () => {
  it("should return an array of dependencies' rnpm config", () => {
    const config = {
      getDependencyConfig: jest.fn(),
    };

    expect(Array.isArray(getDependencyConfig(config, ['abcd']))).toBeTruthy();
    expect(config.getDependencyConfig.mock.calls.length).toEqual(1);
  });

  it('should filter out invalid react-native projects', () => {
    const config = {
      getDependencyConfig: jest.fn().mockImplementation(() => {
        throw new Error('Cannot require');
      }),
    };

    expect(getDependencyConfig(config, ['abcd'])).toEqual([]);
  });
});
