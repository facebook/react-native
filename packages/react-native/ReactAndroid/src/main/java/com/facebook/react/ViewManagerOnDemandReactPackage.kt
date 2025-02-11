/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

public interface ViewManagerOnDemandReactPackage {
  /**
   * Provides a list of names of ViewManagers with which these modules can be accessed from JS.
   * Typically, this is ViewManager.getName().
   */
  public fun getViewManagerNames(reactContext: ReactApplicationContext): Collection<String>

  /**
   * Creates and returns a ViewManager with a specific name {@param viewManagerName}. It's up to an
   * implementing package how to interpret the name.
   */
  public fun createViewManager(
      reactContext: ReactApplicationContext,
      viewManagerName: String
  ): ViewManager<in Nothing, in Nothing>?
}
