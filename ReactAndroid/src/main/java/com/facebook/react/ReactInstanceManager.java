/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

import javax.annotation.Nullable;

import java.util.List;

import android.app.Activity;
import android.content.Intent;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.devsupport.DevSupportManager;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.uimanager.ViewManager;

/**
 * This class is managing instances of {@link CatalystInstance}. It exposes a way to configure
 * catalyst instance using {@link ReactPackage} and keeps track of the lifecycle of that
 * instance. It also sets up connection between the instance and developers support functionality
 * of the framework.
 *
 * An instance of this manager is required to start JS application in {@link ReactRootView} (see
 * {@link ReactRootView#startReactApplication} for more info).
 *
 * The lifecycle of the instance of {@link ReactInstanceManager} should be bound to the activity
 * that owns the {@link ReactRootView} that is used to render react application using this
 * instance manager (see {@link ReactRootView#startReactApplication}). It's required to pass
 * owning activity's lifecycle events to the instance manager (see {@link #onHostPause},
 * {@link #onHostDestroy} and {@link #onHostResume}).
 *
 * Ideally, this would be an interface, but because of the API used by earlier versions, it has to
 * have a static method, and so cannot (in Java < 8) be one.
 */
public abstract class ReactInstanceManager {

  /**
   * Listener interface for react instance events.
   */
  public interface ReactInstanceEventListener {
    /**
     * Called when the react context is initialized (all modules registered). Always called on the
     * UI thread.
     */
    void onReactContextInitialized(ReactContext context);
  }

  public abstract DevSupportManager getDevSupportManager();

  public abstract MemoryPressureRouter getMemoryPressureRouter();

  /**
   * Trigger react context initialization asynchronously in a background async task. This enables
   * applications to pre-load the application JS, and execute global code before
   * {@link ReactRootView} is available and measured. This should only be called the first time the
   * application is set up, which is enforced to keep developers from accidentally creating their
   * application multiple times without realizing it.
   *
   * Called from UI thread.
   */
  public abstract void createReactContextInBackground();

  /**
   * @return whether createReactContextInBackground has been called. Will return false after
   * onDestroy until a new initial context has been created.
   */
  public abstract boolean hasStartedCreatingInitialContext();

  /**
   * This method will give JS the opportunity to consume the back button event. If JS does not
   * consume the event, mDefaultBackButtonImpl will be invoked at the end of the round trip to JS.
   */
  public abstract void onBackPressed();

  /**
   * This method will give JS the opportunity to receive intents via Linking.
   */
  public abstract void onNewIntent(Intent intent);

  /**
   * Call this from {@link Activity#onPause()}. This notifies any listening modules so they can do
   * any necessary cleanup.
   *
   * @deprecated Use {@link #onHostPause(Activity)} instead.
   */
  @Deprecated
  public abstract void onHostPause();

  /**
   * Call this from {@link Activity#onPause()}. This notifies any listening modules so they can do
   * any necessary cleanup. The passed Activity is the current Activity being paused. This will
   * always be the foreground activity that would be returned by
   * {@link ReactContext#getCurrentActivity()}.
   *
   * @param activity the activity being paused
   */
  public abstract void onHostPause(Activity activity);

  /**
   * Use this method when the activity resumes to enable invoking the back button directly from JS.
   *
   * This method retains an instance to provided mDefaultBackButtonImpl. Thus it's
   * important to pass from the activity instance that owns this particular instance of {@link
   * ReactInstanceManager}, so that once this instance receive {@link #onHostDestroy} event it will
   * clear the reference to that defaultBackButtonImpl.
   *
   * @param defaultBackButtonImpl a {@link DefaultHardwareBackBtnHandler} from an Activity that owns
   * this instance of {@link ReactInstanceManager}.
   */
  public abstract void onHostResume(
    Activity activity,
    DefaultHardwareBackBtnHandler defaultBackButtonImpl);

  /**
   * Call this from {@link Activity#onDestroy()}. This notifies any listening modules so they can do
   * any necessary cleanup.
   *
   * @deprecated use {@link #onHostDestroy(Activity)} instead
   */
  @Deprecated
  public abstract void onHostDestroy();

  /**
   * Call this from {@link Activity#onDestroy()}. This notifies any listening modules so they can do
   * any necessary cleanup. If the activity being destroyed is not the current activity, no modules
   * are notified.
   *
   * @param activity the activity being destroyed
   */
  public abstract void onHostDestroy(Activity activity);

  public abstract void onActivityResult(
    Activity activity,
    int requestCode,
    int resultCode,
    Intent data);
  public abstract void showDevOptionsDialog();

  /**
   * Attach given {@param rootView} to a catalyst instance manager and start JS application using
   * JS module provided by {@link ReactRootView#getJSModuleName}. If the react context is currently
   * being (re)-created, or if react context has not been created yet, the JS application associated
   * with the provided root view will be started asynchronously, i.e this method won't block.
   * This view will then be tracked by this manager and in case of catalyst instance restart it will
   * be re-attached.
   */
  public abstract void attachMeasuredRootView(ReactRootView rootView);

  /**
   * Detach given {@param rootView} from current catalyst instance. It's safe to call this method
   * multiple times on the same {@param rootView} - in that case view will be detached with the
   * first call.
   */
  public abstract void detachRootView(ReactRootView rootView);

  /**
   * Destroy this React instance and the attached JS context.
   */
  public abstract void destroy();

  /**
   * Uses configured {@link ReactPackage} instances to create all view managers
   */
  public abstract List<ViewManager> createAllViewManagers(
    ReactApplicationContext catalystApplicationContext);

  /**
   * Add a listener to be notified of react instance events.
   */
  public abstract void addReactInstanceEventListener(ReactInstanceEventListener listener);

  /**
   * Remove a listener previously added with {@link #addReactInstanceEventListener}.
   */
  public abstract void removeReactInstanceEventListener(ReactInstanceEventListener listener);

  @VisibleForTesting
  public abstract @Nullable ReactContext getCurrentReactContext();

  public abstract LifecycleState getLifecycleState();

  /**
   * Creates a builder that is capable of creating an instance of {@link ReactInstanceManagerImpl}.
   */
  public static ReactInstanceManagerBuilder builder() {
    return new ReactInstanceManagerBuilder();
  }
}
