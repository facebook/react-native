/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.drawer;

import javax.annotation.Nullable;

import java.lang.reflect.Method;
import java.util.Map;

import android.os.Build;
import android.support.v4.widget.DrawerLayout;
import android.view.Gravity;
import android.view.View;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.drawer.events.DrawerClosedEvent;
import com.facebook.react.views.drawer.events.DrawerOpenedEvent;
import com.facebook.react.views.drawer.events.DrawerSlideEvent;
import com.facebook.react.views.drawer.events.DrawerStateChangedEvent;

/**
 * View Manager for {@link ReactDrawerLayout} components.
 */
@ReactModule(name = ReactDrawerLayoutManager.REACT_CLASS)
public class ReactDrawerLayoutManager extends ViewGroupManager<ReactDrawerLayout> {

  protected static final String REACT_CLASS = "AndroidDrawerLayout";

  public static final int OPEN_DRAWER = 1;
  public static final int CLOSE_DRAWER = 2;

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected void addEventEmitters(ThemedReactContext reactContext, ReactDrawerLayout view) {
    view.setDrawerListener(
        new DrawerEventEmitter(
            view,
            reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()));
  }

  @Override
  protected ReactDrawerLayout createViewInstance(ThemedReactContext context) {
    return new ReactDrawerLayout(context);
  }

  @ReactProp(name = "drawerPosition", defaultInt = Gravity.START)
  public void setDrawerPosition(ReactDrawerLayout view, int drawerPosition) {
    if (Gravity.START == drawerPosition || Gravity.END == drawerPosition) {
      view.setDrawerPosition(drawerPosition);
    } else {
      throw new JSApplicationIllegalArgumentException("Unknown drawerPosition " + drawerPosition);
    }
  }

  @ReactProp(name = "drawerWidth", defaultFloat = Float.NaN)
  public void getDrawerWidth(ReactDrawerLayout view, float width) {
    int widthInPx = Float.isNaN(width) ?
        ReactDrawerLayout.DEFAULT_DRAWER_WIDTH : Math.round(PixelUtil.toPixelFromDIP(width));
    view.setDrawerWidth(widthInPx);
  }

  @ReactProp(name = "drawerLockMode")
  public void setDrawerLockMode(ReactDrawerLayout view, @Nullable String drawerLockMode) {
    if (drawerLockMode == null || "unlocked".equals(drawerLockMode)) {
      view.setDrawerLockMode(DrawerLayout.LOCK_MODE_UNLOCKED);
    } else if ("locked-closed".equals(drawerLockMode)) {
      view.setDrawerLockMode(DrawerLayout.LOCK_MODE_LOCKED_CLOSED);
    } else if ("locked-open".equals(drawerLockMode)) {
      view.setDrawerLockMode(DrawerLayout.LOCK_MODE_LOCKED_OPEN);
    } else {
      throw new JSApplicationIllegalArgumentException("Unknown drawerLockMode " + drawerLockMode);
    }
  }

  @Override
  public void setElevation(ReactDrawerLayout view, float elevation) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      // Facebook is using an older version of the support lib internally that doesn't support
      // setDrawerElevation so we invoke it using reflection.
      // TODO: Call the method directly when this is no longer needed.
      try {
        Method method = ReactDrawerLayout.class.getMethod("setDrawerElevation", float.class);
        method.invoke(view, PixelUtil.toPixelFromDIP(elevation));
      } catch (Exception ex) {
        FLog.w(
            ReactConstants.TAG,
            "setDrawerElevation is not available in this version of the support lib.",
            ex);
      }
    }
  }

  @Override
  public boolean needsCustomLayoutForChildren() {
    // Return true, since DrawerLayout will lay out it's own children.
    return true;
  }

  @Override
  public @Nullable Map<String, Integer> getCommandsMap() {
    return MapBuilder.of("openDrawer", OPEN_DRAWER, "closeDrawer", CLOSE_DRAWER);
  }

  @Override
  public void receiveCommand(
      ReactDrawerLayout root,
      int commandId,
      @Nullable ReadableArray args) {
    switch (commandId) {
      case OPEN_DRAWER:
        root.openDrawer();
        break;
      case CLOSE_DRAWER:
        root.closeDrawer();
        break;
    }
  }

  @Override
  public @Nullable Map getExportedViewConstants() {
    return MapBuilder.of(
        "DrawerPosition",
        MapBuilder.of("Left", Gravity.START, "Right", Gravity.END));
  }

  @Override
  public @Nullable Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
        DrawerSlideEvent.EVENT_NAME, MapBuilder.of("registrationName", "onDrawerSlide"),
        DrawerOpenedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onDrawerOpen"),
        DrawerClosedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onDrawerClose"),
        DrawerStateChangedEvent.EVENT_NAME, MapBuilder.of(
            "registrationName", "onDrawerStateChanged"));
  }

  /**
   * This method is overridden because of two reasons:
   * 1. A drawer must have exactly two children
   * 2. The second child that is added, is the navigationView, which gets panned from the side.
   */
  @Override
  public void addView(ReactDrawerLayout parent, View child, int index) {
    if (getChildCount(parent) >= 2) {
      throw new
          JSApplicationIllegalArgumentException("The Drawer cannot have more than two children");
    }
    if (index != 0 && index != 1) {
      throw new JSApplicationIllegalArgumentException(
          "The only valid indices for drawer's child are 0 or 1. Got " + index + " instead.");
    }
    parent.addView(child, index);
    parent.setDrawerProperties();
  }

  public static class DrawerEventEmitter implements DrawerLayout.DrawerListener {

    private final DrawerLayout mDrawerLayout;
    private final EventDispatcher mEventDispatcher;

    public DrawerEventEmitter(DrawerLayout drawerLayout, EventDispatcher eventDispatcher) {
      mDrawerLayout = drawerLayout;
      mEventDispatcher = eventDispatcher;
    }

    @Override
    public void onDrawerSlide(View view, float v) {
      mEventDispatcher.dispatchEvent(
          new DrawerSlideEvent(mDrawerLayout.getId(), v));
    }

    @Override
    public void onDrawerOpened(View view) {
      mEventDispatcher.dispatchEvent(
        new DrawerOpenedEvent(mDrawerLayout.getId()));
    }

    @Override
    public void onDrawerClosed(View view) {
      mEventDispatcher.dispatchEvent(
          new DrawerClosedEvent(mDrawerLayout.getId()));
    }

    @Override
    public void onDrawerStateChanged(int i) {
      mEventDispatcher.dispatchEvent(
          new DrawerStateChangedEvent(mDrawerLayout.getId(), i));
    }
  }
}
