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
   * Should this application use Catalyst Teardown V2? This is an experiment to use a V2 of the
   * CatalystInstanceImpl `destroy` method.
   */
  public static boolean useCatalystTeardownV2 = false;

  /**
   * When the ReactContext is destroyed, should the CatalystInstance immediately be nullified? This
   * is the safest thing to do since the CatalystInstance shouldn't be used, and should be
   * garbage-collected after it's destroyed, but this is a breaking change in that many native
   * modules assume that a ReactContext will always have a CatalystInstance. This will be deleted
   * and the CatalystInstance will always be destroyed in some future release.
   */
  public static boolean nullifyCatalystInstanceOnDestroy = false;

  /**
   * Temporary flag. See UIImplementation: if this flag is enabled, ViewCommands will be queued and
   * executed before any other types of UI operations.
   */
  public static boolean allowEarlyViewCommandExecution = false;

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
}
