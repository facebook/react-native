/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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

  /** Feature flag to configure eager initialization of Fabric */
  public static boolean eagerInitializeFabric = false;

  /** Enables Static ViewConfig in RN Android native code. */
  public static boolean enableExperimentalStaticViewConfigs = false;

  public static boolean enableRuntimeScheduler = false;

  /** Enables a more aggressive cleanup during destruction of ReactContext */
  public static boolean enableReactContextCleanupFix = false;

  /** Feature flag to configure eager initialization of MapBuffer So file */
  public static boolean enableEagerInitializeMapBufferSoFile = false;

  private static boolean mapBufferSerializationEnabled = false;

  /** Enables or disables MapBuffer Serialization */
  public static void setMapBufferSerializationEnabled(boolean enabled) {
    mapBufferSerializationEnabled = enabled;
  }

  public static boolean isMapBufferSerializationEnabled() {
    return mapBufferSerializationEnabled;
  }

  /** Enables Fabric for LogBox */
  public static boolean enableFabricInLogBox = false;

  public static boolean enableLockFreeEventDispatcher = false;

  public static boolean enableAggressiveEventEmitterCleanup = false;
}
