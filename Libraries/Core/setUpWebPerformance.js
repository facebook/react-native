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

// TODO: Replace setUpPerformance with this once the WebPerformance API is stable (T143070419)
export default function setUpPerformance() {
  // $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it.
  global.performance = new Performance();
}
