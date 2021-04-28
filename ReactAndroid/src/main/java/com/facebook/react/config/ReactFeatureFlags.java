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

  /**
   * Should application use the new TM callback manager in Cxx? This is assumed to be a sane
   * default, but it's new. We will delete once (1) we know it's safe to ship and (2) we have
   * quantified impact.
   */
  public static volatile boolean useTurboModulesRAIICallbackManager = false;

  /** Should we dispatch TurboModule methods with promise returns to the NativeModules thread? */
  public static volatile boolean enableTurboModulePromiseAsyncDispatch = false;

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

  /** Enables Static ViewConfig in RN Android native code. */
  public static boolean enableExperimentalStaticViewConfigs = false;

  /** Enables a more aggressive cleanup during destruction of ReactContext */
  public static boolean enableReactContextCleanupFix = false;

  /** Enables JS Responder in Fabric */
  public static boolean enableJSResponder = false;

  /** Enables MapBuffer Serialization */
  public static boolean mapBufferSerializationEnabled = false;

  /** An interface used to compute flags on demand. */
  public interface FlagProvider {
    boolean get();
  }

  /** Should the RuntimeExecutor call JSIExecutor::flush()? */
  private static FlagProvider enableRuntimeExecutorFlushingProvider = null;

  public static void setEnableRuntimeExecutorFlushingFlagProvider(FlagProvider provider) {
    enableRuntimeExecutorFlushingProvider = provider;
  }

  public static boolean enableRuntimeExecutorFlushing() {
    if (enableRuntimeExecutorFlushingProvider != null) {
      return enableRuntimeExecutorFlushingProvider.get();
    }

    return false;
  }

  /** Enables Fabric for LogBox */
  public static boolean enableFabricInLogBox = false;
}
