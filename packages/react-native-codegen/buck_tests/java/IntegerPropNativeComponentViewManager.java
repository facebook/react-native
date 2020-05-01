/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.IntegerPropNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.IntegerPropNativeComponentViewManagerInterface;

public class IntegerPropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements IntegerPropNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "IntegerPropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    IntegerPropNativeComponentViewManagerDelegate<ViewGroup, IntegerPropNativeComponentViewManager>
        delegate = new IntegerPropNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setProgress1(ViewGroup view, int value) {}

  @Override
  public void setProgress2(ViewGroup view, int value) {}

  @Override
  public void setProgress3(ViewGroup view, int value) {}
}
