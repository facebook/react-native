/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.text

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.uimanager.ReactShadowNodeImpl
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * [com.facebook.react.uimanager.ReactShadowNode] class for pure raw text node (aka `textContent` in
 * terms of DOM). Raw text node can only have simple string value without any attributes, properties
 * or state.
 */
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
internal class ReactRawTextShadowNode : ReactShadowNodeImpl() {
  @set:ReactProp(name = "text")
  var text: String? = null
    set(value) {
      field = value
      markUpdated()
    }

  override fun isVirtual(): Boolean = true

  override fun toString(): String = "$viewClass [text: $text]"
}
