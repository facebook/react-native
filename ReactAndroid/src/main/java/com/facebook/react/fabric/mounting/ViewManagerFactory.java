/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting;

import android.view.View;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerRegistry;

public class ViewManagerFactory implements ViewFactory {

  private ViewManagerRegistry mViewManagerRegistry;

  ViewManagerFactory(ViewManagerRegistry viewManagerRegistry) {
    mViewManagerRegistry = viewManagerRegistry;
  }

  @UiThread
  @Override
  public View getOrCreateView(
      String componentName,
      @Nullable ReactStylesDiffMap props,
      @Nullable StateWrapper stateWrapper,
      ThemedReactContext context) {
    return mViewManagerRegistry.get(componentName).createView(context, props, stateWrapper, null);
  }

  @UiThread
  @Override
  public void recycle(ThemedReactContext context, String componentName, View view) {
    // do nothing
  }
}
