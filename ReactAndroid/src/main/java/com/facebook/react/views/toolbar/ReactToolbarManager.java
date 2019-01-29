/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.toolbar;

import android.content.Context;
import android.content.res.Resources;
import android.content.res.TypedArray;
import android.graphics.Color;
import android.util.LayoutDirection;
import android.view.MenuItem;
import android.view.View;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.toolbar.events.ToolbarClickEvent;
import java.util.Map;
import javax.annotation.Nullable;

/**
 * Manages instances of ReactToolbar.
 */
public class ReactToolbarManager extends ViewGroupManager<ReactToolbar> {

  private static final String REACT_CLASS = "ToolbarAndroid";
  private static final int COMMAND_DISMISS_POPUP_MENUS = 1;

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ReactToolbar createViewInstance(ThemedReactContext reactContext) {
    return new ReactToolbar(reactContext);
  }

  @ReactProp(name = "logo")
  public void setLogo(ReactToolbar view, @Nullable ReadableMap logo) {
    view.setLogoSource(logo);
  }

  @ReactProp(name = "navIcon")
  public void setNavIcon(ReactToolbar view, @Nullable ReadableMap navIcon) {
    view.setNavIconSource(navIcon);
  }

  @ReactProp(name = "overflowIcon")
  public void setOverflowIcon(ReactToolbar view, @Nullable ReadableMap overflowIcon) {
    view.setOverflowIconSource(overflowIcon);
  }

  @ReactProp(name = "rtl")
  public void setRtl(ReactToolbar view, boolean rtl) {
    view.setLayoutDirection(rtl ? LayoutDirection.RTL : LayoutDirection.LTR);
  }

  @ReactProp(name = "subtitle")
  public void setSubtitle(ReactToolbar view, @Nullable String subtitle) {
    view.setSubtitle(subtitle);
  }

  @ReactProp(name = "subtitleColor", customType = "Color")
  public void setSubtitleColor(ReactToolbar view, @Nullable Integer subtitleColor) {
    int[] defaultColors = getDefaultColors(view.getContext());
    if (subtitleColor != null) {
      view.setSubtitleTextColor(subtitleColor);
    } else {
      view.setSubtitleTextColor(defaultColors[1]);
    }
  }

  @ReactProp(name = "title")
  public void setTitle(ReactToolbar view, @Nullable String title) {
    view.setTitle(title);
  }

  @ReactProp(name = "titleColor", customType = "Color")
  public void setTitleColor(ReactToolbar view, @Nullable Integer titleColor) {
    int[] defaultColors = getDefaultColors(view.getContext());
    if (titleColor != null) {
      view.setTitleTextColor(titleColor);
    } else {
      view.setTitleTextColor(defaultColors[0]);
    }
  }

  @ReactProp(name = "contentInsetStart", defaultFloat = Float.NaN)
  public void setContentInsetStart(ReactToolbar view, float insetStart) {
    int inset = Float.isNaN(insetStart) ?
        getDefaultContentInsets(view.getContext())[0] :
        Math.round(PixelUtil.toPixelFromDIP(insetStart));
    view.setContentInsetsRelative(inset, view.getContentInsetEnd());
  }

  @ReactProp(name = "contentInsetEnd", defaultFloat = Float.NaN)
  public void setContentInsetEnd(ReactToolbar view, float insetEnd) {
    int inset = Float.isNaN(insetEnd) ?
        getDefaultContentInsets(view.getContext())[1] :
        Math.round(PixelUtil.toPixelFromDIP(insetEnd));
    view.setContentInsetsRelative(view.getContentInsetStart(), inset);
  }

  @ReactProp(name = "nativeActions")
  public void setActions(ReactToolbar view, @Nullable ReadableArray actions) {
    view.setActions(actions);
  }

  @Override
  protected void addEventEmitters(final ThemedReactContext reactContext, final ReactToolbar view) {
    final EventDispatcher mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
    view.setNavigationOnClickListener(
        new View.OnClickListener() {
          @Override
          public void onClick(View v) {
            mEventDispatcher.dispatchEvent(
                new ToolbarClickEvent(view.getId(), -1));
          }
        });

    view.setOnMenuItemClickListener(
        new ReactToolbar.OnMenuItemClickListener() {
          @Override
          public boolean onMenuItemClick(MenuItem menuItem) {
            mEventDispatcher.dispatchEvent(
                new ToolbarClickEvent(
                    view.getId(),
                    menuItem.getOrder()));
            return true;
          }
        });
  }

  @Nullable
  @Override
  public Map<String, Object> getExportedViewConstants() {
    return MapBuilder.<String, Object>of(
        "ShowAsAction",
        MapBuilder.of(
            "never", MenuItem.SHOW_AS_ACTION_NEVER,
            "always", MenuItem.SHOW_AS_ACTION_ALWAYS,
            "ifRoom", MenuItem.SHOW_AS_ACTION_IF_ROOM));
  }

  @Override
  public boolean needsCustomLayoutForChildren() {
    return true;
  }

  @Nullable
  @Override
  public Map<String, Integer> getCommandsMap() {
    return MapBuilder.of("dismissPopupMenus", COMMAND_DISMISS_POPUP_MENUS);
  }

  @Override
  public void receiveCommand(ReactToolbar view, int commandType, @Nullable ReadableArray args) {
    switch (commandType) {
      case COMMAND_DISMISS_POPUP_MENUS: {
        view.dismissPopupMenus();
        return;
      }
      default:
        throw new IllegalArgumentException(String.format(
          "Unsupported command %d received by %s.",
          commandType,
          getClass().getSimpleName()));
    }
  }

  private int[] getDefaultContentInsets(Context context) {
    Resources.Theme theme = context.getTheme();
    TypedArray toolbarStyle = null;
    TypedArray contentInsets = null;

    try {
      toolbarStyle =
          theme.obtainStyledAttributes(new int[] {getIdentifier(context, "toolbarStyle")});

      int toolbarStyleResId = toolbarStyle.getResourceId(0, 0);

      contentInsets =
          theme.obtainStyledAttributes(
              toolbarStyleResId,
              new int[] {
                getIdentifier(context, "contentInsetStart"),
                getIdentifier(context, "contentInsetEnd"),
              });

      int contentInsetStart = contentInsets.getDimensionPixelSize(0, 0);
      int contentInsetEnd = contentInsets.getDimensionPixelSize(1, 0);

      return new int[] {contentInsetStart, contentInsetEnd};
    } finally {
      recycleQuietly(toolbarStyle);
      recycleQuietly(contentInsets);
    }

  }

  private static int[] getDefaultColors(Context context) {
    Resources.Theme theme = context.getTheme();
    TypedArray toolbarStyle = null;
    TypedArray textAppearances = null;
    TypedArray titleTextAppearance = null;
    TypedArray subtitleTextAppearance = null;

    try {
      toolbarStyle =
          theme.obtainStyledAttributes(new int[] {getIdentifier(context, "toolbarStyle")});

      int toolbarStyleResId = toolbarStyle.getResourceId(0, 0);
      textAppearances =
          theme.obtainStyledAttributes(
              toolbarStyleResId,
              new int[] {
                getIdentifier(context, "titleTextAppearance"),
                getIdentifier(context, "subtitleTextAppearance"),
              });

      int titleTextAppearanceResId = textAppearances.getResourceId(0, 0);
      int subtitleTextAppearanceResId = textAppearances.getResourceId(1, 0);

      titleTextAppearance = theme
          .obtainStyledAttributes(titleTextAppearanceResId, new int[]{android.R.attr.textColor});
      subtitleTextAppearance = theme
          .obtainStyledAttributes(subtitleTextAppearanceResId, new int[]{android.R.attr.textColor});

      int titleTextColor = titleTextAppearance.getColor(0, Color.BLACK);
      int subtitleTextColor = subtitleTextAppearance.getColor(0, Color.BLACK);

      return new int[] {titleTextColor, subtitleTextColor};
    } finally {
      recycleQuietly(toolbarStyle);
      recycleQuietly(textAppearances);
      recycleQuietly(titleTextAppearance);
      recycleQuietly(subtitleTextAppearance);
    }
  }

  private static void recycleQuietly(@Nullable TypedArray style) {
    if (style != null) {
      style.recycle();
    }
  }

  /**
   * The appcompat-v7 BUCK dep is listed as a provided_dep, which complains that
   * com.facebook.react.R doesn't exist. Since the attributes provided from a parent, we can access
   * those attributes dynamically.
   */
  private static int getIdentifier(Context context, String name) {
    return context.getResources().getIdentifier(name, "attr", context.getPackageName());
  }

}
