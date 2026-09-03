/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PredictiveBackNativeEvent} from './PredictiveBackAnimatedViewNativeComponent';

import Animated from '../../Animated/Animated';
import useAnimatedValue from '../../Animated/useAnimatedValue';
import * as React from 'react';

export type {PredictiveBackNativeEvent};

function PredictiveBackAnimatedView(_props: {...}): React.Node {
  return null;
}

export function usePredictiveBackAnimatedValue(): {
  progress: Animated.Value,
  onProgress: $FlowFixMe,
} {
  const progress = useAnimatedValue(0);
  return {progress, onProgress: () => {}};
}

export default PredictiveBackAnimatedView;
