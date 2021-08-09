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

  const mockStartCallback = jest.fn();
  jest.useFakeTimers();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const itCallsStartCallback = () => {
    jest.runAllTimers();

    expect(mockStartCallback).toHaveBeenCalledTimes(1);
  };

  describe('Animated.parallel', () => {
    it('calls the start callback', () => {
      AnimatedMock.parallel([]).start(mockStartCallback);

      jest.runAllTimers();

      itCallsStartCallback();
    });
  });

  describe('Animated.sequence', () => {
    it('calls the start callback', () => {
      AnimatedMock.sequence([]).start(mockStartCallback);

      jest.runAllTimers();

      itCallsStartCallback();
    });
  });

  describe('Animated.loop', () => {
    it('calls the start callback', () => {
      AnimatedMock.loop(AnimatedMock.timing(new AnimatedMock.Value(0))).start(
        mockStartCallback,
      );

      itCallsStartCallback();
    });
  });

  describe('Animated.delay', () => {
    it('calls the start callback', () => {
      AnimatedMock.decay(new AnimatedMock.Value(0)).start(mockStartCallback);

      itCallsStartCallback();
    });
  });

  describe('Animated.stagger', () => {
    it('calls the start callback', () => {
      AnimatedMock.stagger(50, []).start(mockStartCallback);

      itCallsStartCallback();
    });
  });

  describe('Animated.timing', () => {
    it('calls the start callback', () => {
      AnimatedMock.timing(new AnimatedMock.Value(0), {toValue: 20}).start(
        mockStartCallback,
      );

      itCallsStartCallback();
    });
  });

  describe('Animated.spring', () => {
    it('calls the start callback', () => {
      AnimatedMock.spring(new AnimatedMock.Value(0), {toValue: 20}).start(
        mockStartCallback,
      );

      itCallsStartCallback();
    });
  });
});
