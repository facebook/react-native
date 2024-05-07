/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.drawer;

import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.accessibility.AccessibilityEvent;

import androidx.annotation.NonNull;
import androidx.core.view.AccessibilityDelegateCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat;
import androidx.drawerlayout.widget.DrawerLayout;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.R;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.events.NativeGestureUtil;

/**
 * Wrapper view for {@link DrawerLayout}. It manages the properties that can be set on the drawer
 * and contains some ReactNative-specific functionality.
 */
/* package */ @Nullsafe(Nullsafe.Mode.LOCAL)
class ReactDrawerLayout extends DrawerLayout {

  public static final int DEFAULT_DRAWER_WIDTH = LayoutParams.MATCH_PARENT;
  private int mDrawerPosition = Gravity.START;
  private int mDrawerWidth = DEFAULT_DRAWER_WIDTH;
  private boolean mDragging = false;
  private boolean mOpened = false;
  private StateWrapper mStateWrapper = null;

  public ReactDrawerLayout(ReactContext reactContext) {
    super(reactContext);
    ViewCompat.setAccessibilityDelegate(
        this,
        new AccessibilityDelegateCompat() {
          @Override
          public void onInitializeAccessibilityNodeInfo(
              View host, AccessibilityNodeInfoCompat info) {
            super.onInitializeAccessibilityNodeInfo(host, info);

            final AccessibilityRole accessibilityRole = AccessibilityRole.fromViewTag(host);
            if (accessibilityRole != null) {
              info.setClassName(AccessibilityRole.getValue(accessibilityRole));
            }
          }

          @Override
          public void onInitializeAccessibilityEvent(View host, AccessibilityEvent event) {
            super.onInitializeAccessibilityEvent(host, event);
            final AccessibilityRole accessibilityRole =
                (AccessibilityRole) host.getTag(R.id.accessibility_role);
            if (accessibilityRole != null) {
              event.setClassName(AccessibilityRole.getValue(accessibilityRole));
            }
          }
        });

    this.addDrawerListener(new DrawerListener() {
      @Override
      public void onDrawerSlide(@NonNull View drawerView, float slideOffset) {}

      @Override
      public void onDrawerOpened(@NonNull View drawerView) {
        mOpened = true;
        updateState();
      }

      @Override
      public void onDrawerClosed(@NonNull View drawerView) {
        mOpened = false;
        updateState();
      }

      @Override
      public void onDrawerStateChanged(int newState) {}
    });
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    try {
      if (super.onInterceptTouchEvent(ev)) {
        NativeGestureUtil.notifyNativeGestureStarted(this, ev);
        mDragging = true;
        return true;
      }
    } catch (IllegalArgumentException e) {
      // Log and ignore the error. This seems to be a bug in the android SDK and
      // this is the commonly accepted workaround.
      // https://tinyurl.com/mw6qkod (Stack Overflow)
      FLog.w(ReactConstants.TAG, "Error intercepting touch event.", e);
    }

    return false;
  }

  @Override
  public boolean onTouchEvent(MotionEvent ev) {
    int action = ev.getActionMasked();
    if (action == MotionEvent.ACTION_UP && mDragging) {
      NativeGestureUtil.notifyNativeGestureEnded(this, ev);
      mDragging = false;
    }
    return super.onTouchEvent(ev);
  }

  /* package */ void openDrawer() {
    openDrawer(mDrawerPosition);
  }

  /* package */ void closeDrawer() {
    closeDrawer(mDrawerPosition);
  }

  /* package */ void setDrawerPosition(int drawerPosition) {
    mDrawerPosition = drawerPosition;
    setDrawerProperties();
  }

  /* package */ void setDrawerWidth(int drawerWidthInPx) {
    mDrawerWidth = drawerWidthInPx;
    setDrawerProperties();
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    super.onLayout(changed, l, t, r, b);
    updateState();
  }

  public void setStateWrapper(StateWrapper stateWrapper) {
    this.mStateWrapper = stateWrapper;
  }

  public void updateState() {
    this.updateState(mOpened, mDrawerPosition == Gravity.START, PixelUtil.toDIPFromPixel(getWidth()), PixelUtil.toDIPFromPixel(mDrawerWidth));
  }

  private void updateState(boolean isOpen, boolean onLeft, float containerWidth, float drawerWidth) {
    if (this.mStateWrapper == null) {
      return;
    }

    ReadableMap currentState = mStateWrapper.getStateData();

    if (currentState == null) {
      return;
    }

    double delta = 0.9f;
    boolean stateOnLeft = true;
    boolean stateDrawerOpened = false;
    double stateContainerWidth = 0;
    double stateDrawerWidth = 0;

    if (currentState.hasKey("drawerOnLeft")) {
      stateOnLeft = currentState.getBoolean("drawerOnLeft");
    }

    if (currentState.hasKey("drawerOpened")) {
      stateDrawerOpened = currentState.getBoolean("drawerOpened");
    }

    if (currentState.hasKey("containerWidth")) {
      stateContainerWidth = currentState.getDouble("containerWidth");
    }

    if (currentState.hasKey("drawerWidth")) {
      stateDrawerWidth = currentState.getDouble("drawerWidth");
    }

    if (isOpen != stateDrawerOpened || onLeft != stateOnLeft || Math.abs(stateContainerWidth - containerWidth) > delta || Math.abs(stateDrawerWidth - drawerWidth) > delta) {
      WritableNativeMap newState = new WritableNativeMap();
      newState.putBoolean("drawerOnLeft", onLeft);
      newState.putBoolean("drawerOpened", isOpen);
      newState.putDouble("drawerWidth", drawerWidth);
      newState.putDouble("containerWidth", containerWidth);
      mStateWrapper.updateState(newState);
    }
  }

  // Sets the properties of the drawer, after the navigationView has been set.
  /* package */ void setDrawerProperties() {
    if (this.getChildCount() == 2) {
      View drawerView = this.getChildAt(1);
      LayoutParams layoutParams = (LayoutParams) drawerView.getLayoutParams();
      layoutParams.gravity = mDrawerPosition;
      layoutParams.width = mDrawerWidth;
      drawerView.setLayoutParams(layoutParams);
      drawerView.setClickable(true);
      updateState();
    }
  }
}
