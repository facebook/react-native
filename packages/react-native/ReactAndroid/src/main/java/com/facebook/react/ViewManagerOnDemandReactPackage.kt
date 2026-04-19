/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * Interface for React Native packages that provide ViewManagers on-demand rather than eagerly.
 *
 * This interface enables lazy initialization of ViewManagers, improving startup performance by
 * deferring the creation of ViewManager instances until they are actually needed by the JavaScript
 * code. Instead of instantiating all ViewManagers during package initialization, implementing
 * classes can defer creation until a specific ViewManager is requested by name.
 *
 * This pattern is particularly beneficial for applications with many ViewManagers, as it reduces
 * memory footprint and initialization time by only creating the ViewManagers that are actively
 * used.
 *
 * Implementing classes should maintain a registry or factory mechanism to create ViewManagers based
 * on their names when requested.
 *
 * @see com.facebook.react.uimanager.ViewManager
 * @see com.facebook.react.ReactPackage
 */
public interface ViewManagerOnDemandReactPackage {
  /**
   * Provides the names of all ViewManagers available in this package.
   *
   * This method returns a collection of ViewManager names that can be accessed from JavaScript. The
   * names returned should match the values returned by [ViewManager.getName] for each ViewManager
   * that this package can create. The React Native framework uses these names to determine which
   * ViewManagers are available and to request their creation on-demand.
   *
   * This method is called during the initialization phase to register available ViewManagers
   * without actually instantiating them, enabling lazy loading.
   *
   * @param reactContext The React application context, which provides access to the Android
   *   application context and React Native lifecycle information
   * @return A collection of ViewManager names. Returns an empty collection if no ViewManagers are
   *   available. The returned names should be unique within this package
   */
  public fun getViewManagerNames(reactContext: ReactApplicationContext): Collection<String>

  /**
   * Creates and returns a ViewManager instance for the specified name.
   *
   * This method is called lazily when a ViewManager is actually needed by the JavaScript code,
   * rather than during package initialization. The implementation should create and configure the
   * appropriate ViewManager based on the provided name. The name parameter corresponds to one of
   * the names returned by [getViewManagerNames].
   *
   * Implementations have flexibility in how they interpret the name and create ViewManagers. For
   * example, they might use a factory pattern, reflection, or a simple name-to-class mapping.
   *
   * This method may be called on any thread, so implementations should ensure thread safety if
   * necessary.
   *
   * @param reactContext The React application context, which provides access to the Android
   *   application context and React Native lifecycle information needed to initialize the
   *   ViewManager
   * @param viewManagerName The name of the ViewManager to create, matching one of the names
   *   returned by [getViewManagerNames]
   * @return A ViewManager instance for the specified name, or null if the name is not recognized or
   *   the ViewManager cannot be created. Returning null will result in a JavaScript error when the
   *   native component is used
   */
  public fun createViewManager(
      reactContext: ReactApplicationContext,
      viewManagerName: String,
  ): ViewManager<in Nothing, in Nothing>?
}
