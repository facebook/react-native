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
import android.os.Build;
import android.os.Bundle;
import android.util.AttributeSet;
import android.util.DisplayMetrics;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.view.WindowManager;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.appregistry.AppRegistry;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.deviceinfo.DeviceInfoModule;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.JSTouchDispatcher;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.RootView;
import com.facebook.react.uimanager.SizeMonitoringFrameLayout;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.systrace.Systrace;

import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

/**
 * Default root view for catalyst apps. Provides the ability to listen for size changes so that a UI
 * manager can re-layout its elements.
 * It delegates handling touch events for itself and child views and sending those events to JS by
 * using JSTouchDispatcher.
 * This view is overriding {@link ViewGroup#onInterceptTouchEvent} method in order to be notified
 * about the events for all of its children and it's also overriding
 * {@link ViewGroup#requestDisallowInterceptTouchEvent} to make sure that
 * {@link ViewGroup#onInterceptTouchEvent} will get events even when some child view start
 * intercepting it. In case when no child view is interested in handling some particular
 * touch event this view's {@link View#onTouchEvent} will still return true in order to be notified
 * about all subsequent touch events related to that gesture (in case when JS code want to handle
 * that gesture).
 */
public class ReactRootView extends SizeMonitoringFrameLayout implements RootView {

  /**
   * Listener interface for react root view events
   */
  public interface ReactRootViewEventListener {
    /**
     * Called when the react context is attached to a ReactRootView.
     */
    void onAttachedToReactInstance(ReactRootView rootView);
  }

  private @Nullable ReactInstanceManager mReactInstanceManager;
  private @Nullable String mJSModuleName;
  private @Nullable Bundle mAppProperties;
  private @Nullable CustomGlobalLayoutListener mCustomGlobalLayoutListener;
  private @Nullable ReactRootViewEventListener mRootViewEventListener;
  private int mRootViewTag;
  private boolean mIsAttachedToInstance;
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
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "ReactRootView.onMeasure");
    try {
      setMeasuredDimension(
        MeasureSpec.getSize(widthMeasureSpec),
        MeasureSpec.getSize(heightMeasureSpec));

      // Check if we were waiting for onMeasure to attach the root view.
      if (mReactInstanceManager != null && !mIsAttachedToInstance) {
        attachToReactInstanceManager();
      }
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
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
    // Override in order to still receive events to onInterceptTouchEvent even when some other
    // views disallow that, but propagate it up the tree if possible.
    if (getParent() != null) {
      getParent().requestDisallowInterceptTouchEvent(disallowIntercept);
    }
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    // No-op since UIManagerModule handles actually laying out children.
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    if (mIsAttachedToInstance) {
      getViewTreeObserver().addOnGlobalLayoutListener(getCustomGlobalLayoutListener());
    }
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    if (mIsAttachedToInstance) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
        getViewTreeObserver().removeOnGlobalLayoutListener(getCustomGlobalLayoutListener());
      } else {
        getViewTreeObserver().removeGlobalOnLayoutListener(getCustomGlobalLayoutListener());
      }
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
      @Nullable Bundle initialProperties) {
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "startReactApplication");
    try {
      UiThreadUtil.assertOnUiThread();

      // TODO(6788889): Use POJO instead of bundle here, apparently we can't just use WritableMap
      // here as it may be deallocated in native after passing via JNI bridge, but we want to reuse
      // it in the case of re-creating the catalyst instance
      Assertions.assertCondition(
        mReactInstanceManager == null,
        "This root view has already been attached to a catalyst instance manager");

      mReactInstanceManager = reactInstanceManager;
      mJSModuleName = moduleName;
      mAppProperties = initialProperties;

      if (!mReactInstanceManager.hasStartedCreatingInitialContext()) {
        mReactInstanceManager.createReactContextInBackground();
      }

      attachToReactInstanceManager();
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  /**
   * Unmount the react application at this root view, reclaiming any JS memory associated with that
   * application. If {@link #startReactApplication} is called, this method must be called before the
   * ReactRootView is garbage collected (typically in your Activity's onDestroy, or in your
   * Fragment's onDestroyView).
   */
  public void unmountReactApplication() {
    if (mReactInstanceManager != null && mIsAttachedToInstance) {
      mReactInstanceManager.detachRootView(this);
      mIsAttachedToInstance = false;
    }
  }

  public void onAttachedToReactInstance() {
    if (mRootViewEventListener != null) {
      mRootViewEventListener.onAttachedToReactInstance(this);
    }
  }

  public void setEventListener(ReactRootViewEventListener eventListener) {
    mRootViewEventListener = eventListener;
  }

  /* package */ String getJSModuleName() {
    return Assertions.assertNotNull(mJSModuleName);
  }

  public @Nullable Bundle getAppProperties() {
    return mAppProperties;
  }

  public void setAppProperties(@Nullable Bundle appProperties) {
    UiThreadUtil.assertOnUiThread();
    mAppProperties = appProperties;
    runApplication();
  }

  /**
   * Calls into JS to start the React application. Can be called multiple times with the
   * same rootTag, which will re-render the application from the root.
   */
  /* package */ void runApplication() {
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "ReactRootView.runApplication");
    try {
      if (mReactInstanceManager == null || !mIsAttachedToInstance) {
        return;
      }

      ReactContext reactContext = mReactInstanceManager.getCurrentReactContext();
      if (reactContext == null) {
        return;
      }

      CatalystInstance catalystInstance = reactContext.getCatalystInstance();

      WritableNativeMap appParams = new WritableNativeMap();
      appParams.putDouble("rootTag", getRootViewTag());
      @Nullable Bundle appProperties = getAppProperties();
      if (appProperties != null) {
        appParams.putMap("initialProps", Arguments.fromBundle(appProperties));
      }

      String jsAppModuleName = getJSModuleName();
      catalystInstance.getJSModule(AppRegistry.class).runApplication(jsAppModuleName, appParams);
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  /**
   * Is used by unit test to setup mIsAttachedToWindow flags, that will let this
   * view to be properly attached to catalyst instance by startReactApplication call
   */
  @VisibleForTesting
  /* package */ void simulateAttachForTesting() {
    mIsAttachedToInstance = true;
  }

  private CustomGlobalLayoutListener getCustomGlobalLayoutListener() {
    if (mCustomGlobalLayoutListener == null) {
      mCustomGlobalLayoutListener = new CustomGlobalLayoutListener();
    }
    return mCustomGlobalLayoutListener;
  }

  private void attachToReactInstanceManager() {
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "attachToReactInstanceManager");
    try {
      if (mIsAttachedToInstance) {
        return;
      }

      mIsAttachedToInstance = true;
      Assertions.assertNotNull(mReactInstanceManager).attachRootView(this);
      getViewTreeObserver().addOnGlobalLayoutListener(getCustomGlobalLayoutListener());
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  @Override
  protected void finalize() throws Throwable {
    super.finalize();
    Assertions.assertCondition(
      !mIsAttachedToInstance,
      "The application this ReactRootView was rendering was not unmounted before the " +
        "ReactRootView was garbage collected. This usually means that your application is " +
        "leaking large amounts of memory. To solve this, make sure to call " +
        "ReactRootView#unmountReactApplication in the onDestroy() of your hosting Activity or in " +
        "the onDestroyView() of your hosting Fragment.");
  }

  public int getRootViewTag() {
    return mRootViewTag;
  }

  public void setRootViewTag(int rootViewTag) {
    mRootViewTag = rootViewTag;
  }

  private class CustomGlobalLayoutListener implements ViewTreeObserver.OnGlobalLayoutListener {
    private final Rect mVisibleViewArea;
    private final int mMinKeyboardHeightDetected;

    private int mKeyboardHeight = 0;
    private int mDeviceRotation = 0;
    private DisplayMetrics mWindowMetrics = new DisplayMetrics();
    private DisplayMetrics mScreenMetrics = new DisplayMetrics();

    /* package */ CustomGlobalLayoutListener() {
      DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(getContext().getApplicationContext());
      mVisibleViewArea = new Rect();
      mMinKeyboardHeightDetected = (int) PixelUtil.toPixelFromDIP(60);
    }

    @Override
    public void onGlobalLayout() {
      if (mReactInstanceManager == null || !mIsAttachedToInstance ||
        mReactInstanceManager.getCurrentReactContext() == null) {
        return;
      }
      checkForKeyboardEvents();
      checkForDeviceOrientationChanges();
      checkForDeviceDimensionsChanges();
    }

    private void checkForKeyboardEvents() {
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

    private void checkForDeviceOrientationChanges() {
      final int rotation =
        ((WindowManager) getContext().getSystemService(Context.WINDOW_SERVICE))
          .getDefaultDisplay().getRotation();
      if (mDeviceRotation == rotation) {
        return;
      }
      mDeviceRotation = rotation;
      emitOrientationChanged(rotation);
    }

    private void checkForDeviceDimensionsChanges() {
      // Get current display metrics.
      DisplayMetricsHolder.initDisplayMetrics(getContext());
      // Check changes to both window and screen display metrics since they may not update at the same time.
      if (!areMetricsEqual(mWindowMetrics, DisplayMetricsHolder.getWindowDisplayMetrics()) ||
        !areMetricsEqual(mScreenMetrics, DisplayMetricsHolder.getScreenDisplayMetrics())) {
        mWindowMetrics.setTo(DisplayMetricsHolder.getWindowDisplayMetrics());
        mScreenMetrics.setTo(DisplayMetricsHolder.getScreenDisplayMetrics());
        emitUpdateDimensionsEvent();
      }
    }

    private boolean areMetricsEqual(DisplayMetrics displayMetrics, DisplayMetrics otherMetrics) {
      if (Build.VERSION.SDK_INT >= 17) {
        return displayMetrics.equals(otherMetrics);
      } else {
        // DisplayMetrics didn't have an equals method before API 17.
        // Check all public fields manually.
        return displayMetrics.widthPixels == otherMetrics.widthPixels &&
          displayMetrics.heightPixels == otherMetrics.heightPixels &&
          displayMetrics.density == otherMetrics.density &&
          displayMetrics.densityDpi == otherMetrics.densityDpi &&
          displayMetrics.scaledDensity == otherMetrics.scaledDensity &&
          displayMetrics.xdpi == otherMetrics.xdpi &&
          displayMetrics.ydpi == otherMetrics.ydpi;
      }
    }

    private void emitOrientationChanged(final int newRotation) {
      String name;
      double rotationDegrees;
      boolean isLandscape = false;

      switch (newRotation) {
        case Surface.ROTATION_0:
          name = "portrait-primary";
          rotationDegrees = 0.0;
          break;
        case Surface.ROTATION_90:
          name = "landscape-primary";
          rotationDegrees = -90.0;
          isLandscape = true;
          break;
        case Surface.ROTATION_180:
          name = "portrait-secondary";
          rotationDegrees = 180.0;
          break;
        case Surface.ROTATION_270:
          name = "landscape-secondary";
          rotationDegrees = 90.0;
          isLandscape = true;
          break;
        default:
          return;
      }
      WritableMap map = Arguments.createMap();
      map.putString("name", name);
      map.putDouble("rotationDegrees", rotationDegrees);
      map.putBoolean("isLandscape", isLandscape);

      sendEvent("namedOrientationDidChange", map);
    }

    private void emitUpdateDimensionsEvent() {
      mReactInstanceManager
          .getCurrentReactContext()
          .getNativeModule(DeviceInfoModule.class)
          .emitUpdateDimensionsEvent();
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
