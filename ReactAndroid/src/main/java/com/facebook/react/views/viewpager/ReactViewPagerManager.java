/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.viewpager;

import java.util.Map;

import android.view.View;

import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

/**
 * Instance of {@link ViewManager} that provides native {@link ViewPager} view.
 */
public class ReactViewPagerManager extends ViewGroupManager<ReactViewPager> {

  private static final String REACT_CLASS = "AndroidViewPager";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ReactViewPager createViewInstance(ThemedReactContext reactContext) {
    return new ReactViewPager(reactContext);
  }

  @ReactProp(name = "selectedPage")
  public void setSelectedPage(ReactViewPager view, int page) {
    // TODO(8496821): Handle selectedPage property cleanup correctly, now defaults to 0
    view.setCurrentItemFromJs(page);
  }

  @Override
  public boolean needsCustomLayoutForChildren() {
    return true;
  }

  @Override
  public Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
        PageScrollEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageScroll"),
        PageSelectedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageSelected")
    );
  }

  @Override
  public void addView(ReactViewPager parent, View child, int index) {
    parent.addViewToAdapter(child, index);
  }
}
