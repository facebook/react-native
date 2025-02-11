/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.content.Context
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.views.view.ReactViewGroup

/**
 * Used by legacy/Paper renderer to perform offsetting of scroll content when the app-wide layout
 * direction is RTL. Contextually set layout direction is not respected by legacy renderer.
 */
internal class ReactHorizontalScrollContainerLegacyView(context: Context) :
    ReactViewGroup(context) {
  private val isRTL: Boolean = I18nUtil.instance.isRTL(context)

  override fun setRemoveClippedSubviews(removeClippedSubviews: Boolean) {
    // removeClippedSubviews logic may read metrics before the offsetting we do in onLayout() and is
    // such unsafe
    if (isRTL) {
      super.setRemoveClippedSubviews(false)
      return
    }

    super.setRemoveClippedSubviews(removeClippedSubviews)
  }

  protected override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    if (isRTL) {
      // When the layout direction is RTL, we expect Yoga to give us a layout
      // that extends off the screen to the left so we re-center it with left=0
      val newLeft = 0
      val width = right - left
      val newRight = newLeft + width
      setLeft(newLeft)
      setTop(top)
      setRight(newRight)
      setBottom(bottom)
    }
  }
}
