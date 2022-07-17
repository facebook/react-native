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
   * After TurboModules and Fabric are enabled, we need to ensure that the legacy NativeModule isn't
   * isn't used. So, turn this flag on to trigger warnings whenever the legacy NativeModule system
   * is used.
   */
  public static volatile boolean warnOnLegacyNativeModuleSystemUse = false;

  /** Should we dispatch TurboModule methods with promise returns to the NativeModules thread? */
  public static volatile boolean enableTurboModulePromiseAsyncDispatch = false;

  /**
   * Experiment:
   *
   * <p>Bridge and Bridgeless mode can run concurrently. This means that there can be two
   * TurboModule systems alive at the same time.
   *
   * <p>The TurboModule system stores all JS callbacks in a global LongLivedObjectCollection. This
   * collection is cleared when the JS VM is torn down. Implication: Tearing down the bridge JSVM
   * invalidates the bridgeless JSVM's callbacks, and vice versa.
   *
   * <p>useGlobalCallbackCleanupScopeUsingRetainJSCallback => Use a retainJSCallbacks lambda to
   * store jsi::Functions into the global LongLivedObjectCollection
   *
   * <p>useTurboModuleManagerCallbackCleanupScope => Use a retainJSCallbacks labmda to store
   * jsi::Functions into a LongLivedObjectCollection owned by the TurboModuleManager
   */
  public static boolean useGlobalCallbackCleanupScopeUsingRetainJSCallback = false;

  public static boolean useTurboModuleManagerCallbackCleanupScope = false;

  /** This feature flag enables logs for Fabric */
  public static boolean enableFabricLogs = false;

  public static boolean enableRuntimeScheduler = false;

  public static boolean enableRuntimeSchedulerInTurboModule = false;

  /** Feature flag to configure eager attachment of the root view/initialisation of the JS code */
  public static boolean enableEagerRootViewAttachment = false;

  /** Feature flag to configure synchronized queue access for Animated module */
  public static boolean enableSynchronizationForAnimated = false;

  /** Enables or disables MapBuffer Serialization */
  public static boolean mapBufferSerializationEnabled = false;

  /** Feature Flag to use overflowInset values provided by Yoga */
  public static boolean useOverflowInset = false;

  public static boolean enableLockFreeEventDispatcher = false;

  public static boolean enableAggressiveEventEmitterCleanup = false;

  public static boolean insertZReorderBarriersOnViewGroupChildren = true;

  /** Feature Flag for mitigatin concurrent root crashes */
  public static boolean enableDelayedViewStateDeletion = false;

  public static boolean disablePreallocationOnClone = false;

  public static boolean shouldRememberAllocatedViews = false;
  /**
   * Feature Flag to control the size of the cache used by TextLayoutManager in Fabric. Used from
   * JNI.
   */
  public static boolean enableLargeTextMeasureCache = true;

  /** TODO: T113245006 Delete this flag. Enables caching of spannables for text */
  public static boolean enableSpannableCache = false;

  public static boolean dispatchPointerEvents = false;

  /** Feature Flag to enable the pending event queue in fabric before mounting views */
  public static boolean enableFabricPendingEventQueue = false;

  /** Feature Flag to control RN Android scrollEventThrottle prop. */
  public static boolean enableScrollEventThrottle = false;

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
}
