/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import android.content.res.AssetManager;
import android.os.AsyncTask;
import android.util.Log;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.bridge.queue.QueueThreadExceptionHandler;
import com.facebook.react.bridge.queue.ReactQueueConfiguration;
import com.facebook.react.bridge.queue.ReactQueueConfigurationImpl;
import com.facebook.react.bridge.queue.ReactQueueConfigurationSpec;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.TraceListener;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import javax.annotation.Nullable;

/**
 * This provides an implementation of the public CatalystInstance instance.  It is public because
 * it is built by XReactInstanceManager which is in a different package.
 */
@DoNotStrip
public class CatalystInstanceImpl implements CatalystInstance {
  static {
    ReactBridge.staticInit();
  }

  private static final AtomicInteger sNextInstanceIdForTrace = new AtomicInteger(1);

  public static class PendingJSCall {

    public String mModule;
    public String mMethod;
    public @Nullable NativeArray mArguments;

    public PendingJSCall(String module, String method, @Nullable NativeArray arguments) {
      mModule = module;
      mMethod = method;
      mArguments = arguments;
    }

    void call(CatalystInstanceImpl catalystInstance) {
      NativeArray arguments = mArguments != null ? mArguments : new WritableNativeArray();
      catalystInstance.jniCallJSFunction(mModule, mMethod, arguments);
    }

    public String toString() {
      return mModule + "." + mMethod + "("
        + (mArguments == null ? "" : mArguments.toString()) + ")";
    }
  }

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
  private final ArrayList<PendingJSCall> mJSCallsPendingInit = new ArrayList<PendingJSCall>();
  private final Object mJSCallsPendingInitLock = new Object();

  private final NativeModuleRegistry mNativeModuleRegistry;
  private final JSIModuleRegistry mJSIModuleRegistry = new JSIModuleRegistry();
  private final NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
  private final MessageQueueThread mNativeModulesQueueThread;
  private boolean mInitialized = false;
  private volatile boolean mAcceptCalls = false;

  private boolean mJSBundleHasLoaded;
  private @Nullable String mSourceURL;

  private JavaScriptContextHolder mJavaScriptContextHolder;

  // C++ parts
  private final HybridData mHybridData;
  private native static HybridData initHybrid();

  private CatalystInstanceImpl(
      final ReactQueueConfigurationSpec reactQueueConfigurationSpec,
      final JavaScriptExecutor jsExecutor,
      final NativeModuleRegistry nativeModuleRegistry,
      final JSBundleLoader jsBundleLoader,
      NativeModuleCallExceptionHandler nativeModuleCallExceptionHandler) {
    Log.d(ReactConstants.TAG, "Initializing React Xplat Bridge.");
    mHybridData = initHybrid();

    mReactQueueConfiguration = ReactQueueConfigurationImpl.create(
        reactQueueConfigurationSpec,
        new NativeExceptionHandler());
    mBridgeIdleListeners = new CopyOnWriteArrayList<>();
    mNativeModuleRegistry = nativeModuleRegistry;
    mJSModuleRegistry = new JavaScriptModuleRegistry();
    mJSBundleLoader = jsBundleLoader;
    mNativeModuleCallExceptionHandler = nativeModuleCallExceptionHandler;
    mNativeModulesQueueThread = mReactQueueConfiguration.getNativeModulesQueueThread();
    mTraceListener = new JSProfilerTraceListener(this);

    Log.d(ReactConstants.TAG, "Initializing React Xplat Bridge before initializeBridge");
    initializeBridge(
      new BridgeCallback(this),
      jsExecutor,
      mReactQueueConfiguration.getJSQueueThread(),
      mNativeModulesQueueThread,
      mNativeModuleRegistry.getJavaModules(this),
      mNativeModuleRegistry.getCxxModules());
    Log.d(ReactConstants.TAG, "Initializing React Xplat Bridge after initializeBridge");

    mJavaScriptContextHolder = new JavaScriptContextHolder(getJavaScriptContext());
  }

  private static class BridgeCallback implements ReactCallback {
    // We do this so the callback doesn't keep the CatalystInstanceImpl alive.
    // In this case, the callback is held in C++ code, so the GC can't see it
    // and determine there's an inaccessible cycle.
    private final WeakReference<CatalystInstanceImpl> mOuter;

    BridgeCallback(CatalystInstanceImpl outer) {
      mOuter = new WeakReference<>(outer);
    }

    @Override
    public void onBatchComplete() {
      CatalystInstanceImpl impl = mOuter.get();
      if (impl != null) {
        impl.mNativeModuleRegistry.onBatchComplete();
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
  }

  /**
   * This method and the native below permits a CatalystInstance to extend the known
   * Native modules. This registry contains only the new modules to load. The
   * registry {@code mNativeModuleRegistry} updates internally to contain all the new modules, and generates
   * the new registry for extracting just the new collections.
   */
  @Override
  public void extendNativeModules(NativeModuleRegistry modules) {
    //Extend the Java-visible registry of modules
    mNativeModuleRegistry.registerModules(modules);
    Collection<JavaModuleWrapper> javaModules = modules.getJavaModules(this);
    Collection<ModuleHolder> cxxModules = modules.getCxxModules();
    //Extend the Cxx-visible registry of modules wrapped in appropriate interfaces
    jniExtendNativeModules(javaModules, cxxModules);
  }

  private native void jniExtendNativeModules(
    Collection<JavaModuleWrapper> javaModules,
    Collection<ModuleHolder> cxxModules);

  private native void initializeBridge(
      ReactCallback callback,
      JavaScriptExecutor jsExecutor,
      MessageQueueThread jsQueue,
      MessageQueueThread moduleQueue,
      Collection<JavaModuleWrapper> javaModules,
      Collection<ModuleHolder> cxxModules);

  /**
   * This API is used in situations where the JS bundle is being executed not on
   * the device, but on a host machine. In that case, we must provide two source
   * URLs for the JS bundle: One to be used on the device, and one to be used on
   * the remote debugging machine.
   *
   * @param deviceURL A source URL that is accessible from this device.
   * @param remoteURL A source URL that is accessible from the remote machine
   * executing the JS.
   */
  /* package */ void setSourceURLs(String deviceURL, String remoteURL) {
    mSourceURL = deviceURL;
    jniSetSourceURL(remoteURL);
  }

  @Override
  public void registerSegment(int segmentId, String path) {
    jniRegisterSegment(segmentId, path);
  }

  /* package */ void loadScriptFromAssets(AssetManager assetManager, String assetURL, boolean loadSynchronously) {
    mSourceURL = assetURL;
    jniLoadScriptFromAssets(assetManager, assetURL, loadSynchronously);
  }

  /* package */ void loadScriptFromFile(String fileName, String sourceURL, boolean loadSynchronously) {
    mSourceURL = sourceURL;
    jniLoadScriptFromFile(fileName, sourceURL, loadSynchronously);
  }

  /* package */ void loadScriptFromDeltaBundle(
    String sourceURL,
    NativeDeltaClient deltaClient,
    boolean loadSynchronously) {
    mSourceURL = sourceURL;
    jniLoadScriptFromDeltaBundle(sourceURL, deltaClient, loadSynchronously);
  }

  private native void jniSetSourceURL(String sourceURL);
  private native void jniRegisterSegment(int segmentId, String path);
  private native void jniLoadScriptFromAssets(AssetManager assetManager, String assetURL, boolean loadSynchronously);
  private native void jniLoadScriptFromFile(String fileName, String sourceURL, boolean loadSynchronously);
  private native void jniLoadScriptFromDeltaBundle(String sourceURL, NativeDeltaClient deltaClient, boolean loadSynchronously);

  @Override
  public void runJSBundle() {
    Log.d(ReactConstants.TAG, "CatalystInstanceImpl.runJSBundle()");
    Assertions.assertCondition(!mJSBundleHasLoaded, "JS bundle was already loaded!");
    // incrementPendingJSCalls();
    mJSBundleLoader.loadScript(CatalystInstanceImpl.this);

    synchronized (mJSCallsPendingInitLock) {

      // Loading the bundle is queued on the JS thread, but may not have
      // run yet.  It's safe to set this here, though, since any work it
      // gates will be queued on the JS thread behind the load.
      mAcceptCalls = true;

      for (PendingJSCall function : mJSCallsPendingInit) {
        function.call(this);
      }
      mJSCallsPendingInit.clear();
      mJSBundleHasLoaded = true;
    }

    // This is registered after JS starts since it makes a JS call
    Systrace.registerListener(mTraceListener);
  }

  @Override
  public boolean hasRunJSBundle() {
    synchronized (mJSCallsPendingInitLock) {
      return mJSBundleHasLoaded && mAcceptCalls;
    }
  }

  @Override
  public @Nullable String getSourceURL() {
    return mSourceURL;
  }

  private native void jniCallJSFunction(
    String module,
    String method,
    NativeArray arguments);

  @Override
  public void callFunction(
      final String module,
      final String method,
      final NativeArray arguments) {
    callFunction(new PendingJSCall(module, method, arguments));
  }

  public void callFunction(PendingJSCall function) {
    if (mDestroyed) {
      final String call = function.toString();
      FLog.w(ReactConstants.TAG, "Calling JS function after bridge has been destroyed: " + call);
      return;
    }
    if (!mAcceptCalls) {
      // Most of the time the instance is initialized and we don't need to acquire the lock
      synchronized (mJSCallsPendingInitLock) {
        if (!mAcceptCalls) {
          mJSCallsPendingInit.add(function);
          return;
        }
      }
    }
    function.call(this);
  }

  private native void jniCallJSCallback(int callbackID, NativeArray arguments);

  @Override
  public void invokeCallback(final int callbackID, final NativeArray arguments) {
    if (mDestroyed) {
      FLog.w(ReactConstants.TAG, "Invoking JS callback after bridge has been destroyed.");
      return;
    }

    jniCallJSCallback(callbackID, arguments);
  }

  /**
   * Destroys this catalyst instance, waiting for any other threads in ReactQueueConfiguration
   * (besides the UI thread) to finish running. Must be called from the UI thread so that we can
   * fully shut down other threads.
   */
  @Override
  public void destroy() {
    Log.d(ReactConstants.TAG, "CatalystInstanceImpl.destroy() start");
    UiThreadUtil.assertOnUiThread();

    if (mDestroyed) {
      return;
    }

    // TODO: tell all APIs to shut down
    ReactMarker.logMarker(ReactMarkerConstants.DESTROY_CATALYST_INSTANCE_START);
    mDestroyed = true;

    mNativeModulesQueueThread.runOnQueue(
        new Runnable() {
          @Override
          public void run() {
            mNativeModuleRegistry.notifyJSInstanceDestroy();
            boolean wasIdle = (mPendingJSCalls.getAndSet(0) == 0);
            if (!wasIdle && !mBridgeIdleListeners.isEmpty()) {
              for (NotThreadSafeBridgeIdleDebugListener listener : mBridgeIdleListeners) {
                listener.onTransitionToBridgeIdle();
              }
            }
            AsyncTask.execute(
                new Runnable() {
                  @Override
                  public void run() {
                    // Kill non-UI threads from neutral third party
                    // potentially expensive, so don't run on UI thread

                    // contextHolder is used as a lock to guard against other users of the JS VM having
                    // the VM destroyed underneath them, so notify them before we resetNative
                    mJavaScriptContextHolder.clear();

                    mHybridData.resetNative();
                    getReactQueueConfiguration().destroy();
                    Log.d(ReactConstants.TAG, "CatalystInstanceImpl.destroy() end");
                    ReactMarker.logMarker(ReactMarkerConstants.DESTROY_CATALYST_INSTANCE_END);
                  }
                });
          }
        });

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
    Log.d(ReactConstants.TAG, "CatalystInstanceImpl.initialize()");
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
    mNativeModulesQueueThread.runOnQueue(new Runnable() {
      @Override
      public void run() {
        mNativeModuleRegistry.notifyJSInstanceInitialized();
      }
    });
  }

  @Override
  public ReactQueueConfiguration getReactQueueConfiguration() {
    return mReactQueueConfiguration;
  }

  @Override
  public <T extends JavaScriptModule> T getJSModule(Class<T> jsInterface) {
    return mJSModuleRegistry.getJavaScriptModule(this, jsInterface);
  }

  @Override
  public <T extends NativeModule> boolean hasNativeModule(Class<T> nativeModuleInterface) {
    return mNativeModuleRegistry.hasModule(nativeModuleInterface);
  }

  // This is only ever called with UIManagerModule or CurrentViewerModule.
  @Override
  public <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface) {
    return mNativeModuleRegistry.getModule(nativeModuleInterface);
  }

  // This is only used by com.facebook.react.modules.common.ModuleDataCleaner
  @Override
  public Collection<NativeModule> getNativeModules() {
    return mNativeModuleRegistry.getAllModules();
  }

  private native void jniHandleMemoryPressure(int level);

  @Override
  public void handleMemoryPressure(int level) {
    if (mDestroyed) {
      return;
    }
    jniHandleMemoryPressure(level);
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

  @Override
  public JavaScriptContextHolder getJavaScriptContextHolder() {
    return mJavaScriptContextHolder;
  }

  @Override
  public void addJSIModules(List<JSIModuleHolder> jsiModules) {
    mJSIModuleRegistry.registerModules(jsiModules);
  }

  @Override
  public <T extends JSIModule> T getJSIModule(Class<T> jsiModuleInterface) {
    return mJSIModuleRegistry.getModule(jsiModuleInterface);
  }

  private native long getJavaScriptContext();

  private void incrementPendingJSCalls() {
    int oldPendingCalls = mPendingJSCalls.getAndIncrement();
    boolean wasIdle = oldPendingCalls == 0;
    Systrace.traceCounter(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        mJsPendingCallsTitleForTrace,
        oldPendingCalls + 1);
    if (wasIdle && !mBridgeIdleListeners.isEmpty()) {
      mNativeModulesQueueThread.runOnQueue(new Runnable() {
        @Override
        public void run() {
          for (NotThreadSafeBridgeIdleDebugListener listener : mBridgeIdleListeners) {
            listener.onTransitionToBridgeBusy();
          }
        }
      });
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
      mNativeModulesQueueThread.runOnQueue(new Runnable() {
        @Override
        public void run() {
          for (NotThreadSafeBridgeIdleDebugListener listener : mBridgeIdleListeners) {
            listener.onTransitionToBridgeIdle();
          }
        }
      });
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
          Assertions.assertNotNull(mJSBundleLoader),
          Assertions.assertNotNull(mNativeModuleCallExceptionHandler));
    }
  }
}
