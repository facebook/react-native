<<<<<<< HEAD
=======
/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

>>>>>>> fb/0.62-stable
package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.StringPropNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.StringPropNativeComponentViewManagerInterface;

public class StringPropNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements StringPropNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "StringPropNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    StringPropNativeComponentViewManagerDelegate<ViewGroup, StringPropNativeComponentViewManager>
        delegate = new StringPropNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
<<<<<<< HEAD
  public void setAccessibilityHint(ViewGroup view, String value) {}

  @Override
  public void setAccessibilityRole(ViewGroup view, String value) {}
=======
  public void setPlaceholder(ViewGroup view, String value) {}

  @Override
  public void setDefaultValue(ViewGroup view, String value) {}
>>>>>>> fb/0.62-stable
}
