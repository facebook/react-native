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

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

import javax.annotation.Nullable;

/**
 * Instance of {@link ViewManager} that provides native {@link ViewPager} view.
 */
public class ReactViewPagerManager
    extends ViewGroupManager<ReactViewPager>
    implements ReactViewPagerCommandHelper.PagerCommandHandler<ReactViewPager> {

  private static final String REACT_CLASS = "AndroidViewPager";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ReactViewPager createViewInstance(ThemedReactContext reactContext) {
    return new ReactViewPager(reactContext);
  }

  @Override
  public boolean needsCustomLayoutForChildren() {
    return true;
  }


  @Override
  public @Nullable Map<String, Integer> getCommandsMap() {
    return ReactViewPagerCommandHelper.getCommandsMap();
  }

  @Override
  public void receiveCommand(
      ReactViewPager viewPager,
      int commandId,
      @Nullable ReadableArray args) {
    ReactViewPagerCommandHelper.receiveCommand(this, viewPager, commandId, args);
  }

  @Override
  public void setPage(
      ReactViewPager viewPager,
      int page) {
    viewPager.setCurrentItemFromJs(page, true);
  }

  @Override
  public void setPageWithoutAnimation(
      ReactViewPager viewPager,
      int page) {
    viewPager.setCurrentItemFromJs(page, false);
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

  @Override
  public int getChildCount(ReactViewPager parent) {
    return parent.getViewCountInAdapter();
  }

  @Override
  public View getChildAt(ReactViewPager parent, int index) {
    return parent.getViewFromAdapter(index);
  }

  @Override
  public void removeViewAt(ReactViewPager parent, int index) {
    parent.removeViewFromAdapter(index);
  }
}
