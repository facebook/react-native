/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
import android.graphics.Point;
import android.graphics.Rect;
import android.os.Build;
import android.os.Bundle;
import android.util.AttributeSet;
import android.util.DisplayMetrics;
import android.view.DisplayCutout;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.view.WindowInsets;
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
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
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
import com.facebook.react.uimanager.JSPointerDispatcher;
import com.facebook.react.uimanager.JSTouchDispatcher;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactClippingProhibitedView;
import com.facebook.react.uimanager.ReactRoot;
import com.facebook.react.uimanager.RootView;
import com.facebook.react.uimanager.RootViewUtil;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.systrace.Systrace;
import java.util.concurrent.atomic.AtomicInteger;

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
  private int mRootViewTag =
      0; /* This should be View.NO_ID, but for legacy reasons we haven't migrated yet */
  private boolean mIsAttachedToInstance;
  private boolean mShouldLogContentAppeared;
  private @Nullable JSTouchDispatcher mJSTouchDispatcher;
  private @Nullable JSPointerDispatcher mJSPointerDispatcher;
  private final ReactAndroidHWInputDeviceHelper mAndroidHWInputDeviceHelper =
      new ReactAndroidHWInputDeviceHelper(this);
  private boolean mWasMeasured = false;
  private int mWidthMeasureSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED);
  private int mHeightMeasureSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED);
  private int mLastWidth = 0;
  private int mLastHeight = 0;
  private int mLastOffsetX = Integer.MIN_VALUE;
  private int mLastOffsetY = Integer.MIN_VALUE;
  private @UIManagerType int mUIManagerType = DEFAULT;
  private final AtomicInteger mState = new AtomicInteger(STATE_STOPPED);

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
    ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_ON_MEASURE_START);
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
        updateRootLayoutSpecs(true, mWidthMeasureSpec, mHeightMeasureSpec);
      }
      mLastWidth = width;
      mLastHeight = height;

    } finally {
      ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_ON_MEASURE_END);
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  @Override
  public void onChildStartedNativeGesture(MotionEvent ev) {
    onChildStartedNativeGesture(null, ev);
  }

  @Override
  public void onChildStartedNativeGesture(View childView, MotionEvent ev) {
    if (!isDispatcherReady()) {
      return;
    }
    ReactContext reactContext = mReactInstanceManager.getCurrentReactContext();
    UIManager uiManager = UIManagerHelper.getUIManager(reactContext, getUIManagerType());

    if (uiManager != null) {
      EventDispatcher eventDispatcher = uiManager.getEventDispatcher();
      mJSTouchDispatcher.onChildStartedNativeGesture(ev, eventDispatcher);
      if (childView != null && mJSPointerDispatcher != null) {
        mJSPointerDispatcher.onChildStartedNativeGesture(childView, ev, eventDispatcher);
      }
    }
  }

  @Override
  public void onChildEndedNativeGesture(View childView, MotionEvent ev) {
    if (!isDispatcherReady()) {
      return;
    }
    ReactContext reactContext = mReactInstanceManager.getCurrentReactContext();
    UIManager uiManager = UIManagerHelper.getUIManager(reactContext, getUIManagerType());

    if (uiManager != null) {
      EventDispatcher eventDispatcher = uiManager.getEventDispatcher();
      mJSTouchDispatcher.onChildEndedNativeGesture(ev, eventDispatcher);
      if (mJSPointerDispatcher != null) {
        mJSPointerDispatcher.onChildEndedNativeGesture();
      }
    }
  }

  private boolean isDispatcherReady() {
    if (mReactInstanceManager == null
        || !mIsAttachedToInstance
        || mReactInstanceManager.getCurrentReactContext() == null) {
      FLog.w(TAG, "Unable to dispatch touch to JS as the catalyst instance has not been attached");
      return false;
    }
    if (mJSTouchDispatcher == null) {
      FLog.w(TAG, "Unable to dispatch touch to JS before the dispatcher is available");
      return false;
    }
    if (ReactFeatureFlags.dispatchPointerEvents && mJSPointerDispatcher == null) {
      FLog.w(TAG, "Unable to dispatch pointer events to JS before the dispatcher is available");
      return false;
    }

    return true;
  }

  // By default the JS touch events are dispatched at the root view. This can be overridden in
  // subclasses as needed.
  public boolean shouldDispatchJSTouchEvent(MotionEvent ev) {
    return true;
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    if (shouldDispatchJSTouchEvent(ev)) {
      dispatchJSTouchEvent(ev);
    }
    dispatchJSPointerEvent(ev);
    return super.onInterceptTouchEvent(ev);
  }

  @Override
  public boolean onInterceptHoverEvent(MotionEvent ev) {
    dispatchJSPointerEvent(ev);
    return super.onInterceptHoverEvent(ev);
  }

  @Override
  public boolean onTouchEvent(MotionEvent ev) {
    if (shouldDispatchJSTouchEvent(ev)) {
      dispatchJSTouchEvent(ev);
    }
    dispatchJSPointerEvent(ev);
    super.onTouchEvent(ev);
    // In case when there is no children interested in handling touch event, we return true from
    // the root view in order to receive subsequent events related to that gesture
    return true;
  }

  @Override
  public boolean onHoverEvent(MotionEvent ev) {
    dispatchJSPointerEvent(ev);
    return super.onHoverEvent(ev);
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

  private void dispatchJSPointerEvent(MotionEvent event) {
    if (mReactInstanceManager == null
        || !mIsAttachedToInstance
        || mReactInstanceManager.getCurrentReactContext() == null) {
      FLog.w(TAG, "Unable to dispatch touch to JS as the catalyst instance has not been attached");
      return;
    }
    if (mJSPointerDispatcher == null) {
      if (!ReactFeatureFlags.dispatchPointerEvents) {
        return;
      }
      FLog.w(TAG, "Unable to dispatch pointer events to JS before the dispatcher is available");
      return;
    }
    ReactContext reactContext = mReactInstanceManager.getCurrentReactContext();
    UIManager uiManager = UIManagerHelper.getUIManager(reactContext, getUIManagerType());

    if (uiManager != null) {
      EventDispatcher eventDispatcher = uiManager.getEventDispatcher();
      mJSPointerDispatcher.handleMotionEvent(event, eventDispatcher);
    }
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
    UIManager uiManager = UIManagerHelper.getUIManager(reactContext, getUIManagerType());

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
    // No-op in non-Fabric since UIManagerModule handles actually laying out children.

    // In Fabric, update LayoutSpecs just so we update the offsetX and offsetY.
    if (mWasMeasured && isFabric()) {
      updateRootLayoutSpecs(false, mWidthMeasureSpec, mHeightMeasureSpec);
    }
  }

  private boolean isFabric() {
    return getUIManagerType() == FABRIC;
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
  public void onViewAdded(final View child) {
    super.onViewAdded(child);

    // See comments in {@code ReactRootViewProhibitedChildView} for why we want this mechanism.
    if (child instanceof ReactClippingProhibitedView) {
      UiThreadUtil.runOnUiThread(
          new Runnable() {
            @Override
            public void run() {
              if (!child.isShown()) {
                ReactSoftExceptionLogger.logSoftException(
                    TAG,
                    new ReactNoCrashSoftException(
                        "A view was illegally added as a child of a ReactRootView. "
                            + "This View should not be a direct child of a ReactRootView, because it is not visible and will never be reachable. Child: "
                            + child.getClass().getCanonicalName().toString()
                            + " child ID: "
                            + child.getId()));
              }
            }
          });
    }

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
      // if in this experiment, we initialize the root earlier in startReactApplication
      // instead of waiting for the initial measure
      if (ReactFeatureFlags.enableEagerRootViewAttachment) {
        if (!mWasMeasured) {
          // Ideally, those values will be used by default, but we only update them here to scope
          // this change to `enableEagerRootViewAttachment` experiment.
          setSurfaceConstraintsToScreenSize();
        }
        attachToReactInstanceManager();
      }
    } finally {
      Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
    }
  }

  private void setSurfaceConstraintsToScreenSize() {
    DisplayMetrics displayMetrics = getContext().getResources().getDisplayMetrics();
    mWidthMeasureSpec =
        MeasureSpec.makeMeasureSpec(displayMetrics.widthPixels, MeasureSpec.AT_MOST);
    mHeightMeasureSpec =
        MeasureSpec.makeMeasureSpec(displayMetrics.heightPixels, MeasureSpec.AT_MOST);
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

  public AtomicInteger getState() {
    return mState;
  }

  /**
   * Call whenever measure specs change, or if you want to force an update of offsetX/offsetY. If
   * measureSpecsChanged is false and the offsetX/offsetY don't change, updateRootLayoutSpecs will
   * not be called on the UIManager as a perf optimization.
   *
   * @param measureSpecsChanged
   * @param widthMeasureSpec
   * @param heightMeasureSpec
   */
  private void updateRootLayoutSpecs(
      boolean measureSpecsChanged, final int widthMeasureSpec, final int heightMeasureSpec) {
    ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_UPDATE_LAYOUT_SPECS_START);
    if (mReactInstanceManager == null) {
      ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_UPDATE_LAYOUT_SPECS_END);
      FLog.w(TAG, "Unable to update root layout specs for uninitialized ReactInstanceManager");
      return;
    }
    // In Fabric we cannot call `updateRootLayoutSpecs` until a SurfaceId has been set.
    // Sometimes,
    boolean isFabricEnabled = isFabric();
    if (isFabricEnabled && !isRootViewTagSet()) {
      ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_UPDATE_LAYOUT_SPECS_END);
      FLog.e(TAG, "Unable to update root layout specs for ReactRootView: no rootViewTag set yet");
      return;
    }

    final ReactContext reactApplicationContext = mReactInstanceManager.getCurrentReactContext();

    if (reactApplicationContext != null) {
      @Nullable
      UIManager uiManager =
          UIManagerHelper.getUIManager(reactApplicationContext, getUIManagerType());
      // Ignore calling updateRootLayoutSpecs if UIManager is not properly initialized.
      if (uiManager != null) {
        // In Fabric only, get position of view within screen
        int offsetX = 0;
        int offsetY = 0;
        if (isFabricEnabled) {
          Point viewportOffset = RootViewUtil.getViewportOffset(this);
          offsetX = viewportOffset.x;
          offsetY = viewportOffset.y;
        }

        if (measureSpecsChanged || offsetX != mLastOffsetX || offsetY != mLastOffsetY) {
          uiManager.updateRootLayoutSpecs(
              getRootViewTag(), widthMeasureSpec, heightMeasureSpec, offsetX, offsetY);
        }
        mLastOffsetX = offsetX;
        mLastOffsetY = offsetY;
      }
    }

    ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_UPDATE_LAYOUT_SPECS_END);
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
    if (mReactInstanceManager != null) {
      final ReactContext reactApplicationContext = mReactInstanceManager.getCurrentReactContext();
      if (reactApplicationContext != null && isFabric()) {
        @Nullable
        UIManager uiManager =
            UIManagerHelper.getUIManager(reactApplicationContext, getUIManagerType());
        if (uiManager != null) {
          final int surfaceId = this.getId();

          // In case of "retry" or error dialogues being shown, this ReactRootView could be
          // reused (with the same surfaceId, or a different one). Ensure the ReactRootView
          // is marked as unused in case of that.
          setId(NO_ID);

          // Remove all children from ReactRootView
          removeAllViews();

          if (surfaceId == NO_ID) {
            ReactSoftExceptionLogger.logSoftException(
                TAG,
                new RuntimeException(
                    "unmountReactApplication called on ReactRootView with invalid id"));
          } else {
            uiManager.stopSurface(surfaceId);
          }
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

    if (ReactFeatureFlags.dispatchPointerEvents) {
      mJSPointerDispatcher = new JSPointerDispatcher(this);
    }

    if (mRootViewEventListener != null) {
      mRootViewEventListener.onAttachedToReactInstance(this);
    }
  }

  public void setEventListener(@Nullable ReactRootViewEventListener eventListener) {
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
    if (isRootViewTagSet()) {
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
        updateRootLayoutSpecs(true, mWidthMeasureSpec, mHeightMeasureSpec);
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
    if (ReactFeatureFlags.dispatchPointerEvents) {
      mJSPointerDispatcher = new JSPointerDispatcher(this);
    }
  }

  @VisibleForTesting
  /* package */ void simulateCheckForKeyboardForTesting() {
    getCustomGlobalLayoutListener().checkForKeyboardEvents();
  }

  private CustomGlobalLayoutListener getCustomGlobalLayoutListener() {
    if (mCustomGlobalLayoutListener == null) {
      mCustomGlobalLayoutListener = new CustomGlobalLayoutListener();
    }
    return mCustomGlobalLayoutListener;
  }

  private void attachToReactInstanceManager() {
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "attachToReactInstanceManager");
    ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_ATTACH_TO_REACT_INSTANCE_MANAGER_START);

    // React Native requires that the RootView id be managed entirely by React Native, and will
    // crash in addRootView/startSurface if the native View id isn't set to NO_ID.

    // This behavior can not be guaranteed in hybrid apps that have a native android layer over
    // which reactRootViews are added and the native views need to have ids on them in order to
    // work.
    // Hence this can cause unnecessary crashes at runtime for hybrid apps.
    // So converting this to a soft exception such that pure react-native devs can still see the
    // warning while hybrid apps continue to run without crashes

    if (getId() != View.NO_ID) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new IllegalViewOperationException(
              "Trying to attach a ReactRootView with an explicit id already set to ["
                  + getId()
                  + "]. React Native uses the id field to track react tags and will overwrite this"
                  + " field. If that is fine, explicitly overwrite the id field to View.NO_ID."));
    }

    try {
      if (mIsAttachedToInstance) {
        return;
      }

      mIsAttachedToInstance = true;
      Assertions.assertNotNull(mReactInstanceManager).attachRootView(this);
      getViewTreeObserver().addOnGlobalLayoutListener(getCustomGlobalLayoutListener());
    } finally {
      ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_ATTACH_TO_REACT_INSTANCE_MANAGER_END);
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

  private boolean isRootViewTagSet() {
    return mRootViewTag != 0 && mRootViewTag != NO_ID;
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
      int notchHeight = 0;
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        WindowInsets insets = getRootView().getRootWindowInsets();
        if (insets != null) {
          DisplayCutout displayCutout = insets.getDisplayCutout();
          if (displayCutout != null) {
            notchHeight = displayCutout.getSafeInsetTop();
          }
        }
      }
      final int heightDiff =
          DisplayMetricsHolder.getWindowDisplayMetrics().heightPixels
              - mVisibleViewArea.bottom
              + notchHeight;

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
                PixelUtil.toDIPFromPixel(mLastHeight),
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
      DisplayMetricsHolder.initDisplayMetrics(getContext().getApplicationContext());
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
