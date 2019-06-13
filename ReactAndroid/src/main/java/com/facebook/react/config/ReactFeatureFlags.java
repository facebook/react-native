/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.config;

/**
 * Hi there, traveller! This configuration class is not meant to be used by end-users of RN. It
 * contains mainly flags for features that are either under active development and not ready for
 * public consumption, or for use in experiments.
 *
 * These values are safe defaults and should not require manual changes.
 */
public class ReactFeatureFlags {

  /**
   * Whether we should load a specific view manager immediately or when it is accessed by JS
   */
  public static boolean lazilyLoadViewManagers = false;

  /**
   * Reduce the number of Java-JS interops while accessing native arrays
   */
  public static boolean useArrayNativeAccessor = false;

  /**
   * Reduce the number of Java-JS interops while accessing native maps
   */
  public static boolean useMapNativeAccessor = false;

  /**
   * Should this application use TurboModules. If yes, then any module that inherits
   * {@link com.facebook.react.turbomodule.core.interfaces.TurboModule} will NOT be passed in to
   * C++ CatalystInstanceImpl
   */
  public static boolean useTurboModules = false;
}
