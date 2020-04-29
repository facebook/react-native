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

const TimingAnimation = require('../animations/TimingAnimation');

describe('Timing Animation', () => {
  it('should return array of 61 items', () => {
<<<<<<< HEAD
    const timingAnim = new TimingAnimation({duration: 1000});
=======
    const timingAnim = new TimingAnimation({
      duration: 1000,
      useNativeDriver: false,
    });
>>>>>>> fb/0.62-stable
    const config = timingAnim.__getNativeAnimationConfig();

    expect(config.frames.length).toBe(61);
    expect(config.frames[60]).toBe(1);
    expect(config.frames[59]).toBeLessThan(1);
  });

  it('should cope with zero duration', () => {
<<<<<<< HEAD
    const timingAnim = new TimingAnimation({duration: 0});
=======
    const timingAnim = new TimingAnimation({
      duration: 0,
      useNativeDriver: false,
    });
>>>>>>> fb/0.62-stable
    const config = timingAnim.__getNativeAnimationConfig();

    expect(config.frames.length).toBe(1);
    expect(config.frames[0]).toBe(1);
  });
});
