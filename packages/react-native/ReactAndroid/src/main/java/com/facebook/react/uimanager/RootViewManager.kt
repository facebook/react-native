/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.ViewGroup
import android.widget.FrameLayout

/** View manager for ReactRootView components. */
internal class RootViewManager : ViewGroupManager<ViewGroup>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): ViewGroup =
      FrameLayout(reactContext)

  companion object {
    const val REACT_CLASS: String = "RootView"
  }
}
