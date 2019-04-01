/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting;

import android.view.View;
import androidx.annotation.UiThread;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerRegistry;
import java.util.WeakHashMap;

/** Class that provides pool for views based on {@link ThemedReactContext}. */
public final class ContextBasedViewPool implements ViewFactory {
  private final WeakHashMap<ThemedReactContext, ViewPool> mContextViewPoolHashMap =
      new WeakHashMap<>();
  private final ViewManagerRegistry mViewManagerRegistry;

  ContextBasedViewPool(ViewManagerRegistry viewManagerRegistry) {
    mViewManagerRegistry = viewManagerRegistry;
  }

  @UiThread
  void createView(ThemedReactContext context, String componentName) {
    getViewPool(context).createView(componentName, context);
  }

  @UiThread
  @Override
  public View getOrCreateView(String componentName, ThemedReactContext context) {
    return getViewPool(context).getOrCreateView(componentName, context);
  }

  @UiThread
  @Override
  public void recycle(ThemedReactContext context, String componentName, View view) {
    getViewPool(context).returnToPool(componentName, view);
  }

  @UiThread
  private ViewPool getViewPool(ThemedReactContext context) {
    ViewPool pool = mContextViewPoolHashMap.get(context);
    if (pool == null) {
      pool = new ViewPool(mViewManagerRegistry);
      mContextViewPoolHashMap.put(context, pool);
    }
    return pool;
  }
}
