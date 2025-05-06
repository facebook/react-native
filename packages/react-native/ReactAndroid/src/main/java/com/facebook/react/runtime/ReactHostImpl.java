/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import static com.facebook.infer.annotation.Assertions.assertNotNull;
import static com.facebook.infer.annotation.ThreadConfined.UI;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.nfc.NfcAdapter;
import android.os.Bundle;
import androidx.annotation.Nullable;
import androidx.annotation.VisibleForTesting;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.infer.annotation.ThreadSafe;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.MemoryPressureRouter;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactInstanceEventListener;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.MemoryPressureListener;
import com.facebook.react.bridge.NativeArray;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.ReactNoCrashBridgeNotAllowedSoftException;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.RuntimeExecutor;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.queue.ReactQueueConfiguration;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.devsupport.DefaultDevSupportManagerFactory;
import com.facebook.react.devsupport.DevSupportManagerBase;
import com.facebook.react.devsupport.DevSupportManagerFactory;
import com.facebook.react.devsupport.InspectorFlags;
import com.facebook.react.devsupport.inspector.InspectorNetworkHelper;
import com.facebook.react.devsupport.inspector.InspectorNetworkRequestListener;
import com.facebook.react.devsupport.interfaces.BundleLoadCallback;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.devsupport.interfaces.DevSupportManager.PausedInDebuggerOverlayCommandListener;
import com.facebook.react.fabric.ComponentFactory;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.interfaces.TaskInterface;
import com.facebook.react.interfaces.fabric.ReactSurface;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags;
import com.facebook.react.modules.appearance.AppearanceModule;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers;
import com.facebook.react.runtime.internal.bolts.Continuation;
import com.facebook.react.runtime.internal.bolts.Task;
import com.facebook.react.runtime.internal.bolts.TaskCompletionSource;
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.BlackHoleEventDispatcher;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import kotlin.Unit;
import kotlin.jvm.functions.Function0;
import kotlin.jvm.functions.Function1;

/**
 * A ReactHost is an object that manages a single {@link ReactInstance}. A ReactHost can be
 * constructed without initializing the ReactInstance, and it will continue to exist after the
 * instance is destroyed. This class ensures safe access to the ReactInstance and the JS runtime;
 * methods that operate on the instance use Bolts Tasks to defer the operation until the instance
 * has been initialized. They also return a Task so the caller can be notified of completion.
 *
 * @see <a href="https://github.com/BoltsFramework/Bolts-Android#tasks">Bolts Android</a>
 */
@DoNotStrip
@ThreadSafe
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactHostImpl implements ReactHost {
  private static final String TAG = "ReactHost";
  private static final int BRIDGELESS_MARKER_INSTANCE_KEY = 1;
  private static final AtomicInteger mCounter = new AtomicInteger(0);

  private final Context mContext;
  private final ReactHostDelegate mReactHostDelegate;
  private final ComponentFactory mComponentFactory;
  private DevSupportManager mDevSupportManager;
  private final Executor mBGExecutor;
  private final Executor mUIExecutor;
  private final Set<ReactSurfaceImpl> mAttachedSurfaces = new HashSet<>();
  private final MemoryPressureRouter mMemoryPressureRouter;
  private final boolean mAllowPackagerServerAccess;
  private final boolean mUseDevSupport;

  // todo: T192399917 This no longer needs to store the react instance
  private final BridgelessAtomicRef<Task<ReactInstance>> mCreateReactInstanceTaskRef =
      new BridgelessAtomicRef<>(Task.forResult(null));
  private @Nullable ReactInstance mReactInstance;

  private final BridgelessAtomicRef<BridgelessReactContext> mBridgelessReactContextRef =
      new BridgelessAtomicRef<>();

  private final AtomicReference<Activity> mActivity = new AtomicReference<>();
  private final AtomicReference<WeakReference<Activity>> mLastUsedActivity =
      new AtomicReference<>(new WeakReference<>(null));
  private final BridgelessReactStateTracker mBridgelessReactStateTracker =
      new BridgelessReactStateTracker(ReactBuildConfig.DEBUG);
  private final ReactLifecycleStateManager mReactLifecycleStateManager =
      new ReactLifecycleStateManager(mBridgelessReactStateTracker);
  private final int mId = mCounter.getAndIncrement();
  private @Nullable MemoryPressureListener mMemoryPressureListener;
  private @Nullable DefaultHardwareBackBtnHandler mDefaultHardwareBackBtnHandler;

  private final List<ReactInstanceEventListener> mReactInstanceEventListeners =
      new CopyOnWriteArrayList<>();
  private final List<Function0<Unit>> mBeforeDestroyListeners = new CopyOnWriteArrayList<>();

  private @Nullable ReactHostInspectorTarget mReactHostInspectorTarget;

  private volatile boolean mHostInvalidated = false;

  public ReactHostImpl(
      Context context,
      ReactHostDelegate delegate,
      ComponentFactory componentFactory,
      boolean allowPackagerServerAccess,
      boolean useDevSupport) {
    this(
        context,
        delegate,
        componentFactory,
        Executors.newSingleThreadExecutor(),
        Task.UI_THREAD_EXECUTOR,
        allowPackagerServerAccess,
        useDevSupport);
  }

  public ReactHostImpl(
      Context context,
      ReactHostDelegate delegate,
      ComponentFactory componentFactory,
      Executor bgExecutor,
      Executor uiExecutor,
      boolean allowPackagerServerAccess,
      boolean useDevSupport) {
    this(
        context,
        delegate,
        componentFactory,
        bgExecutor,
        uiExecutor,
        allowPackagerServerAccess,
        useDevSupport,
        null);
  }

  public ReactHostImpl(
      Context context,
      ReactHostDelegate delegate,
      ComponentFactory componentFactory,
      Executor bgExecutor,
      Executor uiExecutor,
      boolean allowPackagerServerAccess,
      boolean useDevSupport,
      @Nullable DevSupportManagerFactory devSupportManagerFactory) {
    mContext = context;
    mReactHostDelegate = delegate;
    mComponentFactory = componentFactory;
    mBGExecutor = bgExecutor;
    mUIExecutor = uiExecutor;
    mMemoryPressureRouter = new MemoryPressureRouter(context);
    mAllowPackagerServerAccess = allowPackagerServerAccess;
    mUseDevSupport = useDevSupport;
    if (devSupportManagerFactory == null) {
      devSupportManagerFactory = new DefaultDevSupportManagerFactory();
    }

    mDevSupportManager =
        devSupportManagerFactory.create(
            /* applicationContext */ context.getApplicationContext(),
            /* reactInstanceManagerHelper */ new ReactHostImplDevHelper(ReactHostImpl.this),
            /* packagerPathForJSBundleName */ mReactHostDelegate.getJsMainModulePath(),
            /* enableOnCreate */ true,
            /* redBoxHandler */ null,
            /* devBundleDownloadListener */ null,
            /* minNumShakes */ 2,
            /* customPackagerCommandHandlers */ null,
            /* surfaceDelegateFactory */ null,
            /* devLoadingViewManager */ null,
            /* pausedInDebuggerOverlayManager */ null,
            mUseDevSupport);
  }

  @Override
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
  @Override
  public TaskInterface<Void> start() {
    return Task.call(this::getOrCreateStartTask, mBGExecutor);
  }

  /** Initialize and run a React Native surface in a background without mounting real views. */
  /* package */
  TaskInterface<Void> prerenderSurface(final ReactSurfaceImpl surface) {
    final String method = "prerenderSurface(surfaceId = " + surface.getSurfaceID() + ")";
    log(method, "Schedule");

    attachSurface(surface);
    return callAfterGetOrCreateReactInstance(
        method,
        reactInstance -> {
          log(method, "Execute");
          reactInstance.prerenderSurface(surface);
        },
        mBGExecutor);
  }

  /**
   * Start rendering a React Native surface on screen.
   *
   * @param surface The ReactSurface to render
   * @return A Task that will complete when startSurface has been called.
   */
  /** package */
  TaskInterface<Void> startSurface(final ReactSurfaceImpl surface) {
    final String method = "startSurface(surfaceId = " + surface.getSurfaceID() + ")";
    log(method, "Schedule");

    attachSurface(surface);
    return callAfterGetOrCreateReactInstance(
        method,
        reactInstance -> {
          log(method, "Execute");
          reactInstance.startSurface(surface);
        },
        mBGExecutor);
  }

  /**
   * Stop rendering a React Native surface.
   *
   * @param surface The surface to stop
   * @return A Task that will complete when stopSurface has been called.
   */
  /** package */
  TaskInterface<Void> stopSurface(final ReactSurfaceImpl surface) {
    final String method = "stopSurface(surfaceId = " + surface.getSurfaceID() + ")";
    log(method, "Schedule");

    detachSurface(surface);
    return callWithExistingReactInstance(
            method,
            reactInstance -> {
              log(method, "Execute");
              reactInstance.stopSurface(surface);
            },
            mBGExecutor)
        .makeVoid();
  }

  /**
   * To be called when the host activity is resumed.
   *
   * @param activity The host activity
   */
  @ThreadConfined(UI)
  @Override
  public void onHostResume(
      final @Nullable Activity activity,
      @Nullable DefaultHardwareBackBtnHandler defaultBackButtonImpl) {
    mDefaultHardwareBackBtnHandler = defaultBackButtonImpl;
    onHostResume(activity);
  }

  @ThreadConfined(UI)
  @Override
  public void onHostResume(final @Nullable Activity activity) {
    final String method = "onHostResume(activity)";
    log(method);

    setCurrentActivity(activity);
    ReactContext currentContext = getCurrentReactContext();

    maybeEnableDevSupport(true);
    mReactLifecycleStateManager.moveToOnHostResume(currentContext, getCurrentActivity());
  }

  @ThreadConfined(UI)
  @Override
  public void onHostLeaveHint(final @Nullable Activity activity) {
    final String method = "onUserLeaveHint(activity)";
    log(method);

    ReactContext currentContext = getCurrentReactContext();
    if (currentContext != null) {
      currentContext.onUserLeaveHint(activity);
    }
  }

  @ThreadConfined(UI)
  @Override
  public void onHostPause(final @Nullable Activity activity) {
    final String method = "onHostPause(activity)";
    log(method);

    ReactContext currentContext = getCurrentReactContext();

    Activity currentActivity = getCurrentActivity();
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

    maybeEnableDevSupport(false);
    mDefaultHardwareBackBtnHandler = null;
    mReactLifecycleStateManager.moveToOnHostPause(currentContext, currentActivity);
  }

  /** To be called when the host activity is paused. */
  @ThreadConfined(UI)
  @Override
  public void onHostPause() {
    final String method = "onHostPause()";
    log(method);

    ReactContext currentContext = getCurrentReactContext();

    maybeEnableDevSupport(false);
    mDefaultHardwareBackBtnHandler = null;
    mReactLifecycleStateManager.moveToOnHostPause(currentContext, getCurrentActivity());
  }

  /** To be called when the host activity is destroyed. */
  @ThreadConfined(UI)
  @Override
  public void onHostDestroy() {
    final String method = "onHostDestroy()";
    log(method);

    maybeEnableDevSupport(false);
    moveToHostDestroy(getCurrentReactContext());
  }

  @ThreadConfined(UI)
  @Override
  public void onHostDestroy(@Nullable Activity activity) {
    final String method = "onHostDestroy(activity)";
    log(method);

    Activity currentActivity = getCurrentActivity();

    if (currentActivity == activity) {
      maybeEnableDevSupport(false);
      moveToHostDestroy(getCurrentReactContext());
    }
  }

  private void maybeEnableDevSupport(boolean enabled) {
    if (mUseDevSupport) {
      mDevSupportManager.setDevSupportEnabled(enabled);
    }
  }

  /**
   * Returns current ReactContext which could be nullable if ReactInstance hasn't been created.
   *
   * @return The {@link BridgelessReactContext} associated with ReactInstance.
   */
  @Override
  public @Nullable ReactContext getCurrentReactContext() {
    return mBridgelessReactContextRef.getNullable();
  }

  @Override
  public DevSupportManager getDevSupportManager() {
    return assertNotNull(mDevSupportManager);
  }

  @Override
  public ReactSurface createSurface(
      Context context, String moduleName, @Nullable Bundle initialProps) {
    ReactSurfaceImpl surface = new ReactSurfaceImpl(context, moduleName, initialProps);
    ReactSurfaceView surfaceView = new ReactSurfaceView(context, surface);
    surfaceView.setShouldLogContentAppeared(true);
    surface.attachView(surfaceView);
    surface.attach(this);
    return surface;
  }

  @Override
  public MemoryPressureRouter getMemoryPressureRouter() {
    return mMemoryPressureRouter;
  }

  /* package */ boolean isInstanceInitialized() {
    return mReactInstance != null;
  }

  @ThreadConfined(UI)
  @Override
  public boolean onBackPressed() {
    UiThreadUtil.assertOnUiThread();
    final ReactInstance reactInstance = mReactInstance;
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
    final ReactInstance reactInstance = mReactInstance;
    if (reactInstance != null) {
      return reactInstance.getReactQueueConfiguration();
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

  /**
   * Entrypoint to reload the ReactInstance. If the ReactInstance is destroying, will wait until
   * destroy is finished, before reloading.
   *
   * @param reason {@link String} describing why ReactHost is being reloaded (e.g. js error, user
   *     tap on reload button)
   * @return A task that completes when React Native reloads
   */
  @Override
  public TaskInterface<Void> reload(String reason) {
    final String method = "reload()";
    return Task.call(
        () -> {
          Task<Void> reloadTask = null;
          if (mDestroyTask != null) {
            log(method, "Waiting for destroy to finish, before reloading React Native.");
            reloadTask =
                mDestroyTask
                    .continueWithTask(task -> getOrCreateReloadTask(reason), mBGExecutor)
                    .makeVoid();
          } else {
            reloadTask = getOrCreateReloadTask(reason).makeVoid();
          }

          return reloadTask.continueWithTask(
              task -> {
                if (task.isFaulted()) {
                  final Exception ex = task.getError();
                  Assertions.assertNotNull(ex, "Reload failed without an exception");
                  if (mUseDevSupport) {
                    mDevSupportManager.handleException(ex);
                  } else {
                    mReactHostDelegate.handleInstanceException(ex);
                  }
                  return getOrCreateDestroyTask("Reload failed", ex);
                }

                return task;
              },
              mBGExecutor);
        },
        mBGExecutor);
  }

  @DoNotStrip
  private void setPausedInDebuggerMessage(@Nullable String message) {
    if (message == null) {
      mDevSupportManager.hidePausedInDebuggerOverlay();
    } else {
      mDevSupportManager.showPausedInDebuggerOverlay(
          message,
          new PausedInDebuggerOverlayCommandListener() {
            @Override
            public void onResume() {
              UiThreadUtil.assertOnUiThread();
              if (mReactHostInspectorTarget != null) {
                mReactHostInspectorTarget.sendDebuggerResumeCommand();
              }
            }
          });
    }
  }

  @DoNotStrip
  private Map<String, String> getHostMetadata() {
    return AndroidInfoHelpers.getInspectorHostMetadata(mContext);
  }

  @DoNotStrip
  private void loadNetworkResource(String url, InspectorNetworkRequestListener listener) {
    InspectorNetworkHelper.loadNetworkResource(url, listener);
  }

  /**
   * Entrypoint to destroy the ReactInstance. If the ReactInstance is reloading, will wait until
   * reload is finished, before destroying.
   *
   * <p>The destroy operation is asynchronous and the task returned by this method will complete
   * when React Native gets destroyed. Note that the destroy operation will execute in multiple
   * threads, in particular some of the sub-tasks will run in the UIThread. Calling {@link
   * TaskInterface#waitForCompletion()} from the UIThread will lead into a deadlock. Use
   * onDestroyFinished callback to be notified when React Native gets destroyed.
   *
   * @param reason describing why ReactHost is being destroyed (e.g. memory pressure)
   * @param ex exception that caused the trigger to destroy ReactHost (or null) This exception will
   *     be used to log properly the cause of destroy operation.
   * @param onDestroyFinished callback that will be called when React Native gets destroyed, the
   *     callback will run on a background thread.
   * @return A task that completes when React Native gets destroyed.
   */
  @Override
  public TaskInterface<Void> destroy(
      String reason, @Nullable Exception ex, Function1<? super Boolean, Unit> onDestroyFinished) {
    Task<Void> task = (Task<Void>) destroy(reason, ex);
    return task.continueWith(
        new Continuation<Void, Void>() {
          @Nullable
          @Override
          public Void then(Task<Void> task) throws Exception {
            boolean instanceDestroyedSuccessfully = task.isCompleted() && !task.isFaulted();
            onDestroyFinished.invoke(instanceDestroyedSuccessfully);
            return null;
          }
        });
  }

  /**
   * Entrypoint to destroy the ReactInstance. If the ReactInstance is reloading, will wait until
   * reload is finished, before destroying.
   *
   * <p>The destroy operation is asynchronous and the task returned by this method will complete
   * when React Native gets destroyed. Note that the destroy operation will execute in multiple
   * threads, in particular some of the sub-tasks will run in the UIThread. Calling {@link
   * TaskInterface#waitForCompletion()} from the UIThread will lead into a deadlock.
   *
   * @param reason {@link String} describing why ReactHost is being destroyed (e.g. memory pressure)
   * @param ex {@link Exception} exception that caused the trigger to destroy ReactHost (or null)
   *     This exception will be used to log properly the cause of destroy operation.
   * @return A task that completes when React Native gets destroyed.
   */
  @Override
  public TaskInterface<Void> destroy(String reason, @Nullable Exception ex) {
    final String method = "destroy()";
    return Task.call(
        () -> {
          if (mReloadTask != null) {
            log(
                method,
                "Reloading React Native. Waiting for reload to finish before destroying React"
                    + " Native.");
            return mReloadTask.continueWithTask(
                task -> getOrCreateDestroyTask(reason, ex), mBGExecutor);
          }
          return getOrCreateDestroyTask(reason, ex);
        },
        mBGExecutor);
  }

  private MemoryPressureListener createMemoryPressureListener(ReactInstance reactInstance) {
    WeakReference<ReactInstance> weakReactInstance = new WeakReference<>(reactInstance);
    return (level) -> {
      mBGExecutor.execute(
          () -> {
            @Nullable ReactInstance strongReactInstance = weakReactInstance.get();
            if (strongReactInstance != null) {
              strongReactInstance.handleMemoryPressure(level);
            }
          });
    };
  }

  @Nullable
  /* package */ Activity getCurrentActivity() {
    return mActivity.get();
  }

  @Nullable
  /* package */ Activity getLastUsedActivity() {
    @Nullable WeakReference<Activity> lastUsedActivityWeakRef = mLastUsedActivity.get();
    if (lastUsedActivityWeakRef != null) {
      return lastUsedActivityWeakRef.get();
    }
    return null;
  }

  private void setCurrentActivity(@Nullable Activity activity) {
    mActivity.set(activity);
    if (activity != null) {
      mLastUsedActivity.set(new WeakReference<>(activity));
    }
  }

  /**
   * Get the {@link EventDispatcher} from the {@link FabricUIManager}. This always returns an
   * EventDispatcher, even if the instance isn't alive; in that case, it returns a {@link
   * BlackHoleEventDispatcher} which no-ops.
   *
   * @return The real {@link EventDispatcher} if the instance is alive; otherwise, a {@link
   *     BlackHoleEventDispatcher}.
   */
  /* package */ EventDispatcher getEventDispatcher() {
    final ReactInstance reactInstance = mReactInstance;
    if (reactInstance == null) {
      return BlackHoleEventDispatcher.INSTANCE;
    }

    return reactInstance.getEventDispatcher();
  }

  /* package */
  @Nullable
  FabricUIManager getUIManager() {
    final ReactInstance reactInstance = mReactInstance;
    if (reactInstance == null) {
      return null;
    }
    return reactInstance.getFabricUIManager();
  }

  /* package */ <T extends NativeModule> boolean hasNativeModule(Class<T> nativeModuleInterface) {
    final ReactInstance reactInstance = mReactInstance;
    if (reactInstance != null) {
      return reactInstance.hasNativeModule(nativeModuleInterface);
    }
    return false;
  }

  /* package */ Collection<NativeModule> getNativeModules() {
    final ReactInstance reactInstance = mReactInstance;
    if (reactInstance != null) {
      return reactInstance.getNativeModules();
    }
    return new ArrayList<>();
  }

  /* package */
  @Nullable
  <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface) {
    if (!ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE
        && nativeModuleInterface == UIManagerModule.class) {

      ReactSoftExceptionLogger.logSoftExceptionVerbose(
          TAG,
          new ReactNoCrashBridgeNotAllowedSoftException(
              "getNativeModule(UIManagerModule.class) cannot be called when the bridge is"
                  + " disabled"));
    }

    final ReactInstance reactInstance = mReactInstance;
    if (reactInstance != null) {
      return reactInstance.getNativeModule(nativeModuleInterface);
    }
    return null;
  }

  /* package */
  @Nullable
  NativeModule getNativeModule(String nativeModuleName) {
    final ReactInstance reactInstance = mReactInstance;
    if (reactInstance != null) {
      return reactInstance.getNativeModule(nativeModuleName);
    }
    return null;
  }

  /* package */
  @Nullable
  RuntimeExecutor getRuntimeExecutor() {
    final String method = "getRuntimeExecutor()";

    final ReactInstance reactInstance = mReactInstance;
    if (reactInstance != null) {
      return reactInstance.getBufferedRuntimeExecutor();
    }
    raiseSoftException(method, "Tried to get runtime executor while instance is not ready");
    return null;
  }

  /* package */
  @Nullable
  CallInvokerHolder getJSCallInvokerHolder() {
    final String method = "getJSCallInvokerHolder()";

    final ReactInstance reactInstance = mReactInstance;
    if (reactInstance != null) {
      return reactInstance.getJSCallInvokerHolder();
    }
    raiseSoftException(method, "Tried to get JSCallInvokerHolder while instance is not ready");
    return null;
  }

  /**
   * To be called when the host activity receives an activity result.
   *
   * @param activity The host activity
   */
  @ThreadConfined(UI)
  @Override
  public void onActivityResult(
      Activity activity, int requestCode, int resultCode, @Nullable Intent data) {
    final String method =
        "onActivityResult(activity = \""
            + activity
            + "\", requestCode = \""
            + requestCode
            + "\", resultCode = \""
            + resultCode
            + "\", data = \""
            + data
            + "\")";

    ReactContext currentContext = getCurrentReactContext();
    if (currentContext != null) {
      currentContext.onActivityResult(activity, requestCode, resultCode, data);
    } else {
      raiseSoftException(method, "Tried to access onActivityResult while context is not ready");
    }
  }

  /* To be called when focus has changed for the hosting window. */
  @ThreadConfined(UI)
  @Override
  public void onWindowFocusChange(boolean hasFocus) {
    final String method = "onWindowFocusChange(hasFocus = \"" + hasFocus + "\")";

    ReactContext currentContext = getCurrentReactContext();
    if (currentContext != null) {
      currentContext.onWindowFocusChange(hasFocus);
    } else {
      raiseSoftException(method, "Tried to access onWindowFocusChange while context is not ready");
    }
  }

  /* This method will give JS the opportunity to receive intents via Linking.
   *
   * @param intent The incoming intent
   */
  @ThreadConfined(UI)
  @Override
  public void onNewIntent(Intent intent) {
    final String method = "onNewIntent(intent = \"" + intent + "\")";

    ReactContext currentContext = getCurrentReactContext();
    if (currentContext != null) {
      String action = intent.getAction();
      Uri uri = intent.getData();

      if (uri != null
          && (Intent.ACTION_VIEW.equals(action)
              || NfcAdapter.ACTION_NDEF_DISCOVERED.equals(action))) {
        DeviceEventManagerModule deviceEventManagerModule =
            currentContext.getNativeModule(DeviceEventManagerModule.class);
        if (deviceEventManagerModule != null) {
          deviceEventManagerModule.emitNewIntentReceived(uri);
        }
      }
      currentContext.onNewIntent(getCurrentActivity(), intent);
    } else {
      raiseSoftException(method, "Tried to access onNewIntent while context is not ready");
    }
  }

  @ThreadConfined(UI)
  @Override
  public void onConfigurationChanged(Context updatedContext) {
    ReactContext currentReactContext = getCurrentReactContext();
    if (currentReactContext != null) {
      if (ReactNativeFeatureFlags.enableFontScaleChangesUpdatingLayout()) {
        DisplayMetricsHolder.initDisplayMetrics(currentReactContext);
      }

      AppearanceModule appearanceModule =
          currentReactContext.getNativeModule(AppearanceModule.class);

      if (appearanceModule != null) {
        appearanceModule.onConfigurationChanged(updatedContext);
      }
    }
  }

  @Nullable
  JavaScriptContextHolder getJavaScriptContextHolder() {
    final ReactInstance reactInstance = mReactInstance;
    if (reactInstance != null) {
      return reactInstance.getJavaScriptContextHolder();
    }
    return null;
  }

  /* package */
  DefaultHardwareBackBtnHandler getDefaultBackButtonHandler() {
    return () -> {
      UiThreadUtil.assertOnUiThread();
      if (mDefaultHardwareBackBtnHandler != null) {
        mDefaultHardwareBackBtnHandler.invokeDefaultOnBackPressed();
      }
    };
  }

  /* package */ Task<Boolean> loadBundle(final JSBundleLoader bundleLoader) {
    final String method = "loadBundle()";
    log(method, "Schedule");

    return callWithExistingReactInstance(
        method,
        reactInstance -> {
          log(method, "Execute");
          reactInstance.loadJSBundle(bundleLoader);
        },
        null);
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
        },
        null);
  }

  /* package */ void handleHostException(Exception e) {
    final String method = "handleHostException(message = \"" + e.getMessage() + "\")";
    log(method);

    if (mUseDevSupport) {
      mDevSupportManager.handleException(e);
    } else {
      mReactHostDelegate.handleInstanceException(e);
    }
    destroy(method, e);
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
        },
        null);
  }

  /* package */ void attachSurface(ReactSurfaceImpl surface) {
    final String method = "attachSurface(surfaceId = " + surface.getSurfaceID() + ")";
    log(method);

    synchronized (mAttachedSurfaces) {
      mAttachedSurfaces.add(surface);
    }
  }

  /* package */ void detachSurface(ReactSurfaceImpl surface) {
    final String method = "detachSurface(surfaceId = " + surface.getSurfaceID() + ")";
    log(method);

    synchronized (mAttachedSurfaces) {
      mAttachedSurfaces.remove(surface);
    }
  }

  /* package */ boolean isSurfaceAttached(ReactSurfaceImpl surface) {
    synchronized (mAttachedSurfaces) {
      return mAttachedSurfaces.contains(surface);
    }
  }

  /* package */ boolean isSurfaceWithModuleNameAttached(String moduleName) {
    synchronized (mAttachedSurfaces) {
      for (ReactSurfaceImpl surface : mAttachedSurfaces) {
        if (surface.getModuleName().equals(moduleName)) {
          return true;
        }
      }
      return false;
    }
  }

  @Override
  public void addBeforeDestroyListener(Function0<Unit> onBeforeDestroy) {
    mBeforeDestroyListeners.add(onBeforeDestroy);
  }

  @Override
  public void removeBeforeDestroyListener(Function0<Unit> onBeforeDestroy) {
    mBeforeDestroyListeners.remove(onBeforeDestroy);
  }

  private interface ReactInstanceCalback {
    void then(ReactInstance reactInstance);
  }

  @ThreadConfined("ReactHost")
  private @Nullable Task<Void> mStartTask = null;

  @ThreadConfined("ReactHost")
  private Task<Void> getOrCreateStartTask() {
    final String method = "getOrCreateStartTask()";
    if (mStartTask == null) {
      log(method, "Schedule");
      if (ReactBuildConfig.DEBUG) {
        Assertions.assertCondition(
            ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture(),
            "enableBridgelessArchitecture FeatureFlag must be set to start ReactNative.");

        Assertions.assertCondition(
            ReactNativeNewArchitectureFeatureFlags.enableFabricRenderer(),
            "enableFabricRenderer FeatureFlag must be set to start ReactNative.");

        Assertions.assertCondition(
            ReactNativeNewArchitectureFeatureFlags.useTurboModules(),
            "useTurboModules FeatureFlag must be set to start ReactNative.");
      }
      if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
        Assertions.assertCondition(
            !ReactNativeNewArchitectureFeatureFlags.useFabricInterop(),
            "useFabricInterop FeatureFlag must be false when"
                + " UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE == true.");
        Assertions.assertCondition(
            !ReactNativeNewArchitectureFeatureFlags.useTurboModuleInterop(),
            "useTurboModuleInterop FeatureFlag must be false when"
                + " UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE == true.");
      }
      mStartTask =
          waitThenCallGetOrCreateReactInstanceTask()
              .continueWithTask(
                  (task) -> {
                    if (task.isFaulted()) {
                      Exception ex = Assertions.assertNotNull(task.getError());
                      if (mUseDevSupport) {
                        mDevSupportManager.handleException(ex);
                      } else {
                        mReactHostDelegate.handleInstanceException(ex);
                      }
                      // Wait for destroy to finish
                      return getOrCreateDestroyTask(
                              "getOrCreateStartTask() failure: " + ex.getMessage(), ex)
                          .continueWithTask(destroyTask -> Task.forError(ex))
                          .makeVoid();
                    }
                    return task.makeVoid();
                  },
                  mBGExecutor);
    }
    return mStartTask;
  }

  @ThreadConfined(UI)
  private void moveToHostDestroy(@Nullable ReactContext currentContext) {
    mReactLifecycleStateManager.moveToOnHostDestroy(currentContext);
    setCurrentActivity(null);
  }

  private void raiseSoftException(String callingMethod, String message) {
    raiseSoftException(callingMethod, message, null);
  }

  private void raiseSoftException(
      String callingMethod, String message, @Nullable Throwable throwable) {
    final String method = "raiseSoftException(" + callingMethod + ")";
    log(method, message);
    ReactSoftExceptionLogger.logSoftException(
        TAG, new ReactNoCrashSoftException(method + ": " + message, throwable));
  }

  /** Schedule work on a ReactInstance that is already created. */
  private Task<Boolean> callWithExistingReactInstance(
      final String callingMethod,
      final ReactInstanceCalback continuation,
      @Nullable Executor executor) {
    final String method = "callWithExistingReactInstance(" + callingMethod + ")";

    if (executor == null) {
      executor = Task.IMMEDIATE_EXECUTOR;
    }

    return mCreateReactInstanceTaskRef
        .get()
        .onSuccess(
            task -> {
              final ReactInstance reactInstance = task.getResult();
              if (reactInstance == null) {
                raiseSoftException(method, "Execute: reactInstance is null. Dropping work.");
                return FALSE;
              }

              continuation.then(reactInstance);
              return TRUE;
            },
            executor);
  }

  /** Create a ReactInstance if it doesn't exist already, and schedule work on it. */
  private Task<Void> callAfterGetOrCreateReactInstance(
      final String callingMethod,
      final ReactInstanceCalback runnable,
      @Nullable Executor executor) {
    final String method = "callAfterGetOrCreateReactInstance(" + callingMethod + ")";

    if (executor == null) {
      executor = Task.IMMEDIATE_EXECUTOR;
    }

    return getOrCreateReactInstance()
        .onSuccess(
            task -> {
              final ReactInstance reactInstance = task.getResult();
              if (reactInstance == null) {
                raiseSoftException(method, "Execute: reactInstance is null. Dropping work.");
                return null;
              }

              runnable.then(reactInstance);
              return null;
            },
            executor)
        .continueWith(
            task -> {
              if (task.isFaulted()) {
                handleHostException(Assertions.assertNotNull(task.getError()));
              }
              return null;
            });
  }

  private BridgelessReactContext getOrCreateReactContext() {
    final String method = "getOrCreateReactContext()";
    return mBridgelessReactContextRef.getOrCreate(
        () -> {
          log(method, "Creating BridgelessReactContext");
          return new BridgelessReactContext(mContext, ReactHostImpl.this);
        });
  }

  /**
   * Entrypoint to create the ReactInstance.
   *
   * <p>If the ReactInstance is reloading, will return the reload task. If the ReactInstance is
   * destroying, will wait until destroy is finished, before creating.
   */
  private Task<ReactInstance> getOrCreateReactInstance() {
    return Task.call(this::waitThenCallGetOrCreateReactInstanceTask, mBGExecutor);
  }

  @ThreadConfined("ReactHost")
  private Task<ReactInstance> waitThenCallGetOrCreateReactInstanceTask() {
    return waitThenCallGetOrCreateReactInstanceTaskWithRetries(0, 4);
  }

  @ThreadConfined("ReactHost")
  private Task<ReactInstance> waitThenCallGetOrCreateReactInstanceTaskWithRetries(
      int tryNum, int maxTries) {
    final String method = "waitThenCallGetOrCreateReactInstanceTaskWithRetries";
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
            (task) -> waitThenCallGetOrCreateReactInstanceTaskWithRetries(tryNum + 1, maxTries),
            mBGExecutor);
      }

      raiseSoftException(
          method,
          "React Native is tearing down. Not wait for teardown to finish: reached max retries.");
    }

    return getOrCreateReactInstanceTask();
  }

  private static class CreationResult {
    final ReactInstance mInstance;
    final ReactContext mContext;
    final boolean mIsReloading;

    private CreationResult(ReactInstance instance, ReactContext context, boolean isReloading) {
      mInstance = instance;
      mContext = context;
      mIsReloading = isReloading;
    }
  }

  @ThreadConfined("ReactHost")
  private Task<ReactInstance> getOrCreateReactInstanceTask() {
    final String method = "getOrCreateReactInstanceTask()";
    log(method);

    return mCreateReactInstanceTaskRef.getOrCreate(
        () -> {
          log(method, "Start");
          Assertions.assertCondition(
              !mHostInvalidated, "Cannot start a new ReactInstance on an invalidated ReactHost");

          ReactMarker.logMarker(
              ReactMarkerConstants.REACT_BRIDGELESS_LOADING_START, BRIDGELESS_MARKER_INSTANCE_KEY);

          Task<CreationResult> creationTask =
              getJsBundleLoader()
                  .onSuccess(
                      task -> {
                        final JSBundleLoader bundleLoader =
                            Assertions.assertNotNull(task.getResult());
                        final BridgelessReactContext reactContext = getOrCreateReactContext();
                        final DevSupportManager devSupportManager = getDevSupportManager();
                        reactContext.setJSExceptionHandler(devSupportManager);

                        log(method, "Creating ReactInstance");
                        final ReactInstance instance =
                            new ReactInstance(
                                reactContext,
                                mReactHostDelegate,
                                mComponentFactory,
                                devSupportManager,
                                this::handleHostException,
                                mUseDevSupport,
                                getOrCreateReactHostInspectorTarget());
                        mReactInstance = instance;

                        MemoryPressureListener memoryPressureListener =
                            createMemoryPressureListener(instance);
                        mMemoryPressureListener = memoryPressureListener;
                        mMemoryPressureRouter.addMemoryPressureListener(memoryPressureListener);

                        // Eagerly initialize turbo modules in parallel with JS bundle execution
                        // as TurboModuleManager will handle any concurrent access
                        instance.initializeEagerTurboModules();

                        log(method, "Loading JS Bundle");
                        instance.loadJSBundle(bundleLoader);

                        log(
                            method,
                            "Calling DevSupportManagerBase.onNewReactContextCreated(reactContext)");
                        devSupportManager.onNewReactContextCreated(reactContext);

                        reactContext.runOnJSQueueThread(
                            () -> {
                              // Executing on the JS thread to ensure that we're done
                              // loading the JS bundle.
                              // TODO T76081936 Move this if we switch to a sync RTE
                              ReactMarker.logMarker(
                                  ReactMarkerConstants.REACT_BRIDGELESS_LOADING_END,
                                  BRIDGELESS_MARKER_INSTANCE_KEY);
                            });

                        return new CreationResult(instance, reactContext, mReloadTask != null);
                      },
                      mBGExecutor);

          Continuation<CreationResult, ReactInstance> lifecycleUpdateTask =
              task -> {
                CreationResult result = Assertions.assertNotNull(task.getResult());
                final ReactInstance reactInstance = result.mInstance;
                final ReactContext reactContext = result.mContext;
                final boolean isReloading = result.mIsReloading;
                final boolean isManagerResumed =
                    mReactLifecycleStateManager.getLifecycleState() == LifecycleState.RESUMED;

                /**
                 * ReactContext.onHostResume() should only be called when the user navigates to the
                 * first React Native screen.
                 *
                 * <p>During init: The application puts the React manager in a resumed state, when
                 * the user navigates to a React Native screen. Two types of init: (1) If React
                 * Native init happens when the user navigates to a React Native screen, the React
                 * manager will get resumed on init start, so ReactContext.onHostResume() will be
                 * executed here. (2) If React Native init happens before the user navigates to a
                 * React Native screen (i.e: React Native is preloaded), the React manager won't be
                 * in a resumed state here. So ReactContext.onHostResume() won't be executed here.
                 * But, when the user navigates to their first React Native screen, the application
                 * will call ReactHost.onHostResume(). That will call ReactContext.onHostResume().
                 *
                 * <p>During reloads, if the manager isn't resumed, call
                 * ReactContext.onHostResume(). If React Native is reloading, it seems reasonable to
                 * assume that: (1) We must have navigated to a React Native screen in the past, or
                 * (2) We must be on a React Native screen.
                 */
                if (isReloading && !isManagerResumed) {
                  mReactLifecycleStateManager.moveToOnHostResume(
                      reactContext, getCurrentActivity());
                } else {
                  /**
                   * Call ReactContext.onHostResume() only when already in the resumed state which
                   * aligns with the bridge https://fburl.com/diffusion/2qhxmudv.
                   */
                  mReactLifecycleStateManager.resumeReactContextIfHostResumed(
                      reactContext, getCurrentActivity());
                }

                log(method, "Executing ReactInstanceEventListeners");
                for (ReactInstanceEventListener listener : mReactInstanceEventListeners) {
                  if (listener != null) {
                    listener.onReactContextInitialized(reactContext);
                  }
                }
                return reactInstance;
              };

          creationTask.onSuccess(lifecycleUpdateTask, mUIExecutor);
          return creationTask.onSuccess(
              task -> Assertions.assertNotNull(task.getResult()).mInstance,
              Task.IMMEDIATE_EXECUTOR);
        });
  }

  private Task<JSBundleLoader> getJsBundleLoader() {
    final String method = "getJSBundleLoader()";
    log(method);

    if (mUseDevSupport && mAllowPackagerServerAccess) {
      return isMetroRunning()
          .onSuccessTask(
              task -> {
                boolean isMetroRunning = Assertions.assertNotNull(task.getResult());
                if (isMetroRunning) {
                  // Since metro is running, fetch the JS bundle from the server
                  return loadJSBundleFromMetro();
                }
                return Task.forResult(mReactHostDelegate.getJsBundleLoader());
              },
              mBGExecutor);
    } else {
      if (ReactBuildConfig.DEBUG) {
        FLog.d(TAG, "Packager server access is disabled in this environment");
      }

      /**
       * In prod mode: fall back to the JS bundle loader from the delegate.
       *
       * <p>Note: Create the prod JSBundleLoader inside a Task.call. Why: If JSBundleLoader creation
       * throws an exception, the task will fault, and we'll go through the ReactHost error
       * reporting pipeline.
       */
      try {
        return Task.forResult(mReactHostDelegate.getJsBundleLoader());
      } catch (Exception e) {
        return Task.forError(e);
      }
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

  private Task<JSBundleLoader> loadJSBundleFromMetro() {
    final String method = "loadJSBundleFromMetro()";
    log(method);

    final TaskCompletionSource<JSBundleLoader> taskCompletionSource = new TaskCompletionSource<>();
    final DevSupportManagerBase asyncDevSupportManager =
        ((DevSupportManagerBase) getDevSupportManager());
    String bundleURL =
        asyncDevSupportManager
            .getDevServerHelper()
            .getDevServerBundleURL(
                Assertions.assertNotNull(asyncDevSupportManager.getJSAppBundleName()));

    asyncDevSupportManager.reloadJSFromServer(
        bundleURL,
        new BundleLoadCallback() {
          @Override
          public void onSuccess() {
            log(method, "Creating BundleLoader");
            JSBundleLoader bundleLoader =
                JSBundleLoader.createCachedBundleFromNetworkLoader(
                    bundleURL, asyncDevSupportManager.getDownloadedJSBundleFile());
            taskCompletionSource.setResult(bundleLoader);
          }

          @Override
          public void onError(Exception cause) {
            taskCompletionSource.setError(cause);
          }
        });

    return taskCompletionSource.getTask();
  }

  private void log(String method, String message) {
    mBridgelessReactStateTracker.enterState("ReactHost{" + mId + "}." + method + ": " + message);
  }

  private void log(String method) {
    mBridgelessReactStateTracker.enterState("ReactHost{" + mId + "}." + method);
  }

  private void stopAttachedSurfaces(String method, ReactInstance reactInstance) {
    log(method, "Stopping all React Native surfaces");
    synchronized (mAttachedSurfaces) {
      for (ReactSurfaceImpl surface : mAttachedSurfaces) {
        reactInstance.stopSurface(surface);
        surface.clear();
      }
    }
  }

  private void startAttachedSurfaces(String method, ReactInstance reactInstance) {
    log(method, "Restarting previously running React Native Surfaces");
    synchronized (mAttachedSurfaces) {
      for (ReactSurfaceImpl surface : mAttachedSurfaces) {
        reactInstance.startSurface(surface);
      }
    }
  }

  @ThreadConfined("ReactHost")
  private @Nullable Task<ReactInstance> mReloadTask = null;

  private interface ReactInstanceTaskUnwrapper {
    @Nullable
    ReactInstance unwrap(Task<ReactInstance> task, String stage);
  }

  private ReactInstanceTaskUnwrapper createReactInstanceUnwrapper(
      String tag, String method, String reason) {

    return (task, stage) -> {
      final ReactInstance reactInstance = task.getResult();
      final ReactInstance currentReactInstance = mReactInstance;

      final String stageLabel = "Stage: " + stage;
      final String reasonLabel = tag + " reason: " + reason;
      if (task.isFaulted()) {
        final Exception ex = Assertions.assertNotNull(task.getError());
        final String faultLabel = "Fault reason: " + ex.getMessage();
        raiseSoftException(
            method,
            tag
                + ": ReactInstance task faulted. "
                + stageLabel
                + ". "
                + faultLabel
                + ". "
                + reasonLabel);
        return currentReactInstance;
      }

      if (task.isCancelled()) {
        raiseSoftException(
            method, tag + ": ReactInstance task cancelled. " + stageLabel + ". " + reasonLabel);
        return currentReactInstance;
      }

      if (reactInstance == null) {
        raiseSoftException(
            method, tag + ": ReactInstance task returned null. " + stageLabel + ". " + reasonLabel);
        return currentReactInstance;
      }

      if (currentReactInstance != null && reactInstance != currentReactInstance) {
        raiseSoftException(
            method,
            tag
                + ": Detected two different ReactInstances. Returning old. "
                + stageLabel
                + ". "
                + reasonLabel);
      }

      return reactInstance;
    };
  }

  /**
   * The ReactInstance is loaded. Tear it down, and re-create it.
   *
   * <p>If the ReactInstance is in an "invalid state", make a "best effort" attempt to clean up
   * React. "invalid state" means: ReactInstance task is faulted; ReactInstance is null; React
   * instance task is cancelled; BridgelessReactContext is null. This can typically happen if the
   * ReactInstance task work throws an exception.
   */
  @ThreadConfined("ReactHost")
  private Task<ReactInstance> getOrCreateReloadTask(String reason) {
    final String method = "getOrCreateReloadTask()";
    log(method);

    // Log how React Native is destroyed
    // TODO(T136397487): Remove after Venice is shipped to 100%
    raiseSoftException(method, reason);

    ReactInstanceTaskUnwrapper reactInstanceTaskUnwrapper =
        createReactInstanceUnwrapper("Reload", method, reason);

    if (mReloadTask == null) {
      // When using the immediate executor, we want to avoid scheduling any further work immediately
      // when destruction is kicked off.
      log(method, "Resetting createReactInstance task ref");
      mReloadTask =
          mCreateReactInstanceTaskRef
              .getAndReset()
              .continueWithTask(
                  (task) -> {
                    log(method, "Starting React Native reload");
                    final ReactInstance reactInstance =
                        reactInstanceTaskUnwrapper.unwrap(task, "1: Starting reload");

                    unregisterInstanceFromInspector(reactInstance);

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

                    return Task.forResult(reactInstance);
                  },
                  mUIExecutor)
              .continueWithTask(
                  task -> {
                    final ReactInstance reactInstance =
                        reactInstanceTaskUnwrapper.unwrap(task, "2: Surface shutdown");

                    if (reactInstance == null) {
                      raiseSoftException(method, "Skipping surface shutdown: ReactInstance null");
                      return task;
                    }

                    stopAttachedSurfaces(method, reactInstance);
                    return task;
                  },
                  mBGExecutor)
              .continueWithTask(
                  (task) -> {
                    reactInstanceTaskUnwrapper.unwrap(task, "3: Destroying ReactContext");
                    for (Function0<Unit> destroyListener : mBeforeDestroyListeners) {
                      destroyListener.invoke();
                    }

                    if (mMemoryPressureListener != null) {
                      log(method, "Removing memory pressure listener");
                      mMemoryPressureRouter.removeMemoryPressureListener(mMemoryPressureListener);
                    }

                    final ReactContext reactContext = mBridgelessReactContextRef.getNullable();
                    if (reactContext != null) {
                      log(method, "Resetting ReactContext ref");
                      mBridgelessReactContextRef.reset();

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
                    final ReactInstance reactInstance =
                        reactInstanceTaskUnwrapper.unwrap(task, "4: Destroying ReactInstance");

                    if (reactInstance == null) {
                      raiseSoftException(
                          method, "Skipping ReactInstance.destroy(): ReactInstance null");
                    } else {
                      log(method, "Resetting ReactInstance ptr");
                      mReactInstance = null;

                      log(method, "Destroying ReactInstance");
                      reactInstance.destroy();
                    }

                    log(method, "Resetting start task ref");
                    mStartTask = null;

                    // Kickstart a new ReactInstance create
                    return getOrCreateReactInstanceTask();
                  },
                  mBGExecutor)
              .continueWithTask(
                  task -> {
                    final ReactInstance reactInstance =
                        reactInstanceTaskUnwrapper.unwrap(task, "5: Restarting surfaces");

                    if (reactInstance == null) {
                      raiseSoftException(method, "Skipping surface restart: ReactInstance null");
                      return task;
                    }

                    startAttachedSurfaces(method, reactInstance);

                    return task;
                  },
                  mBGExecutor)
              .continueWithTask(
                  task -> {
                    if (task.isFaulted()) {
                      Exception fault = Assertions.assertNotNull(task.getError());
                      raiseSoftException(
                          method,
                          "Error during reload. ReactInstance task faulted. Fault reason: "
                              + fault.getMessage()
                              + ". Reload reason: "
                              + reason,
                          task.getError());
                    }

                    if (task.isCancelled()) {
                      raiseSoftException(
                          method,
                          "Error during reload. ReactInstance task cancelled. Reload reason: "
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
  private Task<Void> getOrCreateDestroyTask(final String reason, @Nullable Exception ex) {
    final String method = "getOrCreateDestroyTask()";
    log(method);

    // Log how React Native is destroyed
    // TODO(T136397487): Remove after Venice is shipped to 100%
    raiseSoftException(method, reason, ex);

    ReactInstanceTaskUnwrapper reactInstanceTaskUnwrapper =
        createReactInstanceUnwrapper("Destroy", method, reason);

    if (mDestroyTask == null) {
      // When using the immediate executor, we want to avoid scheduling any further work immediately
      // when destruction is kicked off.
      log(method, "Resetting createReactInstance task ref");
      mDestroyTask =
          mCreateReactInstanceTaskRef
              .getAndReset()
              .continueWithTask(
                  task -> {
                    log(method, "Starting React Native destruction");

                    final ReactInstance reactInstance =
                        reactInstanceTaskUnwrapper.unwrap(task, "1: Starting destroy");

                    unregisterInstanceFromInspector(reactInstance);

                    if (mHostInvalidated) {
                      // If the host has been invalidated, now that the current context/instance
                      // has been unregistered, we can safely destroy the host's inspector
                      // target.
                      if (mReactHostInspectorTarget != null) {
                        mReactHostInspectorTarget.close();
                        mReactHostInspectorTarget = null;
                      }
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

                    return Task.forResult(reactInstance);
                  },
                  mUIExecutor)
              .continueWithTask(
                  task -> {
                    final ReactInstance reactInstance =
                        reactInstanceTaskUnwrapper.unwrap(task, "2: Stopping surfaces");
                    if (reactInstance == null) {
                      raiseSoftException(method, "Skipping surface shutdown: ReactInstance null");
                      return task;
                    }

                    // Step 3: Stop all React Native surfaces
                    stopAttachedSurfaces(method, reactInstance);
                    synchronized (mAttachedSurfaces) {
                      mAttachedSurfaces.clear();
                    }

                    return task;
                  },
                  mBGExecutor)
              .continueWithTask(
                  task -> {
                    reactInstanceTaskUnwrapper.unwrap(task, "3: Destroying ReactContext");
                    for (Function0<Unit> destroyListener : mBeforeDestroyListeners) {
                      destroyListener.invoke();
                    }

                    final ReactContext reactContext = mBridgelessReactContextRef.getNullable();
                    if (reactContext == null) {
                      raiseSoftException(method, "ReactContext is null. Destroy reason: " + reason);
                    }

                    // Step 4: De-register the memory pressure listener
                    log(method, "Destroying MemoryPressureRouter");
                    mMemoryPressureRouter.destroy(mContext);

                    if (reactContext != null) {
                      log(method, "Resetting ReactContext ref");
                      mBridgelessReactContextRef.reset();

                      log(method, "Destroying ReactContext");
                      reactContext.destroy();
                    }

                    // Reset current activity
                    setCurrentActivity(null);

                    // Clear ResourceIdleDrawableIdMap
                    ResourceDrawableIdHelper.getInstance().clear();

                    return task;
                  },
                  mUIExecutor)
              .continueWithTask(
                  task -> {
                    final ReactInstance reactInstance =
                        reactInstanceTaskUnwrapper.unwrap(task, "4: Destroying ReactInstance");

                    if (reactInstance == null) {
                      raiseSoftException(
                          method, "Skipping ReactInstance.destroy(): ReactInstance null");
                    } else {
                      log(method, "Resetting ReactInstance ptr");
                      mReactInstance = null;

                      log(method, "Destroying ReactInstance");
                      reactInstance.destroy();
                    }

                    log(method, "Resetting start task ref");
                    mStartTask = null;

                    log(method, "Resetting destroy task ref");
                    mDestroyTask = null;
                    return task;
                  },
                  mBGExecutor)
              .continueWith(
                  task -> {
                    if (task.isFaulted()) {
                      Exception fault = Assertions.assertNotNull(task.getError());
                      raiseSoftException(
                          method,
                          "React destruction failed. ReactInstance task faulted. Fault reason: "
                              + fault.getMessage()
                              + ". Destroy reason: "
                              + reason,
                          task.getError());
                    }

                    if (task.isCancelled()) {
                      raiseSoftException(
                          method,
                          "React destruction failed. ReactInstance task cancelled. Destroy reason: "
                              + reason);
                    }
                    return null;
                  });
    }

    return mDestroyTask;
  }

  @VisibleForTesting
  /* package */ @Nullable
  ReactHostInspectorTarget getOrCreateReactHostInspectorTarget() {
    if (mReactHostInspectorTarget == null && InspectorFlags.getFuseboxEnabled()) {
      // NOTE: ReactHostInspectorTarget only retains a weak reference to `this`.
      mReactHostInspectorTarget = new ReactHostInspectorTarget(this);
    }

    return mReactHostInspectorTarget;
  }

  @ThreadConfined(UI)
  @VisibleForTesting
  /* package */ void unregisterInstanceFromInspector(final @Nullable ReactInstance reactInstance) {
    if (reactInstance != null) {
      if (InspectorFlags.getFuseboxEnabled()) {
        Assertions.assertCondition(
            mReactHostInspectorTarget != null && mReactHostInspectorTarget.isValid(),
            "Host inspector target destroyed before instance was unregistered");
      }
      reactInstance.unregisterFromInspector();
    }
  }

  @Override
  public void invalidate() {
    FLog.d(TAG, "ReactHostImpl.invalidate()");
    mHostInvalidated = true;
    destroy("ReactHostImpl.invalidate()", null);
  }
}
