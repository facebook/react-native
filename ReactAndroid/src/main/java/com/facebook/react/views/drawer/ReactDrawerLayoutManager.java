/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.views.drawer;

<<<<<<< HEAD
import android.os.Build;
import android.view.Gravity;
import android.view.View;
import androidx.annotation.Nullable;
import androidx.drawerlayout.widget.DrawerLayout;
import com.facebook.common.logging.FLog;
=======
import android.view.Gravity;
import android.view.View;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.drawerlayout.widget.DrawerLayout;
>>>>>>> fb/0.62-stable
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.viewmanagers.AndroidDrawerLayoutManagerDelegate;
import com.facebook.react.viewmanagers.AndroidDrawerLayoutManagerInterface;
import com.facebook.react.views.drawer.events.DrawerClosedEvent;
import com.facebook.react.views.drawer.events.DrawerOpenedEvent;
import com.facebook.react.views.drawer.events.DrawerSlideEvent;
import com.facebook.react.views.drawer.events.DrawerStateChangedEvent;
import java.util.Map;

/** View Manager for {@link ReactDrawerLayout} components. */
@ReactModule(name = ReactDrawerLayoutManager.REACT_CLASS)
public class ReactDrawerLayoutManager extends ViewGroupManager<ReactDrawerLayout>
    implements AndroidDrawerLayoutManagerInterface<ReactDrawerLayout> {

  public static final String REACT_CLASS = "AndroidDrawerLayout";

  public static final int OPEN_DRAWER = 1;
  public static final int CLOSE_DRAWER = 2;

  private final ViewManagerDelegate<ReactDrawerLayout> mDelegate;

  public ReactDrawerLayoutManager() {
    mDelegate = new AndroidDrawerLayoutManagerDelegate<>(this);
  }

  @Override
  public @NonNull String getName() {
    return REACT_CLASS;
  }

  @Override
  protected void addEventEmitters(ThemedReactContext reactContext, ReactDrawerLayout view) {
    view.addDrawerListener(
        new DrawerEventEmitter(
            view, reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()));
  }

  @Override
  protected @NonNull ReactDrawerLayout createViewInstance(@NonNull ThemedReactContext context) {
    return new ReactDrawerLayout(context);
  }

<<<<<<< HEAD
=======
  @Override
  public void setDrawerPosition(ReactDrawerLayout view, @Nullable String value) {
    if (value == null) {
      view.setDrawerPosition(Gravity.START);
    } else {
      setDrawerPositionInternal(view, value);
    }
  }

>>>>>>> fb/0.62-stable
  @ReactProp(name = "drawerPosition")
  public void setDrawerPosition(ReactDrawerLayout view, Dynamic drawerPosition) {
    if (drawerPosition.isNull()) {
      view.setDrawerPosition(Gravity.START);
    } else if (drawerPosition.getType() == ReadableType.Number) {
      final int drawerPositionNum = drawerPosition.asInt();

      if (Gravity.START == drawerPositionNum || Gravity.END == drawerPositionNum) {
        view.setDrawerPosition(drawerPositionNum);
      } else {
        throw new JSApplicationIllegalArgumentException(
            "Unknown drawerPosition " + drawerPositionNum);
      }
    } else if (drawerPosition.getType() == ReadableType.String) {
<<<<<<< HEAD
      final String drawerPositionStr = drawerPosition.asString();

      if (drawerPositionStr.equals("left")) {
        view.setDrawerPosition(Gravity.START);
      } else if (drawerPositionStr.equals("right")) {
        view.setDrawerPosition(Gravity.END);
      } else {
        throw new JSApplicationIllegalArgumentException(
            "drawerPosition must be 'left' or 'right', received" + drawerPositionStr);
      }
    } else {
      throw new JSApplicationIllegalArgumentException("drawerPosition must be a string or int");
=======
      setDrawerPositionInternal(view, drawerPosition.asString());
    } else {
      throw new JSApplicationIllegalArgumentException("drawerPosition must be a string or int");
    }
  }

  private void setDrawerPositionInternal(ReactDrawerLayout view, String drawerPosition) {
    if (drawerPosition.equals("left")) {
      view.setDrawerPosition(Gravity.START);
    } else if (drawerPosition.equals("right")) {
      view.setDrawerPosition(Gravity.END);
    } else {
      throw new JSApplicationIllegalArgumentException(
          "drawerPosition must be 'left' or 'right', received" + drawerPosition);
>>>>>>> fb/0.62-stable
    }
  }

  @ReactProp(name = "drawerWidth", defaultFloat = Float.NaN)
<<<<<<< HEAD
  public void getDrawerWidth(ReactDrawerLayout view, float width) {
=======
  public void setDrawerWidth(ReactDrawerLayout view, float width) {
>>>>>>> fb/0.62-stable
    int widthInPx =
        Float.isNaN(width)
            ? ReactDrawerLayout.DEFAULT_DRAWER_WIDTH
            : Math.round(PixelUtil.toPixelFromDIP(width));
    view.setDrawerWidth(widthInPx);
  }

  @Override
  public void setDrawerWidth(ReactDrawerLayout view, @Nullable Float width) {
    int widthInPx =
        width == null
            ? ReactDrawerLayout.DEFAULT_DRAWER_WIDTH
            : Math.round(PixelUtil.toPixelFromDIP(width));
    view.setDrawerWidth(widthInPx);
  }

  @Override
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
  public void openDrawer(ReactDrawerLayout view) {
    view.openDrawer();
  }

  @Override
  public void closeDrawer(ReactDrawerLayout view) {
    view.closeDrawer();
  }

  @Override
  public void setKeyboardDismissMode(ReactDrawerLayout view, @Nullable String value) {}

  @Override
  public void setDrawerBackgroundColor(ReactDrawerLayout view, @Nullable Integer value) {}

  @Override
  public void setStatusBarBackgroundColor(ReactDrawerLayout view, @Nullable Integer value) {}

  @Override
  public void setElevation(@NonNull ReactDrawerLayout view, float elevation) {
    view.setDrawerElevation(PixelUtil.toPixelFromDIP(elevation));
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
  public void receiveCommand(ReactDrawerLayout root, int commandId, @Nullable ReadableArray args) {
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
  public void receiveCommand(
<<<<<<< HEAD
      ReactDrawerLayout root, String commandId, @Nullable ReadableArray args) {
=======
      @NonNull ReactDrawerLayout root, String commandId, @Nullable ReadableArray args) {
>>>>>>> fb/0.62-stable
    switch (commandId) {
      case "openDrawer":
        root.openDrawer();
        break;
      case "closeDrawer":
        root.closeDrawer();
        break;
    }
  }

  @Override
  public @Nullable Map getExportedViewConstants() {
    return MapBuilder.of(
        "DrawerPosition", MapBuilder.of("Left", Gravity.START, "Right", Gravity.END));
  }

  @Override
  public @Nullable Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
        DrawerSlideEvent.EVENT_NAME, MapBuilder.of("registrationName", "onDrawerSlide"),
        DrawerOpenedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onDrawerOpen"),
        DrawerClosedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onDrawerClose"),
        DrawerStateChangedEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onDrawerStateChanged"));
  }

  /**
   * This method is overridden because of two reasons: 1. A drawer must have exactly two children 2.
   * The second child that is added, is the navigationView, which gets panned from the side.
   */
  @Override
  public void addView(ReactDrawerLayout parent, View child, int index) {
    if (getChildCount(parent) >= 2) {
      throw new JSApplicationIllegalArgumentException(
          "The Drawer cannot have more than two children");
    }
    if (index != 0 && index != 1) {
      throw new JSApplicationIllegalArgumentException(
          "The only valid indices for drawer's child are 0 or 1. Got " + index + " instead.");
    }
    parent.addView(child, index);
    parent.setDrawerProperties();
  }

  @Override
  public ViewManagerDelegate<ReactDrawerLayout> getDelegate() {
    return mDelegate;
  }

  public static class DrawerEventEmitter implements DrawerLayout.DrawerListener {

    private final DrawerLayout mDrawerLayout;
    private final EventDispatcher mEventDispatcher;

    public DrawerEventEmitter(DrawerLayout drawerLayout, EventDispatcher eventDispatcher) {
      mDrawerLayout = drawerLayout;
      mEventDispatcher = eventDispatcher;
    }

    @Override
<<<<<<< HEAD
    public void onDrawerSlide(View view, float v) {
=======
    public void onDrawerSlide(@NonNull View view, float v) {
>>>>>>> fb/0.62-stable
      mEventDispatcher.dispatchEvent(new DrawerSlideEvent(mDrawerLayout.getId(), v));
    }

    @Override
<<<<<<< HEAD
    public void onDrawerOpened(View view) {
=======
    public void onDrawerOpened(@NonNull View view) {
>>>>>>> fb/0.62-stable
      mEventDispatcher.dispatchEvent(new DrawerOpenedEvent(mDrawerLayout.getId()));
    }

    @Override
<<<<<<< HEAD
    public void onDrawerClosed(View view) {
=======
    public void onDrawerClosed(@NonNull View view) {
>>>>>>> fb/0.62-stable
      mEventDispatcher.dispatchEvent(new DrawerClosedEvent(mDrawerLayout.getId()));
    }

    @Override
    public void onDrawerStateChanged(int i) {
      mEventDispatcher.dispatchEvent(new DrawerStateChangedEvent(mDrawerLayout.getId(), i));
    }
  }
}
