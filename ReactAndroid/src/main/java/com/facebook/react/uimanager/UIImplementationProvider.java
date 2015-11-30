/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
package com.facebook.react.uimanager;

import java.util.List;

import com.facebook.react.bridge.ReactApplicationContext;

/**
 * Provides UIImplementation to use in {@link UIManagerModule}.
 */
public class UIImplementationProvider {
  public UIImplementation createUIImplementation(
      ReactApplicationContext reactContext,
      List<ViewManager> viewManagers) {
    return new UIImplementation(reactContext, viewManagers);
  }
}
