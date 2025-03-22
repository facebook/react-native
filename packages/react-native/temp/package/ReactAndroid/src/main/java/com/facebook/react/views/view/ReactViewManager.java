/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view;

import android.graphics.Rect;
import android.view.View;
import androidx.annotation.ColorInt;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.DynamicFromObject;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.BackgroundStyleApplicator;
import com.facebook.react.uimanager.LengthPercentage;
import com.facebook.react.uimanager.LengthPercentageType;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.style.BackgroundImageLayer;
import com.facebook.react.uimanager.style.BorderRadiusProp;
import com.facebook.react.uimanager.style.BorderStyle;
import com.facebook.react.uimanager.style.LogicalEdge;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** View manager for AndroidViews (plain React Views). */
@ReactModule(name = ReactViewManager.REACT_CLASS)
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactViewManager extends ReactClippingViewManager<ReactViewGroup> {

  @VisibleForTesting public static final String REACT_CLASS = ViewProps.VIEW_CLASS_NAME;

  private static final int[] SPACING_TYPES = {
    Spacing.ALL,
    Spacing.LEFT,
    Spacing.RIGHT,
    Spacing.TOP,
    Spacing.BOTTOM,
    Spacing.START,
    Spacing.END,
    Spacing.BLOCK,
    Spacing.BLOCK_END,
    Spacing.BLOCK_START
  };
  private static final int CMD_HOTSPOT_UPDATE = 1;
  private static final int CMD_SET_PRESSED = 2;
  private static final String HOTSPOT_UPDATE_KEY = "hotspotUpdate";

  public ReactViewManager() {
    super();

    setupViewRecycling();
  }

  @Override
  protected @Nullable ReactViewGroup prepareToRecycleView(
      ThemedReactContext reactContext, ReactViewGroup view) {
    // BaseViewManager
    ReactViewGroup preparedView = super.prepareToRecycleView(reactContext, view);
    if (preparedView != null) {
      preparedView.recycleView();
    }
    return view;
  }

  @ReactProp(name = "accessible")
  public void setAccessible(ReactViewGroup view, boolean accessible) {
    view.setFocusable(accessible);
  }

  @ReactProp(name = "hasTVPreferredFocus")
  public void setTVPreferredFocus(ReactViewGroup view, boolean hasTVPreferredFocus) {
    if (hasTVPreferredFocus) {
      view.setFocusable(true);
      view.setFocusableInTouchMode(true);
      view.requestFocus();
    }
  }

  @ReactProp(name = ViewProps.BACKGROUND_IMAGE, customType = "BackgroundImage")
  public void setBackgroundImage(ReactViewGroup view, @Nullable ReadableArray backgroundImage) {
    if (ViewUtil.getUIManagerType(view) == UIManagerType.FABRIC) {
      if (backgroundImage != null && backgroundImage.size() > 0) {
        List<BackgroundImageLayer> backgroundImageLayers = new ArrayList<>(backgroundImage.size());
        for (int i = 0; i < backgroundImage.size(); i++) {
          ReadableMap backgroundImageMap = backgroundImage.getMap(i);
          BackgroundImageLayer layer = new BackgroundImageLayer(backgroundImageMap);
          backgroundImageLayers.add(layer);
        }
        view.setBackgroundImage(backgroundImageLayers);
      } else {
        view.setBackgroundImage(null);
      }
    }
  }

  @ReactProp(name = "nextFocusDown", defaultInt = View.NO_ID)
  public void nextFocusDown(ReactViewGroup view, int viewId) {
    view.setNextFocusDownId(viewId);
  }

  @ReactProp(name = "nextFocusForward", defaultInt = View.NO_ID)
  public void nextFocusForward(ReactViewGroup view, int viewId) {
    view.setNextFocusForwardId(viewId);
  }

  @ReactProp(name = "nextFocusLeft", defaultInt = View.NO_ID)
  public void nextFocusLeft(ReactViewGroup view, int viewId) {
    view.setNextFocusLeftId(viewId);
  }

  @ReactProp(name = "nextFocusRight", defaultInt = View.NO_ID)
  public void nextFocusRight(ReactViewGroup view, int viewId) {
    view.setNextFocusRightId(viewId);
  }

  @ReactProp(name = "nextFocusUp", defaultInt = View.NO_ID)
  public void nextFocusUp(ReactViewGroup view, int viewId) {
    view.setNextFocusUpId(viewId);
  }

  @ReactPropGroup(
      names = {
        ViewProps.BORDER_RADIUS,
        ViewProps.BORDER_TOP_LEFT_RADIUS,
        ViewProps.BORDER_TOP_RIGHT_RADIUS,
        ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
        ViewProps.BORDER_BOTTOM_LEFT_RADIUS,
        ViewProps.BORDER_TOP_START_RADIUS,
        ViewProps.BORDER_TOP_END_RADIUS,
        ViewProps.BORDER_BOTTOM_START_RADIUS,
        ViewProps.BORDER_BOTTOM_END_RADIUS,
        ViewProps.BORDER_END_END_RADIUS,
        ViewProps.BORDER_END_START_RADIUS,
        ViewProps.BORDER_START_END_RADIUS,
        ViewProps.BORDER_START_START_RADIUS,
      })
  public void setBorderRadius(ReactViewGroup view, int index, Dynamic rawBorderRadius) {
    @Nullable LengthPercentage borderRadius = LengthPercentage.setFromDynamic(rawBorderRadius);

    // We do not support percentage border radii on Paper in order to be consistent with iOS (to
    // avoid developer surprise if it works on one platform but not another).
    if (ViewUtil.getUIManagerType(view) != UIManagerType.FABRIC
        && borderRadius != null
        && borderRadius.getType() == LengthPercentageType.PERCENT) {
      borderRadius = null;
    }

    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBorderRadius(
          view, BorderRadiusProp.values()[index], borderRadius);
    } else {
      view.setBorderRadius(BorderRadiusProp.values()[index], borderRadius);
    }
  }

  /**
   * @deprecated Use {@link #setBorderRadius(ReactViewGroup, int, Dynamic)} instead.
   */
  @Deprecated(since = "0.75.0", forRemoval = true)
  public void setBorderRadius(ReactViewGroup view, int index, float borderRadius) {
    setBorderRadius(view, index, new DynamicFromObject(borderRadius));
  }

  @ReactProp(name = "borderStyle")
  public void setBorderStyle(ReactViewGroup view, @Nullable String borderStyle) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      @Nullable
      BorderStyle parsedBorderStyle =
          borderStyle == null ? null : BorderStyle.fromString(borderStyle);
      BackgroundStyleApplicator.setBorderStyle(view, parsedBorderStyle);
    } else {
      view.setBorderStyle(borderStyle);
    }
  }

  @ReactProp(name = "hitSlop")
  public void setHitSlop(final ReactViewGroup view, Dynamic hitSlop) {
    switch (hitSlop.getType()) {
      case Map:
        ReadableMap hitSlopMap = hitSlop.asMap();
        view.setHitSlopRect(
            new Rect(
                hitSlopMap.hasKey("left")
                    ? (int) PixelUtil.toPixelFromDIP(hitSlopMap.getDouble("left"))
                    : 0,
                hitSlopMap.hasKey("top")
                    ? (int) PixelUtil.toPixelFromDIP(hitSlopMap.getDouble("top"))
                    : 0,
                hitSlopMap.hasKey("right")
                    ? (int) PixelUtil.toPixelFromDIP(hitSlopMap.getDouble("right"))
                    : 0,
                hitSlopMap.hasKey("bottom")
                    ? (int) PixelUtil.toPixelFromDIP(hitSlopMap.getDouble("bottom"))
                    : 0));
        break;
      case Number:
        int hitSlopValue = (int) PixelUtil.toPixelFromDIP(hitSlop.asDouble());
        view.setHitSlopRect(new Rect(hitSlopValue, hitSlopValue, hitSlopValue, hitSlopValue));
        break;
      default:
        FLog.w(ReactConstants.TAG, "Invalid type for 'hitSlop' value " + hitSlop.getType());
        /* falls through */
      case Null:
        view.setHitSlopRect(null);
        break;
    }
  }

  @ReactProp(name = ViewProps.POINTER_EVENTS)
  public void setPointerEvents(ReactViewGroup view, @Nullable String pointerEventsStr) {
    view.setPointerEvents(PointerEvents.parsePointerEvents(pointerEventsStr));
  }

  @ReactProp(name = "nativeBackgroundAndroid")
  public void setNativeBackground(ReactViewGroup view, @Nullable ReadableMap bg) {
    view.setTranslucentBackgroundDrawable(
        bg == null
            ? null
            : ReactDrawableHelper.createDrawableFromJSDescription(view.getContext(), bg));
  }

  @ReactProp(name = "nativeForegroundAndroid")
  public void setNativeForeground(ReactViewGroup view, @Nullable ReadableMap fg) {
    view.setForeground(
        fg == null
            ? null
            : ReactDrawableHelper.createDrawableFromJSDescription(view.getContext(), fg));
  }

  @ReactProp(name = ViewProps.NEEDS_OFFSCREEN_ALPHA_COMPOSITING)
  public void setNeedsOffscreenAlphaCompositing(
      ReactViewGroup view, boolean needsOffscreenAlphaCompositing) {
    view.setNeedsOffscreenAlphaCompositing(needsOffscreenAlphaCompositing);
  }

  @ReactPropGroup(
      names = {
        ViewProps.BORDER_WIDTH,
        ViewProps.BORDER_LEFT_WIDTH,
        ViewProps.BORDER_RIGHT_WIDTH,
        ViewProps.BORDER_TOP_WIDTH,
        ViewProps.BORDER_BOTTOM_WIDTH,
        ViewProps.BORDER_START_WIDTH,
        ViewProps.BORDER_END_WIDTH,
      },
      defaultFloat = Float.NaN)
  public void setBorderWidth(ReactViewGroup view, int index, float width) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBorderWidth(view, LogicalEdge.values()[index], width);
    } else {
      if (!Float.isNaN(width) && width < 0) {
        width = Float.NaN;
      }

      if (!Float.isNaN(width)) {
        width = PixelUtil.toPixelFromDIP(width);
      }

      view.setBorderWidth(SPACING_TYPES[index], width);
    }
  }

  @ReactPropGroup(
      names = {
        ViewProps.BORDER_COLOR,
        ViewProps.BORDER_LEFT_COLOR,
        ViewProps.BORDER_RIGHT_COLOR,
        ViewProps.BORDER_TOP_COLOR,
        ViewProps.BORDER_BOTTOM_COLOR,
        ViewProps.BORDER_START_COLOR,
        ViewProps.BORDER_END_COLOR,
        ViewProps.BORDER_BLOCK_COLOR,
        ViewProps.BORDER_BLOCK_END_COLOR,
        ViewProps.BORDER_BLOCK_START_COLOR
      },
      customType = "Color")
  public void setBorderColor(ReactViewGroup view, int index, @Nullable Integer color) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBorderColor(
          view, LogicalEdge.fromSpacingType(SPACING_TYPES[index]), color);
    } else {
      view.setBorderColor(SPACING_TYPES[index], color);
    }
  }

  @ReactProp(name = ViewProps.COLLAPSABLE)
  public void setCollapsable(ReactViewGroup view, boolean collapsable) {
    // no-op: it's here only so that "collapsable" property is exported to JS. The value is actually
    // handled in NativeViewHierarchyOptimizer
  }

  @ReactProp(name = ViewProps.COLLAPSABLE_CHILDREN)
  public void setCollapsableChildren(ReactViewGroup view, boolean collapsableChildren) {
    // no-op: it's here only so that "collapsableChildren" property is exported to JS.
  }

  @ReactProp(name = "focusable")
  public void setFocusable(final ReactViewGroup view, boolean focusable) {
    if (focusable) {
      view.setOnClickListener(
          new View.OnClickListener() {
            @Override
            public void onClick(View v) {
              final EventDispatcher mEventDispatcher =
                  UIManagerHelper.getEventDispatcherForReactTag(
                      (ReactContext) view.getContext(), view.getId());
              if (mEventDispatcher == null) {
                return;
              }
              mEventDispatcher.dispatchEvent(
                  new ViewGroupClickEvent(
                      UIManagerHelper.getSurfaceId(view.getContext()), view.getId()));
            }
          });

      // Clickable elements are focusable. On API 26, this is taken care by setClickable.
      // Explicitly calling setFocusable here for backward compatibility.
      view.setFocusable(true /*isFocusable*/);
    } else {
      view.setOnClickListener(null);
      view.setClickable(false);
      // Don't set view.setFocusable(false) because we might still want it to be focusable for
      // accessibility reasons
    }
  }

  @ReactProp(name = ViewProps.OVERFLOW)
  public void setOverflow(ReactViewGroup view, String overflow) {
    view.setOverflow(overflow);
  }

  @ReactProp(name = "backfaceVisibility")
  public void setBackfaceVisibility(ReactViewGroup view, String backfaceVisibility) {
    view.setBackfaceVisibility(backfaceVisibility);
  }

  @Override
  public void setOpacity(ReactViewGroup view, float opacity) {
    view.setOpacityIfPossible(opacity);
  }

  @Override
  protected void setTransformProperty(
      ReactViewGroup view,
      @Nullable ReadableArray transforms,
      @Nullable ReadableArray transformOrigin) {
    super.setTransformProperty(view, transforms, transformOrigin);
    view.setBackfaceVisibilityDependantOpacity();
  }

  @ReactProp(name = ViewProps.BOX_SHADOW, customType = "BoxShadow")
  public void setBoxShadow(ReactViewGroup view, @Nullable ReadableArray shadows) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBoxShadow(view, shadows);
    }
  }

  @Override
  public void setBackgroundColor(ReactViewGroup view, @ColorInt int backgroundColor) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBackgroundColor(view, backgroundColor);
    } else {
      super.setBackgroundColor(view, backgroundColor);
    }
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
    return MapBuilder.of(HOTSPOT_UPDATE_KEY, CMD_HOTSPOT_UPDATE, "setPressed", CMD_SET_PRESSED);
  }

  @Override
  public void receiveCommand(ReactViewGroup root, int commandId, @Nullable ReadableArray args) {
    switch (commandId) {
      case CMD_HOTSPOT_UPDATE:
        {
          handleHotspotUpdate(root, args);
          break;
        }
      case CMD_SET_PRESSED:
        {
          handleSetPressed(root, args);
          break;
        }
    }
  }

  @Override
  public void receiveCommand(ReactViewGroup root, String commandId, @Nullable ReadableArray args) {
    switch (commandId) {
      case HOTSPOT_UPDATE_KEY:
        {
          handleHotspotUpdate(root, args);
          break;
        }
      case "setPressed":
        {
          handleSetPressed(root, args);
          break;
        }
    }
  }

  private void handleSetPressed(ReactViewGroup root, @Nullable ReadableArray args) {
    if (args == null || args.size() != 1) {
      throw new JSApplicationIllegalArgumentException(
          "Illegal number of arguments for 'setPressed' command");
    }
    root.setPressed(args.getBoolean(0));
  }

  private void handleHotspotUpdate(ReactViewGroup root, @Nullable ReadableArray args) {
    if (args == null || args.size() != 2) {
      throw new JSApplicationIllegalArgumentException(
          "Illegal number of arguments for 'updateHotspot' command");
    }

    float x = PixelUtil.toPixelFromDIP(args.getDouble(0));
    float y = PixelUtil.toPixelFromDIP(args.getDouble(1));
    root.drawableHotspotChanged(x, y);
  }
}
