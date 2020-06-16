/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import static com.facebook.infer.annotation.ThreadConfined.UI;
import static com.facebook.react.uimanager.common.UIManagerType.DEFAULT;
import static com.facebook.react.uimanager.common.UIManagerType.FABRIC;
import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.os.Bundle;
import android.util.AttributeSet;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.view.WindowManager;
import android.widget.FrameLayout;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.modules.appregistry.AppRegistry;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.deviceinfo.DeviceInfoModule;
import com.facebook.react.surface.ReactStage;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.JSTouchDispatcher;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactRoot;
import com.facebook.react.uimanager.RootView;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.systrace.Systrace;

/**
 * Default root view for catalyst apps. Provides the ability to listen for size changes so that a UI
 * manager can re-layout its elements. It delegates handling touch events for itself and child views
 * and sending those events to JS by using JSTouchDispatcher. This view is overriding {@link
 * ViewGroup#onInterceptTouchEvent} method in order to be notified about the events for all of its
 * children and it's also overriding {@link ViewGroup#requestDisallowInterceptTouchEvent} to make
 * sure that {@link ViewGroup#onInterceptTouchEvent} will get events even when some child view start
 * intercepting it. In case when no child view is interested in handling some particular touch
 * event, this view's {@link View#onTouchEvent} will still return true in order to be notified about
 * all subsequent touch events related to that gesture (in case when JS code wants to handle that
 * gesture).
 */
public class ReactRootView extends FrameLayout implements RootView, ReactRoot {

  /** Listener interface for react root view events */
  public interface ReactRootViewEventListener {
    /** Called when the react context is attached to a ReactRootView. */
    void onAttachedToReactInstance(ReactRootView rootView);
  }

  private static final String TAG = "ReactRootView";
  private @Nullable ReactInstanceManager mReactInstanceManager;
  private @Nullable String mJSModuleName;
  private @Nullable Bundle mAppProperties;
  private @Nullable String mInitialUITemplate;
  private @Nullable CustomGlobalLayoutListener mCustomGlobalLayoutListener;
  private @Nullable ReactRootViewEventListener mRootViewEventListener;
  private int mRootViewTag;
  private boolean mIsAttachedToInstance;
  private boolean mShouldLogContentAppeared;
  private @Nullable JSTouchDispatcher mJSTouchDispatcher;
  private final ReactAndroidHWInputDeviceHelper mAndroidHWInputDeviceHelper =
      new ReactAndroidHWInputDeviceHelper(this);
  private boolean mWasMeasured = false;
  private int mWidthMeasureSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED);
  private int mHeightMeasureSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED);
  private int mLastWidth = 0;
  private int mLastHeight = 0;
  private @UIManagerType int mUIManagerType = DEFAULT;

  public ReactRootView(Context context) {
    super(context);
    init();
  }

  public ReactRootView(Context context, AttributeSet attrs) {
    super(context, attrs);
    init();
  }

  public ReactRootView(Context context, AttributeSet attrs, int defStyle) {
    super(context, attrs, defStyle);
    init();
  }

  private void init() {
    setClipChildren(false);
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "ReactRootView.onMeasure");
    try {
      boolean measureSpecsUpdated =
          widthMeasureSpec != mWidthMeasureSpec || heightMeasureSpec != mHeightMeasureSpec;
      mWidthMeasureSpec = widthMeasureSpec;
      mHeightMeasureSpec = heightMeasureSpec;

      int width = 0;
      int height = 0;
      int widthMode = MeasureSpec.getMode(widthMeasureSpec);
      if (widthMode == MeasureSpec.AT_MOST || widthMode == MeasureSpec.UNSPECIFIED) {
        for (int i = 0; i < getChildCount(); i++) {
          View child = getChildAt(i);
          int childSize =
              child.getLeft()
                  + child.getMeasuredWidth()
                  + child.getPaddingLeft()
                  + child.getPaddingRight();
          width = Math.max(width, childSize);
        }
      } else {
        width = MeasureSpec.getSize(widthMeasureSpec);
      }
      int heightMode = MeasureSpec.getMode(heightMeasureSpec);
      if (heightMode == MeasureSpec.AT_MOST || heightMode == MeasureSpec.UNSPECIFIED) {
        for (int i = 0; i < getChildCount(); i++) {
          View child = getChildAt(i);
          int childSize =
              child.getTop()
                  + child.getMeasuredHeight()
                  + child.getPaddingTop()
                  + child.getPaddingBottom();
          height = Math.max(height, childSize);
        }
      } else {
        height = MeasureSpec.getSize(heightMeasureSpec);
      }
      setMeasuredDimension(width, height);
      mWasMeasured = true;

      // Check if we were waiting for onMeasure to attach the root view.
      if (mReactInstanceManager != null && !mIsAttachedToInstance) {
        attachToReactInstanceManager();
      } else if (measureSpecsUpdated || mLastWidth != width || mLastHeight != height) {
        updateRootLayoutSpecs(mWidthMeasureSpec, mHeightMeasureSpec);
      }
      mLastWidth = width;
      mLastHeight = height;

    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  @Override
  public void onChildStartedNativeGesture(MotionEvent androidEvent) {
    if (mReactInstanceManager == null
        || !mIsAttachedToInstance
        || mReactInstanceManager.getCurrentReactContext() == null) {
      FLog.w(TAG, "Unable to dispatch touch to JS as the catalyst instance has not been attached");
      return;
    }
    if (mJSTouchDispatcher == null) {
      FLog.w(TAG, "Unable to dispatch touch to JS before the dispatcher is available");
      return;
    }
    ReactContext reactContext = mReactInstanceManager.getCurrentReactContext();
    UIManagerModule uiManager = reactContext.getNativeModule(UIManagerModule.class);

    if (uiManager != null) {
      EventDispatcher eventDispatcher = uiManager.getEventDispatcher();
      mJSTouchDispatcher.onChildStartedNativeGesture(androidEvent, eventDispatcher);
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

  @Override
  protected void dispatchDraw(Canvas canvas) {
    try {
      super.dispatchDraw(canvas);
    } catch (StackOverflowError e) {
      // Adding special exception management for StackOverflowError for logging purposes.
      // This will be removed in the future.
      handleException(e);
    }
  }

  @Override
  public boolean dispatchKeyEvent(KeyEvent ev) {
    if (mReactInstanceManager == null
        || !mIsAttachedToInstance
        || mReactInstanceManager.getCurrentReactContext() == null) {
      FLog.w(TAG, "Unable to handle key event as the catalyst instance has not been attached");
      return super.dispatchKeyEvent(ev);
    }
    mAndroidHWInputDeviceHelper.handleKeyEvent(ev);
    return super.dispatchKeyEvent(ev);
  }

  @Override
  protected void onFocusChanged(boolean gainFocus, int direction, Rect previouslyFocusedRect) {
    if (mReactInstanceManager == null
        || !mIsAttachedToInstance
        || mReactInstanceManager.getCurrentReactContext() == null) {
      FLog.w(
          TAG,
          "Unable to handle focus changed event as the catalyst instance has not been attached");
      super.onFocusChanged(gainFocus, direction, previouslyFocusedRect);
      return;
    }
    mAndroidHWInputDeviceHelper.clearFocus();
    super.onFocusChanged(gainFocus, direction, previouslyFocusedRect);
  }

  @Override
  public void requestChildFocus(View child, View focused) {
    if (mReactInstanceManager == null
        || !mIsAttachedToInstance
        || mReactInstanceManager.getCurrentReactContext() == null) {
      FLog.w(
          TAG,
          "Unable to handle child focus changed event as the catalyst instance has not been attached");
      super.requestChildFocus(child, focused);
      return;
    }
    mAndroidHWInputDeviceHelper.onFocusChanged(focused);
    super.requestChildFocus(child, focused);
  }

  private void dispatchJSTouchEvent(MotionEvent event) {
    if (mReactInstanceManager == null
        || !mIsAttachedToInstance
        || mReactInstanceManager.getCurrentReactContext() == null) {
      FLog.w(TAG, "Unable to dispatch touch to JS as the catalyst instance has not been attached");
      return;
    }
    if (mJSTouchDispatcher == null) {
      FLog.w(TAG, "Unable to dispatch touch to JS before the dispatcher is available");
      return;
    }
    ReactContext reactContext = mReactInstanceManager.getCurrentReactContext();
    UIManagerModule uiManager = reactContext.getNativeModule(UIManagerModule.class);

    if (uiManager != null) {
      EventDispatcher eventDispatcher = uiManager.getEventDispatcher();
      mJSTouchDispatcher.handleTouchEvent(event, eventDispatcher);
    }
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
      removeOnGlobalLayoutListener();
      getViewTreeObserver().addOnGlobalLayoutListener(getCustomGlobalLayoutListener());
    }
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    if (mIsAttachedToInstance) {
      removeOnGlobalLayoutListener();
    }
  }

  private void removeOnGlobalLayoutListener() {
    getViewTreeObserver().removeOnGlobalLayoutListener(getCustomGlobalLayoutListener());
  }

  @Override
  public void onViewAdded(View child) {
    super.onViewAdded(child);

    if (mShouldLogContentAppeared) {
      mShouldLogContentAppeared = false;

      if (mJSModuleName != null) {
        ReactMarker.logMarker(ReactMarkerConstants.CONTENT_APPEARED, mJSModuleName, mRootViewTag);
      }
    }
  }

  @Override
  public ViewGroup getRootViewGroup() {
    return this;
  }

  /** {@see #startReactApplication(ReactInstanceManager, String, android.os.Bundle)} */
  public void startReactApplication(ReactInstanceManager reactInstanceManager, String moduleName) {
    startReactApplication(reactInstanceManager, moduleName, null);
  }

  /** {@see #startReactApplication(ReactInstanceManager, String, android.os.Bundle, String)} */
  public void startReactApplication(
      ReactInstanceManager reactInstanceManager,
      String moduleName,
      @Nullable Bundle initialProperties) {
    startReactApplication(reactInstanceManager, moduleName, initialProperties, null);
  }

  /**
   * Schedule rendering of the react component rendered by the JS application from the given JS
   * module (@{param moduleName}) using provided {@param reactInstanceManager} to attach to the JS
   * context of that manager. Extra parameter {@param launchOptions} can be used to pass initial
   * properties for the react component.
   */
  @ThreadConfined(UI)
  public void startReactApplication(
      ReactInstanceManager reactInstanceManager,
      String moduleName,
      @Nullable Bundle initialProperties,
      @Nullable String initialUITemplate) {
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
      mInitialUITemplate = initialUITemplate;

      mReactInstanceManager.createReactContextInBackground();

      attachToReactInstanceManager();

    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  @Override
  public int getWidthMeasureSpec() {
    return mWidthMeasureSpec;
  }

  @Override
  public int getHeightMeasureSpec() {
    return mHeightMeasureSpec;
  }

  @Override
  public void setShouldLogContentAppeared(boolean shouldLogContentAppeared) {
    mShouldLogContentAppeared = shouldLogContentAppeared;
  }

  @Nullable
  @Override
  public String getSurfaceID() {
    Bundle appProperties = getAppProperties();
    return appProperties != null ? appProperties.getString("surfaceID") : null;
  }

  private void updateRootLayoutSpecs(final int widthMeasureSpec, final int heightMeasureSpec) {
    if (mReactInstanceManager == null) {
      FLog.w(TAG, "Unable to update root layout specs for uninitialized ReactInstanceManager");
      return;
    }
    final ReactContext reactApplicationContext = mReactInstanceManager.getCurrentReactContext();

    if (reactApplicationContext != null) {
      @Nullable
      UIManager uiManager =
          UIManagerHelper.getUIManager(reactApplicationContext, getUIManagerType());
      // Ignore calling updateRootLayoutSpecs if UIManager is not properly initialized.
      if (uiManager != null) {
        uiManager.updateRootLayoutSpecs(getRootViewTag(), widthMeasureSpec, heightMeasureSpec);
      }
    }
  }

  /**
   * Unmount the react application at this root view, reclaiming any JS memory associated with that
   * application. If {@link #startReactApplication} is called, this method must be called before the
   * ReactRootView is garbage collected (typically in your Activity's onDestroy, or in your
   * Fragment's onDestroyView).
   */
  @ThreadConfined(UI)
  public void unmountReactApplication() {
    UiThreadUtil.assertOnUiThread();
    // Stop surface in Fabric.
    // Calling FabricUIManager.stopSurface causes the C++ Binding.stopSurface
    // to be called synchronously over the JNI, which causes an empty tree
    // to be committed via the Scheduler, which will cause mounting instructions
    // to be queued up and synchronously executed to delete and remove
    // all the views in the hierarchy.
    if (mReactInstanceManager != null && ReactFeatureFlags.enableStopSurfaceOnRootViewUnmount) {
      final ReactContext reactApplicationContext = mReactInstanceManager.getCurrentReactContext();
      if (reactApplicationContext != null && getUIManagerType() == FABRIC) {
        @Nullable
        UIManager uiManager =
            UIManagerHelper.getUIManager(reactApplicationContext, getUIManagerType());
        if (uiManager != null) {
          FLog.e(TAG, "stopSurface for surfaceId: " + this.getId());
          uiManager.stopSurface(this.getId());
        }
      }
    }

    if (mReactInstanceManager != null && mIsAttachedToInstance) {
      mReactInstanceManager.detachRootView(this);
      mIsAttachedToInstance = false;
    }
    mReactInstanceManager = null;
    mShouldLogContentAppeared = false;
  }

  @Override
  public void onStage(int stage) {
    switch (stage) {
      case ReactStage.ON_ATTACH_TO_INSTANCE:
        onAttachedToReactInstance();
        break;
      default:
        break;
    }
  }

  public void onAttachedToReactInstance() {
    // Create the touch dispatcher here instead of having it always available, to make sure
    // that all touch events are only passed to JS after React/JS side is ready to consume
    // them. Otherwise, these events might break the states expected by JS.
    // Note that this callback was invoked from within the UI thread.
    mJSTouchDispatcher = new JSTouchDispatcher(this);
    if (mRootViewEventListener != null) {
      mRootViewEventListener.onAttachedToReactInstance(this);
    }
  }

  public void setEventListener(ReactRootViewEventListener eventListener) {
    mRootViewEventListener = eventListener;
  }

  @Override
  public String getJSModuleName() {
    return Assertions.assertNotNull(mJSModuleName);
  }

  @Override
  public @Nullable Bundle getAppProperties() {
    return mAppProperties;
  }

  @Override
  public @Nullable String getInitialUITemplate() {
    return mInitialUITemplate;
  }

  @ThreadConfined(UI)
  public void setAppProperties(@Nullable Bundle appProperties) {
    UiThreadUtil.assertOnUiThread();
    mAppProperties = appProperties;
    if (getRootViewTag() != 0) {
      runApplication();
    }
  }

  /**
   * Calls into JS to start the React application. Can be called multiple times with the same
   * rootTag, which will re-render the application from the root.
   */
  @Override
  public void runApplication() {
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
      String jsAppModuleName = getJSModuleName();

      if (mWasMeasured) {
        updateRootLayoutSpecs(mWidthMeasureSpec, mHeightMeasureSpec);
      }

      WritableNativeMap appParams = new WritableNativeMap();
      appParams.putDouble("rootTag", getRootViewTag());
      @Nullable Bundle appProperties = getAppProperties();
      if (appProperties != null) {
        appParams.putMap("initialProps", Arguments.fromBundle(appProperties));
      }

      mShouldLogContentAppeared = true;

      catalystInstance.getJSModule(AppRegistry.class).runApplication(jsAppModuleName, appParams);
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  /**
   * Is used by unit test to setup mIsAttachedToWindow flags, that will let this view to be properly
   * attached to catalyst instance by startReactApplication call
   */
  @VisibleForTesting
  /* package */ void simulateAttachForTesting() {
    mIsAttachedToInstance = true;
    mJSTouchDispatcher = new JSTouchDispatcher(this);
  }

  private CustomGlobalLayoutListener getCustomGlobalLayoutListener() {
    if (mCustomGlobalLayoutListener == null) {
      mCustomGlobalLayoutListener = new CustomGlobalLayoutListener();
    }
    return mCustomGlobalLayoutListener;
  }

  private void attachToReactInstanceManager() {
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "attachToReactInstanceManager");

    if (mIsAttachedToInstance) {
      return;
    }

    try {
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
        "The application this ReactRootView was rendering was not unmounted before the "
            + "ReactRootView was garbage collected. This usually means that your application is "
            + "leaking large amounts of memory. To solve this, make sure to call "
            + "ReactRootView#unmountReactApplication in the onDestroy() of your hosting Activity or in "
            + "the onDestroyView() of your hosting Fragment.");
  }

  public int getRootViewTag() {
    return mRootViewTag;
  }

  public void setRootViewTag(int rootViewTag) {
    mRootViewTag = rootViewTag;
  }

  @Override
  public void handleException(final Throwable t) {
    if (mReactInstanceManager == null || mReactInstanceManager.getCurrentReactContext() == null) {
      throw new RuntimeException(t);
    }

    Exception e = new IllegalViewOperationException(t.getMessage(), this, t);
    mReactInstanceManager.getCurrentReactContext().handleException(e);
  }

  public void setIsFabric(boolean isFabric) {
    mUIManagerType = isFabric ? FABRIC : DEFAULT;
  }

  @Override
  public @UIManagerType int getUIManagerType() {
    return mUIManagerType;
  }

  @Nullable
  public ReactInstanceManager getReactInstanceManager() {
    return mReactInstanceManager;
  }

  /* package */ void sendEvent(String eventName, @Nullable WritableMap params) {
    if (mReactInstanceManager != null) {
      mReactInstanceManager
          .getCurrentReactContext()
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit(eventName, params);
    }
  }

  private class CustomGlobalLayoutListener implements ViewTreeObserver.OnGlobalLayoutListener {
    private final Rect mVisibleViewArea;
    private final int mMinKeyboardHeightDetected;

    private int mKeyboardHeight = 0;
    private int mDeviceRotation = 0;

    /* package */ CustomGlobalLayoutListener() {
      DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(getContext().getApplicationContext());
      mVisibleViewArea = new Rect();
      mMinKeyboardHeightDetected = (int) PixelUtil.toPixelFromDIP(60);
    }

    @Override
    public void onGlobalLayout() {
      if (mReactInstanceManager == null
          || !mIsAttachedToInstance
          || mReactInstanceManager.getCurrentReactContext() == null) {
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

      boolean isKeyboardShowingOrKeyboardHeightChanged =
          mKeyboardHeight != heightDiff && heightDiff > mMinKeyboardHeightDetected;
      if (isKeyboardShowingOrKeyboardHeightChanged) {
        mKeyboardHeight = heightDiff;
        sendEvent(
            "keyboardDidShow",
            createKeyboardEventPayload(
                PixelUtil.toDIPFromPixel(mVisibleViewArea.bottom),
                PixelUtil.toDIPFromPixel(mVisibleViewArea.left),
                PixelUtil.toDIPFromPixel(mVisibleViewArea.width()),
                PixelUtil.toDIPFromPixel(mKeyboardHeight)));
        return;
      }

      boolean isKeyboardHidden = mKeyboardHeight != 0 && heightDiff <= mMinKeyboardHeightDetected;
      if (isKeyboardHidden) {
        mKeyboardHeight = 0;
        sendEvent(
            "keyboardDidHide",
            createKeyboardEventPayload(
                PixelUtil.toDIPFromPixel(mVisibleViewArea.height()),
                0,
                PixelUtil.toDIPFromPixel(mVisibleViewArea.width()),
                0));
      }
    }

    private void checkForDeviceOrientationChanges() {
      final int rotation =
          ((WindowManager) getContext().getSystemService(Context.WINDOW_SERVICE))
              .getDefaultDisplay()
              .getRotation();
      if (mDeviceRotation == rotation) {
        return;
      }
      mDeviceRotation = rotation;
      emitOrientationChanged(rotation);
    }

    private void checkForDeviceDimensionsChanges() {
      // DeviceInfoModule caches the last dimensions emitted to JS, so we don't need to check here.
      emitUpdateDimensionsEvent();
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
      DeviceInfoModule deviceInfo =
          mReactInstanceManager.getCurrentReactContext().getNativeModule(DeviceInfoModule.class);

      if (deviceInfo != null) {
        deviceInfo.emitUpdateDimensionsEvent();
      }
    }

    private WritableMap createKeyboardEventPayload(
        double screenY, double screenX, double width, double height) {
      WritableMap keyboardEventParams = Arguments.createMap();
      WritableMap endCoordinates = Arguments.createMap();

      endCoordinates.putDouble("height", height);
      endCoordinates.putDouble("screenX", screenX);
      endCoordinates.putDouble("width", width);
      endCoordinates.putDouble("screenY", screenY);

      keyboardEventParams.putMap("endCoordinates", endCoordinates);
      keyboardEventParams.putString("easing", "keyboard");
      keyboardEventParams.putDouble("duration", 0);
      return keyboardEventParams;
    }
  }
}
