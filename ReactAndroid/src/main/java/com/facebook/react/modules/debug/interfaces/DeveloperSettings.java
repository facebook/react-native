/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.modules.debug.interfaces;

/** Provides access to React Native developers settings. */
public interface DeveloperSettings {

  /** @return whether an overlay showing current FPS should be shown. */
  boolean isFpsDebugEnabled();

  /** @return Whether debug information about transitions should be displayed. */
  boolean isAnimationFpsDebugEnabled();

  /** @return Whether dev mode should be enabled in JS bundles. */
  boolean isJSDevModeEnabled();

  /** @return Whether JS bundle should be minified. */
  boolean isJSMinifyEnabled();

  /** @return Whether element inspector is enabled. */
  boolean isElementInspectorEnabled();

  /** @return Whether Nuclide JS debugging is enabled. */
  boolean isNuclideJSDebugEnabled();

  /** @return Whether remote JS debugging is enabled. */
  boolean isRemoteJSDebugEnabled();

  /** Enable/Disable remote JS debugging. */
  void setRemoteJSDebugEnabled(boolean remoteJSDebugEnabled);

  /** @return Whether Start Sampling Profiler on App Start is enabled. */
  boolean isStartSamplingProfilerOnInit();
}
