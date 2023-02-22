/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.View;

/**
 * Common base class for most of the {@link ViewManager}s. It provides support for most common
 * properties through extending {@link BaseViewManager}. It also reduces boilerplate by specifying
 * the type of shadow node to be {@link ReactShadowNode} and providing default, empty implementation
 * for some of the methods of {@link ViewManager} interface.
 *
 * @param <T> the view handled by this manager
 */
public abstract class SimpleViewManager<T extends View>
    extends BaseViewManager<T, LayoutShadowNode> {

  @Override
  public LayoutShadowNode createShadowNodeInstance() {
    return new LayoutShadowNode();
  }

  @Override
  public Class<LayoutShadowNode> getShadowNodeClass() {
    return LayoutShadowNode.class;
  }

  @Override
  public void updateExtraData(T root, Object extraData) {}
}
