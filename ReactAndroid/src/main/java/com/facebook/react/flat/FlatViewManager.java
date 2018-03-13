/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
