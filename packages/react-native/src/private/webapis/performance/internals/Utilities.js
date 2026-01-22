/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import warnOnce from '../../../../../Libraries/Utilities/warnOnce';
import {nativePerformanceNow} from '../../../runtime/ReactNativeRuntimeGlobals';
import NativePerformance from '../specs/NativePerformance';

export function warnNoNativePerformance() {
  warnOnce(
    'missing-native-performance',
    'Missing native implementation of Performance',
  );
}

export const getCurrentTimeStamp: () => DOMHighResTimeStamp =
  NativePerformance?.now ?? nativePerformanceNow ?? (() => Date.now());
