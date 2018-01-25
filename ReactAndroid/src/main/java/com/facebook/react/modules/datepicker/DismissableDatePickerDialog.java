/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.datepicker;

import android.app.DatePickerDialog;
import javax.annotation.Nullable;

import android.app.DatePickerDialog;
import android.content.Context;
import android.os.Build;

/**
 * <p>
 *   Certain versions of Android (Jellybean-KitKat) have a bug where when dismissed, the
 *   {@link DatePickerDialog} still calls the OnDateSetListener. This class works around that issue.
 * </p>
 *
 * <p>
 *   See: <a href="https://code.google.com/p/android/issues/detail?id=34833">Issue 34833</a>
 * </p>
 */
public class DismissableDatePickerDialog extends DatePickerDialog {

  public DismissableDatePickerDialog(
      Context context,
      @Nullable DatePickerDialog.OnDateSetListener callback,
      int year,
      int monthOfYear,
      int dayOfMonth) {
    super(context, callback, year, monthOfYear, dayOfMonth);
  }

  public DismissableDatePickerDialog(
      Context context,
      int theme,
      @Nullable DatePickerDialog.OnDateSetListener callback,
      int year,
      int monthOfYear,
      int dayOfMonth) {
    super(context, theme, callback, year, monthOfYear, dayOfMonth);
  }

  @Override
  protected void onStop() {
    // do *not* call super.onStop() on KitKat on lower, as that would erroneously call the
    // OnDateSetListener when the dialog is dismissed, or call it twice when "OK" is pressed.
    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.KITKAT) {
      super.onStop();
    }
  }
}
