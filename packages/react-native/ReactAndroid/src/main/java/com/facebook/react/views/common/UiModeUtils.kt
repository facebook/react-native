/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.common

import android.content.Context
import android.content.res.Configuration

/** Utility object providing static methods for working with UI mode properties from Context. */
internal object UiModeUtils {

  /**
   * Determines whether the current UI mode is dark mode
   *
   * @param context The context to check the UI mode from
   * @return true if the current UI mode is dark mode, false otherwise
   */
  @JvmStatic
  fun isDarkMode(context: Context): Boolean =
      context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK ==
          Configuration.UI_MODE_NIGHT_YES
}
