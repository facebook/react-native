/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.unimplementedview;

import static com.facebook.react.views.unimplementedview.ReactUnimplementedViewManager.REACT_CLASS;

import androidx.annotation.Nullable;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * ViewManager for {@link ReactUnimplementedView} to represent a component that is not yet
 * supported.
 */
@ReactModule(name = ReactUnimplementedViewManager.REACT_CLASS)
public class ReactUnimplementedViewManager extends ViewGroupManager<ReactUnimplementedView> {

  public static final String REACT_CLASS = "UnimplementedNativeView";

  @Override
  protected ReactUnimplementedView createViewInstance(ThemedReactContext reactContext) {
    return new ReactUnimplementedView(reactContext);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @ReactProp(name = "name")
  public void setName(ReactUnimplementedView view, @Nullable String name) {
    view.setName(name);
  }
}
