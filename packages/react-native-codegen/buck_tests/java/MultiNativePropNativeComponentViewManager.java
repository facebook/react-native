/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.viewmanagers.MultiNativePropNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.MultiNativePropNativeComponentViewManagerInterface;

public class MultiNativePropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements MultiNativePropNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "MultiNativePropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    MultiNativePropNativeComponentViewManagerDelegate<
            ViewGroup, MultiNativePropNativeComponentViewManager>
        delegate = new MultiNativePropNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setThumbImage(ViewGroup view, ReadableMap value) {}

  @Override
  public void setColor(ViewGroup view, Integer value) {}

  @Override
  public void setThumbTintColor(ViewGroup view, Integer value) {}

  @Override
  public void setPoint(ViewGroup view, ReadableMap value) {}
}
