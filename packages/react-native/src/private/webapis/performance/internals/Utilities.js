/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

import warnOnce from '../../../../../Libraries/Utilities/warnOnce';

export function warnNoNativePerformance() {
  warnOnce(
    'missing-native-performance',
    'Missing native implementation of Performance',
  );
}
