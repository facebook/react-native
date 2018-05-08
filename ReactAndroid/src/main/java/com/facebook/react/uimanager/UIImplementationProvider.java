/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
