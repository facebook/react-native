/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.debug.interfaces

/** Provides access to React Native developers settings. */
public interface DeveloperSettings {

  /** whether an overlay showing current FPS should be shown. */
  public fun isFpsDebugEnabled(): Boolean

  /** Whether debug information about transitions should be displayed. */
  public fun isAnimationFpsDebugEnabled(): Boolean

  /** Whether dev mode should be enabled in JS bundles. */
  public fun isJSDevModeEnabled(): Boolean

  /** Whether JS bundle should be minified. */
  public fun isJSMinifyEnabled(): Boolean

  /** Whether element inspector is enabled. */
  public fun isElementInspectorEnabled(): Boolean

  /** Whether Nuclide JS debugging is enabled. */
  public fun isDeviceDebugEnabled(): Boolean

  /** Whether remote JS debugging is enabled. */
  public fun isRemoteJSDebugEnabled(): Boolean

  /** Enable/Disable remote JS debugging. */
  public fun setRemoteJSDebugEnabled(remoteJSDebugEnabled: Boolean)

  /** Whether Start Sampling Profiler on App Start is enabled. */
  public fun isStartSamplingProfilerOnInit(): Boolean

  /** Add an item to the dev menu. */
  public fun addMenuItem(title: String)
}
