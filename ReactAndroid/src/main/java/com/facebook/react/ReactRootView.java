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

import android.content.Context;
import android.graphics.Rect;
import android.os.Bundle;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.RootView;
import com.facebook.react.uimanager.SizeMonitoringFrameLayout;
import com.facebook.react.uimanager.JSTouchDispatcher;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;

/**
 * Default root view for catalyst apps. Provides the ability to listen for size changes so that a UI
 * manager can re-layout its elements.
 * It delegates handling touch events for itself and child views and sending those events to JS by
 * using JSTouchDispatcher.
 * This view is overriding {@link ViewGroup#onInterceptTouchEvent} method in order to be notified
 * about the events for all of it's children and it's also overriding
 * {@link ViewGroup#requestDisallowInterceptTouchEvent} to make sure that
 * {@link ViewGroup#onInterceptTouchEvent} will get events even when some child view start
 * intercepting it. In case when no child view is interested in handling some particular
 * touch event this view's {@link View#onTouchEvent} will still return true in order to be notified
 * about all subsequent touch events related to that gesture (in case when JS code want to handle
 * that gesture).
 */
public class ReactRootView extends SizeMonitoringFrameLayout implements RootView {

  private @Nullable ReactInstanceManager mReactInstanceManager;
  private @Nullable String mJSModuleName;
  private @Nullable Bundle mLaunchOptions;
  private @Nullable KeyboardListener mKeyboardListener;
  private @Nullable OnGenericMotionListener mOnGenericMotionListener;
  private boolean mWasMeasured = false;
  private boolean mIsAttachedToInstance = false;
  private final JSTouchDispatcher mJSTouchDispatcher = new JSTouchDispatcher(this);

  public ReactRootView(Context context) {
    super(context);
  }

  public ReactRootView(Context context, AttributeSet attrs) {
    super(context, attrs);
  }

  public ReactRootView(Context context, AttributeSet attrs, int defStyle) {
    super(context, attrs, defStyle);
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    int widthMode = MeasureSpec.getMode(widthMeasureSpec);
    int heightMode = MeasureSpec.getMode(heightMeasureSpec);

    if (widthMode == MeasureSpec.UNSPECIFIED || heightMode == MeasureSpec.UNSPECIFIED) {
      throw new IllegalStateException(
          "The root catalyst view must have a width and height given to it by it's parent view. " +
          "You can do this by specifying MATCH_PARENT or explicit width and height in the layout.");
    }

    setMeasuredDimension(
        MeasureSpec.getSize(widthMeasureSpec),
        MeasureSpec.getSize(heightMeasureSpec));

    mWasMeasured = true;
    // Check if we were waiting for onMeasure to attach the root view
    if (mReactInstanceManager != null && !mIsAttachedToInstance) {
      // Enqueue it to UIThread not to block onMeasure waiting for the catalyst instance creation
      UiThreadUtil.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          attachToReactInstanceManager();
        }
      });
    }
  }

  @Override
  public void onChildStartedNativeGesture(MotionEvent androidEvent) {
    if (mReactInstanceManager == null || !mIsAttachedToInstance ||
      mReactInstanceManager.getCurrentReactContext() == null) {
      FLog.w(
        ReactConstants.TAG,
        "Unable to dispatch touch to JS as the catalyst instance has not been attached");
      return;
    }
    ReactContext reactContext = mReactInstanceManager.getCurrentReactContext();
    EventDispatcher eventDispatcher = reactContext.getNativeModule(UIManagerModule.class)
      .getEventDispatcher();
    mJSTouchDispatcher.onChildStartedNativeGesture(androidEvent, eventDispatcher);
    // Hook for containers or fragments to get informed of the on touch events to perform actions.
    if (mOnGenericMotionListener != null) {
      mOnGenericMotionListener.onGenericMotion(this, androidEvent);
    }
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    dispatchJSTouchEvent(ev);
    return super.onInterceptTouchEvent(ev);
  }

  @Override
  public boolean onTouchEvent(MotionEvent ev) {
    dispatchJSTouchEvent(ev);
    super.onTouchEvent(ev);
    // In case when there is no children interested in handling touch event, we return true from
    // the root view in order to receive subsequent events related to that gesture
    return true;
  }

  public void setOnGenericMotionListener(OnGenericMotionListener listener) {
    mOnGenericMotionListener = listener;
  }

  private void dispatchJSTouchEvent(MotionEvent event) {
    if (mReactInstanceManager == null || !mIsAttachedToInstance ||
      mReactInstanceManager.getCurrentReactContext() == null) {
      FLog.w(
        ReactConstants.TAG,
        "Unable to dispatch touch to JS as the catalyst instance has not been attached");
      return;
    }
    ReactContext reactContext = mReactInstanceManager.getCurrentReactContext();
    EventDispatcher eventDispatcher = reactContext.getNativeModule(UIManagerModule.class)
      .getEventDispatcher();
    mJSTouchDispatcher.handleTouchEvent(event, eventDispatcher);
  }

  @Override
  public void requestDisallowInterceptTouchEvent(boolean disallowIntercept) {
    // No-op - override in order to still receive events to onInterceptTouchEvent
    // even when some other view disallow that
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    // No-op since UIManagerModule handles actually laying out children.
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    if (mIsAttachedToInstance) {
      getViewTreeObserver().addOnGlobalLayoutListener(getKeyboardListener());
    }
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    if (mIsAttachedToInstance) {
      getViewTreeObserver().removeOnGlobalLayoutListener(getKeyboardListener());
    }
  }

  /**
   * {@see #startReactApplication(ReactInstanceManager, String, android.os.Bundle)}
   */
  public void startReactApplication(ReactInstanceManager reactInstanceManager, String moduleName) {
    startReactApplication(reactInstanceManager, moduleName, null);
  }

  /**
   * Schedule rendering of the react component rendered by the JS application from the given JS
   * module (@{param moduleName}) using provided {@param reactInstanceManager} to attach to the
   * JS context of that manager. Extra parameter {@param launchOptions} can be used to pass initial
   * properties for the react component.
   */
  public void startReactApplication(
      ReactInstanceManager reactInstanceManager,
      String moduleName,
      @Nullable Bundle launchOptions) {
    UiThreadUtil.assertOnUiThread();

    // TODO(6788889): Use POJO instead of bundle here, apparently we can't just use WritableMap
    // here as it may be deallocated in native after passing via JNI bridge, but we want to reuse
    // it in the case of re-creating the catalyst instance
    Assertions.assertCondition(
        mReactInstanceManager == null,
        "This root view has already been attached to a catalyst instance manager");

    mReactInstanceManager = reactInstanceManager;
    mJSModuleName = moduleName;
    mLaunchOptions = launchOptions;

    if (!mReactInstanceManager.hasStartedCreatingInitialContext()) {
      mReactInstanceManager.createReactContextInBackground();
    }

    // We need to wait for the initial onMeasure, if this view has not yet been measured, we set which
    // will make this view startReactApplication itself to instance manager once onMeasure is called.
    if (mWasMeasured) {
      attachToReactInstanceManager();
    }
  }

  /**
   * Unmount the react application at this root view, reclaiming any JS memory associated with that
   * application. If {@link #startReactApplication} is called, this method must be called before the
   * ReactRootView is garbage collected (typically in your Activity's onDestroy, or in your Fragment's
   * onDestroyView).
   */
  public void unmountReactApplication() {
    if (mReactInstanceManager != null && mIsAttachedToInstance) {
      mReactInstanceManager.detachRootView(this);
      mIsAttachedToInstance = false;
    }
  }

  /* package */ String getJSModuleName() {
    return Assertions.assertNotNull(mJSModuleName);
  }

  /* package */ @Nullable Bundle getLaunchOptions() {
    return mLaunchOptions;
  }

  /**
   * Is used by unit test to setup mWasMeasured and mIsAttachedToWindow flags, that will let this
   * view to be properly attached to catalyst instance by startReactApplication call
   */
  @VisibleForTesting
  /* package */ void simulateAttachForTesting() {
    mIsAttachedToInstance = true;
    mWasMeasured = true;
  }

  private KeyboardListener getKeyboardListener() {
    if (mKeyboardListener == null) {
      mKeyboardListener = new KeyboardListener();
    }
    return mKeyboardListener;
  }

  private void attachToReactInstanceManager() {
    if (mIsAttachedToInstance) {
      return;
    }

    mIsAttachedToInstance = true;
    Assertions.assertNotNull(mReactInstanceManager).attachMeasuredRootView(this);
    getViewTreeObserver().addOnGlobalLayoutListener(getKeyboardListener());
  }

  @Override
  protected void finalize() throws Throwable {
    super.finalize();
    Assertions.assertCondition(
      !mIsAttachedToInstance,
      "The application this ReactRootView was rendering was not unmounted before the ReactRootView " +
        "was garbage collected. This usually means that your application is leaking large amounts of " +
        "memory. To solve this, make sure to call ReactRootView#unmountReactApplication in the onDestroy() " +
        "of your hosting Activity or in the onDestroyView() of your hosting Fragment.");
  }

  private class KeyboardListener implements ViewTreeObserver.OnGlobalLayoutListener {
    private final Rect mVisibleViewArea;
    private final int mMinKeyboardHeightDetected;

    private int mKeyboardHeight = 0;

    /* package */ KeyboardListener() {
      mVisibleViewArea = new Rect();
      mMinKeyboardHeightDetected = (int) PixelUtil.toPixelFromDIP(60);
    }

    @Override
    public void onGlobalLayout() {
      if (mReactInstanceManager == null || !mIsAttachedToInstance ||
          mReactInstanceManager.getCurrentReactContext() == null) {
        FLog.w(
            ReactConstants.TAG,
            "Unable to dispatch keyboard events in JS as the react instance has not been attached");
        return;
      }

      getRootView().getWindowVisibleDisplayFrame(mVisibleViewArea);
      final int heightDiff =
          DisplayMetricsHolder.getWindowDisplayMetrics().heightPixels - mVisibleViewArea.bottom;
      if (mKeyboardHeight != heightDiff && heightDiff > mMinKeyboardHeightDetected) {
        // keyboard is now showing, or the keyboard height has changed
        mKeyboardHeight = heightDiff;
        WritableMap params = Arguments.createMap();
        WritableMap coordinates = Arguments.createMap();
        coordinates.putDouble("screenY", PixelUtil.toDIPFromPixel(mVisibleViewArea.bottom));
        coordinates.putDouble("screenX", PixelUtil.toDIPFromPixel(mVisibleViewArea.left));
        coordinates.putDouble("width", PixelUtil.toDIPFromPixel(mVisibleViewArea.width()));
        coordinates.putDouble("height", PixelUtil.toDIPFromPixel(mKeyboardHeight));
        params.putMap("endCoordinates", coordinates);
        sendEvent("keyboardDidShow", params);
      } else if (mKeyboardHeight != 0 && heightDiff <= mMinKeyboardHeightDetected) {
        // keyboard is now hidden
        mKeyboardHeight = 0;
        sendEvent("keyboardDidHide", null);
      }
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
      if (mReactInstanceManager != null) {
        mReactInstanceManager.getCurrentReactContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
      }
    }
  }
}
