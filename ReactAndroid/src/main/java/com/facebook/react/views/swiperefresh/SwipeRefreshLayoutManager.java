/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.swiperefresh;

import javax.annotation.Nullable;

import java.util.Map;

import android.graphics.Color;
import android.support.v4.widget.SwipeRefreshLayout;
import android.support.v4.widget.SwipeRefreshLayout.OnRefreshListener;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;

import static com.facebook.react.views.swiperefresh.SwipeRefreshLayoutManager.REACT_CLASS;

/**
 * ViewManager for {@link ReactSwipeRefreshLayout} which allows the user to "pull to refresh" a
 * child view. Emits an {@code onRefresh} event when this happens.
 */
@ReactModule(name = REACT_CLASS)
public class SwipeRefreshLayoutManager extends ViewGroupManager<ReactSwipeRefreshLayout> {

  protected static final String REACT_CLASS = "AndroidSwipeRefreshLayout";

  @Override
  protected ReactSwipeRefreshLayout createViewInstance(ThemedReactContext reactContext) {
    return new ReactSwipeRefreshLayout(reactContext);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
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
  public void setRefreshing(ReactSwipeRefreshLayout view, boolean refreshing) {
    view.setRefreshing(refreshing);
  }

  @ReactProp(name = "progressViewOffset", defaultFloat = 0)
  public void setProgressViewOffset(final ReactSwipeRefreshLayout view, final float offset) {
    view.setProgressViewOffset(offset);
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
                .dispatchEvent(new RefreshEvent(view.getId()));
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
