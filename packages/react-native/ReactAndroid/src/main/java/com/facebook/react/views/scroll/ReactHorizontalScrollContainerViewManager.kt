/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager

/** View manager for [ReactHorizontalScrollContainerView] components. */
@ReactModule(name = ReactHorizontalScrollContainerViewManager.REACT_CLASS)
public class ReactHorizontalScrollContainerViewManager : ReactViewManager() {
  public override fun getName(): String = REACT_CLASS

  protected override fun createViewInstance(
      reactTag: Int,
      context: ThemedReactContext,
      initialProps: ReactStylesDiffMap?,
      stateWrapper: StateWrapper?
  ): ReactViewGroup {
    check(uiManagerType == null)
    uiManagerType = ViewUtil.getUIManagerType(reactTag)
    val view = super.createViewInstance(reactTag, context, initialProps, stateWrapper)
    uiManagerType = null
    return view
  }

  public override fun createViewInstance(context: ThemedReactContext): ReactViewGroup {
    return when (checkNotNull(uiManagerType)) {
      UIManagerType.FABRIC -> ReactViewGroup(context)
      else -> ReactHorizontalScrollContainerLegacyView(context)
    }
  }

  public companion object {
    public const val REACT_CLASS: String = "AndroidHorizontalScrollContentView"
    @UIManagerType private var uiManagerType: Int? = null
  }
}
