/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component;

import android.graphics.Color;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;

/** Legacy View manager (non Fabric compatible) for {@link MyNativeView} components. */
@ReactModule(name = MyLegacyViewManager.REACT_CLASS)
public class MyLegacyViewManager extends SimpleViewManager<MyNativeView> {

  public static final String REACT_CLASS = "RNTMyLegacyNativeView";
  private final ReactApplicationContext mCallerContext;

  public MyLegacyViewManager(ReactApplicationContext reactContext) {
    mCallerContext = reactContext;
  }

  @NonNull
  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @NonNull
  @Override
  protected MyNativeView createViewInstance(@NonNull ThemedReactContext reactContext) {
    MyNativeView view = new MyNativeView(reactContext);
    view.setBackgroundColor(Color.RED);
    return view;
  }

  @Override
  @ReactProp(name = ViewProps.OPACITY, defaultFloat = 1.f)
  public void setOpacity(@NonNull MyNativeView view, float opacity) {
    super.setOpacity(view, opacity);
  }

  @ReactProp(name = ViewProps.COLOR)
  public void setColor(@NonNull MyNativeView view, @Nullable String color) {
    view.setBackgroundColor(Color.parseColor(color));
  }
}
