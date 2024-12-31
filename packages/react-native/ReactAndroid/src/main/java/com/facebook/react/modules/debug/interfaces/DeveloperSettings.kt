/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.debug.interfaces

import com.facebook.react.packagerconnection.PackagerConnectionSettings

/** Provides access to React Native developers settings. */
public interface DeveloperSettings {
  /** Return the underlying [PackagerConnectionSettings] instance. */
  public val packagerConnectionSettings: PackagerConnectionSettings

  /** Whether an overlay showing current FPS should be shown. */
  public var isFpsDebugEnabled: Boolean

  /** Whether debug information about transitions should be displayed. */
  public var isAnimationFpsDebugEnabled: Boolean

  /** Whether dev mode should be enabled in JS bundles. */
  public var isJSDevModeEnabled: Boolean

  /** Whether JS bundle should be minified. */
  public var isJSMinifyEnabled: Boolean

  /** Whether element inspector is enabled. */
  public var isElementInspectorEnabled: Boolean

  /** Whether Nuclide JS debugging is enabled. */
  public var isDeviceDebugEnabled: Boolean

  /** Whether remote JS debugging is enabled. */
  public var isRemoteJSDebugEnabled: Boolean

  /** Whether Start Sampling Profiler on App Start is enabled. */
  @Deprecated(
      "Legacy sampling profiler is no longer supported - This field will be removed in React Native 0.77")
  public var isStartSamplingProfilerOnInit: Boolean

  /** Whether HMR is enabled. */
  public var isHotModuleReplacementEnabled: Boolean

  /** Add an item to the dev menu. */
  public fun addMenuItem(title: String)
}
