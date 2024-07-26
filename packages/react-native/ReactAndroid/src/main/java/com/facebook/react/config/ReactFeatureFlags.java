/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.config;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.proguard.annotations.DoNotStripAny;

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
   * Feature flag to enable the new bridgeless architecture. Note: Enabling this will force enable
   * the following flags: `useTurboModules` & `enableFabricRenderer`.
   */
  public static boolean enableBridgelessArchitecture = false;

  public static boolean dispatchPointerEvents = false;

  /**
   * Feature Flag to enable View Recycling. When enabled, individual ViewManagers must still opt-in.
   */
  public static boolean enableViewRecycling = false;

  /**
   * Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).
   */
  public static boolean enableCppPropsIteratorSetter = false;
}
