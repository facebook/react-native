/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.scroll;

import javax.annotation.Nullable;

import android.graphics.Color;
import android.view.View;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ReactClippingViewGroupHelper;

/**
 * View manager for {@link ReactHorizontalScrollView} components.
 *
 * <p>Note that {@link ReactScrollView} and {@link ReactHorizontalScrollView} are exposed to JS
 * as a single ScrollView component, configured via the {@code horizontal} boolean property.
 */
@ReactModule(name = ReactHorizontalScrollViewManager.REACT_CLASS)
public class ReactHorizontalScrollViewManager
    extends ViewGroupManager<ReactHorizontalScrollView>
    implements ReactScrollViewCommandHelper.ScrollCommandHandler<ReactHorizontalScrollView> {

  protected static final String REACT_CLASS = "AndroidHorizontalScrollView";

  private @Nullable FpsListener mFpsListener = null;

  public ReactHorizontalScrollViewManager() {
    this(null);
  }

  public ReactHorizontalScrollViewManager(@Nullable FpsListener fpsListener) {
    mFpsListener = fpsListener;
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactHorizontalScrollView createViewInstance(ThemedReactContext context) {
    return new ReactHorizontalScrollView(context, mFpsListener);
  }

  @ReactProp(name = "scrollEnabled", defaultBoolean = true)
  public void setScrollEnabled(ReactHorizontalScrollView view, boolean value) {
    view.setScrollEnabled(value);
  }

  @ReactProp(name = "showsHorizontalScrollIndicator")
  public void setShowsHorizontalScrollIndicator(ReactHorizontalScrollView view, boolean value) {
    view.setHorizontalScrollBarEnabled(value);
  }

  @ReactProp(name = ReactClippingViewGroupHelper.PROP_REMOVE_CLIPPED_SUBVIEWS)
  public void setRemoveClippedSubviews(ReactHorizontalScrollView view, boolean removeClippedSubviews) {
    view.setRemoveClippedSubviews(removeClippedSubviews);
  }

  /**
   * Computing momentum events is potentially expensive since we post a runnable on the UI thread
   * to see when it is done.  We only do that if {@param sendMomentumEvents} is set to true.  This
   * is handled automatically in js by checking if there is a listener on the momentum events.
   *
   * @param view
   * @param sendMomentumEvents
   */
  @ReactProp(name = "sendMomentumEvents")
  public void setSendMomentumEvents(ReactHorizontalScrollView view, boolean sendMomentumEvents) {
    view.setSendMomentumEvents(sendMomentumEvents);
  }

  /**
   * Tag used for logging scroll performance on this scroll view. Will force momentum events to be
   * turned on (see setSendMomentumEvents).
   *
   * @param view
   * @param scrollPerfTag
   */
  @ReactProp(name = "scrollPerfTag")
  public void setScrollPerfTag(ReactHorizontalScrollView view, String scrollPerfTag) {
    view.setScrollPerfTag(scrollPerfTag);
  }

  @ReactProp(name = "pagingEnabled")
  public void setPagingEnabled(ReactHorizontalScrollView view, boolean pagingEnabled) {
    view.setPagingEnabled(pagingEnabled);
  }

  /**
   * Controls overScroll behaviour
   */
  @ReactProp(name = "overScrollMode")
  public void setOverScrollMode(ReactHorizontalScrollView view, String value) {
    view.setOverScrollMode(ReactScrollViewHelper.parseOverScrollMode(value));
  }

  @Override
  public void receiveCommand(
      ReactHorizontalScrollView scrollView,
      int commandId,
      @Nullable ReadableArray args) {
    ReactScrollViewCommandHelper.receiveCommand(this, scrollView, commandId, args);
  }

  @Override
  public void scrollTo(
      ReactHorizontalScrollView scrollView,
      ReactScrollViewCommandHelper.ScrollToCommandData data) {
    if (data.mAnimated) {
      scrollView.smoothScrollTo(data.mDestX, data.mDestY);
    } else {
      scrollView.scrollTo(data.mDestX, data.mDestY);
    }
  }

  @Override
  public void scrollToEnd(
      ReactHorizontalScrollView scrollView,
      ReactScrollViewCommandHelper.ScrollToEndCommandData data) {
    // ScrollView always has one child - the scrollable area
    int right =
      scrollView.getChildAt(0).getWidth() + scrollView.getPaddingRight();
    if (data.mAnimated) {
      scrollView.smoothScrollTo(right, scrollView.getScrollY());
    } else {
      scrollView.scrollTo(right, scrollView.getScrollY());
    }
  }

  /**
   * When set, fills the rest of the scrollview with a color to avoid setting a background and
   * creating unnecessary overdraw.
   * @param view
   * @param color
   */
  @ReactProp(name = "endFillColor", defaultInt = Color.TRANSPARENT, customType = "Color")
  public void setBottomFillColor(ReactHorizontalScrollView view, int color) {
    view.setEndFillColor(color);
  }
}
