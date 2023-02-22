/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.accessibilityinfo;

import android.annotation.TargetApi;
import android.content.ContentResolver;
import android.content.Context;
import android.database.ContentObserver;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityManager;
import androidx.annotation.Nullable;
import com.facebook.fbreact.specs.NativeAccessibilityInfoSpec;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * Module that monitors and provides information about the state of Touch Exploration service on the
 * device. For API >= 19.
 */
@ReactModule(name = NativeAccessibilityInfoSpec.NAME)
public class AccessibilityInfoModule extends NativeAccessibilityInfoSpec
    implements LifecycleEventListener {

  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  private class ReactTouchExplorationStateChangeListener
      implements AccessibilityManager.TouchExplorationStateChangeListener {

    @Override
    public void onTouchExplorationStateChanged(boolean enabled) {
      updateAndSendTouchExplorationChangeEvent(enabled);
    }
  }

  // Android can listen for accessibility service enable with `accessibilityStateChange`, but
  // `accessibilityState` conflicts with React Native props and confuses developers. Therefore, the
  // name `accessibilityServiceChange` is used here instead.
  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  private class ReactAccessibilityServiceChangeListener
      implements AccessibilityManager.AccessibilityStateChangeListener {

    @Override
    public void onAccessibilityStateChanged(boolean enabled) {
      updateAndSendAccessibilityServiceChangeEvent(enabled);
    }
  }

  // Listener that is notified when the global TRANSITION_ANIMATION_SCALE.
  private final ContentObserver animationScaleObserver =
      new ContentObserver(new Handler(Looper.getMainLooper())) {
        @Override
        public void onChange(boolean selfChange) {
          this.onChange(selfChange, null);
        }

        @Override
        public void onChange(boolean selfChange, Uri uri) {
          if (getReactApplicationContext().hasActiveReactInstance()) {
            AccessibilityInfoModule.this.updateAndSendReduceMotionChangeEvent();
          }
        }
      };

  private @Nullable AccessibilityManager mAccessibilityManager;
  private @Nullable ReactTouchExplorationStateChangeListener mTouchExplorationStateChangeListener;
  private @Nullable ReactAccessibilityServiceChangeListener mAccessibilityServiceChangeListener;
  private final ContentResolver mContentResolver;
  private boolean mReduceMotionEnabled = false;
  private boolean mTouchExplorationEnabled = false;
  private boolean mAccessibilityServiceEnabled = false;
  private int mRecommendedTimeout;

  private static final String REDUCE_MOTION_EVENT_NAME = "reduceMotionDidChange";
  private static final String TOUCH_EXPLORATION_EVENT_NAME = "touchExplorationDidChange";
  private static final String ACCESSIBILITY_SERVICE_EVENT_NAME = "accessibilityServiceDidChange";

  public AccessibilityInfoModule(ReactApplicationContext context) {
    super(context);
    Context appContext = context.getApplicationContext();
    mAccessibilityManager =
        (AccessibilityManager) appContext.getSystemService(Context.ACCESSIBILITY_SERVICE);
    mContentResolver = getReactApplicationContext().getContentResolver();
    mTouchExplorationEnabled = mAccessibilityManager.isTouchExplorationEnabled();
    mAccessibilityServiceEnabled = mAccessibilityManager.isEnabled();
    mReduceMotionEnabled = this.getIsReduceMotionEnabledValue();
    mTouchExplorationStateChangeListener = new ReactTouchExplorationStateChangeListener();
    mAccessibilityServiceChangeListener = new ReactAccessibilityServiceChangeListener();
  }

  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  private boolean getIsReduceMotionEnabledValue() {
    String value =
        Settings.Global.getString(mContentResolver, Settings.Global.TRANSITION_ANIMATION_SCALE);

    return value != null && value.equals("0.0");
  }

  @Override
  public void isReduceMotionEnabled(Callback successCallback) {
    successCallback.invoke(mReduceMotionEnabled);
  }

  @Override
  public void isTouchExplorationEnabled(Callback successCallback) {
    successCallback.invoke(mTouchExplorationEnabled);
  }

  @Override
  public void isAccessibilityServiceEnabled(Callback successCallback) {
    successCallback.invoke(mAccessibilityServiceEnabled);
  }

  private void updateAndSendReduceMotionChangeEvent() {
    boolean isReduceMotionEnabled = this.getIsReduceMotionEnabledValue();

    if (mReduceMotionEnabled != isReduceMotionEnabled) {
      mReduceMotionEnabled = isReduceMotionEnabled;

      ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();
      if (reactApplicationContext != null) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(REDUCE_MOTION_EVENT_NAME, mReduceMotionEnabled);
      }
    }
  }

  private void updateAndSendTouchExplorationChangeEvent(boolean enabled) {
    if (mTouchExplorationEnabled != enabled) {
      mTouchExplorationEnabled = enabled;

      ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();
      if (reactApplicationContext != null) {
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(TOUCH_EXPLORATION_EVENT_NAME, mTouchExplorationEnabled);
      }
    }
  }

  private void updateAndSendAccessibilityServiceChangeEvent(boolean enabled) {
    if (mAccessibilityServiceEnabled != enabled) {
      mAccessibilityServiceEnabled = enabled;

      ReactApplicationContext reactApplicationContext = getReactApplicationContextIfActiveOrWarn();
      if (reactApplicationContext != null) {
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(ACCESSIBILITY_SERVICE_EVENT_NAME, mAccessibilityServiceEnabled);
      }
    }
  }

  @Override
  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  public void onHostResume() {
    mAccessibilityManager.addTouchExplorationStateChangeListener(
        mTouchExplorationStateChangeListener);
    mAccessibilityManager.addAccessibilityStateChangeListener(mAccessibilityServiceChangeListener);

    Uri transitionUri = Settings.Global.getUriFor(Settings.Global.TRANSITION_ANIMATION_SCALE);
    mContentResolver.registerContentObserver(transitionUri, false, animationScaleObserver);

    updateAndSendTouchExplorationChangeEvent(mAccessibilityManager.isTouchExplorationEnabled());
    updateAndSendAccessibilityServiceChangeEvent(mAccessibilityManager.isEnabled());
    updateAndSendReduceMotionChangeEvent();
  }

  @Override
  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  public void onHostPause() {
    mAccessibilityManager.removeTouchExplorationStateChangeListener(
        mTouchExplorationStateChangeListener);
    mAccessibilityManager.removeAccessibilityStateChangeListener(
        mAccessibilityServiceChangeListener);

    mContentResolver.unregisterContentObserver(animationScaleObserver);
  }

  @Override
  public void initialize() {
    getReactApplicationContext().addLifecycleEventListener(this);
    updateAndSendTouchExplorationChangeEvent(mAccessibilityManager.isTouchExplorationEnabled());
    updateAndSendAccessibilityServiceChangeEvent(mAccessibilityManager.isEnabled());
    updateAndSendReduceMotionChangeEvent();
  }

  @Override
  public void invalidate() {
    super.invalidate();

    ReactApplicationContext applicationContext = getReactApplicationContextIfActiveOrWarn();
    if (applicationContext != null) {
      applicationContext.removeLifecycleEventListener(this);
    }
  }

  @Override
  public void onHostDestroy() {}

  @Override
  public void announceForAccessibility(String message) {
    if (mAccessibilityManager == null || !mAccessibilityManager.isEnabled()) {
      return;
    }

    AccessibilityEvent event = AccessibilityEvent.obtain(AccessibilityEvent.TYPE_ANNOUNCEMENT);
    event.getText().add(message);
    event.setClassName(AccessibilityInfoModule.class.getName());
    event.setPackageName(getReactApplicationContext().getPackageName());

    mAccessibilityManager.sendAccessibilityEvent(event);
  }

  @Override
  public void setAccessibilityFocus(double reactTag) {
    // iOS only
  }

  @Override
  public void getRecommendedTimeoutMillis(double originalTimeout, Callback successCallback) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      successCallback.invoke((int) originalTimeout);
      return;
    }
    mRecommendedTimeout =
        mAccessibilityManager.getRecommendedTimeoutMillis(
            (int) originalTimeout, AccessibilityManager.FLAG_CONTENT_CONTROLS);
    successCallback.invoke(mRecommendedTimeout);
  }
}
