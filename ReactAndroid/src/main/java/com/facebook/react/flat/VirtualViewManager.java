/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import android.view.View;

import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManager;

/**
 * Base class to ViewManagers that don't map to a View.
 */
abstract class VirtualViewManager<C extends FlatShadowNode> extends ViewManager<View, C> {
  @Override
  protected View createViewInstance(ThemedReactContext reactContext) {
    throw new RuntimeException(getName() + " doesn't map to a View");
  }

  @Override
  public void updateExtraData(View root, Object extraData) {
  }
}
