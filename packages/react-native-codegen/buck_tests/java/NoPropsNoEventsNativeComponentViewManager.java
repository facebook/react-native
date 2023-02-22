/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.NoPropsNoEventsNativeComponentViewManagerDelegate;
import com.facebook.react.viewmanagers.NoPropsNoEventsNativeComponentViewManagerInterface;

public class NoPropsNoEventsNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements NoPropsNoEventsNativeComponentViewManagerInterface<ViewGroup> {

  public static final String REACT_CLASS = "NoPropsNoEventsNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    NoPropsNoEventsNativeComponentViewManagerDelegate<
            ViewGroup, NoPropsNoEventsNativeComponentViewManager>
        delegate = new NoPropsNoEventsNativeComponentViewManagerDelegate<>(this);
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }
}
