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
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.RNTMyNativeViewManagerDelegate;
import com.facebook.react.viewmanagers.RNTMyNativeViewManagerInterface;

/** View manager for {@link MyNativeView} components. */
@ReactModule(name = MyNativeViewManager.REACT_CLASS)
public class MyNativeViewManager extends SimpleViewManager<MyNativeView>
    implements RNTMyNativeViewManagerInterface<MyNativeView> {

  public static final String REACT_CLASS = "RNTMyNativeView";

  private final ViewManagerDelegate<MyNativeView> mDelegate;

  public MyNativeViewManager() {
    mDelegate = new RNTMyNativeViewManagerDelegate<>(this);
  }

  @Nullable
  @Override
  protected ViewManagerDelegate<MyNativeView> getDelegate() {
    return mDelegate;
  }

  @NonNull
  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @NonNull
  @Override
  protected MyNativeView createViewInstance(@NonNull ThemedReactContext reactContext) {
    return new MyNativeView(reactContext);
  }

  @Override
  public void receiveCommand(
      @NonNull MyNativeView view, String commandName, @Nullable ReadableArray args) {
    mDelegate.receiveCommand(view, commandName, args);
  }

  @Override
  public void callNativeMethodToChangeBackgroundColor(MyNativeView view, String color) {
    view.setBackgroundColor(Color.parseColor(color));
  }

  @Override
  @ReactProp(name = ViewProps.OPACITY, defaultFloat = 1.f)
  public void setOpacity(@NonNull MyNativeView view, float opacity) {
    super.setOpacity(view, opacity);
  }
}
