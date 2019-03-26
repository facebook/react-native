/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view;

import android.annotation.TargetApi;
import android.graphics.Rect;
import android.os.Build;
import android.view.FocusFinder;
import android.view.View;
import android.view.ViewGroup;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.yoga.YogaConstants;
import java.util.Locale;
import java.util.Map;
import javax.annotation.Nullable;
import javax.annotation.Nonnull;

/**
 * View manager for AndroidViews (plain React Views).
 */
@ReactModule(name = ReactViewManager.REACT_CLASS)
public class ReactViewManager extends ViewGroupManager<ReactViewGroup> {

  @VisibleForTesting
  public static final String REACT_CLASS = ViewProps.VIEW_CLASS_NAME;

  private static final int[] SPACING_TYPES = {
    Spacing.ALL,
    Spacing.LEFT,
    Spacing.RIGHT,
    Spacing.TOP,
    Spacing.BOTTOM,
    Spacing.START,
    Spacing.END,
  };

  @ReactProp(name = "hasTVPreferredFocus")
  public void setTVPreferredFocus(ReactViewGroup view, boolean hasTVPreferredFocus) {
    if (hasTVPreferredFocus) {
      view.setFocusable(true);
      view.setFocusableInTouchMode(true);
      view.requestFocus();
    }
  }

  // Focus or blur call on native components (through NativeMethodsMixin) redirects to TextInputState.js
  // which dispatches focusTextInput or blurTextInput commands. These commands are mapped to FOCUS_TEXT_INPUT=1
  // and BLUR_TEXT_INPUT=2 in ReactTextInputManager, hence these constants value should be in sync with ReactTextInputManager.
  private static final int FOCUS_TEXT_INPUT = 1;
  private static final int BLUR_TEXT_INPUT = 2;
  private static final int CMD_HOTSPOT_UPDATE = 3;
  private static final int CMD_SET_PRESSED = 4;
  
  @ReactPropGroup(names = {
      ViewProps.BORDER_RADIUS,
      ViewProps.BORDER_TOP_LEFT_RADIUS,
      ViewProps.BORDER_TOP_RIGHT_RADIUS,
      ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
      ViewProps.BORDER_BOTTOM_LEFT_RADIUS,
      ViewProps.BORDER_TOP_START_RADIUS,
      ViewProps.BORDER_TOP_END_RADIUS,
      ViewProps.BORDER_BOTTOM_START_RADIUS,
      ViewProps.BORDER_BOTTOM_END_RADIUS,
    },
    defaultFloat = YogaConstants.UNDEFINED
  )
  public void setBorderRadius(ReactViewGroup view, int index, float borderRadius) {
    if (!YogaConstants.isUndefined(borderRadius) && borderRadius < 0) {
      borderRadius = YogaConstants.UNDEFINED;
    }

    if (!YogaConstants.isUndefined(borderRadius)) {
      borderRadius = PixelUtil.toPixelFromDIP(borderRadius);
    }

    if (index == 0) {
      view.setBorderRadius(borderRadius);
    } else {
      view.setBorderRadius(borderRadius, index - 1);
    }
  }

  @Nullable
  @Override
  public Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
      .put(
        "topOnFocusChange",
        MapBuilder.of(
          "phasedRegistrationNames",
          MapBuilder.of("bubbled", "onFocusChange")))
      .build();
  }

  @Override
  protected void addEventEmitters(
    final ThemedReactContext reactContext,
    final ReactViewGroup reactViewGroup) {
    reactViewGroup.setOnFocusChangeListener(
      new View.OnFocusChangeListener() {
        @Override
        public void onFocusChange(View v, boolean hasFocus) {
          EventDispatcher eventDispatcher =
            reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
            eventDispatcher.dispatchEvent(
              new ReactViewFocusEvent(reactViewGroup.getId(), hasFocus));
        }
      }
    );
  }

  @ReactProp(name = "borderStyle")
  public void setBorderStyle(ReactViewGroup view, @Nullable String borderStyle) {
    view.setBorderStyle(borderStyle);
  }

  @ReactProp(name = "hitSlop")
  public void setHitSlop(final ReactViewGroup view, @Nullable ReadableMap hitSlop) {
    if (hitSlop == null) {
      view.setHitSlopRect(null);
    } else {
      view.setHitSlopRect(new Rect(
          hitSlop.hasKey("left") ? (int) PixelUtil.toPixelFromDIP(hitSlop.getDouble("left")) : 0,
          hitSlop.hasKey("top") ? (int) PixelUtil.toPixelFromDIP(hitSlop.getDouble("top")) : 0,
          hitSlop.hasKey("right") ? (int) PixelUtil.toPixelFromDIP(hitSlop.getDouble("right")) : 0,
          hitSlop.hasKey("bottom") ? (int) PixelUtil.toPixelFromDIP(hitSlop.getDouble("bottom")) : 0
      ));
    }
  }

  @ReactProp(name = ViewProps.POINTER_EVENTS)
  public void setPointerEvents(ReactViewGroup view, @Nullable String pointerEventsStr) {
    if (pointerEventsStr == null) {
      view.setPointerEvents(PointerEvents.AUTO);
    } else {
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

  @TargetApi(Build.VERSION_CODES.M)
  @ReactProp(name = "nativeForegroundAndroid")
  public void setNativeForeground(ReactViewGroup view, @Nullable ReadableMap fg) {
    view.setForeground(fg == null
        ? null
        : ReactDrawableHelper.createDrawableFromJSDescription(view.getContext(), fg));
  }

  @ReactProp(name = com.facebook.react.uimanager.ReactClippingViewGroupHelper.PROP_REMOVE_CLIPPED_SUBVIEWS)
  public void setRemoveClippedSubviews(ReactViewGroup view, boolean removeClippedSubviews) {
    view.setRemoveClippedSubviews(removeClippedSubviews);
  }

  @ReactProp(name = ViewProps.NEEDS_OFFSCREEN_ALPHA_COMPOSITING)
  public void setNeedsOffscreenAlphaCompositing(
      ReactViewGroup view,
      boolean needsOffscreenAlphaCompositing) {
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
    defaultFloat = YogaConstants.UNDEFINED
  )
  public void setBorderWidth(ReactViewGroup view, int index, float width) {
    if (!YogaConstants.isUndefined(width) && width < 0) {
      width = YogaConstants.UNDEFINED;
    }

    if (!YogaConstants.isUndefined(width)) {
      width = PixelUtil.toPixelFromDIP(width);
    }

    view.setBorderWidth(SPACING_TYPES[index], width);
  }

  @ReactPropGroup(
    names = {
      ViewProps.BORDER_COLOR,
      ViewProps.BORDER_LEFT_COLOR,
      ViewProps.BORDER_RIGHT_COLOR,
      ViewProps.BORDER_TOP_COLOR,
      ViewProps.BORDER_BOTTOM_COLOR,
      ViewProps.BORDER_START_COLOR,
      ViewProps.BORDER_END_COLOR
    },
    customType = "Color"
  )
  public void setBorderColor(ReactViewGroup view, int index, Integer color) {
    float rgbComponent = color == null ? YogaConstants.UNDEFINED : (float) ((int)color & 0x00FFFFFF);
    float alphaComponent = color == null ? YogaConstants.UNDEFINED : (float) ((int)color >>> 24);
    view.setBorderColor(SPACING_TYPES[index], rgbComponent, alphaComponent);
  }

  @ReactProp(name = ViewProps.COLLAPSABLE)
  public void setCollapsable(ReactViewGroup view, boolean collapsable) {
    // no-op: it's here only so that "collapsable" property is exported to JS. The value is actually
    // handled in NativeViewHierarchyOptimizer
  }

  @ReactProp(name = "clickable")
  public void setClickable(final ReactViewGroup view, boolean clickable) {
    if (clickable) {
      view.setOnClickListener(
        new View.OnClickListener() {
          @Override
          public void onClick(View v) {
            final EventDispatcher mEventDispatcher = ((ReactContext)view.getContext()).getNativeModule(UIManagerModule.class)
                                                                                      .getEventDispatcher();
            mEventDispatcher.dispatchEvent(new ViewGroupClickEvent(view.getId()));
          }});

      // Clickable elements are focusable. On API 26, this is taken care by setClickable.
      // Explicitly calling setFocusable here for backward compatibility.
      view.setFocusable(true /*isFocusable*/);
    }
    else {
      view.setOnClickListener(null);
      view.setClickable(false);
      view.setFocusable(false);
    }
  }

  @ReactProp(name = ViewProps.OVERFLOW)
  public void setOverflow(ReactViewGroup view, String overflow) {
    view.setOverflow(overflow);
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
    return MapBuilder.of("focusTextInput", FOCUS_TEXT_INPUT, "blurTextInput", BLUR_TEXT_INPUT, "hotspotUpdate", CMD_HOTSPOT_UPDATE, "setPressed", CMD_SET_PRESSED);
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
      case FOCUS_TEXT_INPUT: {
        root.requestFocus();
        break;
      }
      case BLUR_TEXT_INPUT: {
        root.clearFocus();
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
      // Prevent focus leaks due to removal of a focused View
      if (parent.getChildAt(index).hasFocus()) {
        giveFocusToAppropriateView(parent, parent.getChildAt(index));
      }
      parent.removeViewAt(index);
    }
  }

  private void giveFocusToAppropriateView(@Nonnull ViewGroup parent, @Nonnull View focusedView) {
    // Search for appropriate sibling
    View viewToTakeFocus = null;
    while (parent != null) {
      // Search DOWN
      viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_DOWN);
      if (viewToTakeFocus == null) {
        // Search RIGHT
        viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_RIGHT);
        if (viewToTakeFocus == null) {
          // Search UP
          viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_UP);
          if (viewToTakeFocus == null) {
            // Search LEFT
            viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_LEFT);
          }
        }
      }
      if (viewToTakeFocus != null || !(parent.getParent() instanceof ViewGroup)) {
        break;
      }
      parent = (ViewGroup) parent.getParent();
    }

    // Give focus to View
    if (viewToTakeFocus != null) {
      viewToTakeFocus.requestFocus();
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

  @Override
  public void startViewTransition(ReactViewGroup parent, View view) {
    boolean removeClippedSubviews = parent.getRemoveClippedSubviews();
    if (removeClippedSubviews) {
      parent.startViewTransitionWithSubviewClippingEnabled(view);
    } else {
      parent.startViewTransition(view);
    }
  }

  @Override
  public void endViewTransition(ReactViewGroup parent, View view) {
    boolean removeClippedSubviews = parent.getRemoveClippedSubviews();
    if (removeClippedSubviews) {
      parent.endViewTransitionWithSubviewClippingEnabled(view);
    } else {
      parent.endViewTransition(view);
    }
  }
}
