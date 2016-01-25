/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import java.util.Collection;

import com.facebook.react.bridge.queue.ReactQueueConfiguration;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.common.annotations.VisibleForTesting;

/**
 * A higher level API on top of the asynchronous JSC bridge. This provides an
 * environment allowing the invocation of JavaScript methods and lets a set of
 * Java APIs be invokable from JavaScript as well.
 */
@DoNotStrip
public interface CatalystInstance {
  void runJSBundle();
  // This is called from java code, so it won't be stripped anyway, but proguard will rename it,
  // which this prevents.
  @DoNotStrip
  void invokeCallback(final int callbackID, final NativeArray arguments);
  /**
   * Destroys this catalyst instance, waiting for any other threads in ReactQueueConfiguration
   * (besides the UI thread) to finish running. Must be called from the UI thread so that we can
   * fully shut down other threads.
   */
  void destroy();
  boolean isDestroyed();

  /**
   * Initialize all the native modules
   */
  @VisibleForTesting
  void initialize();

  ReactQueueConfiguration getReactQueueConfiguration();

  <T extends JavaScriptModule> T getJSModule(Class<T> jsInterface);
  <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface);
  Collection<NativeModule> getNativeModules();

  void handleMemoryPressure(MemoryPressure level);

  /**
   * Adds a idle listener for this Catalyst instance. The listener will receive notifications
   * whenever the bridge transitions from idle to busy and vice-versa, where the busy state is
   * defined as there being some non-zero number of calls to JS that haven't resolved via a
   * onBatchCompleted call. The listener should be purely passive and not affect application logic.
   */
  void addBridgeIdleDebugListener(NotThreadSafeBridgeIdleDebugListener listener);

  /**
   * Removes a NotThreadSafeBridgeIdleDebugListener previously added with
   * {@link #addBridgeIdleDebugListener}
   */
  void removeBridgeIdleDebugListener(NotThreadSafeBridgeIdleDebugListener listener);

  boolean supportsProfiling();
  void startProfiler(String title);
  void stopProfiler(String title, String filename);

  @VisibleForTesting
  void setGlobalVariable(String propName, String jsonValue);
}
