/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const AnimatedMock = require('AnimatedMock');
const AnimatedImplementation = require('AnimatedImplementation');

describe('Animated Mock', () => {
  it('matches implementation keys', () => {
    expect(Object.keys(AnimatedMock)).toEqual(
      Object.keys(AnimatedImplementation),
    );
  });
  it('matches implementation params', () => {
    Object.keys(AnimatedImplementation).forEach(key =>
      expect(AnimatedImplementation[key].length).toEqual(
        AnimatedMock[key].length,
      ),
    );
  });
});
