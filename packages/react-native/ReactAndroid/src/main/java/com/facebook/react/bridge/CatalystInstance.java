/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import androidx.annotation.Nullable;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.queue.ReactQueueConfiguration;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder;
import com.facebook.react.turbomodule.core.interfaces.NativeMethodCallInvokerHolder;
import java.util.Collection;
import java.util.List;

/**
 * A higher level API on top of the asynchronous JSC bridge. This provides an environment allowing
 * the invocation of JavaScript methods and lets a set of Java APIs be invocable from JavaScript as
 * well.
 */
@DoNotStrip
public interface CatalystInstance
    extends MemoryPressureListener, JSInstance, JSBundleLoaderDelegate {
  void runJSBundle();

  // Returns the status of running the JS bundle; waits for an answer if runJSBundle is running
  boolean hasRunJSBundle();

  /**
   * Return the source URL of the JS Bundle that was run, or {@code null} if no JS bundle has been
   * run yet.
   */
  @Nullable
  String getSourceURL();

  // This is called from java code, so it won't be stripped anyway, but proguard will rename it,
  // which this prevents.
  @Override
  @DoNotStrip
  void invokeCallback(int callbackID, NativeArrayInterface arguments);

  @DoNotStrip
  void callFunction(String module, String method, NativeArray arguments);
  /**
   * Destroys this catalyst instance, waiting for any other threads in ReactQueueConfiguration
   * (besides the UI thread) to finish running. Must be called from the UI thread so that we can
   * fully shut down other threads.
   */
  void destroy();

  boolean isDestroyed();

  /** Initialize all the native modules */
  @VisibleForTesting
  void initialize();

  ReactQueueConfiguration getReactQueueConfiguration();

  <T extends JavaScriptModule> T getJSModule(Class<T> jsInterface);

  <T extends NativeModule> boolean hasNativeModule(Class<T> nativeModuleInterface);

  @Nullable
  <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface);

  @Nullable
  NativeModule getNativeModule(String moduleName);

  JSIModule getJSIModule(JSIModuleType moduleType);

  Collection<NativeModule> getNativeModules();

  /**
   * This method permits a CatalystInstance to extend the known Native modules. This provided
   * registry contains only the new modules to load.
   */
  void extendNativeModules(NativeModuleRegistry modules);

  /**
   * Adds a idle listener for this Catalyst instance. The listener will receive notifications
   * whenever the bridge transitions from idle to busy and vice-versa, where the busy state is
   * defined as there being some non-zero number of calls to JS that haven't resolved via a
   * onBatchCompleted call. The listener should be purely passive and not affect application logic.
   */
  void addBridgeIdleDebugListener(NotThreadSafeBridgeIdleDebugListener listener);

  /**
   * Removes a NotThreadSafeBridgeIdleDebugListener previously added with {@link
   * #addBridgeIdleDebugListener}
   */
  void removeBridgeIdleDebugListener(NotThreadSafeBridgeIdleDebugListener listener);

  /** This method registers the file path of an additional JS segment by its ID. */
  void registerSegment(int segmentId, String path);

  @VisibleForTesting
  void setGlobalVariable(String propName, String jsonValue);

  /**
   * Do not use this anymore. Use {@link #getRuntimeExecutor()} instead. Get the C pointer (as a
   * long) to the JavaScriptCore context associated with this instance.
   *
   * <p>Use the following pattern to ensure that the JS context is not cleared while you are using
   * it: JavaScriptContextHolder jsContext = reactContext.getJavaScriptContextHolder()
   * synchronized(jsContext) { nativeThingNeedingJsContext(jsContext.get()); }
   */
  @Deprecated
  JavaScriptContextHolder getJavaScriptContextHolder();

  RuntimeExecutor getRuntimeExecutor();

  RuntimeScheduler getRuntimeScheduler();

  void addJSIModules(List<JSIModuleSpec> jsiModules);

  /**
   * Returns a hybrid object that contains a pointer to a JS CallInvoker, which is used to schedule
   * work on the JS Thread. Required for TurboModuleManager initialization.
   */
  CallInvokerHolder getJSCallInvokerHolder();

  /**
   * Returns a hybrid object that contains a pointer to a NativeMethodCallInvoker, which is used to
   * schedule work on the NativeModules thread. Required for TurboModuleManager initialization.
   */
  NativeMethodCallInvokerHolder getNativeMethodCallInvokerHolder();

  /**
   * For the time being, we want code relying on the old infra to also work with TurboModules.
   * Hence, we must provide the TurboModuleRegistry to CatalystInstance so that getNativeModule,
   * hasNativeModule, and getNativeModules can also return TurboModules.
   */
  void setTurboModuleManager(JSIModule getter);
}
