/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import com.facebook.react.uimanager.ReactShadowNodeImpl
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * [ReactShadowNode] class for pure raw text node (aka `textContent` in terms of DOM). Raw text node
 * can only have simple string value without any attributes, properties or state.
 */
public class ReactRawTextShadowNode : ReactShadowNodeImpl() {
  @set:ReactProp(name = "text")
  public var text: String? = null
    set(value) {
      field = value
      markUpdated()
    }

  override fun isVirtual(): Boolean = true

  override fun toString(): String = "$viewClass [text: $text]"
}
