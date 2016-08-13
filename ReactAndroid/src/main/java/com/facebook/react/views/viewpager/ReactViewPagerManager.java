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

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

import javax.annotation.Nullable;

/**
 * Instance of {@link ViewManager} that provides native {@link ViewPager} view.
 */
public class ReactViewPagerManager extends ViewGroupManager<ReactViewPager> {

  private static final String REACT_CLASS = "AndroidViewPager";

  public static final int COMMAND_SET_PAGE = 1;
  public static final int COMMAND_SET_PAGE_WITHOUT_ANIMATION = 2;

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ReactViewPager createViewInstance(ThemedReactContext reactContext) {
    return new ReactViewPager(reactContext);
  }


  @ReactProp(name = "scrollEnabled", defaultBoolean = true)
  public void setScrollEnabled(ReactViewPager viewPager, boolean value) {
    viewPager.setScrollEnabled(value);
  }

  @Override
  public boolean needsCustomLayoutForChildren() {
    return true;
  }

  @Override
  public Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
        PageScrollEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageScroll"),
        PageScrollStateChangedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageScrollStateChanged"),
        PageSelectedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageSelected")
    );
  }

  @Override
  public Map<String,Integer> getCommandsMap() {
    return MapBuilder.of(
        "setPage",
        COMMAND_SET_PAGE,
        "setPageWithoutAnimation",
        COMMAND_SET_PAGE_WITHOUT_ANIMATION);
  }

  @Override
  public void receiveCommand(
      ReactViewPager viewPager,
      int commandType,
      @Nullable ReadableArray args) {
    Assertions.assertNotNull(viewPager);
    Assertions.assertNotNull(args);
    switch (commandType) {
      case COMMAND_SET_PAGE: {
        viewPager.setCurrentItemFromJs(args.getInt(0), true);
        return;
      }
      case COMMAND_SET_PAGE_WITHOUT_ANIMATION: {
        viewPager.setCurrentItemFromJs(args.getInt(0), false);
        return;
      }
      default:
        throw new IllegalArgumentException(String.format(
            "Unsupported command %d received by %s.",
            commandType,
            getClass().getSimpleName()));
    }
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

  @ReactProp(name = "pageMargin", defaultFloat = 0)
  public void setPageMargin(ReactViewPager pager, float margin) {
    pager.setPageMargin((int) PixelUtil.toPixelFromDIP(margin));
  }
}
