/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.ViewGroup;
import androidx.annotation.Nullable;
import com.facebook.react.viewmanagers.FloatPropsNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.FloatPropsNativeComponentViewManagerInterface;

public class FloatPropsNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements FloatPropsNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "FloatPropsNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    FloatPropsNativeComponentViewManagerDelegate<ViewGroup, FloatPropsNativeComponentViewManager>
        delegate = new FloatPropsNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setBlurRadius(ViewGroup view, float value) {}

  @Override
  public void setBlurRadius2(ViewGroup view, float value) {}

  @Override
  public void setBlurRadius3(ViewGroup view, float value) {}

  @Override
  public void setBlurRadius4(ViewGroup view, float value) {}

  @Override
  public void setBlurRadius5(ViewGroup view, float value) {}

  @Override
  public void setBlurRadius6(ViewGroup view, float value) {}

  @Override
  public void setBlurRadiusNullable(ViewGroup view, @Nullable Float value) {}
}
