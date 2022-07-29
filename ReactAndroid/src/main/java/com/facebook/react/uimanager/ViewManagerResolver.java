/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import java.util.Collection;
import javax.annotation.Nullable;

/** Enables lazy discovery of a specific {@link ViewManager} by its name. */
public interface ViewManagerResolver {
  /**
   * {@class UIManagerModule} class uses this method to get a ViewManager by its name. This is the
   * same name that comes from JS by {@code UIManager.ViewManagerName} call.
   */
  @Nullable
  ViewManager getViewManager(String viewManagerName);

  /**
   * Provides a list of view manager names to register in JS as {@code UIManager.ViewManagerName}
   */
  Collection<String> getViewManagerNames();
}
