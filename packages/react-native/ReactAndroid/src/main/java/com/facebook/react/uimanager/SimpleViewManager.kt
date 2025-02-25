/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View

/**
 * Common base class for most of the [ViewManager]s. It provides support for most common properties
 * through extending [BaseViewManager]. It also reduces boilerplate by specifying the type of shadow
 * node to be [ReactShadowNode] and providing default, empty implementation for some of the methods
 * of [ViewManager] interface.
 *
 * @param <T> the view handled by this manager
 */
public abstract class SimpleViewManager<T : View> : BaseViewManager<T, LayoutShadowNode>() {

  public override fun createShadowNodeInstance(): LayoutShadowNode {
    return LayoutShadowNode()
  }

  public override fun getShadowNodeClass(): Class<LayoutShadowNode> {
    return LayoutShadowNode::class.java
  }

  public override fun updateExtraData(root: T, extraData: Any?): Unit = Unit
}
