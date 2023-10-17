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

  /** In Bridgeless mode, should legacy NativeModules use the TurboModule system? */
  public static volatile boolean unstable_useTurboModuleInterop = false;

  /**
   * Temporary flag that will be used to validate the staibility of the TurboModule interop layer.
   * Force all Java NativeModules that are TurboModule-compatible (that would have otherwise gone
   * through the C++ codegen method dispatch path) instead through the TurboModule interop layer
   * (i.e: the JavaInteropTurboModule method dispatch path).
   */
  public static volatile boolean unstable_useTurboModuleInteropForAllTurboModules = false;

  /**
   * Should this application use the new (Fabric) Renderer? If yes, all rendering in this app will
   * use Fabric instead of the legacy renderer.
   */
  public static volatile boolean enableFabricRenderer = false;

  /**
   * Should this application enable the Fabric Interop Layer for Android? If yes, the application
   * will behave so that it can accept non-Fabric components and render them on Fabric. This toggle
   * is controlling extra logic such as custom event dispatching that are needed for the Fabric
   * Interop Layer to work correctly.
   */
  public static volatile boolean unstable_useFabricInterop = false;

  /**
   * Should this application always use the Native RuntimeScheduler? If yes, we'll be instantiating
   * it over all the architectures (both Old and New). This is intentionally set to true as we want
   * to use it more as a kill-switch to turn off this feature to potentially debug issues.
   */
  public static volatile boolean unstable_useRuntimeSchedulerAlways = true;

  /**
   * Feature flag to enable the new bridgeless architecture. Note: Enabling this will force enable
   * the following flags: `useTurboModules` & `enableFabricRenderer`.
   */
  public static boolean enableBridgelessArchitecture = false;

  /** Server-side gating for a hacky fix to an ANR in the bridgeless core, related to Bolts task. */
  public static boolean unstable_bridgelessArchitectureMemoryPressureHackyBoltsFix = false;

  /**
   * Does the bridgeless architecture log soft exceptions. Could be useful for tracking down issues.
   */
  public static volatile boolean enableBridgelessArchitectureSoftExceptions = false;

  /** Does the bridgeless architecture use the new create/reload/destroy routines */
  public static volatile boolean enableBridgelessArchitectureNewCreateReloadDestroy = false;

  /** This feature flag enables logs for Fabric */
  public static boolean enableFabricLogs = false;

  /** Feature flag to configure eager attachment of the root view/initialisation of the JS code */
  public static boolean enableEagerRootViewAttachment = false;

  /** Enables or disables calculation of Transformed Frames */
  public static boolean calculateTransformedFramesEnabled = false;

  public static boolean dispatchPointerEvents = false;

  /** Feature Flag to enable a cache of Spannable objects used by TextLayoutManagerMapBuffer */
  public static boolean enableTextSpannableCache = false;

  /** Feature Flag to enable the pending event queue in fabric before mounting views */
  public static boolean enableFabricPendingEventQueue = false;

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

  /**
   * Allow fix to drop delete...create mutations which could cause missing view state in Fabric
   * SurfaceMountingManager.
   */
  public static boolean reduceDeleteCreateMutation = false;

  /**
   * Use JSI NativeState API to store references to native objects rather than the more expensive
   * HostObject pattern
   */
  public static boolean useNativeState = false;

  /** Report mount operations from the host platform to notify mount hooks. */
  public static boolean enableMountHooks = false;

  /** Fixes a leak in SurfaceMountingManager.mTagSetForStoppedSurface */
  public static boolean fixStoppedSurfaceTagSetLeak = true;

  /** Disable the background executor for layout in Fabric */
  public static boolean enableBackgroundExecutor = false;

  /** Use native view configs in bridgeless mode. */
  public static boolean useNativeViewConfigsInBridgelessMode = false;

  /** Only swap left and right on Android in RTL scripts. */
  public static boolean doNotSwapLeftAndRightOnAndroidInLTR = false;

  /** Clean yoga node when <Text /> does not change. */
  public static boolean enableCleanParagraphYogaNode = false;

  /** Default state updates and events to async batched priority. */
  public static boolean enableDefaultAsyncBatchedPriority = false;

  /** Utilize shared Event C++ pipeline with fabric's renderer */
  public static boolean enableFabricSharedEventPipeline = true;

  /** When enabled, Fabric will avoid cloning notes to perform state progression. */
  public static boolean enableClonelessStateProgression = false;

  /** When enabled, rawProps in Props will not include Yoga specific props. */
  public static boolean excludeYogaFromRawProps = false;

  /** Enables Stable API for TurboModule (removal of ReactModule, ReactModuleInfoProvider). */
  public static boolean enableTurboModuleStableAPI = false;
}
