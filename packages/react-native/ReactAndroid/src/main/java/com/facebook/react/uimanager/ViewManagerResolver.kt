/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

/** Enables lazy discovery of a specific [ViewManager] by its name. */
public interface ViewManagerResolver {
  /**
   * [UIManagerModule] class uses this method to get a [ViewManager] by its name. This is the same
   * name that comes from JS by `UIManager.ViewManagerName` call.
   */
  public fun getViewManager(viewManagerName: String): ViewManager<*, *>?

  /** Provides a list of view manager names to register in JS as `UIManager.ViewManagerName` */
  public fun getViewManagerNames(): Collection<String>
}
