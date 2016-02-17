/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Class that stores the mapping between native view name used in JS and the corresponding instance
 * of {@link ViewManager}.
 */
public class ViewManagerRegistry {

  private final Map<String, ViewManager> mViewManagers = new HashMap<>();

  public ViewManagerRegistry(List<ViewManager> viewManagerList) {
    for (ViewManager viewManager : viewManagerList) {
      mViewManagers.put(viewManager.getName(), viewManager);
    }
  }

  public ViewManager get(String className) {
    ViewManager viewManager = mViewManagers.get(className);
    if (viewManager != null) {
      return viewManager;
    } else {
      throw new IllegalViewOperationException("No ViewManager defined for class " + className);
    }
  }
}
