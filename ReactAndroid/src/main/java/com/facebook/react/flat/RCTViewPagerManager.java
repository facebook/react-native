/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import android.view.View;
import com.facebook.react.views.viewpager.ReactViewPager;
import com.facebook.react.views.viewpager.ReactViewPagerManager;

import java.util.List;

public class RCTViewPagerManager extends ReactViewPagerManager {

  /* package */ static final String REACT_CLASS = ReactViewPagerManager.REACT_CLASS;

  @Override
  public void addViews(ReactViewPager parent, List<View> views) {
    parent.setViews(views);
  }

  @Override
  public void removeAllViews(ReactViewPager parent) {
    parent.removeAllViewsFromAdapter();
  }
}
