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
import android.os.SystemClock;
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
import com.facebook.react.uimanager.TouchTargetHelper;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.TouchEvent;
import com.facebook.react.uimanager.events.TouchEventType;

/**
 * Default root view for catalyst apps. Provides the ability to listen for size changes so that a UI
 * manager can re-layout its elements.
 * It is also responsible for handling touch events passed to any of it's child view's and sending
 * those events to JS via RCTEventEmitter module. This view is overriding
 * {@link ViewGroup#onInterceptTouchEvent} method in order to be notified about the events for all
 * of it's children and it's also overriding {@link ViewGroup#requestDisallowInterceptTouchEvent}
 * to make sure that {@link ViewGroup#onInterceptTouchEvent} will get events even when some child
 * view start intercepting it. In case when no child view is interested in handling some particular
 * touch event this view's {@link View#onTouchEvent} will still return true in order to be notified
 * about all subsequent touch events related to that gesture (in case when JS code want to handle
 * that gesture).
 */
public class ReactRootView extends SizeMonitoringFrameLayout implements RootView {

  private final KeyboardListener mKeyboardListener = new KeyboardListener();

  private @Nullable ReactInstanceManager mReactInstanceManager;
  private @Nullable String mJSModuleName;
  private @Nullable Bundle mLaunchOptions;
  private int mTargetTag = -1;
  private boolean mChildIsHandlingNativeGesture = false;
  private boolean mWasMeasured = false;
  private boolean mAttachScheduled = false;
  private boolean mIsAttachedToWindow = false;
  private boolean mIsAttachedToInstance = false;

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
    if (mAttachScheduled && mReactInstanceManager != null && mIsAttachedToWindow) {
      // Scheduled from {@link #startReactApplication} call in case when the view measurements are
      // not available
      mAttachScheduled = false;
      // Enqueue it to UIThread not to block onMeasure waiting for the catalyst instance creation
      UiThreadUtil.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          Assertions.assertNotNull(mReactInstanceManager)
              .attachMeasuredRootView(ReactRootView.this);
          mIsAttachedToInstance = true;
          getViewTreeObserver().addOnGlobalLayoutListener(mKeyboardListener);
        }
      });
    }
  }

  /**
   * Main catalyst view is responsible for collecting and sending touch events to JS. This method
   * reacts for an incoming android native touch events ({@link MotionEvent}) and calls into
   * {@link com.facebook.react.uimanager.events.EventDispatcher} when appropriate.
   * It uses {@link com.facebook.react.uimanager.TouchTargetManagerHelper#findTouchTargetView}
   * helper method for figuring out a react view ID in the case of ACTION_DOWN
   * event (when the gesture starts).
   */
  private void handleTouchEvent(MotionEvent ev) {
    if (mReactInstanceManager == null || !mIsAttachedToInstance ||
        mReactInstanceManager.getCurrentReactContext() == null) {
      FLog.w(
          ReactConstants.TAG,
          "Unable to handle touch in JS as the catalyst instance has not been attached");
      return;
    }
    int action = ev.getAction() & MotionEvent.ACTION_MASK;
    ReactContext reactContext = mReactInstanceManager.getCurrentReactContext();
    EventDispatcher eventDispatcher = reactContext.getNativeModule(UIManagerModule.class)
        .getEventDispatcher();
    if (action == MotionEvent.ACTION_DOWN) {
      if (mTargetTag != -1) {
        FLog.e(
            ReactConstants.TAG,
            "Got DOWN touch before receiving UP or CANCEL from last gesture");
      }

      // First event for this gesture. We expect tag to be set to -1, and we use helper method
      // {@link #findTargetTagForTouch} to find react view ID that will be responsible for handling
      // this gesture
      mChildIsHandlingNativeGesture = false;
      mTargetTag = TouchTargetHelper.findTargetTagForTouch(ev.getY(), ev.getX(), this);
      eventDispatcher.dispatchEvent(
          TouchEvent.obtain(mTargetTag, SystemClock.uptimeMillis(), TouchEventType.START, ev));
    } else if (mChildIsHandlingNativeGesture) {
      // If the touch was intercepted by a child, we've already sent a cancel event to JS for this
      // gesture, so we shouldn't send any more touches related to it.
      return;
    } else if (mTargetTag == -1) {
      // All the subsequent action types are expected to be called after ACTION_DOWN thus target
      // is supposed to be set for them.
      FLog.e(
          ReactConstants.TAG,
          "Unexpected state: received touch event but didn't get starting ACTION_DOWN for this " +
              "gesture before");
    } else if (action == MotionEvent.ACTION_UP) {
      // End of the gesture. We reset target tag to -1 and expect no further event associated with
      // this gesture.
      eventDispatcher.dispatchEvent(
          TouchEvent.obtain(mTargetTag, SystemClock.uptimeMillis(), TouchEventType.END, ev));
      mTargetTag = -1;
    } else if (action == MotionEvent.ACTION_MOVE) {
      // Update pointer position for current gesture
      eventDispatcher.dispatchEvent(
          TouchEvent.obtain(mTargetTag, SystemClock.uptimeMillis(), TouchEventType.MOVE, ev));
    } else if (action == MotionEvent.ACTION_POINTER_DOWN) {
      // New pointer goes down, this can only happen after ACTION_DOWN is sent for the first pointer
      eventDispatcher.dispatchEvent(
          TouchEvent.obtain(mTargetTag, SystemClock.uptimeMillis(), TouchEventType.START, ev));
    } else if (action == MotionEvent.ACTION_POINTER_UP) {
      // Exactly onw of the pointers goes up
      eventDispatcher.dispatchEvent(
          TouchEvent.obtain(mTargetTag, SystemClock.uptimeMillis(), TouchEventType.END, ev));
    } else if (action == MotionEvent.ACTION_CANCEL) {
      dispatchCancelEvent(ev);
      mTargetTag = -1;
    } else {
      FLog.w(
          ReactConstants.TAG,
          "Warning : touch event was ignored. Action=" + action + " Target=" + mTargetTag);
    }
  }

  @Override
  public void onChildStartedNativeGesture(MotionEvent androidEvent) {
    if (mChildIsHandlingNativeGesture) {
      // This means we previously had another child start handling this native gesture and now a
      // different native parent of that child has decided to intercept the touch stream and handle
      // the gesture itself. Example where this can happen: HorizontalScrollView in a ScrollView.
      return;
    }

    dispatchCancelEvent(androidEvent);
    mChildIsHandlingNativeGesture = true;
    mTargetTag = -1;
  }

  private void dispatchCancelEvent(MotionEvent androidEvent) {
    // This means the gesture has already ended, via some other CANCEL or UP event. This is not
    // expected to happen very often as it would mean some child View has decided to intercept the
    // touch stream and start a native gesture only upon receiving the UP/CANCEL event.
    if (mTargetTag == -1) {
      FLog.w(
          ReactConstants.TAG,
          "Can't cancel already finished gesture. Is a child View trying to start a gesture from " +
              "an UP/CANCEL event?");
      return;
    }

    EventDispatcher eventDispatcher = mReactInstanceManager.getCurrentReactContext()
        .getNativeModule(UIManagerModule.class)
        .getEventDispatcher();

    Assertions.assertCondition(
        !mChildIsHandlingNativeGesture,
        "Expected to not have already sent a cancel for this gesture");
    Assertions.assertNotNull(eventDispatcher).dispatchEvent(
        TouchEvent.obtain(
            mTargetTag,
            SystemClock.uptimeMillis(),
            TouchEventType.CANCEL,
            androidEvent));
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    handleTouchEvent(ev);
    return super.onInterceptTouchEvent(ev);
  }

  @Override
  public boolean onTouchEvent(MotionEvent ev) {
    handleTouchEvent(ev);
    super.onTouchEvent(ev);
    // In case when there is no children interested in handling touch event, we return true from
    // the root view in order to receive subsequent events related to that gesture
    return true;
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
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();

    mIsAttachedToWindow = false;

    if (mReactInstanceManager != null && !mAttachScheduled) {
      mReactInstanceManager.detachRootView(this);
      mIsAttachedToInstance = false;
      getViewTreeObserver().removeOnGlobalLayoutListener(mKeyboardListener);
    }
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();

    mIsAttachedToWindow = true;

    // If the view re-attached and catalyst instance has been set before, we'd attach again to the
    // catalyst instance (expecting measure to be called after {@link onAttachedToWindow})
    if (mReactInstanceManager != null) {
      mAttachScheduled = true;
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
    // TODO(6788889): Use POJO instead of bundle here, apparently we can't just use WritableMap
    // here as it may be deallocated in native after passing via JNI bridge, but we want to reuse
    // it in the case of re-creating the catalyst instance
    Assertions.assertCondition(
        mReactInstanceManager == null,
        "This root view has already " +
          "been attached to a catalyst instance manager");

    mReactInstanceManager = reactInstanceManager;
    mJSModuleName = moduleName;
    mLaunchOptions = launchOptions;

    // We need to wait for the initial onMeasure, if this view has not yet been measured, we set
    // mAttachScheduled flag, which will make this view startReactApplication itself to instance
    // manager once onMeasure is called.
    if (mWasMeasured && mIsAttachedToWindow) {
      mReactInstanceManager.attachMeasuredRootView(this);
      mIsAttachedToInstance = true;
      getViewTreeObserver().addOnGlobalLayoutListener(mKeyboardListener);
    } else {
      mAttachScheduled = true;
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
    mIsAttachedToWindow = true;
    mIsAttachedToInstance = true;
    mWasMeasured = true;
  }

  private class KeyboardListener implements ViewTreeObserver.OnGlobalLayoutListener {
    private int mKeyboardHeight = 0;
    private final Rect mVisibleViewArea = new Rect();

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
          DisplayMetricsHolder.getDisplayMetrics().heightPixels - mVisibleViewArea.bottom;
      if (mKeyboardHeight != heightDiff && heightDiff > 0) {
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
      } else if (mKeyboardHeight != 0 && heightDiff == 0) {
        // keyboard is now hidden
        mKeyboardHeight = heightDiff;
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
