/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting;

import android.support.annotation.UiThread;
import android.view.View;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerRegistry;
import java.util.WeakHashMap;

/** Class that provides pool for views based on {@link ThemedReactContext}. */
public final class ContextBasedViewPool {
  private final WeakHashMap<ThemedReactContext, ViewPool> mContextViewPoolHashMap =
      new WeakHashMap<>();
  private final ViewManagerRegistry mViewManagerRegistry;

  ContextBasedViewPool(ViewManagerRegistry viewManagerRegistry) {
    mViewManagerRegistry = viewManagerRegistry;
  }

  @UiThread
  void createView(ThemedReactContext context, String componentName) {
    UiThreadUtil.assertOnUiThread();
    getViewPool(context).createView(componentName, context);
  }

  @UiThread
  View getOrCreateView(String componentName, ThemedReactContext context) {
    UiThreadUtil.assertOnUiThread();
    return getViewPool(context).getOrCreateView(componentName, context);
  }

  @UiThread
  void returnToPool(ThemedReactContext context, String componentName, View view) {
    UiThreadUtil.assertOnUiThread();
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
