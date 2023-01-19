/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import Performance from '../WebPerformance/Performance';

if (!global.performance) {
  global.performance = new Performance();
}
