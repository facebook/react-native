/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.drawer;

import javax.annotation.Nullable;

import java.util.Map;

import android.os.SystemClock;
import android.support.v4.widget.DrawerLayout;
import android.view.Gravity;
import android.view.View;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.drawer.events.DrawerClosedEvent;
import com.facebook.react.views.drawer.events.DrawerOpenedEvent;
import com.facebook.react.views.drawer.events.DrawerSlideEvent;
import com.facebook.react.views.drawer.events.DrawerStateChangedEvent;

/**
 * View Manager for {@link ReactDrawerLayout} components.
 */
public class ReactDrawerLayoutManager extends ViewGroupManager<ReactDrawerLayout> {

  private static final String REACT_CLASS = "AndroidDrawerLayout";

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
          new DrawerSlideEvent(mDrawerLayout.getId(), SystemClock.uptimeMillis(), v));
    }

    @Override
    public void onDrawerOpened(View view) {
      mEventDispatcher.dispatchEvent(
        new DrawerOpenedEvent(mDrawerLayout.getId(), SystemClock.uptimeMillis()));
    }

    @Override
    public void onDrawerClosed(View view) {
      mEventDispatcher.dispatchEvent(
          new DrawerClosedEvent(mDrawerLayout.getId(), SystemClock.uptimeMillis()));
    }

    @Override
    public void onDrawerStateChanged(int i) {
      mEventDispatcher.dispatchEvent(
          new DrawerStateChangedEvent(mDrawerLayout.getId(), SystemClock.uptimeMillis(), i));
    }
  }
}
