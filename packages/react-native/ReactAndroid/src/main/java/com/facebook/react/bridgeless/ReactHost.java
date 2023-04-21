/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridgeless;

import static com.facebook.infer.annotation.Assertions.assertNotNull;
import static com.facebook.infer.annotation.Assertions.nullsafeFIXME;
import static com.facebook.infer.annotation.ThreadConfined.UI;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

import android.app.Activity;
import android.content.Context;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.infer.annotation.ThreadSafe;
import com.facebook.react.MemoryPressureRouter;
import com.facebook.react.ReactInstanceEventListener;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.MemoryPressureListener;
import com.facebook.react.bridge.NativeArray;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.ReactNoCrashBridgeNotAllowedSoftException;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.queue.QueueThreadExceptionHandler;
import com.facebook.react.bridge.queue.ReactQueueConfiguration;
import com.facebook.react.bridgeless.exceptionmanager.ReactJsExceptionHandler;
import com.facebook.react.bridgeless.internal.bolts.Continuation;
import com.facebook.react.bridgeless.internal.bolts.Task;
import com.facebook.react.bridgeless.internal.bolts.TaskCompletionSource;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.devsupport.DisabledDevSupportManager;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.fabric.ComponentFactory;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.BlackHoleEventDispatcher;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * A ReactHost is an object that manages a single {@link ReactInstance}. A ReactHost can be
 * constructed without initializing the ReactInstance, and it will continue to exist after the
 * instance is destroyed. This class ensures safe access to the ReactInstance and the JS runtime;
 * methods that operate on the instance use Bolts Tasks to defer the operation until the instance
 * has been initialized. They also return a Task so the caller can be notified of completion.
 *
 * @see <a href="https://github.com/BoltsFramework/Bolts-Android#tasks">Bolts Android</a>
 */
@ThreadSafe
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactHost {

  // TODO T61403233 Make this configurable by product code
  private static final boolean DEV = ReactBuildConfig.DEBUG;

  private static final int BRIDGELESS_MARKER_INSTANCE_KEY = 1;

  public static final String TAG = "ReactHost";

  private final Context mContext;
  private final ReactInstanceDelegate mReactInstanceDelegate;
  private final ComponentFactory mComponentFactory;
  private final ReactJsExceptionHandler mReactJsExceptionHandler;
  private final DevSupportManager mDevSupportManager;
  private final Executor mBGExecutor;
  private final Executor mUIExecutor;
  private final QueueThreadExceptionHandler mQueueThreadExceptionHandler;
  private final Set<ReactSurface> mAttachedSurfaces = Collections.synchronizedSet(new HashSet<>());
  private final MemoryPressureRouter mMemoryPressureRouter;
  private final MemoryPressureListener mMemoryPressureListener;
  private final boolean mAllowPackagerServerAccess;
  private final boolean mUseDevSupport;
  private final Collection<ReactInstanceEventListener> mReactInstanceEventListeners =
      Collections.synchronizedList(new ArrayList<ReactInstanceEventListener>());

  private final BridgelessAtomicRef<Task<ReactInstance>> mReactInstanceTaskRef =
      new BridgelessAtomicRef<>(
          Task.forResult(
              nullsafeFIXME(
                  null, "forResult parameter supports null, but is not annotated as @Nullable")));

  private final BridgelessAtomicRef<BridgelessReactContext> mBridgelessReactContextRef =
      new BridgelessAtomicRef<>(null);

  private final AtomicReference<Activity> mActivity = new AtomicReference<>();
  private @Nullable DefaultHardwareBackBtnHandler mDefaultHardwareBackBtnHandler;
  private final BridgelessReactStateTracker mBridgelessReactStateTracker =
      new BridgelessReactStateTracker(DEV);
  private final ReactLifecycleStateManager mReactLifecycleStateManager =
      new ReactLifecycleStateManager(mBridgelessReactStateTracker);

  private static final AtomicInteger mCounter = new AtomicInteger(0);
  private final int mId = mCounter.getAndIncrement();

  public ReactHost(
      Context context,
      ReactInstanceDelegate delegate,
      ComponentFactory componentFactory,
      boolean allowPackagerServerAccess,
      ReactJsExceptionHandler reactJsExceptionHandler,
      boolean useDevSupport) {
    this(
        context,
        delegate,
        componentFactory,
        Executors.newSingleThreadExecutor(),
        Task.UI_THREAD_EXECUTOR,
        reactJsExceptionHandler,
        allowPackagerServerAccess,
        useDevSupport);
  }

  public ReactHost(
      Context context,
      ReactInstanceDelegate delegate,
      ComponentFactory componentFactory,
      Executor bgExecutor,
      Executor uiExecutor,
      ReactJsExceptionHandler reactJsExceptionHandler,
      boolean allowPackagerServerAccess,
      boolean useDevSupport) {
    mContext = context;
    mReactInstanceDelegate = delegate;
    mComponentFactory = componentFactory;
    mBGExecutor = bgExecutor;
    mUIExecutor = uiExecutor;
    mReactJsExceptionHandler = reactJsExceptionHandler;
    mQueueThreadExceptionHandler = ReactHost.this::handleException;
    mMemoryPressureRouter = new MemoryPressureRouter(context);
    mMemoryPressureListener =
        level ->
            callWithExistingReactInstance(
                "handleMemoryPressure(" + level + ")",
                reactInstance -> reactInstance.handleMemoryPressure(level));
    mAllowPackagerServerAccess = allowPackagerServerAccess;
    if (DEV) {
      mDevSupportManager =
          new BridgelessDevSupportManager(
              ReactHost.this, mContext, mReactInstanceDelegate.getJSMainModulePath());
    } else {
      mDevSupportManager = new DisabledDevSupportManager();
    }
    mUseDevSupport = useDevSupport;
  }

  public LifecycleState getLifecycleState() {
    return mReactLifecycleStateManager.getLifecycleState();
  }

  /**
   * This function can be used to initialize the ReactInstance in a background thread before a
   * surface needs to be rendered. It is not necessary to call this function; startSurface() will
   * initialize the ReactInstance if it hasn't been preloaded.
   *
   * @return A Task that completes when the instance is initialized. The task will be faulted if any
   *     errors occur during initialization, and will be cancelled if ReactHost.destroy() is called
   *     before it completes.
   */
  public Task<Void> preload() {
    if (ReactFeatureFlags.enableBridgelessArchitectureNewCreateReloadDestroy) {
      return new_preload();
    }

    return old_preload();
  }

  @ThreadConfined("ReactHost")
  private @Nullable Task<Void> mPreloadTask = null;

  private Task<Void> old_preload() {
    final String method = "old_preload()";
    return Task.call(
            () -> {
              if (mPreloadTask == null) {
                log(method, "Schedule");
                mPreloadTask =
                    getOrCreateReactInstanceTask()
                        .continueWithTask(
                            task -> {
                              if (task.isFaulted()) {
                                destroy(
                                    "old_preload() failure: " + task.getError().getMessage(),
                                    task.getError());
                                mReactInstanceDelegate.handleException(task.getError());
                              }

                              return task;
                            },
                            mBGExecutor)
                        .makeVoid();
              }
              return mPreloadTask;
            },
            mBGExecutor)
        .continueWithTask(Task::getResult);
  }

  private Task<Void> new_preload() {
    final String method = "new_preload()";
    return Task.call(
            () -> {
              if (mPreloadTask == null) {
                log(method, "Schedule");
                mPreloadTask =
                    waitThen_new_getOrCreateReactInstanceTask()
                        .continueWithTask(
                            (task) -> {
                              if (task.isFaulted()) {
                                mReactInstanceDelegate.handleException(task.getError());
                                // Wait for destroy to finish
                                return new_getOrCreateDestroyTask(
                                        "new_preload() failure: " + task.getError().getMessage(),
                                        task.getError())
                                    .continueWithTask(destroyTask -> Task.forError(task.getError()))
                                    .makeVoid();
                              }
                              return task.makeVoid();
                            },
                            mBGExecutor);
              }
              return mPreloadTask;
            },
            mBGExecutor)
        .continueWithTask(Task::getResult);
  }

  /** Initialize and run a React Native surface in a background without mounting real views. */
  public Task<Void> prerenderSurface(final ReactSurface surface) {
    final String method = "prerenderSurface(surfaceId = " + surface.getSurfaceID() + ")";
    log(method, "Schedule");

    attachSurface(surface);
    return callAfterGetOrCreateReactInstance(
        method,
        reactInstance -> {
          log(method, "Execute");
          reactInstance.prerenderSurface(surface);
        });
  }

  /**
   * Start rendering a React Native surface on screen.
   *
   * @param surface The ReactSurface to render
   * @return A Task that will complete when startSurface has been called.
   */
  public Task<Void> startSurface(final ReactSurface surface) {
    final String method = "startSurface(surfaceId = " + surface.getSurfaceID() + ")";
    log(method, "Schedule");

    attachSurface(surface);
    return callAfterGetOrCreateReactInstance(
        method,
        reactInstance -> {
          log(method, "Execute");
          reactInstance.startSurface(surface);
        });
  }

  /**
   * Stop rendering a React Native surface.
   *
   * @param surface The surface to stop
   * @return A Task that will complete when stopSurface has been called.
   */
  public Task<Boolean> stopSurface(final ReactSurface surface) {
    final String method = "stopSurface(surfaceId = " + surface.getSurfaceID() + ")";
    log(method, "Schedule");

    detachSurface(surface);
    return callWithExistingReactInstance(
        method,
        reactInstance -> {
          log(method, "Execute");
          reactInstance.stopSurface(surface);
        });
  }

  /**
   * To be called when the host activity is resumed.
   *
   * @param activity The host activity
   */
  @ThreadConfined(UI)
  public void onHostResume(
      final @Nullable Activity activity, DefaultHardwareBackBtnHandler defaultBackButtonImpl) {
    mDefaultHardwareBackBtnHandler = defaultBackButtonImpl;
    onHostResume(activity);
  }

  @ThreadConfined(UI)
  public void onHostResume(final @Nullable Activity activity) {
    final String method = "onHostResume(activity)";
    log(method);

    mActivity.set(activity);
    ReactContext currentContext = getCurrentReactContext();

    // TODO(T137233065): Enable DevSupportManager here
    mReactLifecycleStateManager.moveToOnHostResume(currentContext, mActivity.get());
  }

  @ThreadConfined(UI)
  public void onHostPause(final @Nullable Activity activity) {
    final String method = "onHostPause(activity)";
    log(method);

    ReactContext currentContext = getCurrentReactContext();

    Activity currentActivity = mActivity.get();
    if (currentActivity != null) {
      String currentActivityClass = currentActivity.getClass().getSimpleName();
      String activityClass = activity == null ? "null" : activity.getClass().getSimpleName();
      Assertions.assertCondition(
          activity == currentActivity,
          "Pausing an activity that is not the current activity, this is incorrect! "
              + "Current activity: "
              + currentActivityClass
              + " "
              + "Paused activity: "
              + activityClass);
    }

    // TODO(T137233065): Disable DevSupportManager here
    mDefaultHardwareBackBtnHandler = null;
    mReactLifecycleStateManager.moveToOnHostPause(currentContext, currentActivity);
  }

  /** To be called when the host activity is paused. */
  @ThreadConfined(UI)
  public void onHostPause() {
    final String method = "onHostPause()";
    log(method);

    ReactContext currentContext = getCurrentReactContext();

    // TODO(T137233065): Disable DevSupportManager here
    mDefaultHardwareBackBtnHandler = null;
    mReactLifecycleStateManager.moveToOnHostPause(currentContext, mActivity.get());
  }

  /** To be called when the host activity is destroyed. */
  @ThreadConfined(UI)
  public void onHostDestroy() {
    final String method = "onHostDestroy()";
    log(method);

    // TODO(T137233065): Disable DevSupportManager here
    moveToHostDestroy(getCurrentReactContext());
  }

  @ThreadConfined(UI)
  public void onHostDestroy(@Nullable Activity activity) {
    final String method = "onHostDestroy(activity)";
    log(method);

    Activity currentActivity = mActivity.get();

    // TODO(T137233065): Disable DevSupportManager here
    if (currentActivity == activity) {
      moveToHostDestroy(getCurrentReactContext());
    }
  }

  @ThreadConfined(UI)
  private void moveToHostDestroy(@Nullable ReactContext currentContext) {
    mReactLifecycleStateManager.moveToOnHostDestroy(currentContext);
    mActivity.set(null);
  }

  /**
   * Returns current ReactContext which could be nullable if ReactInstance hasn't been created.
   *
   * @return The {@link BridgelessReactContext} associated with ReactInstance.
   */
  public @Nullable BridgelessReactContext getCurrentReactContext() {
    return mBridgelessReactContextRef.getNullable();
  }

  public DevSupportManager getDevSupportManager() {
    return assertNotNull(mDevSupportManager);
  }

  public @Nullable Activity getCurrentActivity() {
    return mActivity.get();
  }

  /**
   * Get the {@link EventDispatcher} from the {@link FabricUIManager}. This always returns an
   * EventDispatcher, even if the instance isn't alive; in that case, it returns a {@link
   * BlackHoleEventDispatcher} which no-ops.
   *
   * @return The real {@link EventDispatcher} if the instance is alive; otherwise, a {@link
   *     BlackHoleEventDispatcher}.
   */
  public EventDispatcher getEventDispatcher() {
    final ReactInstance reactInstance = mReactInstanceTaskRef.get().getResult();
    if (reactInstance == null) {
      return BlackHoleEventDispatcher.get();
    }

    return reactInstance.getEventDispatcher();
  }

  public @Nullable FabricUIManager getUIManager() {
    final ReactInstance reactInstance = mReactInstanceTaskRef.get().getResult();
    if (reactInstance == null) {
      return null;
    }
    return reactInstance.getUIManager();
  }

  public <T extends NativeModule> boolean hasNativeModule(Class<T> nativeModuleInterface) {
    final ReactInstance reactInstance = mReactInstanceTaskRef.get().getResult();
    if (reactInstance != null) {
      return reactInstance.hasNativeModule(nativeModuleInterface);
    }
    return false;
  }

  public Collection<NativeModule> getNativeModules() {
    final ReactInstance reactInstance = mReactInstanceTaskRef.get().getResult();
    if (reactInstance != null) {
      return reactInstance.getNativeModules();
    }
    return new ArrayList<>();
  }

  public @Nullable <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface) {
    if (nativeModuleInterface == UIManagerModule.class) {
      ReactSoftExceptionLogger.logSoftExceptionVerbose(
          TAG,
          new ReactNoCrashBridgeNotAllowedSoftException(
              "getNativeModule(UIManagerModule.class) cannot be called when the bridge is disabled"));
    }

    final ReactInstance reactInstance = mReactInstanceTaskRef.get().getResult();
    if (reactInstance != null) {
      return reactInstance.getNativeModule(nativeModuleInterface);
    }
    return null;
  }

  public DefaultHardwareBackBtnHandler getDefaultBackButtonHandler() {
    return () -> {
      UiThreadUtil.assertOnUiThread();
      if (mDefaultHardwareBackBtnHandler != null) {
        mDefaultHardwareBackBtnHandler.invokeDefaultOnBackPressed();
      }
    };
  }

  public MemoryPressureRouter getMemoryPressureRouter() {
    return mMemoryPressureRouter;
  }

  public boolean isInstanceInitialized() {
    final ReactInstance reactInstance = mReactInstanceTaskRef.get().getResult();
    return reactInstance != null;
  }

  @ThreadConfined(UI)
  public boolean onBackPressed() {
    UiThreadUtil.assertOnUiThread();
    final ReactInstance reactInstance = mReactInstanceTaskRef.get().getResult();
    if (reactInstance == null) {
      return false;
    }

    DeviceEventManagerModule deviceEventManagerModule =
        reactInstance.getNativeModule(DeviceEventManagerModule.class);
    if (deviceEventManagerModule == null) {
      return false;
    }

    deviceEventManagerModule.emitHardwareBackPressed();
    return true;
  }

  public @Nullable ReactQueueConfiguration getReactQueueConfiguration() {
    synchronized (mReactInstanceTaskRef) {
      Task<ReactInstance> task = mReactInstanceTaskRef.get();
      if (!task.isFaulted() && !task.isCancelled() && task.getResult() != null) {
        return task.getResult().getReactQueueConfiguration();
      }
    }
    return null;
  }

  /** Add a listener to be notified of ReactInstance events. */
  public void addReactInstanceEventListener(ReactInstanceEventListener listener) {
    mReactInstanceEventListeners.add(listener);
  }

  /** Remove a listener previously added with {@link #addReactInstanceEventListener}. */
  public void removeReactInstanceEventListener(ReactInstanceEventListener listener) {
    mReactInstanceEventListeners.remove(listener);
  }

  /* package */ Task<Boolean> loadBundle(final JSBundleLoader bundleLoader) {
    final String method = "loadBundle()";
    log(method, "Schedule");

    return callWithExistingReactInstance(
        method,
        reactInstance -> {
          log(method, "Execute");
          reactInstance.loadJSBundle(bundleLoader);
        });
  }

  /* package */ Task<Boolean> registerSegment(
      final int segmentId, final String path, final Callback callback) {
    final String method =
        "registerSegment(segmentId = \"" + segmentId + "\", path = \"" + path + "\")";
    log(method, "Schedule");

    return callWithExistingReactInstance(
        method,
        reactInstance -> {
          log(method, "Execute");
          reactInstance.registerSegment(segmentId, path);
          assertNotNull(callback).invoke();
        });
  }

  /*package */ void handleException(Exception e) {
    final String method = "handleException(message = \"" + e.getMessage() + "\")";
    log(method);

    destroy(method, e);
    mReactInstanceDelegate.handleException(e);
  }

  /**
   * Call a function on a JS module that has been registered as callable.
   *
   * @param moduleName The name of the JS module
   * @param methodName The function to call
   * @param args Arguments to be passed to the function
   * @return A Task that will complete when the function call has been enqueued on the JS thread.
   */
  /* package */ Task<Boolean> callFunctionOnModule(
      final String moduleName, final String methodName, final NativeArray args) {
    final String method = "callFunctionOnModule(\"" + moduleName + "\", \"" + methodName + "\")";
    return callWithExistingReactInstance(
        method,
        reactInstance -> {
          reactInstance.callFunctionOnModule(moduleName, methodName, args);
        });
  }

  /* package */ void attachSurface(ReactSurface surface) {
    final String method = "attachSurface(surfaceId = " + surface.getSurfaceID() + ")";
    log(method);

    synchronized (mAttachedSurfaces) {
      mAttachedSurfaces.add(surface);
    }
  }

  /* package */ void detachSurface(ReactSurface surface) {
    final String method = "detachSurface(surfaceId = " + surface.getSurfaceID() + ")";
    log(method);

    synchronized (mAttachedSurfaces) {
      mAttachedSurfaces.remove(surface);
    }
  }

  boolean isSurfaceAttached(ReactSurface surface) {
    synchronized (mAttachedSurfaces) {
      return mAttachedSurfaces.contains(surface);
    }
  }

  boolean isSurfaceWithModuleNameAttached(String moduleName) {
    synchronized (mAttachedSurfaces) {
      for (ReactSurface surface : mAttachedSurfaces) {
        if (surface.getModuleName().equals(moduleName)) {
          return true;
        }
      }
      return false;
    }
  }

  interface VeniceThenable<T> {
    void then(T t);
  }

  private void raiseSoftException(String method, String message) {
    raiseSoftException(method, message, null);
  }

  private void raiseSoftException(String method, String message, @Nullable Throwable throwable) {
    log(method, message);
    if (ReactFeatureFlags.enableBridgelessArchitectureSoftExceptions) {
      if (throwable != null) {
        ReactSoftExceptionLogger.logSoftException(
            TAG, new ReactNoCrashSoftException(method + ": " + message, throwable));
        return;
      }

      ReactSoftExceptionLogger.logSoftException(
          TAG, new ReactNoCrashSoftException(method + ": " + message));
    }
  }

  private Task<Boolean> callWithExistingReactInstance(
      final String callingMethod, final VeniceThenable<ReactInstance> continuation) {
    final String method = "callWithExistingReactInstance(" + callingMethod + ")";

    return mReactInstanceTaskRef
        .get()
        .onSuccess(
            task -> {
              final ReactInstance reactInstance = task.getResult();
              if (reactInstance == null) {
                raiseSoftException(method, "Execute: ReactInstance null. Dropping work.");
                return FALSE;
              }

              continuation.then(reactInstance);
              return TRUE;
            },
            mBGExecutor);
  }

  private Task<Void> callAfterGetOrCreateReactInstance(
      final String callingMethod, final VeniceThenable<ReactInstance> runnable) {
    final String method = "callAfterGetOrCreateReactInstance(" + callingMethod + ")";

    return getOrCreateReactInstanceTask()
        .onSuccess(
            (Continuation<ReactInstance, Void>)
                task -> {
                  final ReactInstance reactInstance = task.getResult();
                  if (reactInstance == null) {
                    raiseSoftException(method, "Execute: ReactInstance is null");
                    return null;
                  }

                  runnable.then(reactInstance);
                  return null;
                },
            mBGExecutor)
        .continueWith(
            task -> {
              if (task.isFaulted()) {
                handleException(task.getError());
              }
              return null;
            },
            mBGExecutor);
  }

  private BridgelessReactContext getOrCreateReactContext() {
    final String method = "getOrCreateReactContext()";
    return mBridgelessReactContextRef.getOrCreate(
        () -> {
          log(method, "Creating BridgelessReactContext");
          return new BridgelessReactContext(mContext, ReactHost.this);
        });
  }

  /**
   * Entrypoint to create the ReactInstance.
   *
   * <p>If the ReactInstance is reloading, will return the reload task. If the ReactInstance is
   * destroying, will wait until destroy is finished, before creating.
   *
   * @return
   */
  private Task<ReactInstance> getOrCreateReactInstanceTask() {
    if (ReactFeatureFlags.enableBridgelessArchitectureNewCreateReloadDestroy) {
      return Task.call(this::waitThen_new_getOrCreateReactInstanceTask, mBGExecutor)
          .continueWithTask(Task::getResult);
    }

    return old_getOrCreateReactInstanceTask();
  }

  @ThreadConfined("ReactHost")
  private Task<ReactInstance> waitThen_new_getOrCreateReactInstanceTask() {
    return waitThen_new_getOrCreateReactInstanceTaskWithRetries(0, 4);
  }

  @ThreadConfined("ReactHost")
  private Task<ReactInstance> waitThen_new_getOrCreateReactInstanceTaskWithRetries(
      int tryNum, int maxTries) {
    final String method = "waitThen_new_getOrCreateReactInstanceTaskWithRetries";
    if (mReloadTask != null) {
      log(method, "React Native is reloading. Return reload task.");
      return mReloadTask;
    }

    if (mDestroyTask != null) {
      boolean shouldTryAgain = tryNum < maxTries;
      if (shouldTryAgain) {
        log(
            method,
            "React Native is tearing down."
                + "Wait for teardown to finish, before trying again (try count = "
                + tryNum
                + ").");
        return mDestroyTask.onSuccessTask(
            (task) -> waitThen_new_getOrCreateReactInstanceTaskWithRetries(tryNum + 1, maxTries),
            mBGExecutor);
      }

      raiseSoftException(
          method,
          "React Native is tearing down. Not wait for teardown to finish: reached max retries.");
    }

    return new_getOrCreateReactInstanceTask();
  }

  @ThreadConfined("ReactHost")
  private Task<ReactInstance> new_getOrCreateReactInstanceTask() {
    final String method = "new_getOrCreateReactInstanceTask()";
    log(method);

    return mReactInstanceTaskRef.getOrCreate(
        () -> {
          log(method, "Start");
          ReactMarker.logMarker(
              ReactMarkerConstants.REACT_BRIDGELESS_LOADING_START, BRIDGELESS_MARKER_INSTANCE_KEY);

          return getJSBundleLoader()
              .onSuccess(
                  task -> {
                    final JSBundleLoader bundleLoader = task.getResult();
                    final BridgelessReactContext reactContext = getOrCreateReactContext();
                    final DevSupportManager devSupportManager = getDevSupportManager();

                    log(method, "Creating ReactInstance");
                    final ReactInstance instance =
                        new ReactInstance(
                            reactContext,
                            mReactInstanceDelegate,
                            mComponentFactory,
                            devSupportManager,
                            mQueueThreadExceptionHandler,
                            mReactJsExceptionHandler,
                            mUseDevSupport);

                    mMemoryPressureRouter.addMemoryPressureListener(mMemoryPressureListener);

                    log(method, "Loading JS Bundle");
                    instance.loadJSBundle(bundleLoader);

                    log(
                        method,
                        "Calling DevSupportManagerBase.onNewReactContextCreated(reactContext)");
                    devSupportManager.onNewReactContextCreated(reactContext);

                    reactContext.runOnJSQueueThread(
                        () -> {
                          // Executing on the JS thread to ensurethat we're done
                          // loading the JS bundle.
                          // TODO T76081936 Move this if we switch to a sync RTE
                          ReactMarker.logMarker(
                              ReactMarkerConstants.REACT_BRIDGELESS_LOADING_END,
                              BRIDGELESS_MARKER_INSTANCE_KEY);
                        });

                    class Result {
                      final ReactInstance mInstance;
                      final ReactContext mContext;

                      Result(ReactInstance instance, ReactContext context) {
                        mInstance = instance;
                        mContext = context;
                      }
                    }

                    return new Result(instance, reactContext);
                  },
                  mBGExecutor)
              .onSuccess(
                  task -> {
                    ReactInstance reactInstance = task.getResult().mInstance;
                    ReactContext reactContext = task.getResult().mContext;

                    /**
                     * Call ReactContext.onHostResume() only when already in the resumed state which
                     * aligns with the bridge https://fburl.com/diffusion/2qhxmudv.
                     */
                    mReactLifecycleStateManager.resumeReactContextIfHostResumed(
                        reactContext, mActivity.get());

                    ReactInstanceEventListener[] listeners =
                        new ReactInstanceEventListener[mReactInstanceEventListeners.size()];
                    final ReactInstanceEventListener[] finalListeners =
                        mReactInstanceEventListeners.toArray(listeners);

                    log(method, "Executing ReactInstanceEventListeners");
                    for (ReactInstanceEventListener listener : finalListeners) {
                      if (listener != null) {
                        listener.onReactContextInitialized(reactContext);
                      }
                    }
                    return reactInstance;
                  },
                  mUIExecutor);
        });
  }

  private Task<ReactInstance> old_getOrCreateReactInstanceTask() {
    final String method = "old_getOrCreateReactInstanceTask()";
    log(method);

    return mReactInstanceTaskRef.getOrCreate(
        () -> {
          log(method, "Start");
          ReactMarker.logMarker(
              ReactMarkerConstants.REACT_BRIDGELESS_LOADING_START, BRIDGELESS_MARKER_INSTANCE_KEY);

          final BridgelessReactContext reactContext = getOrCreateReactContext();
          final DevSupportManager devSupportManager = getDevSupportManager();

          return getJSBundleLoader()
              .onSuccess(
                  task -> {
                    final JSBundleLoader bundleLoader = task.getResult();
                    log(method, "Creating ReactInstance");
                    final ReactInstance instance =
                        new ReactInstance(
                            reactContext,
                            mReactInstanceDelegate,
                            mComponentFactory,
                            devSupportManager,
                            mQueueThreadExceptionHandler,
                            mReactJsExceptionHandler,
                            mUseDevSupport);

                    mMemoryPressureRouter.addMemoryPressureListener(mMemoryPressureListener);

                    log(method, "Loading JS Bundle");
                    instance.loadJSBundle(bundleLoader);

                    log(
                        method,
                        "Calling DevSupportManagerBase.onNewReactContextCreated(reactContext)");
                    devSupportManager.onNewReactContextCreated(reactContext);
                    reactContext.runOnJSQueueThread(
                        () -> {
                          // Executing on the JS thread to ensurethat we're done
                          // loading the JS bundle.
                          // TODO T76081936 Move this if we switchto a sync RTE
                          ReactMarker.logMarker(
                              ReactMarkerConstants.REACT_BRIDGELESS_LOADING_END,
                              BRIDGELESS_MARKER_INSTANCE_KEY);
                        });
                    return instance;
                  },
                  mBGExecutor)
              .onSuccess(
                  task -> {
                    /*
                     Call ReactContext.onHostResume() only when already in the resumed state which
                     aligns with the bridge https://fburl.com/diffusion/2qhxmudv.
                    */
                    mReactLifecycleStateManager.resumeReactContextIfHostResumed(
                        reactContext, mActivity.get());

                    ReactInstanceEventListener[] listeners =
                        new ReactInstanceEventListener[mReactInstanceEventListeners.size()];
                    final ReactInstanceEventListener[] finalListeners =
                        mReactInstanceEventListeners.toArray(listeners);

                    log(method, "Executing ReactInstanceEventListeners");
                    for (ReactInstanceEventListener listener : finalListeners) {
                      if (listener != null) {
                        listener.onReactContextInitialized(reactContext);
                      }
                    }

                    return task.getResult();
                  },
                  mUIExecutor);
        });
  }

  private Task<JSBundleLoader> getJSBundleLoader() {
    final String method = "getJSBundleLoader()";
    log(method);

    if (DEV && mAllowPackagerServerAccess) {
      return isMetroRunning()
          .onSuccessTask(
              task -> {
                boolean isMetroRunning = task.getResult();
                if (isMetroRunning) {
                  // Since metro is running, fetch the JS bundle from the server
                  return loadJSBundleFromMetro();
                }
                return Task.forResult(mReactInstanceDelegate.getJSBundleLoader(mContext));
              },
              mBGExecutor);
    } else {
      if (DEV) {
        FLog.d(TAG, "Packager server access is disabled in this environment");
      }

      /**
       * In prod mode: fall back to the JS bundle loader from the delegate.
       *
       * <p>Note: Create the prod JSBundleLoader inside a Task.call. Why: If JSBundleLoader creation
       * throws an exception, the task will fault, and we'll go through the ReactHost error
       * reporting pipeline.
       */
      return Task.call(() -> mReactInstanceDelegate.getJSBundleLoader(mContext));
    }
  }

  private Task<Boolean> isMetroRunning() {
    final String method = "isMetroRunning()";
    log(method);

    final TaskCompletionSource<Boolean> taskCompletionSource = new TaskCompletionSource<>();
    final DevSupportManager asyncDevSupportManager = getDevSupportManager();

    asyncDevSupportManager.isPackagerRunning(
        packagerIsRunning -> {
          log(method, "Async result = " + packagerIsRunning);
          taskCompletionSource.setResult(packagerIsRunning);
        });

    return taskCompletionSource.getTask();
  }

  /**
   * TODO(T104078367): Ensure that if creating this JSBundleLoader fails, we route the errors
   * through ReactHost's error reporting pipeline
   */
  private Task<JSBundleLoader> loadJSBundleFromMetro() {
    final String method = "loadJSBundleFromMetro()";
    log(method);

    final TaskCompletionSource<JSBundleLoader> taskCompletionSource = new TaskCompletionSource<>();
    final DevSupportManager asyncDevSupportManager = getDevSupportManager();
    final String sourceUrl = asyncDevSupportManager.getSourceUrl();

    asyncDevSupportManager.reloadJSFromServer(
        sourceUrl,
        () -> {
          log(method, "Creating BundleLoader");
          JSBundleLoader bundleLoader =
              JSBundleLoader.createCachedBundleFromNetworkLoader(
                  sourceUrl, asyncDevSupportManager.getDownloadedJSBundleFile());
          taskCompletionSource.setResult(bundleLoader);
        });

    return taskCompletionSource.getTask();
  }

  private void log(String method, String message) {
    mBridgelessReactStateTracker.enterState("ReactHost{" + mId + "}." + method + ": " + message);
  }

  private void log(String method) {
    mBridgelessReactStateTracker.enterState("ReactHost{" + mId + "}." + method);
  }

  /**
   * Entrypoint to reload the ReactInstance. If the ReactInstance is destroying, will wait until
   * destroy is finished, before reloading.
   *
   * @return A task that completes when React Native reloads
   */
  public Task<Void> reload(String reason) {
    final String method = "reload()";
    if (ReactFeatureFlags.enableBridgelessArchitectureNewCreateReloadDestroy) {
      return Task.call(
              () -> {
                if (mDestroyTask != null) {
                  log(
                      method,
                      "Destroying React Native. Waiting for destroy to finish, before reloading React Native.");
                  return mDestroyTask
                      .continueWithTask(task -> new_getOrCreateReloadTask(reason), mBGExecutor)
                      .makeVoid();
                }

                return new_getOrCreateReloadTask(reason).makeVoid();
              },
              mBGExecutor)
          .continueWithTask(Task::getResult);
    }

    return old_reload(reason);
  }

  @ThreadConfined("ReactHost")
  private @Nullable Task<ReactInstance> mReloadTask = null;

  /**
   * The ReactInstance is loaded. Tear it down, and re-create it.
   *
   * <p>If the ReactInstance is in an "invalid state", make a "best effort" attempt to clean up
   * React. "invalid state" means: ReactInstance task is faulted; ReactInstance is null; React
   * instance task is cancelled; BridgelessReactContext is null. This can typically happen if the
   * ReactInstance task work throws an exception.
   */
  @ThreadConfined("ReactHost")
  private Task<ReactInstance> new_getOrCreateReloadTask(String reason) {
    final String method = "new_getOrCreateReloadTask()";
    log(method);

    // Log how React Native is destroyed
    // TODO(T136397487): Remove after Venice is shipped to 100%
    raiseSoftException(method, reason);

    if (mReloadTask == null) {
      mReloadTask =
          mReactInstanceTaskRef
              .get()
              .continueWithTask(
                  (task) -> {
                    log(method, "Starting on UI thread");

                    if (task.isFaulted()) {
                      raiseSoftException(
                          method,
                          "ReactInstance task faulted. Reload reason: " + reason,
                          task.getError());
                    }

                    if (task.isCancelled()) {
                      raiseSoftException(
                          method, "ReactInstance task cancelled. Reload reason: " + reason);
                    }

                    final ReactInstance reactInstance = task.getResult();
                    if (reactInstance == null) {
                      raiseSoftException(method, "ReactInstance is null. Reload reason: " + reason);
                    }

                    final ReactContext reactContext = mBridgelessReactContextRef.getNullable();
                    if (reactContext == null) {
                      raiseSoftException(method, "ReactContext is null. Reload reason: " + reason);
                    }

                    if (reactContext != null
                        && mReactLifecycleStateManager.getLifecycleState()
                            == LifecycleState.RESUMED) {
                      log(method, "Calling ReactContext.onHostPause()");
                      reactContext.onHostPause();
                    }

                    return task;
                  },
                  mUIExecutor)
              .continueWithTask(
                  task -> {
                    final ReactInstance reactInstance = task.getResult();

                    log(method, "Stopping all React Native surfaces");
                    synchronized (mAttachedSurfaces) {
                      for (ReactSurface surface : mAttachedSurfaces) {
                        if (reactInstance != null) {
                          reactInstance.stopSurface(surface);
                        }

                        surface.clear();
                      }
                    }

                    return task;
                  },
                  mBGExecutor)
              .continueWithTask(
                  task -> {
                    log(method, "Removing memory pressure listener");
                    mMemoryPressureRouter.removeMemoryPressureListener(mMemoryPressureListener);

                    final ReactContext reactContext = mBridgelessReactContextRef.getNullable();
                    if (reactContext != null) {
                      log(method, "Destroying ReactContext");
                      reactContext.destroy();
                    }

                    if (mUseDevSupport && reactContext != null) {
                      log(
                          method,
                          "Calling DevSupportManager.onReactInstanceDestroyed(reactContext)");
                      mDevSupportManager.onReactInstanceDestroyed(reactContext);
                    }

                    return task;
                  },
                  mUIExecutor)
              .continueWithTask(
                  task -> {
                    final ReactInstance reactInstance = task.getResult();

                    log(method, "Destroying ReactInstance");
                    if (reactInstance != null) {
                      reactInstance.destroy();
                    }

                    log(method, "Resetting ReactContext ref");
                    mBridgelessReactContextRef.reset();

                    log(method, "Resetting ReactInstance task ref");
                    mReactInstanceTaskRef.reset();

                    log(method, "Resetting preload task ref");
                    mPreloadTask = null;

                    // Kickstart a new ReactInstance create
                    return new_getOrCreateReactInstanceTask();
                  },
                  mBGExecutor)
              .onSuccess(
                  task -> {
                    final ReactInstance reactInstance = task.getResult();
                    if (reactInstance != null) {
                      log(method, "Restarting previously running React Native Surfaces");

                      synchronized (mAttachedSurfaces) {
                        for (ReactSurface surface : mAttachedSurfaces) {
                          reactInstance.startSurface(surface);
                        }
                      }
                    }
                    return reactInstance;
                  },
                  mBGExecutor)
              .continueWithTask(
                  task -> {
                    if (task.isFaulted()) {
                      raiseSoftException(
                          method,
                          "Failed to re-created ReactInstance. Task faulted. Reload reason: "
                              + reason,
                          task.getError());
                    }

                    if (task.isCancelled()) {
                      raiseSoftException(
                          method,
                          "Failed to re-created ReactInstance. Task cancelled. Reload reason: "
                              + reason);
                    }

                    log(method, "Resetting reload task ref");
                    mReloadTask = null;
                    return task;
                  },
                  mBGExecutor);
    }

    return mReloadTask;
  }

  /**
   * Entrypoint to destroy the ReactInstance. If the ReactInstance is reloading, will wait until
   * reload is finished, before destroying.
   *
   * @return A task that completes when React Native gets destroyed.
   */
  public Task<Void> destroy(String reason) {
    return destroy(reason, null);
  }

  public Task<Void> destroy(String reason, @Nullable Exception ex) {
    final String method = "destroy()";
    if (ReactFeatureFlags.enableBridgelessArchitectureNewCreateReloadDestroy) {
      return Task.call(
              () -> {
                if (mReloadTask != null) {
                  log(
                      method,
                      "Reloading React Native. Waiting for reload to finish before destroying React Native.");
                  return mReloadTask.continueWithTask(
                      task -> new_getOrCreateDestroyTask(reason, ex), mBGExecutor);
                }
                return new_getOrCreateDestroyTask(reason, ex);
              },
              mBGExecutor)
          .continueWithTask(Task::getResult);
    }

    old_destroy(reason, ex);
    return Task.forResult(nullsafeFIXME(null, "Empty Destroy Task"));
  }

  @ThreadConfined("ReactHost")
  private @Nullable Task<Void> mDestroyTask = null;

  /**
   * The ReactInstance is loaded. Tear it down.
   *
   * <p>If the ReactInstance is in an "invalid state", make a "best effort" attempt to clean up
   * React. "invalid state" means: ReactInstance task is faulted; ReactInstance is null; React
   * instance task is cancelled; BridgelessReactContext is null. This can typically happen if the *
   * ReactInstance task work throws an exception.
   */
  @ThreadConfined("ReactHost")
  private Task<Void> new_getOrCreateDestroyTask(final String reason, @Nullable Exception ex) {
    final String method = "new_getOrCreateDestroyTask()";
    log(method);

    // Log how React Native is destroyed
    // TODO(T136397487): Remove after Venice is shipped to 100%
    raiseSoftException(method, reason, ex);

    if (mDestroyTask == null) {
      mDestroyTask =
          mReactInstanceTaskRef
              .get()
              .continueWithTask(
                  task -> {
                    log(method, "Destroying ReactInstance on UI Thread");

                    if (task.isFaulted()) {
                      raiseSoftException(
                          method,
                          "ReactInstance task faulted. Destroy reason: " + reason,
                          task.getError());
                    }

                    if (task.isCancelled()) {
                      raiseSoftException(
                          method, "ReactInstance task cancelled. Destroy reason: " + reason);
                    }

                    final ReactInstance reactInstance = task.getResult();
                    if (reactInstance == null) {
                      raiseSoftException(
                          method, "ReactInstance is null. Destroy reason: " + reason);
                    }

                    // Step 1: Destroy DevSupportManager
                    if (mUseDevSupport) {
                      log(method, "DevSupportManager cleanup");
                      // TODO(T137233065): Disable DevSupportManager here
                      mDevSupportManager.stopInspector();
                    }

                    final ReactContext reactContext = mBridgelessReactContextRef.getNullable();

                    if (reactContext == null) {
                      raiseSoftException(method, "ReactContext is null. Destroy reason: " + reason);
                    }

                    // Step 2: Move React Native to onHostDestroy()
                    log(method, "Move ReactHost to onHostDestroy()");
                    mReactLifecycleStateManager.moveToOnHostDestroy(reactContext);

                    // Step 3: De-register the memory pressure listener
                    log(method, "Destroying MemoryPressureRouter");
                    mMemoryPressureRouter.destroy(mContext);

                    if (reactContext != null) {
                      log(method, "Destroying ReactContext");
                      reactContext.destroy();
                    }

                    // Reset current activity
                    mActivity.set(null);

                    // Clear ResourceIdleDrawableIdMap
                    ResourceDrawableIdHelper.getInstance().clear();

                    return task;
                  },
                  mUIExecutor)
              .continueWith(
                  task -> {
                    final ReactInstance reactInstance = task.getResult();
                    if (reactInstance != null) {
                      log(method, "Destroying ReactInstance");
                      reactInstance.destroy();
                    }

                    log(method, "Resetting ReactContext ref ");
                    mBridgelessReactContextRef.reset();

                    log(method, "Resetting ReactInstance task ref");
                    mReactInstanceTaskRef.reset();

                    log(method, "Resetting Preload task ref");
                    mPreloadTask = null;

                    log(method, "Resetting destroy task ref");
                    mDestroyTask = null;
                    return null;
                  },
                  mBGExecutor);
    }

    return mDestroyTask;
  }

  /** Destroy and recreate the ReactInstance and context. */
  private Task<Void> old_reload(String reason) {
    final String method = "old_reload()";
    log(method);

    // Log how React Native is destroyed
    // TODO(T136397487): Remove after Venice is shipped to 100%
    raiseSoftException(method, reason);

    synchronized (mReactInstanceTaskRef) {
      mMemoryPressureRouter.removeMemoryPressureListener(mMemoryPressureListener);
      old_destroyReactInstanceAndContext(method, reason);

      return callAfterGetOrCreateReactInstance(
          method,
          reactInstance -> {
            // Restart any attached surfaces
            log(method, "Restarting Surfaces");
            synchronized (mAttachedSurfaces) {
              for (ReactSurface surface : mAttachedSurfaces) {
                reactInstance.startSurface(surface);
              }
            }
          });
    }
  }

  /** Destroy the specified instance and context. */
  private void old_destroy(String reason, @Nullable Exception ex) {
    final String method = "old_destroy()";
    log(method);

    // Log how React Native is destroyed
    // TODO(T136397487): Remove after Venice is shipped to 100%
    raiseSoftException(method, reason, ex);

    synchronized (mReactInstanceTaskRef) {
      // Retain a reference to current ReactContext before de-referenced by mReactContextRef
      final ReactContext reactContext = getCurrentReactContext();

      if (reactContext != null) {
        mMemoryPressureRouter.destroy(reactContext);
      }

      old_destroyReactInstanceAndContext(method, reason);

      // Remove all attached surfaces
      log(method, "Clearing attached surfaces");
      synchronized (mAttachedSurfaces) {
        mAttachedSurfaces.clear();
      }

      Task.call(
          (Callable<Void>)
              () -> {
                moveToHostDestroy(reactContext);
                return null;
              },
          mUIExecutor);
    }
  }

  private void old_destroyReactInstanceAndContext(final String callingMethod, final String reason) {
    final String method = "old_destroyReactInstanceAndContext(" + callingMethod + ")";
    log(method);

    synchronized (mReactInstanceTaskRef) {
      Task<ReactInstance> task = mReactInstanceTaskRef.getAndReset();
      if (!task.isFaulted() && !task.isCancelled()) {
        final ReactInstance instance = task.getResult();

        // Noop on redundant calls to destroyReactInstance()
        if (instance == null) {
          log(method, "ReactInstance nil");
          return;
        }

        /*
         * The surfaces should be stopped before the instance destroy.
         * Calling stop directly on instance ensures we keep the list of attached surfaces for restart.
         */
        log(method, "Stopping surfaces");
        synchronized (mAttachedSurfaces) {
          for (ReactSurface surface : mAttachedSurfaces) {
            instance.stopSurface(surface);
            surface.clear();
          }
        }

        ReactContext reactContext = getCurrentReactContext();

        // Reset the ReactContext inside the DevSupportManager
        if (reactContext != null) {
          log(method, "DevSupportManager.onReactInstanceDestroyed()");
          getDevSupportManager().onReactInstanceDestroyed(reactContext);
          log(method, "Destroy ReactContext");
          mBridgelessReactContextRef.reset();
        }

        mBGExecutor.execute(
            () -> {
              // instance.destroy() is time consuming and is confined to ReactHost thread.
              log(method, "Destroy ReactInstance");
              instance.destroy();

              // Re-enable preloads
              log(method, "Resetting Preload task ref");
              mPreloadTask = null;
            });
      } else {
        raiseSoftException(
            method,
            ("Not cleaning up ReactInstance: task.isFaulted() = "
                    + task.isFaulted()
                    + ", task.isCancelled() = "
                    + task.isCancelled())
                + ". Reason: "
                + reason);

        mBGExecutor.execute(
            () -> {
              log(method, "Resetting Preload task ref");
              mPreloadTask = null;
            });
      }
    }
  }
}
