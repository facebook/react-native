/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.debug;

/**
 * Provides access to React Native developers settings.
 */
public interface DeveloperSettings {

  /**
   * @return whether an overlay showing current FPS should be shown.
   */
  boolean isFpsDebugEnabled();

  /**
   * @return Whether debug information about transitions should be displayed.
   */
  boolean isAnimationFpsDebugEnabled();

  /**
   * @return Whether dev mode should be enabled in JS bundles.
   */
  boolean isJSDevModeEnabled();

  /**
   * @return Whether JS bundle should be minified.
   */
  boolean isJSMinifyEnabled();

  /**
   * @return Whether element inspector is enabled.
   */
  boolean isElementInspectorEnabled();
}
