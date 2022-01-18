/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.ViewGroup;
import androidx.annotation.Nullable;
import com.facebook.react.viewmanagers.BooleanPropNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.BooleanPropNativeComponentViewManagerInterface;

public class BooleanPropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements BooleanPropNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "BooleanPropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    BooleanPropNativeComponentViewManagerDelegate<ViewGroup, BooleanPropNativeComponentViewManager>
        delegate = new BooleanPropNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setDisabled(ViewGroup view, boolean value) {}

  @Override
  public void setDisabledNullable(ViewGroup view, @Nullable Boolean value) {}
}
