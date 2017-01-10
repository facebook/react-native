/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import java.util.Map;

import android.graphics.Rect;
import android.os.Build;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.ReactClippingViewGroupHelper;
import com.facebook.react.views.view.ReactDrawableHelper;

/**
 * ViewManager that creates instances of RCTView.
 */
/* package */ final class RCTViewManager extends FlatViewManager {

  private static final int[] TMP_INT_ARRAY = new int[2];

  private static final int CMD_HOTSPOT_UPDATE = 1;
  private static final int CMD_SET_PRESSED = 2;

  @Override
  public String getName() {
    return "RCTView";
  }

  public Map<String, Integer> getCommandsMap() {
    return MapBuilder.of("hotspotUpdate", CMD_HOTSPOT_UPDATE, "setPressed", CMD_SET_PRESSED);
  }

  @Override
  public RCTView createShadowNodeInstance() {
    return new RCTView();
  }

  @Override
  public Class<RCTView> getShadowNodeClass() {
    return RCTView.class;
  }

  @ReactProp(name = "nativeBackgroundAndroid")
  public void setHotspot(FlatViewGroup view, @Nullable ReadableMap bg) {
    view.setHotspot(bg == null ?
            null : ReactDrawableHelper.createDrawableFromJSDescription(view.getContext(), bg));
  }

  @Override
  public void receiveCommand(
      FlatViewGroup view,
      int commandId,
      @Nullable ReadableArray args) {
    switch (commandId) {
      case CMD_HOTSPOT_UPDATE: {
        if (args == null || args.size() != 2) {
          throw new JSApplicationIllegalArgumentException(
              "Illegal number of arguments for 'updateHotspot' command");
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
          view.getLocationOnScreen(TMP_INT_ARRAY);
          float x = PixelUtil.toPixelFromDIP(args.getDouble(0)) - TMP_INT_ARRAY[0];
          float y = PixelUtil.toPixelFromDIP(args.getDouble(1)) - TMP_INT_ARRAY[1];
          view.drawableHotspotChanged(x, y);
        }
        break;
      }
      case CMD_SET_PRESSED: {
        if (args == null || args.size() != 1) {
          throw new JSApplicationIllegalArgumentException(
              "Illegal number of arguments for 'setPressed' command");
        }
        view.setPressed(args.getBoolean(0));
        break;
      }
    }
  }

  @ReactProp(name = ViewProps.NEEDS_OFFSCREEN_ALPHA_COMPOSITING)
  public void setNeedsOffscreenAlphaCompositing(
      FlatViewGroup view,
      boolean needsOffscreenAlphaCompositing) {
    view.setNeedsOffscreenAlphaCompositing(needsOffscreenAlphaCompositing);
  }

  @ReactProp(name = "pointerEvents")
  public void setPointerEvents(FlatViewGroup view, @Nullable String pointerEventsStr) {
    view.setPointerEvents(parsePointerEvents(pointerEventsStr));
  }

  @ReactProp(name = ReactClippingViewGroupHelper.PROP_REMOVE_CLIPPED_SUBVIEWS)
  public void setRemoveClippedSubviews(FlatViewGroup view, boolean removeClippedSubviews) {
    view.setRemoveClippedSubviews(removeClippedSubviews);
  }

  private static PointerEvents parsePointerEvents(@Nullable String pointerEventsStr) {
    if (pointerEventsStr != null) {
      switch (pointerEventsStr) {
        case "none":
          return PointerEvents.NONE;
        case "auto":
          return PointerEvents.AUTO;
        case "box-none":
          return PointerEvents.BOX_NONE;
        case "box-only":
          return PointerEvents.BOX_ONLY;
      }
    }
    // default or invalid
    return PointerEvents.AUTO;
  }

  @ReactProp(name = "hitSlop")
  public void setHitSlop(FlatViewGroup view, @Nullable ReadableMap hitSlop) {
    if (hitSlop == null) {
      view.setHitSlopRect(null);
    } else {
      view.setHitSlopRect(new Rect(
          (int) PixelUtil.toPixelFromDIP(hitSlop.getDouble("left")),
          (int) PixelUtil.toPixelFromDIP(hitSlop.getDouble("top")),
          (int) PixelUtil.toPixelFromDIP(hitSlop.getDouble("right")),
          (int) PixelUtil.toPixelFromDIP(hitSlop.getDouble("bottom"))
      ));
    }
  }
}
