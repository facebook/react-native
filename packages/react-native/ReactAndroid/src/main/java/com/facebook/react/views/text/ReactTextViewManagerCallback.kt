/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.text.Spannable

/**
 * This interface allows clients of [ReactTextViewManager] to customize or prepare [Spannable]
 * object that represent text that will be rendered on the screen.
 */
public fun interface ReactTextViewManagerCallback {

  /**
   * Callback executed right after the [Spannable] object is created by React.
   *
   * This callback can be used by different implementations of ReactTextViewManager to customize or
   * extend the [Spannable] created by React.
   */
  public fun onPostProcessSpannable(text: Spannable)
}
