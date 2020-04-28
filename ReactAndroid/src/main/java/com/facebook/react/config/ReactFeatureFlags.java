/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.config;

/**
 * Hi there, traveller! This configuration class is not meant to be used by end-users of RN. It
 * contains mainly flags for features that are either under active development and not ready for
 * public consumption, or for use in experiments.
 *
 * <p>These values are safe defaults and should not require manual changes.
 */
public class ReactFeatureFlags {

  /** Whether we should load a specific view manager immediately or when it is accessed by JS */
  public static boolean lazilyLoadViewManagers = false;

  /** Reduce the number of Java-JS interops while accessing native arrays */
  public static boolean useArrayNativeAccessor = false;

  /** Reduce the number of Java-JS interops while accessing native maps */
  public static boolean useMapNativeAccessor = false;

  /**
   * Should this application use TurboModules. If yes, then any module that inherits {@link
   * com.facebook.react.turbomodule.core.interfaces.TurboModule} will NOT be passed in to C++
   * CatalystInstanceImpl
   */
  public static boolean useTurboModules = false;

  /**
   * Log tags of when a view deleted on the native side {@link
   * com.facebook.react.uimanager.NativeViewHierarchyManager dropView}
   */
  public static boolean logDroppedViews = false;

  /*
   * This feature flag enables extra logging on ReactWebViews.
   * Default value is false.
   */
  public static boolean enableExtraWebViewLogs = false;

  /*
   * This feature flag enables logs for Fabric
   */
  public static boolean enableFabricLogs = false;

  /**
   * Should this application use a {@link com.facebook.react.uimanager.ViewManagerDelegate} (if
   * provided) to update the view properties. If {@code false}, then the generated {@code
   * ...$$PropsSetter} class will be used instead.
   */
  public static boolean useViewManagerDelegates = false;
}
