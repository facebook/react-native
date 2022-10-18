/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.RNTNativeComponentWithStateManagerDelegate;
import com.facebook.react.viewmanagers.RNTNativeComponentWithStateManagerInterface;

/** View manager for {@link NativeViewVithState} components. */
@ReactModule(name = NativeViewWithStateManager.REACT_CLASS)
public class NativeViewWithStateManager extends SimpleViewManager<NativeViewWithState>
    implements RNTNativeComponentWithStateManagerInterface<NativeViewWithState> {

  public static final String REACT_CLASS = "RNTNativeComponentWithState";

  private final ViewManagerDelegate<NativeViewWithState> mDelegate =
      new RNTNativeComponentWithStateManagerDelegate<>(this);

  @Nullable
  @Override
  protected ViewManagerDelegate<NativeViewWithState> getDelegate() {
    return mDelegate;
  }

  @NonNull
  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @NonNull
  @Override
  protected NativeViewWithState createViewInstance(@NonNull ThemedReactContext reactContext) {
    return new NativeViewWithState(reactContext);
  }

  @Override
  @ReactProp(name = "imageSource")
  public void setImageSource(NativeViewWithState view, @Nullable ReadableMap value) {
    view.setImageSource(value);
  }
}
