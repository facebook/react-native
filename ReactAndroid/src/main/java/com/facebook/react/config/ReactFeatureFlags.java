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

  /** Enables Static ViewConfig in RN Android native code. */
  public static boolean enableExperimentalStaticViewConfigs = false;

  public static boolean enableRuntimeScheduler = false;

  public static boolean enableRuntimeSchedulerInTurboModule = false;

  /** Feature flag to configure eager attachment of the root view/initialisation of the JS code */
  public static boolean enableEagerRootViewAttachment = false;

  private static boolean mapBufferSerializationEnabled = false;

  /** Enables or disables MapBuffer Serialization */
  public static void setMapBufferSerializationEnabled(boolean enabled) {
    mapBufferSerializationEnabled = enabled;
  }

  public static boolean isMapBufferSerializationEnabled() {
    return mapBufferSerializationEnabled;
  }

  /** Feature Flag to use overflowInset values provided by Yoga */
  private static boolean useOverflowInset = false;

  public static void setUseOverflowInset(boolean enabled) {
    useOverflowInset = enabled;
  }

  public static boolean doesUseOverflowInset() {
    return useOverflowInset;
  }

  public static boolean enableLockFreeEventDispatcher = false;

  public static boolean enableAggressiveEventEmitterCleanup = false;

  public static boolean insertZReorderBarriersOnViewGroupChildren = true;

  /** TODO: T107492383 Delete this flag. Enables postprocessor for rounded corners for Image */
  public static boolean enableRoundedCornerPostprocessing = false;
}
