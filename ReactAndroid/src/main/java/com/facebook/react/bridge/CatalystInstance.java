/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import javax.annotation.Nullable;

import java.io.IOException;
import java.io.StringWriter;
import java.util.Collection;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.queue.CatalystQueueConfiguration;
import com.facebook.react.bridge.queue.CatalystQueueConfigurationSpec;
import com.facebook.react.bridge.queue.QueueThreadExceptionHandler;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.infer.annotation.Assertions;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.TraceListener;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;

/**
 * A higher level API on top of the asynchronous JSC bridge. This provides an
 * environment allowing the invocation of JavaScript methods and lets a set of
 * Java APIs be invokable from JavaScript as well.
 */
@DoNotStrip
public class CatalystInstance {

  private static final int BRIDGE_SETUP_TIMEOUT_MS = 30000;
  private static final int LOAD_JS_BUNDLE_TIMEOUT_MS = 30000;

  private static final AtomicInteger sNextInstanceIdForTrace = new AtomicInteger(1);

  // Access from any thread
  private final CatalystQueueConfiguration mCatalystQueueConfiguration;
  private final CopyOnWriteArrayList<NotThreadSafeBridgeIdleDebugListener> mBridgeIdleListeners;
  private final AtomicInteger mPendingJSCalls = new AtomicInteger(0);
  private final String mJsPendingCallsTitleForTrace =
      "pending_js_calls_instance" + sNextInstanceIdForTrace.getAndIncrement();
  private volatile boolean mDestroyed = false;
  private final TraceListener mTraceListener;
  private final JavaScriptModuleRegistry mJSModuleRegistry;
  private final JSBundleLoader mJSBundleLoader;

  // Access from native modules thread
  private final NativeModuleRegistry mJavaRegistry;
  private final NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
  private boolean mInitialized = false;

  // Access from JS thread
  private @Nullable ReactBridge mBridge;
  private boolean mJSBundleHasLoaded;

  private CatalystInstance(
      final CatalystQueueConfigurationSpec catalystQueueConfigurationSpec,
      final JavaScriptExecutor jsExecutor,
      final NativeModuleRegistry registry,
      final JavaScriptModulesConfig jsModulesConfig,
      final JSBundleLoader jsBundleLoader,
      NativeModuleCallExceptionHandler nativeModuleCallExceptionHandler) {
    mCatalystQueueConfiguration = CatalystQueueConfiguration.create(
        catalystQueueConfigurationSpec,
        new NativeExceptionHandler());
    mBridgeIdleListeners = new CopyOnWriteArrayList<>();
    mJavaRegistry = registry;
    mJSModuleRegistry = new JavaScriptModuleRegistry(CatalystInstance.this, jsModulesConfig);
    mJSBundleLoader = jsBundleLoader;
    mNativeModuleCallExceptionHandler = nativeModuleCallExceptionHandler;
    mTraceListener = new JSProfilerTraceListener();
    Systrace.registerListener(mTraceListener);

    final CountDownLatch initLatch = new CountDownLatch(1);
    mCatalystQueueConfiguration.getJSQueueThread().runOnQueue(
        new Runnable() {
          @Override
          public void run() {
            initializeBridge(jsExecutor, jsModulesConfig);
            initLatch.countDown();
          }
        });

    try {
      Assertions.assertCondition(
          initLatch.await(BRIDGE_SETUP_TIMEOUT_MS, TimeUnit.MILLISECONDS),
          "Timed out waiting for bridge to initialize!");
    } catch (InterruptedException e) {
      throw new RuntimeException(e);
    }
  }

  private void initializeBridge(
      JavaScriptExecutor jsExecutor,
      JavaScriptModulesConfig jsModulesConfig) {
    mCatalystQueueConfiguration.getJSQueueThread().assertIsOnThread();
    Assertions.assertCondition(mBridge == null, "initializeBridge should be called once");

    mBridge = new ReactBridge(
        jsExecutor,
        new NativeModulesReactCallback(),
        mCatalystQueueConfiguration.getNativeModulesQueueThread());
    mBridge.setGlobalVariable(
        "__fbBatchedBridgeConfig",
        buildModulesConfigJSONProperty(mJavaRegistry, jsModulesConfig));
  }

  public void runJSBundle() {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "CatalystInstance_runJSBundle");

    try {
      final CountDownLatch initLatch = new CountDownLatch(1);
      mCatalystQueueConfiguration.getJSQueueThread().runOnQueue(
          new Runnable() {
            @Override
            public void run() {
              Assertions.assertCondition(!mJSBundleHasLoaded, "JS bundle was already loaded!");
              mJSBundleHasLoaded = true;

              incrementPendingJSCalls();

              mJSBundleLoader.loadScript(mBridge);

              initLatch.countDown();
            }
          });
      Assertions.assertCondition(
          initLatch.await(LOAD_JS_BUNDLE_TIMEOUT_MS, TimeUnit.MILLISECONDS),
          "Timed out loading JS!");
    } catch (InterruptedException e) {
      throw new RuntimeException(e);
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  /* package */ void callFunction(
      final int moduleId,
      final int methodId,
      final NativeArray arguments,
      final String tracingName) {
    if (mDestroyed) {
      FLog.w(ReactConstants.TAG, "Calling JS function after bridge has been destroyed.");
      return;
    }

    incrementPendingJSCalls();

    mCatalystQueueConfiguration.getJSQueueThread().runOnQueue(
        new Runnable() {
          @Override
          public void run() {
            mCatalystQueueConfiguration.getJSQueueThread().assertIsOnThread();

            if (mDestroyed) {
              return;
            }

            Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, tracingName);
            try {
              Assertions.assertNotNull(mBridge).callFunction(moduleId, methodId, arguments);
            } finally {
              Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
            }
          }
        });
  }

  // This is called from java code, so it won't be stripped anyway, but proguard will rename it,
  // which this prevents.
  @DoNotStrip
  /* package */ void invokeCallback(final int callbackID, final NativeArray arguments) {
    if (mDestroyed) {
      FLog.w(ReactConstants.TAG, "Invoking JS callback after bridge has been destroyed.");
      return;
    }

    incrementPendingJSCalls();

    mCatalystQueueConfiguration.getJSQueueThread().runOnQueue(
        new Runnable() {
          @Override
          public void run() {
            mCatalystQueueConfiguration.getJSQueueThread().assertIsOnThread();

            if (mDestroyed) {
              return;
            }

            Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "<callback>");
            try {
              Assertions.assertNotNull(mBridge).invokeCallback(callbackID, arguments);
            } finally {
              Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
            }
          }
        });
  }

  /**
   * Destroys this catalyst instance, waiting for any other threads in CatalystQueueConfiguration
   * (besides the UI thread) to finish running. Must be called from the UI thread so that we can
   * fully shut down other threads.
   */
  /* package */ void destroy() {
    UiThreadUtil.assertOnUiThread();

    if (mDestroyed) {
      return;
    }

    // TODO: tell all APIs to shut down
    mDestroyed = true;
    mJavaRegistry.notifyCatalystInstanceDestroy();
    mCatalystQueueConfiguration.destroy();
    boolean wasIdle = (mPendingJSCalls.getAndSet(0) == 0);
    if (!wasIdle && !mBridgeIdleListeners.isEmpty()) {
      for (NotThreadSafeBridgeIdleDebugListener listener : mBridgeIdleListeners) {
        listener.onTransitionToBridgeIdle();
      }
    }

    if (mTraceListener != null) {
      Systrace.unregisterListener(mTraceListener);
    }

    // We can access the Bridge from any thread now because we know either we are on the JS thread
    // or the JS thread has finished via CatalystQueueConfiguration#destroy()
    Assertions.assertNotNull(mBridge).dispose();
  }

  public boolean isDestroyed() {
    return mDestroyed;
  }

  /**
   * Initialize all the native modules
   */
  @VisibleForTesting
  public void initialize() {
    UiThreadUtil.assertOnUiThread();
    Assertions.assertCondition(
        !mInitialized,
        "This catalyst instance has already been initialized");
    mInitialized = true;
    mJavaRegistry.notifyCatalystInstanceInitialized();
  }

  public CatalystQueueConfiguration getCatalystQueueConfiguration() {
    return mCatalystQueueConfiguration;
  }

  @VisibleForTesting
  public @Nullable
  ReactBridge getBridge() {
    return mBridge;
  }

  public <T extends JavaScriptModule> T getJSModule(Class<T> jsInterface) {
    return Assertions.assertNotNull(mJSModuleRegistry).getJavaScriptModule(jsInterface);
  }

  public <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface) {
    return mJavaRegistry.getModule(nativeModuleInterface);
  }

  public Collection<NativeModule> getNativeModules() {
    return mJavaRegistry.getAllModules();
  }

  /**
   * Adds a idle listener for this Catalyst instance. The listener will receive notifications
   * whenever the bridge transitions from idle to busy and vice-versa, where the busy state is
   * defined as there being some non-zero number of calls to JS that haven't resolved via a
   * onBatchCompleted call. The listener should be purely passive and not affect application logic.
   */
  public void addBridgeIdleDebugListener(NotThreadSafeBridgeIdleDebugListener listener) {
    mBridgeIdleListeners.add(listener);
  }

  /**
   * Removes a NotThreadSafeBridgeIdleDebugListener previously added with
   * {@link #addBridgeIdleDebugListener}
   */
  public void removeBridgeIdleDebugListener(NotThreadSafeBridgeIdleDebugListener listener) {
    mBridgeIdleListeners.remove(listener);
  }

  private String buildModulesConfigJSONProperty(
      NativeModuleRegistry nativeModuleRegistry,
      JavaScriptModulesConfig jsModulesConfig) {
    // TODO(5300733): Serialize config using single json generator
    JsonFactory jsonFactory = new JsonFactory();
    StringWriter writer = new StringWriter();
    try {
      JsonGenerator jg = jsonFactory.createGenerator(writer);
      jg.writeStartObject();
      jg.writeFieldName("remoteModuleConfig");
      jg.writeRawValue(nativeModuleRegistry.moduleDescriptions());
      jg.writeFieldName("localModulesConfig");
      jg.writeRawValue(jsModulesConfig.moduleDescriptions());
      jg.writeEndObject();
      jg.close();
    } catch (IOException ioe) {
      throw new RuntimeException("Unable to serialize JavaScript module declaration", ioe);
    }
    return writer.getBuffer().toString();
  }

  private void incrementPendingJSCalls() {
    int oldPendingCalls = mPendingJSCalls.getAndIncrement();
    boolean wasIdle = oldPendingCalls == 0;
    Systrace.traceCounter(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        mJsPendingCallsTitleForTrace,
        oldPendingCalls + 1);
    if (wasIdle && !mBridgeIdleListeners.isEmpty()) {
      for (NotThreadSafeBridgeIdleDebugListener listener : mBridgeIdleListeners) {
        listener.onTransitionToBridgeBusy();
      }
    }
  }

  private void decrementPendingJSCalls() {
    int newPendingCalls = mPendingJSCalls.decrementAndGet();
    Assertions.assertCondition(newPendingCalls >= 0);
    boolean isNowIdle = newPendingCalls == 0;
    Systrace.traceCounter(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        mJsPendingCallsTitleForTrace,
        newPendingCalls);

    if (isNowIdle && !mBridgeIdleListeners.isEmpty()) {
      for (NotThreadSafeBridgeIdleDebugListener listener : mBridgeIdleListeners) {
        listener.onTransitionToBridgeIdle();
      }
    }
  }

  private class NativeModulesReactCallback implements ReactCallback {

    @Override
    public void call(int moduleId, int methodId, ReadableNativeArray parameters) {
      mCatalystQueueConfiguration.getNativeModulesQueueThread().assertIsOnThread();

      // Suppress any callbacks if destroyed - will only lead to sadness.
      if (mDestroyed) {
        return;
      }

      mJavaRegistry.call(CatalystInstance.this, moduleId, methodId, parameters);
    }

    @Override
    public void onBatchComplete() {
      mCatalystQueueConfiguration.getNativeModulesQueueThread().assertIsOnThread();

      // The bridge may have been destroyed due to an exception during the batch. In that case
      // native modules could be in a bad state so we don't want to call anything on them. We
      // still want to trigger the debug listener since it allows instrumentation tests to end and
      // check their assertions without waiting for a timeout.
      if (!mDestroyed) {
        Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "onBatchComplete");
        try {
          mJavaRegistry.onBatchComplete();
        } finally {
          Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
        }
      }

      decrementPendingJSCalls();
    }
  }

  private class NativeExceptionHandler implements QueueThreadExceptionHandler {

    @Override
    public void handleException(Exception e) {
      // Any Exception caught here is because of something in JS. Even if it's a bug in the
      // framework/native code, it was triggered by JS and theoretically since we were able
      // to set up the bridge, JS could change its logic, reload, and not trigger that crash.
      mNativeModuleCallExceptionHandler.handleException(e);
      mCatalystQueueConfiguration.getUIQueueThread().runOnQueue(
          new Runnable() {
            @Override
            public void run() {
              destroy();
            }
          });
    }
  }

  private class JSProfilerTraceListener implements TraceListener {
    @Override
    public void onTraceStarted() {
      mCatalystQueueConfiguration.getJSQueueThread().runOnQueue(
          new Runnable() {
            @Override
            public void run() {
              mCatalystQueueConfiguration.getJSQueueThread().assertIsOnThread();

              if (mDestroyed) {
                return;
              }
              Assertions.assertNotNull(mBridge).setGlobalVariable(
                  "__BridgeProfilingIsProfiling",
                  "true");
            }
          });
    }

    @Override
    public void onTraceStopped() {
      mCatalystQueueConfiguration.getJSQueueThread().runOnQueue(
          new Runnable() {
            @Override
            public void run() {
              mCatalystQueueConfiguration.getJSQueueThread().assertIsOnThread();

              if (mDestroyed) {
                return;
              }
              Assertions.assertNotNull(mBridge).setGlobalVariable(
                  "__BridgeProfilingIsProfiling",
                  "false");
            }
          });
    }
  }

  public static class Builder {

    private @Nullable CatalystQueueConfigurationSpec mCatalystQueueConfigurationSpec;
    private @Nullable JSBundleLoader mJSBundleLoader;
    private @Nullable NativeModuleRegistry mRegistry;
    private @Nullable JavaScriptModulesConfig mJSModulesConfig;
    private @Nullable JavaScriptExecutor mJSExecutor;
    private @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;

    public Builder setCatalystQueueConfigurationSpec(
        CatalystQueueConfigurationSpec catalystQueueConfigurationSpec) {
      mCatalystQueueConfigurationSpec = catalystQueueConfigurationSpec;
      return this;
    }

    public Builder setRegistry(NativeModuleRegistry registry) {
      mRegistry = registry;
      return this;
    }

    public Builder setJSModulesConfig(JavaScriptModulesConfig jsModulesConfig) {
      mJSModulesConfig = jsModulesConfig;
      return this;
    }

    public Builder setJSBundleLoader(JSBundleLoader jsBundleLoader) {
      mJSBundleLoader = jsBundleLoader;
      return this;
    }

    public Builder setJSExecutor(JavaScriptExecutor jsExecutor) {
      mJSExecutor = jsExecutor;
      return this;
    }

    public Builder setNativeModuleCallExceptionHandler(
        NativeModuleCallExceptionHandler handler) {
      mNativeModuleCallExceptionHandler = handler;
      return this;
    }

    public CatalystInstance build() {
      return new CatalystInstance(
          Assertions.assertNotNull(mCatalystQueueConfigurationSpec),
          Assertions.assertNotNull(mJSExecutor),
          Assertions.assertNotNull(mRegistry),
          Assertions.assertNotNull(mJSModulesConfig),
          Assertions.assertNotNull(mJSBundleLoader),
          Assertions.assertNotNull(mNativeModuleCallExceptionHandler));
    }
  }
}
