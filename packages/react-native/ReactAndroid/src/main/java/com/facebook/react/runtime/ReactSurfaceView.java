/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import android.content.Context;
import android.graphics.Point;
import android.graphics.Rect;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewParent;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.JSPointerDispatcher;
import com.facebook.react.uimanager.JSTouchDispatcher;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.systrace.Systrace;
import java.util.Objects;

/** A view created by {@link ReactSurface} that's responsible for rendering a React component. */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactSurfaceView extends ReactRootView {

  private static final String TAG = "ReactSurfaceView";

  private final ReactSurfaceImpl mSurface;

  private final JSTouchDispatcher mJSTouchDispatcher;
  private @Nullable JSPointerDispatcher mJSPointerDispatcher;

  private boolean mWasMeasured = false;
  private int mWidthMeasureSpec = 0;
  private int mHeightMeasureSpec = 0;

  public ReactSurfaceView(Context context, ReactSurfaceImpl surface) {
    super(context);
    mSurface = surface;
    mJSTouchDispatcher = new JSTouchDispatcher(this);
    if (ReactFeatureFlags.dispatchPointerEvents) {
      mJSPointerDispatcher = new JSPointerDispatcher(this);
    }
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ReactSurfaceView.onMeasure");

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
    mWidthMeasureSpec = widthMeasureSpec;
    mHeightMeasureSpec = heightMeasureSpec;

    Point viewportOffset = getViewportOffset();

    mSurface.updateLayoutSpecs(
        mWidthMeasureSpec, mHeightMeasureSpec, viewportOffset.x, viewportOffset.y);

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    // Call updateLayoutSpecs to update locationOnScreen offsets, in case they've changed
    if (mWasMeasured && changed) {
      Point viewportOffset = getViewportOffset();
      mSurface.updateLayoutSpecs(
          mWidthMeasureSpec, mHeightMeasureSpec, viewportOffset.x, viewportOffset.y);
    }
  }

  private Point getViewportOffset() {
    int[] locationOnScreen = new int[2];
    getLocationOnScreen(locationOnScreen);

    // we need to subtract visibleWindowCoords - to subtract possible window insets, split
    // screen or multi window
    Rect visibleWindowFrame = new Rect();
    getWindowVisibleDisplayFrame(visibleWindowFrame);
    locationOnScreen[0] -= visibleWindowFrame.left;
    locationOnScreen[1] -= visibleWindowFrame.top;

    return new Point(locationOnScreen[0], locationOnScreen[1]);
  }

  @Override
  public void requestDisallowInterceptTouchEvent(boolean disallowIntercept) {
    // Override in order to still receive events to onInterceptTouchEvent even when some other
    // views disallow that, but propagate it up the tree if possible.
    ViewParent parent = getParent();
    if (parent != null) {
      parent.requestDisallowInterceptTouchEvent(disallowIntercept);
    }
  }

  /**
   * Called when a child starts a native gesture (e.g. a scroll in a ScrollView). Should be called
   * from the child's onTouchIntercepted implementation.
   */
  @Override
  public void onChildStartedNativeGesture(View childView, MotionEvent ev) {
    EventDispatcher eventDispatcher = mSurface.getEventDispatcher();
    if (eventDispatcher == null) {
      return;
    }

    if (mJSTouchDispatcher != null) {
      mJSTouchDispatcher.onChildStartedNativeGesture(ev, eventDispatcher);
    }
    if (childView != null && mJSPointerDispatcher != null) {
      mJSPointerDispatcher.onChildStartedNativeGesture(childView, ev, eventDispatcher);
    }
  }

  @Override
  public void onChildEndedNativeGesture(View childView, MotionEvent ev) {
    EventDispatcher eventDispatcher = mSurface.getEventDispatcher();
    if (eventDispatcher == null) {
      return;
    }

    if (mJSTouchDispatcher != null && mSurface.getEventDispatcher() != null) {
      mJSTouchDispatcher.onChildEndedNativeGesture(ev, mSurface.getEventDispatcher());
    }
    if (mJSPointerDispatcher != null) {
      mJSPointerDispatcher.onChildStartedNativeGesture(childView, ev, eventDispatcher);
    }
  }

  @Override
  public void handleException(Throwable t) {
    ReactHostImpl reactHost = mSurface.getReactHost();
    if (reactHost != null) {
      String errorMessage = Objects.toString(t.getMessage(), "");
      Exception e = new IllegalViewOperationException(errorMessage, this, t);
      reactHost.handleHostException(e);
    }
  }

  @Override
  public void setIsFabric(boolean isFabric) {
    // This surface view is always on Fabric regardless.
    super.setIsFabric(true);
  }

  @Override
  public @UIManagerType int getUIManagerType() {
    // This surface view is always on Fabric.
    return UIManagerType.FABRIC;
  }

  @Override
  protected void dispatchJSTouchEvent(MotionEvent event) {
    if (mJSTouchDispatcher == null) {
      FLog.w(TAG, "Unable to dispatch touch events to JS before the dispatcher is available");
      return;
    }
    EventDispatcher eventDispatcher = mSurface.getEventDispatcher();
    if (eventDispatcher != null) {
      mJSTouchDispatcher.handleTouchEvent(event, eventDispatcher);
    } else {
      FLog.w(
          TAG, "Unable to dispatch touch events to JS as the React instance has not been attached");
    }
  }

  @Override
  protected void dispatchJSPointerEvent(MotionEvent event, boolean isCapture) {
    if (mJSPointerDispatcher == null) {
      if (!ReactFeatureFlags.dispatchPointerEvents) {
        return;
      }
      FLog.w(TAG, "Unable to dispatch pointer events to JS before the dispatcher is available");
      return;
    }
    EventDispatcher eventDispatcher = mSurface.getEventDispatcher();
    if (eventDispatcher != null) {
      mJSPointerDispatcher.handleMotionEvent(event, eventDispatcher, isCapture);
    } else {
      FLog.w(
          TAG,
          "Unable to dispatch pointer events to JS as the React instance has not been attached");
    }
  }

  @Override
  public boolean hasActiveReactContext() {
    return mSurface.isAttached() && mSurface.getReactHost().getCurrentReactContext() != null;
  }

  @Override
  public boolean hasActiveReactInstance() {
    return mSurface.isAttached() && mSurface.getReactHost().isInstanceInitialized();
  }

  @Override
  public @Nullable ReactContext getCurrentReactContext() {
    if (mSurface.isAttached()) {
      return mSurface.getReactHost().getCurrentReactContext();
    }
    return null;
  }

  @Override
  public boolean isViewAttachedToReactInstance() {
    return mSurface.isAttached();
  }
}
