/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.common;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.R;

/** Class containing static methods involving manipulations of Views */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ViewUtils {

  /**
   * Returns value of testId for the given view, if present
   *
   * @param view View to get the testId value for
   * @return the value of testId if defined for the view, otherwise null
   */
  public static @Nullable String getTestId(@Nullable View view) {
    if (view == null) {
      return null;
    }
    Object tag = view.getTag(R.id.react_test_id);
    if (tag instanceof String) {
      return (String) tag;
    } else {
      return null;
    }
  }
}
