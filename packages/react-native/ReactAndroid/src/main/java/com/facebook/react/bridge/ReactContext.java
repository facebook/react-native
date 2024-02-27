/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import static com.facebook.infer.annotation.ThreadConfined.UI;

import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.interop.InteropModuleRegistry;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.bridge.queue.ReactQueueConfiguration;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.common.annotations.DeprecatedInNewArchitecture;
import com.facebook.react.common.annotations.FrameworkAPI;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import java.lang.ref.WeakReference;
import java.util.Collection;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Abstract ContextWrapper for Android application or activity {@link Context} and {@link
 * CatalystInstance}
 */
public abstract class ReactContext extends ContextWrapper {

  @DoNotStrip
  public interface RCTDeviceEventEmitter extends JavaScriptModule {

    void emit(@NonNull String eventName, @Nullable Object data);
  }

  private static final String TAG = "ReactContext";

  private final CopyOnWriteArraySet<LifecycleEventListener> mLifecycleEventListeners =
      new CopyOnWriteArraySet<>();
  private final CopyOnWriteArraySet<ActivityEventListener> mActivityEventListeners =
      new CopyOnWriteArraySet<>();
  private final CopyOnWriteArraySet<WindowFocusChangeListener> mWindowFocusEventListeners =
      new CopyOnWriteArraySet<>();

  private LifecycleState mLifecycleState = LifecycleState.BEFORE_CREATE;

  private @Nullable LayoutInflater mInflater;
  private @Nullable MessageQueueThread mUiMessageQueueThread;
  private @Nullable MessageQueueThread mNativeModulesMessageQueueThread;
  private @Nullable MessageQueueThread mJSMessageQueueThread;
  private @Nullable JSExceptionHandler mJSExceptionHandler;
  private @Nullable JSExceptionHandler mExceptionHandlerWrapper;
  private @Nullable WeakReference<Activity> mCurrentActivity;

  protected @Nullable InteropModuleRegistry mInteropModuleRegistry;
  private boolean mIsInitialized = false;

  private @Nullable ReactContext mOtherReactContext = null;

  public ReactContext(Context base) {
    super(base);
  }

  /**
   * Use this constructor to create a ReactContext that decorates another. One usage is
   * ThemedReactContext, which decorates the ReactContext with rendering-related APIs.
   * @param other
   * @param base
   */
  protected ReactContext(ReactContext other, Context base) {
    super(base);
    mOtherReactContext = other;
  }

  /** Initialize message queue threads using a ReactQueueConfiguration. */
  public synchronized void initialize(ReactQueueConfiguration queueConfig) {
    if (mOtherReactContext != null) {
      mOtherReactContext.initialize(queueConfig);
      return;
    }

    FLog.d(TAG, "initialize() is called.");
    if (mUiMessageQueueThread != null
        || mNativeModulesMessageQueueThread != null
        || mJSMessageQueueThread != null) {
      throw new IllegalStateException("Message queue threads already initialized");
    }
    mUiMessageQueueThread = queueConfig.getUIQueueThread();
    mNativeModulesMessageQueueThread = queueConfig.getNativeModulesQueueThread();
    mJSMessageQueueThread = queueConfig.getJSQueueThread();

    /** TODO(T85807990): Fail fast if any of the threads is null. */
    if (mUiMessageQueueThread == null) {
      throw new IllegalStateException("UI thread is null");
    }
    if (mNativeModulesMessageQueueThread == null) {
      throw new IllegalStateException("NativeModules thread is null");
    }
    if (mJSMessageQueueThread == null) {
      throw new IllegalStateException("JavaScript thread is null");
    }
    mIsInitialized = true;
  }

  protected void initializeInteropModules() {
    if (mOtherReactContext != null) {
      mOtherReactContext.initializeInteropModules();
      return;
    }

    mInteropModuleRegistry = new InteropModuleRegistry();
  }

  public void resetPerfStats() {
    if (mOtherReactContext != null) {
      mOtherReactContext.resetPerfStats();
      return;
    }

    if (mNativeModulesMessageQueueThread != null) {
      mNativeModulesMessageQueueThread.resetPerfStats();
    }
    if (mJSMessageQueueThread != null) {
      mJSMessageQueueThread.resetPerfStats();
    }
  }

  public void setJSExceptionHandler(@Nullable JSExceptionHandler jSExceptionHandler) {
    if (mOtherReactContext != null) {
      mOtherReactContext.setJSExceptionHandler(jSExceptionHandler);
      return;
    }

    mJSExceptionHandler = jSExceptionHandler;
  }

  // We override the following method so that views inflated with the inflater obtained from this
  // context return the ReactContext in #getContext(). The default implementation uses the base
  // context instead, so it couldn't be cast to ReactContext.
  // TODO: T7538796 Check requirement for Override of getSystemService ReactContext
  @Override
  public Object getSystemService(String name) {
    if (mOtherReactContext != null) {
      return mOtherReactContext.getSystemService(name);
    }

    if (LAYOUT_INFLATER_SERVICE.equals(name)) {
      if (mInflater == null) {
        mInflater = LayoutInflater.from(getBaseContext()).cloneInContext(this);
      }
      return mInflater;
    }
    return getBaseContext().getSystemService(name);
  }

  /**
   * @return handle to the specified JS module for the CatalystInstance associated with this Context
   */
  public abstract <T extends JavaScriptModule> T getJSModule(Class<T> jsInterface);

  public abstract <T extends NativeModule> boolean hasNativeModule(Class<T> nativeModuleInterface);

  public abstract Collection<NativeModule> getNativeModules();

  /** @return the instance of the specified module interface associated with this ReactContext. */
  @Nullable
  public abstract <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface);

  /**
   * @return the RuntimeExecutor, a thread-safe handler for accessing the runtime.
   * @experimental
   */
  @Nullable
  @FrameworkAPI
  @UnstableReactNativeAPI
  public abstract RuntimeExecutor getRuntimeExecutor();

  /**
   * Calls RCTDeviceEventEmitter.emit to JavaScript, with given event name and an optional list of
   * arguments.
   */
  public void emitDeviceEvent(String eventName, @Nullable Object args) {
    if (mOtherReactContext != null) {
      mOtherReactContext.emitDeviceEvent(eventName, args);
      return;
    }

    RCTDeviceEventEmitter eventEmitter = getJSModule(RCTDeviceEventEmitter.class);
    if (eventEmitter != null) {
      eventEmitter.emit(eventName, args);
    }
  }

  public void emitDeviceEvent(String eventName) {
    if (mOtherReactContext != null) {
      mOtherReactContext.emitDeviceEvent(eventName);
      return;
    }

    emitDeviceEvent(eventName, null);
  }

  @Deprecated
  public abstract CatalystInstance getCatalystInstance();

  /**
   * This API has been deprecated due to naming consideration, please use hasActiveReactInstance()
   * instead
   *
   * @return
   */
  @Deprecated
  public abstract boolean hasActiveCatalystInstance();

  /** @return true if there is an non-null, alive react native instance */
  public abstract boolean hasActiveReactInstance();

  @Deprecated
  public abstract boolean hasCatalystInstance();

  public LifecycleState getLifecycleState() {
    if (mOtherReactContext != null) {
      return mOtherReactContext.getLifecycleState();
    }

    return mLifecycleState;
  }

  public void addLifecycleEventListener(final LifecycleEventListener listener) {
    if (mOtherReactContext != null) {
      mOtherReactContext.addLifecycleEventListener(listener);
      return;
    }

    mLifecycleEventListeners.add(listener);
    if (hasActiveReactInstance() || isBridgeless()) {
      switch (mLifecycleState) {
        case BEFORE_CREATE:
        case BEFORE_RESUME:
          break;
        case RESUMED:
          runOnUiQueueThread(
              new Runnable() {
                @Override
                public void run() {
                  if (!mLifecycleEventListeners.contains(listener)) {
                    return;
                  }
                  try {
                    listener.onHostResume();
                  } catch (RuntimeException e) {
                    handleException(e);
                  }
                }
              });
          break;
        default:
          throw new IllegalStateException("Unhandled lifecycle state.");
      }
    }
  }

  public void removeLifecycleEventListener(LifecycleEventListener listener) {
    if (mOtherReactContext != null) {
      mOtherReactContext.removeLifecycleEventListener(listener);
      return;
    }

    mLifecycleEventListeners.remove(listener);
  }

  public void addActivityEventListener(ActivityEventListener listener) {
    if (mOtherReactContext != null) {
      mOtherReactContext.addActivityEventListener(listener);
      return;
    }

    mActivityEventListeners.add(listener);
  }

  public void removeActivityEventListener(ActivityEventListener listener) {
    if (mOtherReactContext != null) {
      mOtherReactContext.removeActivityEventListener(listener);
      return;
    }

    mActivityEventListeners.remove(listener);
  }

  public void addWindowFocusChangeListener(WindowFocusChangeListener listener) {
    if (mOtherReactContext != null) {
      mOtherReactContext.addWindowFocusChangeListener(listener);
      return;
    }

    mWindowFocusEventListeners.add(listener);
  }

  public void removeWindowFocusChangeListener(WindowFocusChangeListener listener) {
    if (mOtherReactContext != null) {
      mOtherReactContext.removeWindowFocusChangeListener(listener);
      return;
    }

    mWindowFocusEventListeners.remove(listener);
  }

  /** Should be called by the hosting Fragment in {@link Fragment#onResume} */
  @ThreadConfined(UI)
  public void onHostResume(@Nullable Activity activity) {
    if (mOtherReactContext != null) {
      mOtherReactContext.onHostResume(activity);
      return;
    }

    mLifecycleState = LifecycleState.RESUMED;
    mCurrentActivity = new WeakReference(activity);
    ReactMarker.logMarker(ReactMarkerConstants.ON_HOST_RESUME_START);
    for (LifecycleEventListener listener : mLifecycleEventListeners) {
      try {
        listener.onHostResume();
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
    ReactMarker.logMarker(ReactMarkerConstants.ON_HOST_RESUME_END);
  }

  @ThreadConfined(UI)
  public void onNewIntent(@Nullable Activity activity, Intent intent) {
    if (mOtherReactContext != null) {
      mOtherReactContext.onNewIntent(activity, intent);
      return;
    }

    UiThreadUtil.assertOnUiThread();
    mCurrentActivity = new WeakReference(activity);
    for (ActivityEventListener listener : mActivityEventListeners) {
      try {
        listener.onNewIntent(intent);
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
  }

  /** Should be called by the hosting Fragment in {@link Fragment#onPause} */
  @ThreadConfined(UI)
  public void onHostPause() {
    if (mOtherReactContext != null) {
      mOtherReactContext.onHostPause();
      return;
    }

    mLifecycleState = LifecycleState.BEFORE_RESUME;
    ReactMarker.logMarker(ReactMarkerConstants.ON_HOST_PAUSE_START);
    for (LifecycleEventListener listener : mLifecycleEventListeners) {
      try {
        listener.onHostPause();
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
    ReactMarker.logMarker(ReactMarkerConstants.ON_HOST_PAUSE_END);
  }

  /** Should be called by the hosting Fragment in {@link Fragment#onDestroy} */
  @ThreadConfined(UI)
  public void onHostDestroy() {
    if (mOtherReactContext != null) {
      mOtherReactContext.onHostDestroy();
      return;
    }

    UiThreadUtil.assertOnUiThread();
    mLifecycleState = LifecycleState.BEFORE_CREATE;
    for (LifecycleEventListener listener : mLifecycleEventListeners) {
      try {
        listener.onHostDestroy();
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
    mCurrentActivity = null;
  }

  /** Destroy this instance, making it unusable. */
  @ThreadConfined(UI)
  public abstract void destroy();

  /** Should be called by the hosting Fragment in {@link Fragment#onActivityResult} */
  public void onActivityResult(
      Activity activity, int requestCode, int resultCode, @Nullable Intent data) {
    if (mOtherReactContext != null) {
      mOtherReactContext.onActivityResult(activity, requestCode, resultCode, data);
      return;
    }

    for (ActivityEventListener listener : mActivityEventListeners) {
      try {
        listener.onActivityResult(activity, requestCode, resultCode, data);
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
  }

  @ThreadConfined(UI)
  public void onWindowFocusChange(boolean hasFocus) {
    if (mOtherReactContext != null) {
      mOtherReactContext.onWindowFocusChange(hasFocus);
      return;
    }

    UiThreadUtil.assertOnUiThread();
    for (WindowFocusChangeListener listener : mWindowFocusEventListeners) {
      try {
        listener.onWindowFocusChange(hasFocus);
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
  }

  public void assertOnUiQueueThread() {
    if (mOtherReactContext != null) {
      mOtherReactContext.assertOnUiQueueThread();
      return;
    }

    Assertions.assertNotNull(mUiMessageQueueThread).assertIsOnThread();
  }

  public boolean isOnUiQueueThread() {
    if (mOtherReactContext != null) {
      return mOtherReactContext.isOnUiQueueThread();
    }

    return Assertions.assertNotNull(mUiMessageQueueThread).isOnThread();
  }

  public void runOnUiQueueThread(Runnable runnable) {
    if (mOtherReactContext != null) {
      mOtherReactContext.runOnUiQueueThread(runnable);
      return;
    }

    Assertions.assertNotNull(mUiMessageQueueThread).runOnQueue(runnable);
  }

  public void assertOnNativeModulesQueueThread() {
    if (mOtherReactContext != null) {
      mOtherReactContext.assertOnNativeModulesQueueThread();
      return;
    }

    /** TODO(T85807990): Fail fast if the ReactContext isn't initialized */
    if (!mIsInitialized) {
      throw new IllegalStateException(
          "Tried to call assertOnNativeModulesQueueThread() on an uninitialized ReactContext");
    }
    Assertions.assertNotNull(mNativeModulesMessageQueueThread).assertIsOnThread();
  }

  public void assertOnNativeModulesQueueThread(String message) {
    if (mOtherReactContext != null) {
      mOtherReactContext.assertOnNativeModulesQueueThread(message);
      return;
    }

    /** TODO(T85807990): Fail fast if the ReactContext isn't initialized */
    if (!mIsInitialized) {
      throw new IllegalStateException(
          "Tried to call assertOnNativeModulesQueueThread(message) on an uninitialized ReactContext");
    }
    Assertions.assertNotNull(mNativeModulesMessageQueueThread).assertIsOnThread(message);
  }

  public boolean isOnNativeModulesQueueThread() {
    if (mOtherReactContext != null) {
      return mOtherReactContext.isOnNativeModulesQueueThread();
    }

    return Assertions.assertNotNull(mNativeModulesMessageQueueThread).isOnThread();
  }

  public void runOnNativeModulesQueueThread(Runnable runnable) {
    if (mOtherReactContext != null) {
      mOtherReactContext.runOnNativeModulesQueueThread(runnable);
      return;
    }

    Assertions.assertNotNull(mNativeModulesMessageQueueThread).runOnQueue(runnable);
  }

  public void assertOnJSQueueThread() {
    if (mOtherReactContext != null) {
      mOtherReactContext.assertOnJSQueueThread();
      return;
    }

    Assertions.assertNotNull(mJSMessageQueueThread).assertIsOnThread();
  }

  public boolean isOnJSQueueThread() {
    if (mOtherReactContext != null) {
      return mOtherReactContext.isOnJSQueueThread();
    }

    return Assertions.assertNotNull(mJSMessageQueueThread).isOnThread();
  }

  public boolean runOnJSQueueThread(Runnable runnable) {
    if (mOtherReactContext != null) {
      return mOtherReactContext.runOnJSQueueThread(runnable);
    }

    return Assertions.assertNotNull(mJSMessageQueueThread).runOnQueue(runnable);
  }

  public @Nullable MessageQueueThread getJSMessageQueueThread() {
    if (mOtherReactContext != null) {
      return mOtherReactContext.getJSMessageQueueThread();
    }

    return mJSMessageQueueThread;
  }

  public @Nullable MessageQueueThread getNativeModulesMessageQueueThread() {
    if (mOtherReactContext != null) {
      return mOtherReactContext.getNativeModulesMessageQueueThread();
    }

    return mNativeModulesMessageQueueThread;
  }

  public @Nullable MessageQueueThread getUiMessageQueueThread() {
    if (mOtherReactContext != null) {
      return mOtherReactContext.getUiMessageQueueThread();
    }

    return mUiMessageQueueThread;
  }

  /**
   * Passes the given exception to the current {@link JSExceptionHandler} if one exists, rethrowing
   * otherwise.
   */
  public abstract void handleException(Exception e);

  public class ExceptionHandlerWrapper implements JSExceptionHandler {

    @Override
    public void handleException(Exception e) {
      ReactContext.this.handleException(e);
    }
  }

  public JSExceptionHandler getExceptionHandler() {
    if (mOtherReactContext != null) {
      return mOtherReactContext.getExceptionHandler();
    }

    if (mExceptionHandlerWrapper == null) {
      mExceptionHandlerWrapper = new ExceptionHandlerWrapper();
    }
    return mExceptionHandlerWrapper;
  }

  public JSExceptionHandler getJSExceptionHandler() {
    if (mOtherReactContext != null) {
      return mOtherReactContext.getJSExceptionHandler();
    }

    return mJSExceptionHandler;
  }

  public boolean hasCurrentActivity() {
    if (mOtherReactContext != null) {
      return mOtherReactContext.hasCurrentActivity();
    }

    return mCurrentActivity != null && mCurrentActivity.get() != null;
  }

  /**
   * Same as {@link Activity#startActivityForResult(Intent, int)}, this just redirects the call to
   * the current activity. Returns whether the activity was started, as this might fail if this was
   * called before the context is in the right state.
   */
  public boolean startActivityForResult(Intent intent, int code, Bundle bundle) {
    if (mOtherReactContext != null) {
      return mOtherReactContext.startActivityForResult(intent, code, bundle);
    }

    Activity activity = getCurrentActivity();
    if (activity != null) {
      activity.startActivityForResult(intent, code, bundle);
      return true;
    }
    return false;
  }

  /**
   * Get the activity to which this context is currently attached, or {@code null} if not attached.
   * DO NOT HOLD LONG-LIVED REFERENCES TO THE OBJECT RETURNED BY THIS METHOD, AS THIS WILL CAUSE
   * MEMORY LEAKS.
   */
  public @Nullable Activity getCurrentActivity() {
    if (mOtherReactContext != null) {
      return mOtherReactContext.getCurrentActivity();
    }

    if (mCurrentActivity == null) {
      return null;
    }
    return mCurrentActivity.get();
  }

  /** @deprecated DO NOT USE, this method will be removed in the near future. */
  @Deprecated
  public abstract boolean isBridgeless();

  /**
   * Get the C pointer (as a long) to the JavaScriptCore context associated with this instance. Use
   * the following pattern to ensure that the JS context is not cleared while you are using it:
   * JavaScriptContextHolder jsContext = reactContext.getJavaScriptContextHolder()
   * synchronized(jsContext) { nativeThingNeedingJsContext(jsContext.get()); }
   */
  @Deprecated
  public abstract @Nullable JavaScriptContextHolder getJavaScriptContextHolder();

  @DeprecatedInNewArchitecture(
      message =
          "This method will be deprecated later as part of Stable APIs with bridge removal and not encouraged usage.")
  /**
   * Get the UIManager for Fabric from the CatalystInstance.
   *
   * @return The UIManager when CatalystInstance is active.
   */
  public abstract @Nullable UIManager getFabricUIManager();

  /**
   * Get the sourceURL for the JS bundle from the CatalystInstance. This method is needed for
   * compatibility with bridgeless mode, which has no CatalystInstance.
   *
   * @return The JS bundle URL set when the bundle was loaded
   */
  public abstract @Nullable String getSourceURL();

  /**
   * Register a JS segment after loading it from cache or server, make sure mCatalystInstance is
   * properly initialised and not null before calling.
   */
  public abstract void registerSegment(int segmentId, String path, Callback callback);

  /**
   * Register a {@link JavaScriptModule} within the Interop Layer so that can be consumed whenever
   * getJSModule is invoked.
   *
   * <p>This method is internal to React Native and should not be used externally.
   */
  public <T extends JavaScriptModule> void internal_registerInteropModule(
      Class<T> interopModuleInterface, Object interopModule) {
    if (mOtherReactContext != null) {
      mOtherReactContext.internal_registerInteropModule(interopModuleInterface, interopModule);
      return;
    }

    if (mInteropModuleRegistry != null) {
      mInteropModuleRegistry.registerInteropModule(interopModuleInterface, interopModule);
    }
  }
}
