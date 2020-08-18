/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import androidx.annotation.Nullable;
import com.facebook.react.common.MapBuilder;
import java.util.List;
import java.util.Map;

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

  /**
   * @param className {@link String} that identifies the {@link ViewManager} inside the {@link
   *     ViewManagerRegistry}. This methods {@throws IllegalViewOperationException} if there is no
   *     view manager registered for the className received as a parameter.
   * @return the {@link ViewManager} registered to the className received as a parameter
   */
  public ViewManager get(String className) {
    ViewManager viewManager = mViewManagers.get(className);
    if (viewManager != null) {
      return viewManager;
    }
    if (mViewManagerResolver != null) {
      viewManager = getViewManagerFromResolver(className);
      if (viewManager != null) return viewManager;
      throw new IllegalViewOperationException("ViewManagerResolver returned null for " + className);
    }
    throw new IllegalViewOperationException("No ViewManager found for class " + className);
  }

  private @Nullable ViewManager getViewManagerFromResolver(String className) {
    @Nullable ViewManager viewManager;
    viewManager = mViewManagerResolver.getViewManager(className);
    if (viewManager != null) {
      mViewManagers.put(className, viewManager);
    }
    return viewManager;
  }

  /**
   * @param className {@link String} that identifies the {@link ViewManager} inside the {@link
   *     ViewManagerRegistry}.
   * @return the {@link ViewManager} registered to the className received as a parameter or null if
   *     there is no ViewManager associated to the className received as a parameter.
   */
  @Nullable
  ViewManager getViewManagerIfExists(String className) {
    ViewManager viewManager = mViewManagers.get(className);
    if (viewManager != null) {
      return viewManager;
    }
    if (mViewManagerResolver != null) {
      return getViewManagerFromResolver(className);
    }
    return null;
  }
}
