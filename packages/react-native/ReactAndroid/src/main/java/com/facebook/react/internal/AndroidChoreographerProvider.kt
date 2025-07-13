/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal

import com.facebook.react.bridge.UiThreadUtil

/** An implementation of ChoreographerProvider that directly uses android.view.Choreographer. */
internal object AndroidChoreographerProvider : ChoreographerProvider {

  private class AndroidChoreographer : ChoreographerProvider.Choreographer {
    private val instance: android.view.Choreographer = android.view.Choreographer.getInstance()

    override fun postFrameCallback(callback: android.view.Choreographer.FrameCallback) {
      instance.postFrameCallback(callback)
    }

    override fun removeFrameCallback(callback: android.view.Choreographer.FrameCallback) {
      instance.removeFrameCallback(callback)
    }
  }

  @JvmStatic fun getInstance(): AndroidChoreographerProvider = this

  override fun getChoreographer(): ChoreographerProvider.Choreographer {
    UiThreadUtil.assertOnUiThread()
    return AndroidChoreographer()
  }
}
