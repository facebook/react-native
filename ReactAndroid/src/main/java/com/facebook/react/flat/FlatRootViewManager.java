/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import android.view.ViewGroup;

import com.facebook.react.uimanager.RootViewManager;

/* package */ class FlatRootViewManager extends RootViewManager {

  @Override
  public void removeAllViews(ViewGroup parent) {
    parent.removeAllViewsInLayout();
  }
}
