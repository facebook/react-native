/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.textinput

import com.facebook.react.common.annotations.LegacyArchitectureShadowNodeWithCxxImpl
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIViewOperationQueue
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.text.ReactBaseTextShadowNode
import com.facebook.react.views.text.ReactTextViewManagerCallback
import com.facebook.yoga.YogaMeasureFunction
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaNode

@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@LegacyArchitectureShadowNodeWithCxxImpl
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
internal class ReactTextInputShadowNode
@JvmOverloads
constructor(reactTextViewManagerCallback: ReactTextViewManagerCallback? = null) :
    ReactBaseTextShadowNode(reactTextViewManagerCallback), YogaMeasureFunction {

  @Suppress("UNUSED_PARAMETER")
  @set:ReactProp(name = PROP_TEXT)
  var text: String? = null
    set(_) {
      error(
          "ReactTextInputShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
      )
    }

  @Suppress("UNUSED_PARAMETER")
  @set:ReactProp(name = PROP_PLACEHOLDER)
  var placeholder: String? = null
    set(_) {
      error(
          "ReactTextInputShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
      )
    }

  @Suppress("UNUSED_PARAMETER")
  override fun setThemedContext(themedContext: ThemedReactContext) {
    error(
        "ReactTextInputShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  override fun measure(
      node: YogaNode,
      width: Float,
      widthMode: YogaMeasureMode,
      height: Float,
      heightMode: YogaMeasureMode,
  ): Long {
    error(
        "ReactTextInputShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  override fun isVirtualAnchor(): Boolean {
    error(
        "ReactTextInputShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  override fun isYogaLeafNode(): Boolean {
    error(
        "ReactTextInputShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  override fun setLocalData(data: Any) {
    error(
        "ReactTextInputShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = "mostRecentEventCount")
  public fun setMostRecentEventCount(mostRecentEventCount: Int) {
    error(
        "ReactTextInputShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  override fun setTextBreakStrategy(textBreakStrategy: String?) {
    error(
        "ReactTextInputShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  override fun onCollectExtraUpdates(uiViewOperationQueue: UIViewOperationQueue) {
    error(
        "ReactTextInputShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  override fun setPadding(spacingType: Int, padding: Float) {
    error(
        "ReactTextInputShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  companion object {
    const val PROP_TEXT: String = "text"

    const val PROP_PLACEHOLDER: String = "placeholder"

    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "ReactTextInputShadowNode",
          LegacyArchitectureLogLevel.ERROR,
      )
    }
  }
}
