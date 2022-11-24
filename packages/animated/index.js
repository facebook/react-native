/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import typeof Animated from './Animated';
import typeof AnimatedImplementation from './AnimatedImplementation';
import typeof AnimatedMock from './AnimatedMock';
import typeof AnimatedNode from './nodes/AnimatedNode';
import typeof AnimatedValue from './nodes/AnimatedValue';
import typeof Easing from './Easing';
import useAnimatedValue from './useAnimatedValue';
import createAnimatedComponent from './createAnimatedComponent';

module.exports = {
  createAnimatedComponent,
  useAnimatedValue,

  get Animated(): Animated {
    return require('./Animated').default;
  },
  get AnimatedImplementation(): AnimatedImplementation {
    return require('./AnimatedImplementation').default;
  },
  get AnimatedMock(): AnimatedMock {
    return require('./AnimatedMock').default;
  },
  get AnimatedNode(): AnimatedNode {
    return require('./nodes/AnimatedNode').default;
  },
  get AnimatedValue(): AnimatedValue {
    return require('./nodes/AnimatedValue').default;
  },
  get Easing(): Easing {
    return require('./Easing').default;
  },
};
