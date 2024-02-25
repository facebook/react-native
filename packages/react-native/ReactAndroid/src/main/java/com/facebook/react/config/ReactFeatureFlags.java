/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.config;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.proguard.annotations.DoNotStripAny;
import com.facebook.react.common.build.ReactBuildConfig;

/**
 * Hi there, traveller! This configuration class is not meant to be used by end-users of RN. It
 * contains mainly flags for features that are either under active development and not ready for
 * public consumption, or for use in experiments.
 *
 * <p>These values are safe defaults and should not require manual changes.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
@Deprecated(since = "Use com.facebook.react.internal.featureflags.ReactNativeFeatureFlags instead.")
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
   * By default, native module methods that return void run asynchronously. This flag will make
   * execution of void methods in TurboModules stay on the JS thread.
   */
  public static volatile boolean unstable_enableTurboModuleSyncVoidMethods = false;

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
  public static volatile boolean enableBridgelessArchitectureNewCreateReloadDestroy = true;

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

  /** Report mount operations from the host platform to notify mount hooks. */
  public static boolean enableMountHooks = false;

  /** Use native view configs in bridgeless mode. */
  public static boolean useNativeViewConfigsInBridgelessMode = false;

  /** When enabled, Fabric will avoid cloning notes to perform state progression. */
  public static boolean enableClonelessStateProgression = false;

  /** When enabled, rawProps in Props will not include Yoga specific props. */
  public static boolean excludeYogaFromRawProps = false;

  /**
   * Enables storing js caller stack when creating promise in native module. This is useful in case
   * of Promise rejection and tracing the cause.
   */
  public static boolean traceTurboModulePromiseRejections = ReactBuildConfig.DEBUG;

  /**
   * Enables auto rejecting promises from Turbo Modules method calls. If native error occurs Promise
   * in JS will be rejected (The JS error will include native stack)
   */
  public static boolean rejectTurboModulePromiseOnNativeError = true;

  /*
   * When the app is completely migrated to Fabric, set this flag to true to
   * disable parts of Paper infrastructure that are not needed anymore but consume
   * memory and CPU. Specifically, UIViewOperationQueue and EventDispatcherImpl will no
   * longer work as they won't subscribe to ReactChoreographer for updates.
   */
  public static boolean enableFabricRendererExclusively = false;
}
