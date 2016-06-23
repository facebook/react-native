/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

public interface ReactApplication {

  /**
   * Get the default {@link ReactNativeHost} for this app.
   */
  ReactNativeHost getReactNativeHost();
}
