/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.view;

import javax.annotation.Nullable;

import java.util.Locale;
import java.util.Map;

import android.os.Build;
import android.view.View;

import com.facebook.csslayout.CSSConstants;
import com.facebook.csslayout.Spacing;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewProps;

/**
 * View manager for AndroidViews (plain React Views).
 */
public class ReactViewManager extends ViewGroupManager<ReactViewGroup> {

  @VisibleForTesting
  public static final String REACT_CLASS = ViewProps.VIEW_CLASS_NAME;

  private static final int[] SPACING_TYPES = {
      Spacing.ALL, Spacing.LEFT, Spacing.RIGHT, Spacing.TOP, Spacing.BOTTOM,
  };
  private static final int CMD_HOTSPOT_UPDATE = 1;
  private static final int CMD_SET_PRESSED = 2;

  @ReactProp(name = "accessible")
  public void setAccessible(ReactViewGroup view, boolean accessible) {
    view.setFocusable(accessible);
  }

  @ReactProp(name = "borderRadius")
  public void setBorderRadius(ReactViewGroup view, float borderRadius) {
    view.setBorderRadius(PixelUtil.toPixelFromDIP(borderRadius));
  }

  @ReactProp(name = "borderStyle")
  public void setBorderStyle(ReactViewGroup view, @Nullable String borderStyle) {
    view.setBorderStyle(borderStyle);
  }

  @ReactProp(name = "pointerEvents")
  public void setPointerEvents(ReactViewGroup view, @Nullable String pointerEventsStr) {
    if (pointerEventsStr != null) {
      PointerEvents pointerEvents =
          PointerEvents.valueOf(pointerEventsStr.toUpperCase(Locale.US).replace("-", "_"));
      view.setPointerEvents(pointerEvents);
    }
  }

  @ReactProp(name = "nativeBackgroundAndroid")
  public void setNativeBackground(ReactViewGroup view, @Nullable ReadableMap bg) {
    view.setTranslucentBackgroundDrawable(bg == null ?
            null : ReactDrawableHelper.createDrawableFromJSDescription(view.getContext(), bg));
  }

  @ReactProp(name = ReactClippingViewGroupHelper.PROP_REMOVE_CLIPPED_SUBVIEWS)
  public void setRemoveClippedSubviews(ReactViewGroup view, boolean removeClippedSubviews) {
    view.setRemoveClippedSubviews(removeClippedSubviews);
  }

  @ReactProp(name = ViewProps.NEEDS_OFFSCREEN_ALPHA_COMPOSITING)
  public void setNeedsOffscreenAlphaCompositing(
      ReactViewGroup view,
      boolean needsOffscreenAlphaCompositing) {
    view.setNeedsOffscreenAlphaCompositing(needsOffscreenAlphaCompositing);
  }

  @ReactPropGroup(names = {
      ViewProps.BORDER_WIDTH,
      ViewProps.BORDER_LEFT_WIDTH,
      ViewProps.BORDER_RIGHT_WIDTH,
      ViewProps.BORDER_TOP_WIDTH,
      ViewProps.BORDER_BOTTOM_WIDTH,
  }, defaultFloat = CSSConstants.UNDEFINED)
  public void setBorderWidth(ReactViewGroup view, int index, float width) {
    if (!CSSConstants.isUndefined(width)) {
      width = PixelUtil.toPixelFromDIP(width);
    }
    view.setBorderWidth(SPACING_TYPES[index], width);
  }

  @ReactPropGroup(names = {
      "borderColor", "borderLeftColor", "borderRightColor", "borderTopColor", "borderBottomColor"
  }, customType = "Color")
  public void setBorderColor(ReactViewGroup view, int index, Integer color) {
    view.setBorderColor(
        SPACING_TYPES[index],
        color == null ? CSSConstants.UNDEFINED : (float) color);
  }

  @ReactProp(name = ViewProps.COLLAPSABLE)
  public void setCollapsable(ReactViewGroup view, boolean collapsable) {
    // no-op: it's here only so that "collapsable" property is exported to JS. The value is actually
    // handled in NativeViewHierarchyOptimizer
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactViewGroup createViewInstance(ThemedReactContext context) {
    return new ReactViewGroup(context);
  }

  @Override
  public Map<String, Integer> getCommandsMap() {
    return MapBuilder.of("hotspotUpdate", CMD_HOTSPOT_UPDATE, "setPressed", CMD_SET_PRESSED);
  }

  @Override
  public void receiveCommand(ReactViewGroup root, int commandId, @Nullable ReadableArray args) {
    switch (commandId) {
      case CMD_HOTSPOT_UPDATE: {
        if (args == null || args.size() != 2) {
          throw new JSApplicationIllegalArgumentException(
              "Illegal number of arguments for 'updateHotspot' command");
        }
        if (Build.VERSION.SDK_INT >= 21) {
          float x = PixelUtil.toPixelFromDIP(args.getDouble(0));
          float y = PixelUtil.toPixelFromDIP(args.getDouble(1));
          root.drawableHotspotChanged(x, y);
        }
        break;
      }
      case CMD_SET_PRESSED: {
        if (args == null || args.size() != 1) {
          throw new JSApplicationIllegalArgumentException(
              "Illegal number of arguments for 'setPressed' command");
        }
        root.setPressed(args.getBoolean(0));
        break;
      }
    }
  }

  @Override
  public void addView(ReactViewGroup parent, View child, int index) {
    boolean removeClippedSubviews = parent.getRemoveClippedSubviews();
    if (removeClippedSubviews) {
      parent.addViewWithSubviewClippingEnabled(child, index);
    } else {
      parent.addView(child, index);
    }
  }

  @Override
  public int getChildCount(ReactViewGroup parent) {
    boolean removeClippedSubviews = parent.getRemoveClippedSubviews();
    if (removeClippedSubviews) {
      return parent.getAllChildrenCount();
    } else {
      return parent.getChildCount();
    }
  }

  @Override
  public View getChildAt(ReactViewGroup parent, int index) {
    boolean removeClippedSubviews = parent.getRemoveClippedSubviews();
    if (removeClippedSubviews) {
      return parent.getChildAtWithSubviewClippingEnabled(index);
    } else {
      return parent.getChildAt(index);
    }
  }

  @Override
  public void removeViewAt(ReactViewGroup parent, int index) {
    boolean removeClippedSubviews = parent.getRemoveClippedSubviews();
    if (removeClippedSubviews) {
      View child = getChildAt(parent, index);
      if (child.getParent() != null) {
        parent.removeView(child);
      }
      parent.removeViewWithSubviewClippingEnabled(child);
    } else {
      parent.removeViewAt(index);
    }
  }

  @Override
  public void removeAllViews(ReactViewGroup parent) {
    boolean removeClippedSubviews = parent.getRemoveClippedSubviews();
    if (removeClippedSubviews) {
      parent.removeAllViewsWithSubviewClippingEnabled();
    } else {
      parent.removeAllViews();
    }
  }
}
