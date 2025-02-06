/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.modal

import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.ReactShadowNodeImpl
import com.facebook.react.views.modal.ModalHostHelper.getModalHostSize

/**
 * We implement the Modal by using an Android Dialog. That will fill the entire window of the
 * application. To get layout to work properly, we need to layout all the elements within the
 * Modal's inner content view as if they can fill the entire window. To do that, we need to
 * explicitly set the styleWidth and styleHeight on the LayoutShadowNode of the child of this node
 * to be the window size. This will then cause the children of the Modal to layout as if they can
 * fill the window.
 */
internal class ModalHostShadowNode : LayoutShadowNode() {
  /**
   * We need to set the styleWidth and styleHeight of the one child (represented by the
   * <View></View> within the <RCTModalHostView></RCTModalHostView> in Modal.js. This needs to fill
   * the entire window.
   */
  override fun addChildAt(child: ReactShadowNodeImpl, i: Int) {
    super.addChildAt(child, i)
    val modalSize = getModalHostSize(themedContext)
    child.setStyleWidth(modalSize.x.toFloat())
    child.setStyleHeight(modalSize.y.toFloat())
  }
}
