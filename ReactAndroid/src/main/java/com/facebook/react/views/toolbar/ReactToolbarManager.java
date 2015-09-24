/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.toolbar;

import javax.annotation.Nullable;

import android.content.Context;
import android.content.res.Resources;
import android.content.res.TypedArray;
import android.graphics.Color;
import android.os.SystemClock;
import android.support.v7.widget.Toolbar;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;

import com.facebook.react.R;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.CatalystStylesDiffMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.UIProp;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.toolbar.events.ToolbarClickEvent;

/**
 * Manages instances of Toolbar.
 */
public class ReactToolbarManager extends ViewGroupManager<Toolbar> {

  private static final String REACT_CLASS = "ToolbarAndroid";

  @UIProp(UIProp.Type.STRING)
  public static final String PROP_LOGO = "logo";
  @UIProp(UIProp.Type.STRING)
  public static final String PROP_NAV_ICON = "navIcon";
  @UIProp(UIProp.Type.STRING)
  public static final String PROP_SUBTITLE = "subtitle";
  @UIProp(UIProp.Type.COLOR)
  public static final String PROP_SUBTITLE_COLOR = "subtitleColor";
  @UIProp(UIProp.Type.STRING)
  public static final String PROP_TITLE = "title";
  @UIProp(UIProp.Type.COLOR)
  public static final String PROP_TITLE_COLOR = "titleColor";
  @UIProp(UIProp.Type.ARRAY)
  public static final String PROP_ACTIONS = "actions";

  private static final String PROP_ACTION_ICON = "icon";
  private static final String PROP_ACTION_SHOW = "show";
  private static final String PROP_ACTION_SHOW_WITH_TEXT = "showWithText";
  private static final String PROP_ACTION_TITLE = "title";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected Toolbar createViewInstance(ThemedReactContext reactContext) {
    return new Toolbar(reactContext);
  }

  @Override
  public void updateView(Toolbar toolbar, CatalystStylesDiffMap props) {
    super.updateView(toolbar, props);

    int[] defaultColors = getDefaultColors(toolbar.getContext());
    if (props.hasKey(PROP_SUBTITLE)) {
      toolbar.setSubtitle(props.getString(PROP_SUBTITLE));
    }
    if (props.hasKey(PROP_SUBTITLE_COLOR)) {
      final int subtitleColor = props.getInt(PROP_SUBTITLE_COLOR, defaultColors[1]);
      toolbar.setSubtitleTextColor(subtitleColor);
    }
    if (props.hasKey(PROP_TITLE)) {
      toolbar.setTitle(props.getString(PROP_TITLE));
    }
    if (props.hasKey(PROP_TITLE_COLOR)) {
      final int titleColor = props.getInt(PROP_TITLE_COLOR, defaultColors[0]);
      toolbar.setTitleTextColor(titleColor);
    }
    if (props.hasKey(PROP_NAV_ICON)) {
      String navIcon = props.getString(PROP_NAV_ICON);
      if (navIcon != null) {
        toolbar.setNavigationIcon(getDrawableResourceByName(toolbar.getContext(), navIcon));
      } else {
        toolbar.setNavigationIcon(null);
      }
    }
    if (props.hasKey(PROP_LOGO)) {
      String logo = props.getString(PROP_LOGO);
      if (logo != null) {
        toolbar.setLogo(getDrawableResourceByName(toolbar.getContext(), logo));
      } else {
        toolbar.setLogo(null);
      }
    }
    if (props.hasKey(PROP_ACTIONS)) {
      setActions(toolbar, props.getArray(PROP_ACTIONS));
    }
  }

  @Override
  protected void addEventEmitters(final ThemedReactContext reactContext, final Toolbar view) {
    final EventDispatcher mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class)
        .getEventDispatcher();
    view.setNavigationOnClickListener(
        new View.OnClickListener() {
          @Override
          public void onClick(View v) {
            mEventDispatcher.dispatchEvent(
                new ToolbarClickEvent(view.getId(), SystemClock.uptimeMillis(), -1));
          }
        });

    view.setOnMenuItemClickListener(
        new Toolbar.OnMenuItemClickListener() {
          @Override
          public boolean onMenuItemClick(MenuItem menuItem) {
            mEventDispatcher.dispatchEvent(
                new ToolbarClickEvent(
                    view.getId(),
                    SystemClock.uptimeMillis(),
                    menuItem.getOrder()));
            return true;
          }
        });
  }

  @Override
  public boolean needsCustomLayoutForChildren() {
    return true;
  }

  private static void setActions(Toolbar toolbar, @Nullable ReadableArray actions) {
    Menu menu = toolbar.getMenu();
    menu.clear();
    if (actions != null) {
      for (int i = 0; i < actions.size(); i++) {
        ReadableMap action = actions.getMap(i);
        MenuItem item = menu.add(Menu.NONE, Menu.NONE, i, action.getString(PROP_ACTION_TITLE));
        String icon = action.hasKey(PROP_ACTION_ICON) ? action.getString(PROP_ACTION_ICON) : null;
        if (icon != null) {
          item.setIcon(getDrawableResourceByName(toolbar.getContext(), icon));
        }
        String show = action.hasKey(PROP_ACTION_SHOW) ? action.getString(PROP_ACTION_SHOW) : null;
        if (show != null) {
          int showAsAction = MenuItem.SHOW_AS_ACTION_NEVER;
          if ("always".equals(show)) {
            showAsAction = MenuItem.SHOW_AS_ACTION_ALWAYS;
          } else if ("ifRoom".equals(show)) {
            showAsAction = MenuItem.SHOW_AS_ACTION_IF_ROOM;
          }
          if (action.hasKey(PROP_ACTION_SHOW_WITH_TEXT) &&
              action.getBoolean(PROP_ACTION_SHOW_WITH_TEXT)) {
            showAsAction = showAsAction | MenuItem.SHOW_AS_ACTION_WITH_TEXT;
          }
          item.setShowAsAction(showAsAction);
        }
      }
    }
  }

  private static int[] getDefaultColors(Context context) {
    Resources.Theme theme = context.getTheme();
    TypedArray toolbarStyle = null;
    TypedArray textAppearances = null;
    TypedArray titleTextAppearance = null;
    TypedArray subtitleTextAppearance = null;

    try {
      toolbarStyle = theme
          .obtainStyledAttributes(new int[]{R.attr.toolbarStyle});
      int toolbarStyleResId = toolbarStyle.getResourceId(0, 0);
      textAppearances = theme.obtainStyledAttributes(
          toolbarStyleResId, new int[]{
              R.attr.titleTextAppearance,
              R.attr.subtitleTextAppearance,
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

  private static int getDrawableResourceByName(Context context, String name) {
    name = name.toLowerCase().replace("-", "_");
    return context.getResources().getIdentifier(
        name,
        "drawable",
        context.getPackageName());
  }

}
