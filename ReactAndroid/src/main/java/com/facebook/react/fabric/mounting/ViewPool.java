/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting;

import android.support.annotation.UiThread;
import android.view.View;
import com.facebook.react.common.ClearableSynchronizedPool;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import java.util.HashMap;
import java.util.Map;

public final class ViewPool {
  private static final int POOL_SIZE = 512;
  private final Map<String, ClearableSynchronizedPool<View>> mViewPool = new HashMap<>();
  private final ViewManagerRegistry mViewManagerRegistry;

  ViewPool(ViewManagerRegistry viewManagerRegistry) {
    mViewManagerRegistry = viewManagerRegistry;
  }

  @UiThread
  void createView(String componentName, ThemedReactContext context) {
    ClearableSynchronizedPool<View> viewPool = getViewPoolForComponent(componentName);
    ViewManager viewManager = mViewManagerRegistry.get(componentName);
    // TODO: T31905686 Integrate / re-implement jsResponder
    View view = viewManager.createView(context, null);
    viewPool.release(view);
  }

  @UiThread
  View getOrCreateView(String componentName, ThemedReactContext context) {
    ClearableSynchronizedPool<View> viewPool = getViewPoolForComponent(componentName);
    View view = viewPool.acquire();
    if (view == null) {
      createView(componentName, context);
      view = viewPool.acquire();
    }
    return view;
  }

  @UiThread
  void returnToPool(String componentName, View view) {
    ClearableSynchronizedPool<View> viewPool = mViewPool.get(componentName);
    if (viewPool != null) {
      viewPool.release(view);
    }
  }

  private ClearableSynchronizedPool<View> getViewPoolForComponent(String componentName) {
    ClearableSynchronizedPool<View> viewPool = mViewPool.get(componentName);
    if (viewPool == null) {
      viewPool = new ClearableSynchronizedPool<>(POOL_SIZE);
      mViewPool.put(componentName, viewPool);
    }
    return viewPool;
  }
}
