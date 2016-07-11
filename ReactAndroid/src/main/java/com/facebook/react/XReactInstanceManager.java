/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.uimanager.UIImplementationProvider;

public abstract class XReactInstanceManager {
  /**
   * Creates a builder that is defaulted to using the new bridge.
   */
  public static ReactInstanceManager.Builder builder() {
    return new ReactInstanceManager.Builder().setUseNewBridge();
  }
}
