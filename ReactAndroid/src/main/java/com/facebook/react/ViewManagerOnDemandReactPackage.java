/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.List;
import javax.annotation.Nullable;

public interface ViewManagerOnDemandReactPackage {
  /**
   * Provides a list of names of ViewManagers with which these modules can be accessed from JS.
   * Typically, this is ViewManager.getName().
   *
   * @param loadClasses defines if View Managers classes should be loaded or be avoided.
   */
  List<String> getViewManagerNames(ReactApplicationContext reactContext, boolean loadClasses);
  /**
   * Creates and returns a ViewManager with a specific name {@param viewManagerName}. It's up to an
   * implementing package how to interpret the name.
   *
   * @param loadClasses defines if View Managers classes should be loaded or be avoided.
   */
  @Nullable
  ViewManager createViewManager(
      ReactApplicationContext reactContext, String viewManagerName, boolean loadClasses);
}
