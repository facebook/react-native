/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.view.View;

/**
 * A partial implementation of {@link ViewManager} that applies common properties such as background
 * color, opacity and CSS layout. Implementations should make sure to call
 * {@code super.updateView()} in order for these properties to be applied.
 *
 * @param <T> the view handled by this manager
 */
public abstract class SimpleViewManager<T extends View> extends ViewManager<T, ReactShadowNode> {

  @Override
  public ReactShadowNode createCSSNodeInstance() {
    return new ReactShadowNode();
  }

  @Override
  public void updateView(T root, CatalystStylesDiffMap props) {
    BaseViewPropertyApplicator.applyCommonViewProperties(root, props);
  }

  @Override
  public void updateExtraData(T root, Object extraData) {
  }
}
