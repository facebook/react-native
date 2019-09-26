/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.fabric.mounting;

import androidx.annotation.UiThread;
import android.view.View;
import com.facebook.react.uimanager.ReactStylesDiffMap;
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
    String componentName, ReactStylesDiffMap props, ThemedReactContext context) {
    return mViewManagerRegistry.get(componentName).createViewWithProps(context, props, null);
  }

  @UiThread
  @Override
  public void recycle(ThemedReactContext context, String componentName, View view) {
    // do nothing
  }
}
