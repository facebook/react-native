// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.recyclerview;

import android.view.View;

import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

/**
 * View manager for {@link RecyclerViewBackedScrollView}.
 */
public class RecyclerViewBackedScrollViewManager extends
    ViewGroupManager<RecyclerViewBackedScrollView> {

  private static final String REACT_CLASS = "AndroidRecyclerViewBackedScrollView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  // TODO(8624925): Implement removeClippedSubviews support for native ListView

  @Override
  protected RecyclerViewBackedScrollView createViewInstance(ThemedReactContext reactContext) {
    return new RecyclerViewBackedScrollView(reactContext);
  }

  @Override
  public void addView(RecyclerViewBackedScrollView parent, View child, int index) {
    parent.addViewToAdapter(child, index);
  }

  @Override
  public int getChildCount(RecyclerViewBackedScrollView parent) {
    return parent.getChildCountFromAdapter();
  }

  @Override
  public View getChildAt(RecyclerViewBackedScrollView parent, int index) {
    return parent.getChildAtFromAdapter(index);
  }

  @Override
  public void removeView(RecyclerViewBackedScrollView parent, View child) {
    parent.removeViewFromAdapter(child);
  }
}
