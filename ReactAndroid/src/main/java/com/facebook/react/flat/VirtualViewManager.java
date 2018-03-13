/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
