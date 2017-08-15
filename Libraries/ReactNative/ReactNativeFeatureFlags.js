/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeFeatureFlags
 * @flow
 */

'use strict';

// =============================================================================
// IMPORTANT:
// When syncing React Renderer, make sure the feature flags are still compatible
// =============================================================================

var useFiber;

var ReactNativeFeatureFlags = {
  get useFiber(): boolean {
    if (useFiber == null) {
      useFiber = true;
      if (__DEV__) {
        require('Systrace').installReactHook(useFiber);
      }
    }
    return useFiber;
  },
  set useFiber(enabled: boolean): void {
    if (useFiber != null) {
      throw new Error(
        'Cannot set useFiber feature flag after it has been accessed. ' +
        'Please override it before requiring React.',
      );
    }
    useFiber = enabled;
    if (__DEV__) {
      require('Systrace').installReactHook(useFiber);
    }
  },
};

module.exports = ReactNativeFeatureFlags;
