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
   * Should application use the new TM callback manager in Cxx? This is assumed to be a sane
   * default, but it's new. We will delete once (1) we know it's safe to ship and (2) we have
   * quantified impact.
   */
  public static volatile boolean useTurboModulesRAIICallbackManager = false;

  /** Should we dispatch TurboModule methods with promise returns to the NativeModules thread? */
  public static volatile boolean enableTurboModulePromiseAsyncDispatch = false;

  /** This feature flag enables logs for Fabric */
  public static boolean enableFabricLogs = false;

  /** Feature flag to configure eager initialization of Fabric */
  public static boolean eagerInitializeFabric = false;

  /** Enables Static ViewConfig in RN Android native code. */
  public static boolean enableExperimentalStaticViewConfigs = false;

  /** Enables a more aggressive cleanup during destruction of ReactContext */
  public static boolean enableReactContextCleanupFix = false;

  /** Enables JS Responder in Fabric */
  public static boolean enableJSResponder = false;

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

  //
  // ScrollView C++ UpdateState vs onScroll race fixes
  //

  /* Enables a "state race condition fix" for ScrollViews StateUpdate + onScroll event emitter */
  public static boolean enableScrollViewStateEventRaceFix = false;

  /* Enables another "state race condition fix" for ScrollViews StateUpdate + onScroll event emitter. Races a StateUpdate with every onScroll event. */
  public static boolean enableScrollViewStateEventAlwaysRace = false;

  /* Configure a min scroll delta for UpdateState to be called while still actively scrolling. */
  public static int scrollViewUpdateStateMinScrollDelta = 0;
}
