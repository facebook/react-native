/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View

/**
 * Common base class for most of the {@link ViewManager}s. It provides support for most common
 * properties through extending {@link BaseViewManager}. It also reduces boilerplate by specifying
 * the type of shadow node to be {@link ReactShadowNode} and providing default, empty implementation
 * for some of the methods of {@link ViewManager} interface.
 *
 * @param <T> the view handled by this manager
 */
public abstract class SimpleViewManager<T : View> : BaseViewManager<T, LayoutShadowNode>() {

  override public fun createShadowNodeInstance(): LayoutShadowNode {
    return LayoutShadowNode()
  }

  override public fun getShadowNodeClass(): Class<LayoutShadowNode> {
    return LayoutShadowNode::class.java
  }

  override public fun updateExtraData(root: T, extraData: Any?): Unit = Unit
}
