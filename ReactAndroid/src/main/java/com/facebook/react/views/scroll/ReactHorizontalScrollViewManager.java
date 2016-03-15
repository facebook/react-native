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

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.views.view.ReactClippingViewGroupHelper;

/**
 * View manager for {@link ReactHorizontalScrollView} components.
 *
 * <p>Note that {@link ReactScrollView} and {@link ReactHorizontalScrollView} are exposed to JS
 * as a single ScrollView component, configured via the {@code horizontal} boolean property.
 */
public class ReactHorizontalScrollViewManager
    extends ViewGroupManager<ReactHorizontalScrollView>
    implements ReactScrollViewCommandHelper.ScrollCommandHandler<ReactHorizontalScrollView> {

  private static final String REACT_CLASS = "AndroidHorizontalScrollView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactHorizontalScrollView createViewInstance(ThemedReactContext context) {
    return new ReactHorizontalScrollView(context);
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
}
