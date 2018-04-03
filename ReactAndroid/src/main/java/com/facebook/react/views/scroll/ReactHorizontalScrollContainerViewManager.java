// Copyright 2004-present Facebook. All Rights Reserved.

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
