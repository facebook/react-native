/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.uimanager;

import android.view.ViewGroup;
import android.widget.FrameLayout;

/** View manager for ReactRootView components. */
public class RootViewManager extends ViewGroupManager<ViewGroup> {

  public static final String REACT_CLASS = "RootView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ViewGroup createViewInstance(ThemedReactContext reactContext) {
    return new FrameLayout(reactContext);
  }
}
