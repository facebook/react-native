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

import android.graphics.Color;
import android.os.Build;
import android.view.View;

import com.facebook.csslayout.CSSConstants;
import com.facebook.csslayout.Spacing;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.uimanager.BaseViewPropertyApplicator;
import com.facebook.react.uimanager.CatalystStylesDiffMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIProp;
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
  private static final String[] PROPS_BORDER_COLOR = {
      "borderColor", "borderLeftColor", "borderRightColor", "borderTopColor", "borderBottomColor"
  };
  private static final int CMD_HOTSPOT_UPDATE = 1;
  private static final int CMD_SET_PRESSED = 2;
  private static final int[] sLocationBuf = new int[2];

  @UIProp(UIProp.Type.STRING) public static final String PROP_ACCESSIBLE = "accessible";
  @UIProp(UIProp.Type.NUMBER) public static final String PROP_BORDER_RADIUS = "borderRadius";
  @UIProp(UIProp.Type.STRING) public static final String PROP_BORDER_STYLE = "borderStyle";
  @UIProp(UIProp.Type.STRING) public static final String PROP_POINTER_EVENTS = "pointerEvents";
  @UIProp(UIProp.Type.MAP) public static final String PROP_NATIVE_BG = "nativeBackgroundAndroid";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactViewGroup createViewInstance(ThemedReactContext context) {
    return new ReactViewGroup(context);
  }

  @Override
  public Map<String, String> getNativeProps() {
    Map<String, String> nativeProps = super.getNativeProps();
    Map<String, UIProp.Type> baseProps = BaseViewPropertyApplicator.getCommonProps();
    for (Map.Entry<String, UIProp.Type> entry : baseProps.entrySet()) {
      nativeProps.put(entry.getKey(), entry.getValue().toString());
    }
    for (int i = 0; i < SPACING_TYPES.length; i++) {
      nativeProps.put(ViewProps.BORDER_WIDTHS[i], UIProp.Type.NUMBER.toString());
      nativeProps.put(PROPS_BORDER_COLOR[i], UIProp.Type.STRING.toString());
    }
    return nativeProps;
  }

  @Override
  public void updateView(ReactViewGroup view, CatalystStylesDiffMap props) {
    super.updateView(view, props);
    ReactClippingViewGroupHelper.applyRemoveClippedSubviewsProperty(view, props);

    // Border widths
    for (int i = 0; i < SPACING_TYPES.length; i++) {
      String key = ViewProps.BORDER_WIDTHS[i];
      if (props.hasKey(key)) {
        float width = props.getFloat(key, CSSConstants.UNDEFINED);
        if (!CSSConstants.isUndefined(width)) {
          width = PixelUtil.toPixelFromDIP(width);
        }
        view.setBorderWidth(SPACING_TYPES[i], width);
      }
    }

    // Border colors
    for (int i = 0; i < SPACING_TYPES.length; i++) {
      String key = PROPS_BORDER_COLOR[i];
      if (props.hasKey(key)) {
        float color = CSSConstants.UNDEFINED;
        if (!props.isNull(PROPS_BORDER_COLOR[i])) {
          // Check CatalystStylesDiffMap#getColorInt() to see why this is needed
          int colorInt = props.getInt(PROPS_BORDER_COLOR[i], Color.TRANSPARENT);
          color = colorInt;
        }
        view.setBorderColor(SPACING_TYPES[i], color);
      }
    }

    // Border radius
    if (props.hasKey(PROP_BORDER_RADIUS)) {
      view.setBorderRadius(PixelUtil.toPixelFromDIP(props.getFloat(PROP_BORDER_RADIUS, 0.0f)));
    }

    if (props.hasKey(PROP_BORDER_STYLE)) {
      view.setBorderStyle(props.getString(PROP_BORDER_STYLE));
    }

    if (props.hasKey(PROP_POINTER_EVENTS)) {
      String pointerEventsStr = props.getString(PROP_POINTER_EVENTS);
      if (pointerEventsStr != null) {
        PointerEvents pointerEvents =
            PointerEvents.valueOf(pointerEventsStr.toUpperCase(Locale.US).replace("-", "_"));
        view.setPointerEvents(pointerEvents);
      }
    }

    // Native background
    if (props.hasKey(PROP_NATIVE_BG)) {
      ReadableMap map = props.getMap(PROP_NATIVE_BG);
      view.setTranslucentBackgroundDrawable(map == null ?
              null : ReactDrawableHelper.createDrawableFromJSDescription(view.getContext(), map));
    }

    if (props.hasKey(PROP_ACCESSIBLE)) {
      view.setFocusable(props.getBoolean(PROP_ACCESSIBLE, false));
    }

    if (props.hasKey(ViewProps.NEEDS_OFFSCREEN_ALPHA_COMPOSITING)) {
      view.setNeedsOffscreenAlphaCompositing(
          props.getBoolean(ViewProps.NEEDS_OFFSCREEN_ALPHA_COMPOSITING, false));
    }
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
          root.getLocationOnScreen(sLocationBuf);
          float x = PixelUtil.toPixelFromDIP(args.getDouble(0)) - sLocationBuf[0];
          float y = PixelUtil.toPixelFromDIP(args.getDouble(1)) - sLocationBuf[1];
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
  public void removeView(ReactViewGroup parent, View child) {
    boolean removeClippedSubviews = parent.getRemoveClippedSubviews();
    if (removeClippedSubviews) {
      if (child.getParent() != null) {
        parent.removeView(child);
      }
      parent.removeViewWithSubviewClippingEnabled(child);
    } else {
      parent.removeView(child);
    }
  }

}
