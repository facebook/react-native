/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.views.view.ReactViewManager

/** View manager for {@link ReactHorizontalScrollContainerView} components. */
@ReactModule(name = ReactHorizontalScrollContainerViewManager.REACT_CLASS)
public class ReactHorizontalScrollContainerViewManager : ReactViewManager() {
  override public fun getName(): String = REACT_CLASS

  public companion object {
    public const val REACT_CLASS: String = "AndroidHorizontalScrollContentView"
  }
}
