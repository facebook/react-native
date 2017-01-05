/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.view.ViewGroup;

/**
 * View manager for ReactRootView components.
 */
public class RootViewManager extends ViewGroupManager<ViewGroup> {

  public static final String REACT_CLASS = "RootView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ViewGroup createViewInstance(ThemedReactContext reactContext) {
    return new SizeMonitoringFrameLayout(reactContext);
  }
}
