/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.config;

import com.facebook.proguard.annotations.DoNotStripAny;

/**
 * Hi there, traveller! This configuration class is not meant to be used by end-users of RN. It
 * contains mainly flags for features that are either under active development and not ready for
 * public consumption, or for use in experiments.
 *
 * <p>These values are safe defaults and should not require manual changes.
 */
@DoNotStripAny
public class ReactFeatureFlags {
  /**
   * Should this application use TurboModules? If yes, then any module that inherits {@link
   * com.facebook.react.turbomodule.core.interfaces.TurboModule} will NOT be passed in to C++
   * CatalystInstanceImpl
   */
  public static volatile boolean useTurboModules = false;

  /**
   * Should this application use the new (Fabric) Renderer? If yes, all rendering in this app will
   * use Fabric instead of the legacy renderer.
   */
  public static volatile boolean enableFabricRenderer = false;

  /**
   * Feature flag to enable the new bridgeless architecture. Note: Enabling this will force enable
   * the following flags: `useTurboModules` & `enableFabricRenderer`.
   */
  public static boolean enableBridgelessArchitecture = false;

  /**
   * Does the bridgeless architecture log soft exceptions. Could be useful for tracking down issues.
   */
  public static volatile boolean enableBridgelessArchitectureSoftExceptions = false;

  /** Does the bridgeless architecture use the new create/reload/destroy routines */
  public static volatile boolean enableBridgelessArchitectureNewCreateReloadDestroy = false;

  /**
   * After TurboModules and Fabric are enabled, we need to ensure that the legacy NativeModule isn't
   * isn't used. So, turn this flag on to trigger warnings whenever the legacy NativeModule system
   * is used.
   */
  public static volatile boolean warnOnLegacyNativeModuleSystemUse = false;

  /** Should we dispatch TurboModule methods with promise returns to the NativeModules thread? */
  public static volatile boolean enableTurboModulePromiseAsyncDispatch = false;

  /** This feature flag enables logs for Fabric */
  public static boolean enableFabricLogs = false;

  /** Feature flag to configure eager attachment of the root view/initialisation of the JS code */
  public static boolean enableEagerRootViewAttachment = false;

  /* Enables or disables MapBuffer use in Props infrastructure. */
  public static boolean useMapBufferProps = false;

  /** Enables or disables calculation of Transformed Frames */
  public static boolean calculateTransformedFramesEnabled = false;

  /** Feature Flag to use overflowInset values provided by Yoga */
  public static boolean useOverflowInset = false;

  public static boolean dispatchPointerEvents = false;

  /** Feature Flag to enable the pending event queue in fabric before mounting views */
  public static boolean enableFabricPendingEventQueue = false;

  /**
   * Feature flag that controls how turbo modules are exposed to JS
   *
   * <ul>
   *   <li>0 = as a HostObject
   *   <li>1 = as a plain object, backed with a HostObject as prototype
   *   <li>2 = as a plain object, with all methods eagerly configured
   * </ul>
   */
  public static int turboModuleBindingMode = 0;

  /**
   * Feature Flag to enable View Recycling. When enabled, individual ViewManagers must still opt-in.
   */
  public static boolean enableViewRecycling = false;

  /**
   * Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).
   */
  public static boolean enableCppPropsIteratorSetter = false;

  /**
   * Allow Differentiator.cpp and FabricMountingManager.cpp to generate a RemoveDeleteTree mega-op.
   */
  public static boolean enableRemoveDeleteTreeInstruction = false;

  /** Temporary flag to allow execution of mount items up to 15ms earlier than normal. */
  public static boolean enableEarlyScheduledMountItemExecution = false;

  /**
   * Allow closing the small gap that appears between paths when drawing a rounded View with a
   * border.
   */
  public static boolean enableCloseVisibleGapBetweenPaths = true;

  /**
   * Allow fix in layout animation to drop delete...create mutations which could cause missing view
   * state in Fabric SurfaceMountingManager.
   */
  public static boolean reduceDeleteCreateMutationLayoutAnimation = true;
}
