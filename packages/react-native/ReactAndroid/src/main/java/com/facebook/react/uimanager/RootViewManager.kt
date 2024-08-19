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
public class RootViewManager : ViewGroupManager<ViewGroup>() {

  override public fun getName(): String = REACT_CLASS

  override protected fun createViewInstance(reactContext: ThemedReactContext): ViewGroup =
      FrameLayout(reactContext)

  public companion object {
    public const val REACT_CLASS: String = "RootView"
  }
}
