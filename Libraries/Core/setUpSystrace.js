/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/**
 * Set up Systrace profiling hooks if necessary.
 * You can use this module directly, or just require InitializeCore.
 */
if (global.__RCTProfileIsProfiling) {
  const Systrace = require('../Performance/Systrace');
  Systrace.installReactHook();
  Systrace.setEnabled(true);
}
