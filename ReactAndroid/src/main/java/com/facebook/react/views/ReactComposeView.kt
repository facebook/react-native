/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views

import android.content.Context
import android.util.AttributeSet
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.platform.AbstractComposeView

open class ReactComposeView
@JvmOverloads
constructor(context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0) :
    AbstractComposeView(context, attrs, defStyleAttr) {

  private val content = mutableStateOf<(@Composable () -> Unit)?>(null)

  @Suppress("RedundantVisibilityModifier")
  protected override var shouldCreateCompositionOnAttachedToWindow: Boolean = false
  // private set

  @Composable
  override fun Content() {
    content.value?.invoke()
  }

  override fun getAccessibilityClassName(): CharSequence {
    return javaClass.name
  }

  /**
   * Set the Jetpack Compose UI content for this view. Initial composition will occur when the view
   * becomes attached to a window or when [createComposition] is called, whichever comes first.
   */
  fun setContent(content: @Composable () -> Unit) {
    shouldCreateCompositionOnAttachedToWindow = true
    this.content.value = content
    if (isAttachedToWindow) {
      createComposition()
    }
  }
}
