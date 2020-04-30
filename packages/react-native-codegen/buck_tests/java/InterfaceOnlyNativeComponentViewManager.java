/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.InterfaceOnlyNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.InterfaceOnlyNativeComponentViewManagerInterface;

public class InterfaceOnlyNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements InterfaceOnlyNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "InterfaceOnlyNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    InterfaceOnlyNativeComponentViewManagerDelegate<
            ViewGroup, InterfaceOnlyNativeComponentViewManager>
        delegate = new InterfaceOnlyNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setTitle(ViewGroup view, String value) {}
}
