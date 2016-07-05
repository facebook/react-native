/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.cxxbridge;

import javax.annotation.Nullable;

import java.lang.ref.WeakReference;
import java.util.Collection;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import android.content.res.AssetManager;

import com.facebook.common.logging.FLog;
import com.facebook.jni.HybridData;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.ExecutorToken;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.JavaScriptModuleRegistry;
import com.facebook.react.bridge.MemoryPressure;
import com.facebook.react.bridge.NativeArray;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.NativeModuleCallExceptionHandler;
import com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener;
import com.facebook.react.bridge.queue.ReactQueueConfiguration;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.bridge.queue.QueueThreadExceptionHandler;
import com.facebook.react.bridge.queue.ReactQueueConfigurationImpl;
import com.facebook.react.bridge.queue.ReactQueueConfigurationSpec;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.infer.annotation.Assertions;
import com.facebook.soloader.SoLoader;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.TraceListener;

/**
 * This provides an implementation of the public CatalystInstance instance.  It is public because
 * it is built by XReactInstanceManager which is in a different package.
 */
@DoNotStrip
public class CatalystInstanceImpl implements CatalystInstance {

  /* package */ static final String REACT_NATIVE_LIB = "reactnativejnifb";

  static {
    SoLoader.loadLibrary(REACT_NATIVE_LIB);
  }

  private static final int BRIDGE_SETUP_TIMEOUT_MS = 30000;
  private static final int LOAD_JS_BUNDLE_TIMEOUT_MS = 30000;

  private static final AtomicInteger sNextInstanceIdForTrace = new AtomicInteger(1);

  // Access from any thread
  private final ReactQueueConfigurationImpl mReactQueueConfiguration;
  private final CopyOnWriteArrayList<NotThreadSafeBridgeIdleDebugListener> mBridgeIdleListeners;
  private final AtomicInteger mPendingJSCalls = new AtomicInteger(0);
  private final String mJsPendingCallsTitleForTrace =
      "pending_js_calls_instance" + sNextInstanceIdForTrace.getAndIncrement();
  private volatile boolean mDestroyed = false;
  private final TraceListener mTraceListener;
  private final JavaScriptModuleRegistry mJSModuleRegistry;
  private final JSBundleLoader mJSBundleLoader;
  private ExecutorToken mMainExecutorToken;

  private final NativeModuleRegistry mJavaRegistry;
  private final NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
  private boolean mInitialized = false;
  private volatile boolean mAcceptCalls = false;

  private boolean mJSBundleHasLoaded;

  // C++ parts
  private final HybridData mHybridData;
  private native static HybridData initHybrid();

  private CatalystInstanceImpl(
      final ReactQueueConfigurationSpec ReactQueueConfigurationSpec,
      final JavaScriptExecutor jsExecutor,
      final NativeModuleRegistry registry,
      final JavaScriptModuleRegistry jsModuleRegistry,
      final JSBundleLoader jsBundleLoader,
      NativeModuleCallExceptionHandler nativeModuleCallExceptionHandler) {
    FLog.d(ReactConstants.TAG, "Initializing React Xplat Bridge.");
    mHybridData = initHybrid();

    mReactQueueConfiguration = ReactQueueConfigurationImpl.create(
        ReactQueueConfigurationSpec,
        new NativeExceptionHandler());
    mBridgeIdleListeners = new CopyOnWriteArrayList<>();
    mJavaRegistry = registry;
    mJSModuleRegistry = jsModuleRegistry;
    mJSBundleLoader = jsBundleLoader;
    mNativeModuleCallExceptionHandler = nativeModuleCallExceptionHandler;
    mTraceListener = new JSProfilerTraceListener(this);

    initializeBridge(
      new BridgeCallback(this),
      jsExecutor,
      mReactQueueConfiguration.getJSQueueThread(),
      mReactQueueConfiguration.getNativeModulesQueueThread(),
      mJavaRegistry.getModuleRegistryHolder(this));
    mMainExecutorToken = getMainExecutorToken();
  }

  private static class BridgeCallback implements ReactCallback {
    // We do this so the callback doesn't keep the CatalystInstanceImpl alive.
    // In this case, the callback is held in C++ code, so the GC can't see it
    // and determine there's an inaccessible cycle.
    private final WeakReference<CatalystInstanceImpl> mOuter;

    public BridgeCallback(CatalystInstanceImpl outer) {
      mOuter = new WeakReference<CatalystInstanceImpl>(outer);
    }

    @Override
    public void onBatchComplete() {
      CatalystInstanceImpl impl = mOuter.get();
      if (impl != null) {
        impl.mJavaRegistry.onBatchComplete();
      }
    }

    @Override
    public void incrementPendingJSCalls() {
      CatalystInstanceImpl impl = mOuter.get();
      if (impl != null) {
        impl.incrementPendingJSCalls();
      }
    }

    @Override
    public void decrementPendingJSCalls() {
      CatalystInstanceImpl impl = mOuter.get();
      if (impl != null) {
        impl.decrementPendingJSCalls();
      }
    }

    @Override
    public void onNativeException(Exception e) {
      CatalystInstanceImpl impl = mOuter.get();
      if (impl != null) {
        impl.onNativeException(e);
      }
    }
  }

  private native void initializeBridge(ReactCallback callback,
                                       JavaScriptExecutor jsExecutor,
                                       MessageQueueThread jsQueue,
                                       MessageQueueThread moduleQueue,
                                       ModuleRegistryHolder registryHolder);

  /* package */ native void loadScriptFromAssets(AssetManager assetManager, String assetURL);
  /* package */ native void loadScriptFromFile(String fileName, String sourceURL);

  @Override
  public void runJSBundle() {
    // This should really be done when we post the task that runs the JS bundle
    // (don't even need to wait for it to finish). Since that is currently done
    // synchronously, marking it here is fine.
    mAcceptCalls = true;
    Assertions.assertCondition(!mJSBundleHasLoaded, "JS bundle was already loaded!");
    mJSBundleHasLoaded = true;
    // incrementPendingJSCalls();
    mJSBundleLoader.loadScript(CatalystInstanceImpl.this);
    // This is registered after JS starts since it makes a JS call
    Systrace.registerListener(mTraceListener);
  }

  private native void callJSFunction(
    ExecutorToken token,
    String module,
    String method,
    NativeArray arguments,
    String tracingName);

  @Override
  public void callFunction(
      ExecutorToken executorToken,
      final String module,
      final String method,
      final NativeArray arguments,
      final String tracingName) {
    if (mDestroyed) {
      FLog.w(ReactConstants.TAG, "Calling JS function after bridge has been destroyed.");
      return;
    }
    if (!mAcceptCalls) {
      throw new RuntimeException("Attempt to call JS function before JS bundle is loaded.");
    }

    callJSFunction(executorToken, module, method, arguments, tracingName);
  }

  private native void callJSCallback(ExecutorToken executorToken, int callbackID, NativeArray arguments);

  @Override
  public void invokeCallback(ExecutorToken executorToken, final int callbackID, final NativeArray arguments) {
    if (mDestroyed) {
      FLog.w(ReactConstants.TAG, "Invoking JS callback after bridge has been destroyed.");
      return;
    }

    callJSCallback(executorToken, callbackID, arguments);
  }

  /**
   * Destroys this catalyst instance, waiting for any other threads in ReactQueueConfiguration
   * (besides the UI thread) to finish running. Must be called from the UI thread so that we can
   * fully shut down other threads.
   */
  @Override
  public void destroy() {
    UiThreadUtil.assertOnUiThread();

    if (mDestroyed) {
      return;
    }

    // TODO: tell all APIs to shut down
    mDestroyed = true;
    mHybridData.resetNative();
    mJavaRegistry.notifyCatalystInstanceDestroy();
    boolean wasIdle = (mPendingJSCalls.getAndSet(0) == 0);
    if (!wasIdle && !mBridgeIdleListeners.isEmpty()) {
      for (NotThreadSafeBridgeIdleDebugListener listener : mBridgeIdleListeners) {
        listener.onTransitionToBridgeIdle();
      }
    }

    // This is a noop if the listener was not yet registered.
    Systrace.unregisterListener(mTraceListener);
  }

  @Override
  public boolean isDestroyed() {
    return mDestroyed;
  }

  /**
   * Initialize all the native modules
   */
  @VisibleForTesting
  @Override
  public void initialize() {
    UiThreadUtil.assertOnUiThread();
    Assertions.assertCondition(
        !mInitialized,
        "This catalyst instance has already been initialized");
    // We assume that the instance manager blocks on running the JS bundle. If
    // that changes, then we need to set mAcceptCalls just after posting the
    // task that will run the js bundle.
    Assertions.assertCondition(
        mAcceptCalls,
        "RunJSBundle hasn't completed.");
    mInitialized = true;
    mJavaRegistry.notifyCatalystInstanceInitialized();
  }

  @Override
  public ReactQueueConfiguration getReactQueueConfiguration() {
    return mReactQueueConfiguration;
  }

  @Override
  public <T extends JavaScriptModule> T getJSModule(Class<T> jsInterface) {
    return getJSModule(mMainExecutorToken, jsInterface);
  }

  @Override
  public <T extends JavaScriptModule> T getJSModule(ExecutorToken executorToken, Class<T> jsInterface) {
    return Assertions.assertNotNull(mJSModuleRegistry)
        .getJavaScriptModule(this, executorToken, jsInterface);
  }

  private native ExecutorToken getMainExecutorToken();

  @Override
  public <T extends NativeModule> boolean hasNativeModule(Class<T> nativeModuleInterface) {
    return mJavaRegistry.hasModule(nativeModuleInterface);
  }

  // This is only ever called with UIManagerModule or CurrentViewerModule.
  @Override
  public <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface) {
    return mJavaRegistry.getModule(nativeModuleInterface);
  }

  // This is only used by com.facebook.react.modules.common.ModuleDataCleaner
  @Override
  public Collection<NativeModule> getNativeModules() {
    return mJavaRegistry.getAllModules();
  }

  private native void handleMemoryPressureUiHidden();
  private native void handleMemoryPressureModerate();
  private native void handleMemoryPressureCritical();

  @Override
  public void handleMemoryPressure(MemoryPressure level) {
    if (mDestroyed) {
      return;
    }
    switch(level) {
      case UI_HIDDEN:
        handleMemoryPressureUiHidden();
        break;
      case MODERATE:
        handleMemoryPressureModerate();
        break;
      case CRITICAL:
        handleMemoryPressureCritical();
        break;
    }
  }

  /**
   * Adds a idle listener for this Catalyst instance. The listener will receive notifications
   * whenever the bridge transitions from idle to busy and vice-versa, where the busy state is
   * defined as there being some non-zero number of calls to JS that haven't resolved via a
   * onBatchComplete call. The listener should be purely passive and not affect application logic.
   */
  @Override
  public void addBridgeIdleDebugListener(NotThreadSafeBridgeIdleDebugListener listener) {
    mBridgeIdleListeners.add(listener);
  }

  /**
   * Removes a NotThreadSafeBridgeIdleDebugListener previously added with
   * {@link #addBridgeIdleDebugListener}
   */
  @Override
  public void removeBridgeIdleDebugListener(NotThreadSafeBridgeIdleDebugListener listener) {
    mBridgeIdleListeners.remove(listener);
  }

  @Override
  public native void setGlobalVariable(String propName, String jsonValue);

  // TODO mhorowitz: add mDestroyed checks to the next three methods

  @Override
  public native boolean supportsProfiling();

  @Override
  public native void startProfiler(String title);

  @Override
  public native void stopProfiler(String title, String filename);

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
    // TODO(9604406): handle case of web workers injecting messages to main thread
    //Assertions.assertCondition(newPendingCalls >= 0);
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

  private void onNativeException(Exception e) {
    mNativeModuleCallExceptionHandler.handleException(e);
    mReactQueueConfiguration.getUIQueueThread().runOnQueue(
      new Runnable() {
        @Override
        public void run() {
          destroy();
        }
      });
  }

  private class NativeExceptionHandler implements QueueThreadExceptionHandler {
    @Override
    public void handleException(Exception e) {
      // Any Exception caught here is because of something in JS. Even if it's a bug in the
      // framework/native code, it was triggered by JS and theoretically since we were able
      // to set up the bridge, JS could change its logic, reload, and not trigger that crash.
      onNativeException(e);
    }
  }

  private static class JSProfilerTraceListener implements TraceListener {
    // We do this so the callback doesn't keep the CatalystInstanceImpl alive.
    // In this case, Systrace will keep the registered listener around forever
    // if the CatalystInstanceImpl is not explicitly destroyed. These instances
    // can still leak, but they are at least small.
    private final WeakReference<CatalystInstanceImpl> mOuter;

    public JSProfilerTraceListener(CatalystInstanceImpl outer) {
      mOuter = new WeakReference<CatalystInstanceImpl>(outer);
    }

    @Override
    public void onTraceStarted() {
      CatalystInstanceImpl impl = mOuter.get();
      if (impl != null) {
        impl.getJSModule(com.facebook.react.bridge.Systrace.class).setEnabled(true);
      }
    }

    @Override
    public void onTraceStopped() {
      CatalystInstanceImpl impl = mOuter.get();
      if (impl != null) {
        impl.getJSModule(com.facebook.react.bridge.Systrace.class).setEnabled(false);
      }
    }
  }

  public static class Builder {

    private @Nullable ReactQueueConfigurationSpec mReactQueueConfigurationSpec;
    private @Nullable JSBundleLoader mJSBundleLoader;
    private @Nullable NativeModuleRegistry mRegistry;
    private @Nullable JavaScriptModuleRegistry mJSModuleRegistry;
    private @Nullable JavaScriptExecutor mJSExecutor;
    private @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;

    public Builder setReactQueueConfigurationSpec(
        ReactQueueConfigurationSpec ReactQueueConfigurationSpec) {
      mReactQueueConfigurationSpec = ReactQueueConfigurationSpec;
      return this;
    }

    public Builder setRegistry(NativeModuleRegistry registry) {
      mRegistry = registry;
      return this;
    }

    public Builder setJSModuleRegistry(JavaScriptModuleRegistry jsModuleRegistry) {
      mJSModuleRegistry = jsModuleRegistry;
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

    public CatalystInstanceImpl build() {
      return new CatalystInstanceImpl(
          Assertions.assertNotNull(mReactQueueConfigurationSpec),
          Assertions.assertNotNull(mJSExecutor),
          Assertions.assertNotNull(mRegistry),
          Assertions.assertNotNull(mJSModuleRegistry),
          Assertions.assertNotNull(mJSBundleLoader),
          Assertions.assertNotNull(mNativeModuleCallExceptionHandler));
    }
  }
}
