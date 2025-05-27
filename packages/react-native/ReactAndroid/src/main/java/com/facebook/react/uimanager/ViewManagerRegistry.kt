/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.content.ComponentCallbacks2
import android.content.res.Configuration
import com.facebook.react.bridge.UiThreadUtil

/**
 * Class that stores the mapping between native view name used in JS and the corresponding instance
 * of [ViewManager].
 */
public class ViewManagerRegistry : ComponentCallbacks2 {

  private val viewManagers: MutableMap<String, ViewManager<*, *>>
  private val viewManagerResolver: ViewManagerResolver?

  public constructor(viewManagerResolver: ViewManagerResolver) {
    this.viewManagers = mutableMapOf<String, ViewManager<*, *>>()
    this.viewManagerResolver = viewManagerResolver
  }

  public constructor(viewManagerList: List<ViewManager<in Nothing, in Nothing>>) {
    viewManagers = viewManagerList.associateBy { it.name }.toMutableMap()
    viewManagerResolver = null
  }

  public constructor(viewManagerMap: Map<String, ViewManager<*, *>>?) {
    viewManagers = viewManagerMap?.toMutableMap() ?: mutableMapOf<String, ViewManager<*, *>>()
    viewManagerResolver = null
  }

  /**
   * @param className [String] that identifies the [ViewManager] inside the [ViewManagerRegistry].
   * @return the [ViewManager] registered to the className
   * @throws [IllegalViewOperationException] if there is no view manager registered for the
   *   className.
   */
  @Synchronized
  public fun get(className: String): ViewManager<*, *> {
    // 1. Try to get the manager without the prefix.
    viewManagers[className]?.let {
      return it
    }

    // 2. Try to get the manager with the RCT prefix.
    val rctViewManagerName = "RCT$className"
    viewManagers[rctViewManagerName]?.let {
      return it
    }

    if (viewManagerResolver != null) {

      // 1. Try to get the manager without the prefix.
      val resolvedManager = getViewManagerFromResolver(className)
      if (resolvedManager != null) {
        return resolvedManager
      }

      // 2. Try to get the manager with the RCT prefix.
      val rctResolvedManager = getViewManagerFromResolver(rctViewManagerName)
      if (rctResolvedManager != null) {
        return rctResolvedManager
      }

      throw IllegalViewOperationException(
          "Can't find ViewManager '$className' nor '$rctViewManagerName' in ViewManagerRegistry, " +
              "existing names are: ${viewManagerResolver.getViewManagerNames()}")
    }

    throw IllegalViewOperationException("No ViewManager found for class $className")
  }

  private fun getViewManagerFromResolver(className: String): ViewManager<*, *>? {
    val viewManager = viewManagerResolver?.getViewManager(className)
    if (viewManager != null) {
      viewManagers[className] = viewManager
    }
    return viewManager
  }

  /**
   * @param className [String] that identifies the [ViewManager] inside the [ViewManagerRegistry].
   * @return the [ViewManager] registered to the className or null if it does not exist
   */
  @JvmName("getViewManagerIfExists")
  @Synchronized
  internal fun getViewManagerIfExists(className: String): ViewManager<*, *>? {
    viewManagers[className]?.let {
      return it
    }
    return viewManagerResolver?.let { getViewManagerFromResolver(className) }
  }

  /** Send lifecycle signal to all ViewManagers that StopSurface has been called. */
  public fun onSurfaceStopped(surfaceId: Int) {
    val viewManagers: List<ViewManager<*, *>> =
        synchronized(this) { ArrayList(viewManagers.values) }

    val runnable = {
      for (viewManager in viewManagers) {
        viewManager.onSurfaceStopped(surfaceId)
      }
    }

    if (UiThreadUtil.isOnUiThread()) {
      runnable()
    } else {
      UiThreadUtil.runOnUiThread(runnable)
    }
  }

  /** Called on instance destroy */
  public fun invalidate() {
    val viewManagers: List<ViewManager<*, *>> =
        synchronized(this) { ArrayList(viewManagers.values) }

    val runnable = {
      for (viewManager in viewManagers) {
        viewManager.invalidate()
      }
    }

    if (UiThreadUtil.isOnUiThread()) {
      runnable()
    } else {
      UiThreadUtil.runOnUiThread(runnable)
    }
  }

  /** ComponentCallbacks2 method. */
  public override fun onTrimMemory(level: Int) {
    val viewManagers: List<ViewManager<*, *>> =
        synchronized(this) { ArrayList(viewManagers.values) }

    val runnable = {
      for (viewManager in viewManagers) {
        viewManager.trimMemory()
      }
    }

    if (UiThreadUtil.isOnUiThread()) {
      runnable()
    } else {
      UiThreadUtil.runOnUiThread(runnable)
    }
  }

  /** ComponentCallbacks2 method. */
  public override fun onConfigurationChanged(newConfig: Configuration): Unit = Unit

  /** ComponentCallbacks2 method. */
  @Deprecated("Overrides deprecated ComponentCallbacks2.onLowMemory()")
  public override fun onLowMemory(): Unit = onTrimMemory(ComponentCallbacks2.TRIM_MEMORY_BACKGROUND)
}
