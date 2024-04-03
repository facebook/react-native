/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.common

import android.view.View
import androidx.annotation.Nullable
import com.facebook.react.R

/** Class containing static methods involving manipulations of Views */
public object ViewUtils {

  /**
   * Returns value of testId for the given view, if present
   *
   * @param view View to get the testId value for
   * @return the value of testId if defined for the view, otherwise null
   */
  @Nullable
  public fun getTestId(view: View?): String? {
    if (view == null) {
      return null
    }
    val tag = view.getTag(R.id.react_test_id)
    return (tag as? String)
  }
}
