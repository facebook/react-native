// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.views.scroll;

import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

/** View manager for {@link ReactHorizontalScrollContainerView} components. */
@ReactModule(name = ReactHorizontalScrollContainerViewManager.REACT_CLASS)
public class ReactHorizontalScrollContainerViewManager
    extends ViewGroupManager<ReactHorizontalScrollContainerView> {

  protected static final String REACT_CLASS = "AndroidHorizontalScrollContentView";

  public ReactHorizontalScrollContainerViewManager() {}

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ReactHorizontalScrollContainerView createViewInstance(ThemedReactContext context) {
    return new ReactHorizontalScrollContainerView(context);
  }
}
