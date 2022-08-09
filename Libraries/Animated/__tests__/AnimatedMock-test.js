/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const AnimatedMock = require('../AnimatedMock');
const AnimatedImplementation = require('../AnimatedImplementation');

describe('Animated Mock', () => {
  it('matches implementation keys', () => {
    expect(Object.keys(AnimatedMock)).toEqual(
      Object.keys(AnimatedImplementation),
    );
  });
  it('matches implementation params', done => {
    Object.keys(AnimatedImplementation).forEach(key => {
      if (AnimatedImplementation[key].length !== AnimatedMock[key].length) {
        done(
          new Error(
            'key ' +
              key +
              ' had different lengths: ' +
              JSON.stringify(
                {
                  impl: {
                    len: AnimatedImplementation[key].length,
                    type: typeof AnimatedImplementation[key],
                    val: AnimatedImplementation[key].toString(),
                  },
                  mock: {
                    len: AnimatedMock[key].length,
                    type: typeof AnimatedMock[key],
                    val: AnimatedMock[key].toString(),
                  },
                },
                null,
                2,
              ),
          ),
        );
      }
    });
    done();
  });
});
