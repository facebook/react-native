/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.swiperefresh;

import javax.annotation.Nullable;

import java.util.Map;

import android.graphics.Color;
import android.support.v4.widget.SwipeRefreshLayout;
import android.support.v4.widget.SwipeRefreshLayout.OnRefreshListener;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.SystemClock;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * ViewManager for {@link ReactSwipeRefreshLayout} which allows the user to "pull to refresh" a
 * child view. Emits an {@code onRefresh} event when this happens.
 */
public class SwipeRefreshLayoutManager extends ViewGroupManager<ReactSwipeRefreshLayout> {

  @Override
  protected ReactSwipeRefreshLayout createViewInstance(ThemedReactContext reactContext) {
    return new ReactSwipeRefreshLayout(reactContext);
  }

  @Override
  public String getName() {
    return "AndroidSwipeRefreshLayout";
  }

  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  public void setEnabled(ReactSwipeRefreshLayout view, boolean enabled) {
    view.setEnabled(enabled);
  }

  @ReactProp(name = "colors", customType = "ColorArray")
  public void setColors(ReactSwipeRefreshLayout view, @Nullable ReadableArray colors) {
    if (colors != null) {
      int[] colorValues = new int[colors.size()];
      for (int i = 0; i < colors.size(); i++) {
        colorValues[i] = colors.getInt(i);
      }
      view.setColorSchemeColors(colorValues);
    } else {
      view.setColorSchemeColors();
    }
  }

  @ReactProp(name = "progressBackgroundColor", defaultInt = Color.TRANSPARENT, customType = "Color")
  public void setProgressBackgroundColor(ReactSwipeRefreshLayout view, int color) {
    view.setProgressBackgroundColorSchemeColor(color);
  }

  @ReactProp(name = "size", defaultInt = SwipeRefreshLayout.DEFAULT)
  public void setSize(ReactSwipeRefreshLayout view, int size) {
    view.setSize(size);
  }

  @ReactProp(name = "refreshing")
  public void setRefreshing(final ReactSwipeRefreshLayout view, final boolean refreshing) {
    // Use `post` otherwise the control won't start refreshing if refreshing is true when
    // the component gets mounted.
    view.post(new Runnable() {
      @Override
      public void run() {
        view.setRefreshing(refreshing);
      }
    });
  }

  @Override
  protected void addEventEmitters(
      final ThemedReactContext reactContext,
      final ReactSwipeRefreshLayout view) {
    view.setOnRefreshListener(
        new OnRefreshListener() {
          @Override
          public void onRefresh() {
            reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()
                .dispatchEvent(new RefreshEvent(view.getId(), SystemClock.nanoTime()));
          }
        });
  }

  @Nullable
  @Override
  public Map<String, Object> getExportedViewConstants() {
    return MapBuilder.<String, Object>of(
        "SIZE",
        MapBuilder.of("DEFAULT", SwipeRefreshLayout.DEFAULT, "LARGE", SwipeRefreshLayout.LARGE));
  }

  @Override
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
        .put("topRefresh", MapBuilder.of("registrationName", "onRefresh"))
        .build();
  }
}
