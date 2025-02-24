/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {EndCallback} from './animations/Animation';
import type AnimatedAddition from './nodes/AnimatedAddition';
import type AnimatedDiffClamp from './nodes/AnimatedDiffClamp';
import type AnimatedDivision from './nodes/AnimatedDivision';
import type AnimatedInterpolation from './nodes/AnimatedInterpolation';
import type AnimatedModulo from './nodes/AnimatedModulo';
import type AnimatedMultiplication from './nodes/AnimatedMultiplication';
import type AnimatedSubtraction from './nodes/AnimatedSubtraction';
import type AnimatedValue from './nodes/AnimatedValue';

export type CompositeAnimation = {
  start: (callback?: ?EndCallback, isLooping?: boolean) => void,
  stop: () => void,
  reset: () => void,
  _startNativeLoop: (iterations?: number) => void,
  _isUsingNativeDriver: () => boolean,
  ...
};

// All types of animated nodes that represent scalar numbers and can be interpolated (etc)
export type Numeric =
  | AnimatedAddition
  | AnimatedDiffClamp
  | AnimatedDivision
  | AnimatedInterpolation<number>
  | AnimatedModulo
  | AnimatedMultiplication
  | AnimatedSubtraction
  | AnimatedValue;
