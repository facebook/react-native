/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.EnumPropNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.EnumPropNativeComponentViewManagerInterface;

public class EnumPropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements EnumPropNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "EnumPropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    EnumPropNativeComponentViewManagerDelegate<ViewGroup, EnumPropNativeComponentViewManager>
        delegate = new EnumPropNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setAlignment(ViewGroup view, String value) {}

  @Override
  public void setIntervals(ViewGroup view, Integer value) {}
}
