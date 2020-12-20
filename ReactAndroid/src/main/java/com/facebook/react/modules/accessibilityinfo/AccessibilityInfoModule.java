/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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
@ReactModule(name = AccessibilityInfoModule.NAME)
public class AccessibilityInfoModule extends NativeAccessibilityInfoSpec
    implements LifecycleEventListener {

  public static final String NAME = "AccessibilityInfo";

  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  private class ReactTouchExplorationStateChangeListener
      implements AccessibilityManager.TouchExplorationStateChangeListener {

    @Override
    public void onTouchExplorationStateChanged(boolean enabled) {
      updateAndSendTouchExplorationChangeEvent(enabled);
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
          if (getReactApplicationContext().hasActiveCatalystInstance()) {
            AccessibilityInfoModule.this.updateAndSendReduceMotionChangeEvent();
          }
        }
      };

  private @Nullable AccessibilityManager mAccessibilityManager;
  private @Nullable ReactTouchExplorationStateChangeListener mTouchExplorationStateChangeListener;
  private final ContentResolver mContentResolver;
  private boolean mReduceMotionEnabled = false;
  private boolean mTouchExplorationEnabled = false;

  private static final String REDUCE_MOTION_EVENT_NAME = "reduceMotionDidChange";
  private static final String TOUCH_EXPLORATION_EVENT_NAME = "touchExplorationDidChange";

  public AccessibilityInfoModule(ReactApplicationContext context) {
    super(context);
    Context appContext = context.getApplicationContext();
    mAccessibilityManager =
        (AccessibilityManager) appContext.getSystemService(Context.ACCESSIBILITY_SERVICE);
    mContentResolver = getReactApplicationContext().getContentResolver();
    mTouchExplorationEnabled = mAccessibilityManager.isTouchExplorationEnabled();
    mReduceMotionEnabled = this.getIsReduceMotionEnabledValue();
    mTouchExplorationStateChangeListener = new ReactTouchExplorationStateChangeListener();
  }

  @Override
  public String getName() {
    return "AccessibilityInfo";
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

  @Override
  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  public void onHostResume() {
    mAccessibilityManager.addTouchExplorationStateChangeListener(
        mTouchExplorationStateChangeListener);

    Uri transitionUri = Settings.Global.getUriFor(Settings.Global.TRANSITION_ANIMATION_SCALE);
    mContentResolver.registerContentObserver(transitionUri, false, animationScaleObserver);

    updateAndSendTouchExplorationChangeEvent(mAccessibilityManager.isTouchExplorationEnabled());
    updateAndSendReduceMotionChangeEvent();
  }

  @Override
  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  public void onHostPause() {
    mAccessibilityManager.removeTouchExplorationStateChangeListener(
        mTouchExplorationStateChangeListener);

    mContentResolver.unregisterContentObserver(animationScaleObserver);
  }

  @Override
  public void initialize() {
    getReactApplicationContext().addLifecycleEventListener(this);
    updateAndSendTouchExplorationChangeEvent(mAccessibilityManager.isTouchExplorationEnabled());
    updateAndSendReduceMotionChangeEvent();
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();
    getReactApplicationContext().removeLifecycleEventListener(this);
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
}
