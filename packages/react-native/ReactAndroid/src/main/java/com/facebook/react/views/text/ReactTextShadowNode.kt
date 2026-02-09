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
import com.facebook.react.uimanager.NativeViewHierarchyOptimizer
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.UIViewOperationQueue
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * [ReactBaseTextShadowNode] concrete class for anchor `Text` node.
 *
 * The class measures text in `<Text>` view and feeds native [TextView] using [Spannable] object
 * constructed in superclass.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
public class ReactTextShadowNode
@JvmOverloads
public constructor(reactTextViewManagerCallback: ReactTextViewManagerCallback? = null) :
    ReactBaseTextShadowNode(reactTextViewManagerCallback) {

  override fun isVirtualAnchor(): Boolean {
    error(
        "ReactTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  override fun hoistNativeChildren(): Boolean {
    error(
        "ReactTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  override fun markUpdated() {
    error(
        "ReactTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  override fun onBeforeLayout(nativeViewHierarchyOptimizer: NativeViewHierarchyOptimizer) {
    error(
        "ReactTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  override fun onCollectExtraUpdates(uiViewOperationQueue: UIViewOperationQueue) {
    error(
        "ReactTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  @Suppress("UNUSED_PARAMETER")
  @ReactProp(name = "onTextLayout")
  public fun setShouldNotifyOnTextLayout(shouldNotifyOnTextLayout: Boolean) {
    error(
        "ReactTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }

  override fun calculateLayoutOnChildren(): Iterable<ReactShadowNode<*>?>? {
    error(
        "ReactTextShadowNode methods are unsupported, and the ShadowNode will be fully removed in a future version of React Native."
    )
  }
}
