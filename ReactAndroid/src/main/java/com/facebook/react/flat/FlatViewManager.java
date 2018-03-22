/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

abstract class FlatViewManager extends ViewGroupManager<FlatViewGroup> {

  @Override
  protected FlatViewGroup createViewInstance(ThemedReactContext reactContext) {
    return new FlatViewGroup(reactContext);
  }

  @Override
  public void setBackgroundColor(FlatViewGroup view, int backgroundColor) {
    // suppress
  }

  @Override
  public void removeAllViews(FlatViewGroup parent) {
    parent.removeAllViewsInLayout();
  }
}
