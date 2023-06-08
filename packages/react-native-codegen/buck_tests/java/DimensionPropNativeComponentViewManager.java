/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.DimensionPropNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.DimensionPropNativeComponentViewManagerInterface;
import com.facebook.yoga.YogaValue;

public class DimensionPropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements DimensionPropNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "DimensionPropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    DimensionPropNativeComponentViewManagerDelegate<
            ViewGroup, DimensionPropNativeComponentViewManager>
        delegate = new DimensionPropNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setMarginBack(ViewGroup view, YogaValue value) {}
}
