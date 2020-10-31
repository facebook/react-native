/*
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
 * <p>These values are safe defaults and should not require manual changes.
 */
public class ReactFeatureFlags {

  /**
   * Should this application use TurboModules? If yes, then any module that inherits {@link
   * com.facebook.react.turbomodule.core.interfaces.TurboModule} will NOT be passed in to C++
   * CatalystInstanceImpl
   */
  public static volatile boolean useTurboModules = false;

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

  /**
   * Should this application use a {@link com.facebook.react.uimanager.ViewManagerDelegate} (if
   * provided) to execute the view commands. If {@code false}, then {@code receiveCommand} method
   * inside view manager will be called instead.
   */
  public static boolean useViewManagerDelegatesForCommands = false;

  /**
   * This react flag enables a custom algorithm for the getChildVisibleRect() method in the classes
   * ReactViewGroup, ReactHorizontalScrollView and ReactScrollView.
   *
   * <p>This new algorithm clip child rects if overflow is set to ViewProps.HIDDEN. More details in
   * https://github.com/facebook/react-native/issues/23870 and
   * https://github.com/facebook/react-native/pull/26334
   *
   * <p>The react flag is disabled by default because this is increasing ANRs (T57363204)
   */
  public static boolean clipChildRectsIfOverflowIsHidden = false;

  /**
   * Temporary feature flat to control a fix in the transition to layoutOnlyViews TODO T61185028:
   * remove this when bug is fixed
   */
  public static boolean enableTransitionLayoutOnlyViewCleanup = false;

  /** Feature flag to configure eager initialization of Fabric */
  public static boolean eagerInitializeFabric = false;

  /** Feature flag to use stopSurface when ReactRootView is unmounted. */
  public static boolean enableStopSurfaceOnRootViewUnmount = false;

  /** Use experimental SetState retry mechanism in view? */
  public static boolean enableExperimentalStateUpdateRetry = false;

  /** Enable caching of Spannable objects using equality of ReadableNativeMaps */
  public static boolean enableSpannableCacheByReadableNativeMapEquality = true;

  /** Disable customDrawOrder in ReactViewGroup under Fabric only. */
  public static boolean disableCustomDrawOrderFabric = false;

  /** Potential bugfix for crashes caused by mutating the view hierarchy during onDraw. */
  public static boolean enableDrawMutationFix = true;
}
