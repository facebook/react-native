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

  /** Should we dispatch TurboModule methods with promise returns to the NativeModules thread? */
  public static volatile boolean enableTurboModulePromiseAsyncDispatch = false;

  /** Enable TurboModule JS Codegen. */
  public static volatile boolean useTurboModuleJSCodegen = false;

  /**
   * Enable the fix to validate the TurboReactPackage's module info before resolving a TurboModule.
   */
  public static volatile boolean enableTurboModulePackageInfoValidation = false;

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
   * Temporary feature flat to control a fix in the transition to layoutOnlyViews TODO T61185028:
   * remove this when bug is fixed
   */
  public static boolean enableTransitionLayoutOnlyViewCleanup = false;

  /** Feature flag to configure eager initialization of Fabric */
  public static boolean eagerInitializeFabric = false;

  /** Use lock-free data structures for Fabric MountItems. */
  public static boolean enableLockFreeMountInstructions = false;

  /** Temporary flag for FB-internal workaround for RN:Litho interop in non-Fabric RN. */
  public static boolean enableNonFabricRNLithoForceLayout = true;

  /** Disable UI update operations in non-Fabric renderer after catalyst instance was destroyed */
  public static boolean disableNonFabricViewOperationsOnCatalystDestroy = false;

  /**
   * Fixes race-condition in the initialization of RN surface. TODO T78832286: remove this flag once
   * we verify the fix is correct in production
   */
  public static boolean enableStartSurfaceRaceConditionFix = false;

  /** Enables the usage of an experimental optimized iterator for ReadableNativeMaps. */
  public static boolean enableExperimentalReadableNativeMapIterator = false;

  /** Enables Static ViewConfig in RN Android native code. */
  public static boolean enableExperimentalStaticViewConfigs = false;
}
