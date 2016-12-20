/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import java.util.List;

import android.view.View;

import com.facebook.react.views.viewpager.ReactViewPager;
import com.facebook.react.views.viewpager.ReactViewPagerManager;

/* package */ class RCTViewPagerManager extends ReactViewPagerManager {

  @Override
  public void addViews(ReactViewPager parent, List<View> views) {
    parent.setViews(views);
  }

  @Override
  public void removeAllViews(ReactViewPager parent) {
    parent.removeAllViewsFromAdapter();
  }
}
