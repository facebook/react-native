/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactClippingViewManager

/** View manager for {@link ReactHorizontalScrollContainerView} components. */
@ReactModule(name = ReactHorizontalScrollContainerViewManager.REACT_CLASS)
public class ReactHorizontalScrollContainerViewManager :
    ReactClippingViewManager<ReactHorizontalScrollContainerView>() {

  override public fun getName(): String = REACT_CLASS

  override public fun createViewInstance(
      context: ThemedReactContext
  ): ReactHorizontalScrollContainerView = ReactHorizontalScrollContainerView(context)

  public companion object {
    public const val REACT_CLASS: String = "AndroidHorizontalScrollContentView"
  }
}
