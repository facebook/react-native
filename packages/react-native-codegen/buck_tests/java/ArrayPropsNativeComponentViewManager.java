/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.viewmanagers.ArrayPropsNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.ArrayPropsNativeComponentViewManagerInterface;

public class ArrayPropsNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements ArrayPropsNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "ArrayPropsNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    ArrayPropsNativeComponentViewManagerDelegate<ViewGroup, ArrayPropsNativeComponentViewManager>
        delegate = new ArrayPropsNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setNames(ViewGroup view, ReadableArray value) {}

  @Override
  public void setDisableds(ViewGroup view, ReadableArray value) {}

  @Override
  public void setProgress(ViewGroup view, ReadableArray value) {}

  @Override
  public void setRadii(ViewGroup view, ReadableArray value) {}

  @Override
  public void setColors(ViewGroup view, ReadableArray value) {}

  @Override
  public void setSrcs(ViewGroup view, ReadableArray value) {}

  @Override
  public void setPoints(ViewGroup view, ReadableArray value) {}

  @Override
  public void setEdgeInsets(ViewGroup view, ReadableArray value) {}

  @Override
  public void setDimensions(ViewGroup view, ReadableArray value) {}

  @Override
  public void setSizes(ViewGroup view, ReadableArray value) {}

  @Override
  public void setObject(ViewGroup view, ReadableArray value) {}
}
