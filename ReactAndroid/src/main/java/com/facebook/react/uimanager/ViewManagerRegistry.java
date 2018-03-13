/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import com.facebook.react.common.MapBuilder;
import java.util.List;
import java.util.Map;
import javax.annotation.Nullable;

/**
 * Class that stores the mapping between native view name used in JS and the corresponding instance
 * of {@link ViewManager}.
 */
public final class ViewManagerRegistry {

  private final Map<String, ViewManager> mViewManagers;
  private final @Nullable UIManagerModule.ViewManagerResolver mViewManagerResolver;

  public ViewManagerRegistry(UIManagerModule.ViewManagerResolver viewManagerResolver) {
    mViewManagers = MapBuilder.newHashMap();
    mViewManagerResolver = viewManagerResolver;
  }

  public ViewManagerRegistry(List<ViewManager> viewManagerList) {
    Map<String, ViewManager> viewManagerMap = MapBuilder.newHashMap();
    for (ViewManager viewManager : viewManagerList) {
      viewManagerMap.put(viewManager.getName(), viewManager);
    }

    mViewManagers = viewManagerMap;
    mViewManagerResolver = null;
  }

  public ViewManagerRegistry(Map<String, ViewManager> viewManagerMap) {
    mViewManagers =
        viewManagerMap != null ? viewManagerMap : MapBuilder.<String, ViewManager>newHashMap();
    mViewManagerResolver = null;
  }

  public ViewManager get(String className) {
    ViewManager viewManager = mViewManagers.get(className);
    if (viewManager != null) {
      return viewManager;
    }
    if (mViewManagerResolver != null) {
      viewManager = mViewManagerResolver.getViewManager(className);
      if (viewManager != null) {
        mViewManagers.put(className, viewManager);
        return viewManager;
      }
    }
    throw new IllegalViewOperationException("No ViewManager defined for class " + className);
  }
}
