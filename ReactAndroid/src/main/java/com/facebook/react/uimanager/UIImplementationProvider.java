/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
package com.facebook.react.uimanager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.events.EventDispatcher;
import java.util.List;

/**
 * Provides UIImplementation to use in {@link UIManagerModule}.
 */
public class UIImplementationProvider {
  public UIImplementation createUIImplementation(
      ReactApplicationContext reactContext,
      UIManagerModule.ViewManagerResolver viewManagerResolver,
      EventDispatcher eventDispatcher,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    return new UIImplementation(
        reactContext,
        viewManagerResolver,
        eventDispatcher,
        minTimeLeftInFrameForNonBatchedOperationMs);
  }
  
  public UIImplementation createUIImplementation(
      ReactApplicationContext reactContext,
      List<ViewManager> viewManagerList,
      EventDispatcher eventDispatcher,
      int minTimeLeftInFrameForNonBatchedOperationMs) {
    return new UIImplementation(
        reactContext,
        viewManagerList,
        eventDispatcher,
        minTimeLeftInFrameForNonBatchedOperationMs);
  }
}
