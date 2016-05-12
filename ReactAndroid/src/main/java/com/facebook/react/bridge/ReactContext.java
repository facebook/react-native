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

import java.lang.ref.WeakReference;
import java.util.concurrent.CopyOnWriteArraySet;

import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.bridge.queue.ReactQueueConfiguration;

/**
 * Abstract ContextWrapper for Android applicaiton or activity {@link Context} and
 * {@link CatalystInstance}
 */
public class ReactContext extends ContextWrapper {

  private static final String EARLY_JS_ACCESS_EXCEPTION_MESSAGE =
    "Tried to access a JS module before the React instance was fully set up. Calls to " +
      "ReactContext#getJSModule should be protected by ReactContext#hasActiveCatalystInstance().";

  private final CopyOnWriteArraySet<LifecycleEventListener> mLifecycleEventListeners =
      new CopyOnWriteArraySet<>();
  private final CopyOnWriteArraySet<ActivityEventListener> mActivityEventListeners =
      new CopyOnWriteArraySet<>();

  private @Nullable CatalystInstance mCatalystInstance;
  private @Nullable LayoutInflater mInflater;
  private @Nullable MessageQueueThread mUiMessageQueueThread;
  private @Nullable MessageQueueThread mNativeModulesMessageQueueThread;
  private @Nullable MessageQueueThread mJSMessageQueueThread;
  private @Nullable NativeModuleCallExceptionHandler mNativeModuleCallExceptionHandler;
  private @Nullable WeakReference<Activity> mCurrentActivity;

  public ReactContext(Context base) {
    super(base);
  }

  /**
   * Set and initialize CatalystInstance for this Context. This should be called exactly once.
   */
  public void initializeWithInstance(CatalystInstance catalystInstance) {
    if (catalystInstance == null) {
      throw new IllegalArgumentException("CatalystInstance cannot be null.");
    }
    if (mCatalystInstance != null) {
      throw new IllegalStateException("ReactContext has been already initialized");
    }

    mCatalystInstance = catalystInstance;

    ReactQueueConfiguration queueConfig = catalystInstance.getReactQueueConfiguration();
    mUiMessageQueueThread = queueConfig.getUIQueueThread();
    mNativeModulesMessageQueueThread = queueConfig.getNativeModulesQueueThread();
    mJSMessageQueueThread = queueConfig.getJSQueueThread();
  }

  public void setNativeModuleCallExceptionHandler(
      @Nullable NativeModuleCallExceptionHandler nativeModuleCallExceptionHandler) {
    mNativeModuleCallExceptionHandler = nativeModuleCallExceptionHandler;
  }

  // We override the following method so that views inflated with the inflater obtained from this
  // context return the ReactContext in #getContext(). The default implementation uses the base
  // context instead, so it couldn't be cast to ReactContext.
  // TODO: T7538796 Check requirement for Override of getSystemService ReactContext
  @Override
  public Object getSystemService(String name) {
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
  public <T extends JavaScriptModule> T getJSModule(Class<T> jsInterface) {
    if (mCatalystInstance == null) {
      throw new RuntimeException(EARLY_JS_ACCESS_EXCEPTION_MESSAGE);
    }
    return mCatalystInstance.getJSModule(jsInterface);
  }

  public <T extends JavaScriptModule> T getJSModule(ExecutorToken executorToken, Class<T> jsInterface) {
    if (mCatalystInstance == null) {
      throw new RuntimeException(EARLY_JS_ACCESS_EXCEPTION_MESSAGE);
    }
    return mCatalystInstance.getJSModule(executorToken, jsInterface);
  }

  public <T extends NativeModule> boolean hasNativeModule(Class<T> nativeModuleInterface) {
    if (mCatalystInstance == null) {
      throw new RuntimeException(
        "Trying to call native module before CatalystInstance has been set!");
    }
    return mCatalystInstance.hasNativeModule(nativeModuleInterface);
  }

  /**
   * @return the instance of the specified module interface associated with this ReactContext.
   */
  public <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface) {
    if (mCatalystInstance == null) {
      throw new RuntimeException(
        "Trying to call native module before CatalystInstance has been set!");
    }
    return mCatalystInstance.getNativeModule(nativeModuleInterface);
  }

  public CatalystInstance getCatalystInstance() {
    return Assertions.assertNotNull(mCatalystInstance);
  }

  public boolean hasActiveCatalystInstance() {
    return mCatalystInstance != null && !mCatalystInstance.isDestroyed();
  }

  public void addLifecycleEventListener(LifecycleEventListener listener) {
    mLifecycleEventListeners.add(listener);
  }

  public void removeLifecycleEventListener(LifecycleEventListener listener) {
    mLifecycleEventListeners.remove(listener);
  }

  public void addActivityEventListener(ActivityEventListener listener) {
    mActivityEventListeners.add(listener);
  }

  public void removeActivityEventListener(ActivityEventListener listener) {
    mActivityEventListeners.remove(listener);
  }

  /**
   * Should be called by the hosting Fragment in {@link Fragment#onResume}
   */
  public void onHostResume(@Nullable Activity activity) {
    UiThreadUtil.assertOnUiThread();
    mCurrentActivity = new WeakReference(activity);
    for (LifecycleEventListener listener : mLifecycleEventListeners) {
      listener.onHostResume();
    }
  }

  /**
   * Should be called by the hosting Fragment in {@link Fragment#onPause}
   */
  public void onHostPause() {
    UiThreadUtil.assertOnUiThread();
    for (LifecycleEventListener listener : mLifecycleEventListeners) {
      listener.onHostPause();
    }
    mCurrentActivity = null;
  }

  /**
   * Should be called by the hosting Fragment in {@link Fragment#onDestroy}
   */
  public void onHostDestroy() {
    UiThreadUtil.assertOnUiThread();
    for (LifecycleEventListener listener : mLifecycleEventListeners) {
      listener.onHostDestroy();
    }
  }

  /**
   * Destroy this instance, making it unusable.
   */
  public void destroy() {
    UiThreadUtil.assertOnUiThread();

    if (mCatalystInstance != null) {
      mCatalystInstance.destroy();
    }
  }

  /**
   * Should be called by the hosting Fragment in {@link Fragment#onActivityResult}
   */
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    for (ActivityEventListener listener : mActivityEventListeners) {
      listener.onActivityResult(requestCode, resultCode, data);
    }
  }

  public void assertOnUiQueueThread() {
    Assertions.assertNotNull(mUiMessageQueueThread).assertIsOnThread();
  }

  public boolean isOnUiQueueThread() {
    return Assertions.assertNotNull(mUiMessageQueueThread).isOnThread();
  }

  public void runOnUiQueueThread(Runnable runnable) {
    Assertions.assertNotNull(mUiMessageQueueThread).runOnQueue(runnable);
  }

  public void assertOnNativeModulesQueueThread() {
    Assertions.assertNotNull(mNativeModulesMessageQueueThread).assertIsOnThread();
  }

  public boolean isOnNativeModulesQueueThread() {
    return Assertions.assertNotNull(mNativeModulesMessageQueueThread).isOnThread();
  }

  public void runOnNativeModulesQueueThread(Runnable runnable) {
    Assertions.assertNotNull(mNativeModulesMessageQueueThread).runOnQueue(runnable);
  }

  public void assertOnJSQueueThread() {
    Assertions.assertNotNull(mJSMessageQueueThread).assertIsOnThread();
  }

  public boolean isOnJSQueueThread() {
    return Assertions.assertNotNull(mJSMessageQueueThread).isOnThread();
  }

  public void runOnJSQueueThread(Runnable runnable) {
    Assertions.assertNotNull(mJSMessageQueueThread).runOnQueue(runnable);
  }

  /**
   * Passes the given exception to the current
   * {@link com.facebook.react.bridge.NativeModuleCallExceptionHandler} if one exists, rethrowing
   * otherwise.
   */
  public void handleException(RuntimeException e) {
    if (mCatalystInstance != null &&
        !mCatalystInstance.isDestroyed() &&
        mNativeModuleCallExceptionHandler != null) {
      mNativeModuleCallExceptionHandler.handleException(e);
    } else {
      throw e;
    }
  }

  public boolean hasCurrentActivity() {
    return mCurrentActivity != null && mCurrentActivity.get() != null;
  }

  /**
   * Same as {@link Activity#startActivityForResult(Intent, int)}, this just redirects the call to
   * the current activity. Returns whether the activity was started, as this might fail if this
   * was called before the context is in the right state.
   */
  public boolean startActivityForResult(Intent intent, int code, Bundle bundle) {
    Activity activity = getCurrentActivity();
    Assertions.assertNotNull(activity);
    activity.startActivityForResult(intent, code, bundle);
    return true;
  }

  /**
   * Get the activity to which this context is currently attached, or {@code null} if not attached.
   * DO NOT HOLD LONG-LIVED REFERENCES TO THE OBJECT RETURNED BY THIS METHOD, AS THIS WILL CAUSE
   * MEMORY LEAKS.
   */
  /* package */ @Nullable Activity getCurrentActivity() {
    if (mCurrentActivity == null) {
      return null;
    }
    return mCurrentActivity.get();
  }
}
