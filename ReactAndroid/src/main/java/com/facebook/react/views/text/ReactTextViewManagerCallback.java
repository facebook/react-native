/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.Spannable;

/**
 * This interface allows clients of {@link ReactTextViewManager} to customize or prepare {@link
 * Spannable} object that represent text that will be rendered on the screen.
 */
public interface ReactTextViewManagerCallback {

  /**
   * Callback executed right after the {@link Spannable} object is created by React.
   *
   * <p>This callback can be used by different implementations of ReactTextViewManager to customize
   * Spannable or extend managed created by React.
   */
  void onPostProcessSpannable(Spannable text);
}
