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
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

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

  @ReactProp(name = "showsHorizontalScrollIndicator")
  public void setShowsHorizontalScrollIndicator(ReactHorizontalScrollView view, boolean value) {
    view.setHorizontalScrollBarEnabled(value);
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
    scrollView.smoothScrollTo(data.mDestX, data.mDestY);
  }

  @Override
  public void scrollWithoutAnimationTo(
      ReactHorizontalScrollView scrollView,
      ReactScrollViewCommandHelper.ScrollToCommandData data) {
    scrollView.scrollTo(data.mDestX, data.mDestY);
  }
}
