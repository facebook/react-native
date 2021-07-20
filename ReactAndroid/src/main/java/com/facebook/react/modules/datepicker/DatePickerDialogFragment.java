/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.datepicker;

import android.annotation.SuppressLint;
import android.app.DatePickerDialog;
import android.app.DatePickerDialog.OnDateSetListener;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnDismissListener;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.widget.DatePicker;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;
import java.util.Calendar;
import java.util.Locale;

@SuppressLint("ValidFragment")
public class DatePickerDialogFragment extends DialogFragment {

  /** Minimum date supported by {@link DatePicker}, 01 Jan 1900 */
  private static final long DEFAULT_MIN_DATE = -2208988800001l;

  @Nullable private OnDateSetListener mOnDateSetListener;
  @Nullable private OnDismissListener mOnDismissListener;

  @Override
  public Dialog onCreateDialog(Bundle savedInstanceState) {
    Bundle args = getArguments();
    return createDialog(args, getActivity(), mOnDateSetListener);
  }

  /*package*/ static Dialog createDialog(
      Bundle args, Context activityContext, @Nullable OnDateSetListener onDateSetListener) {
    final Calendar c = Calendar.getInstance();
    if (args != null && args.containsKey(DatePickerDialogModule.ARG_DATE)) {
      c.setTimeInMillis(args.getLong(DatePickerDialogModule.ARG_DATE));
    }
    final int year = c.get(Calendar.YEAR);
    final int month = c.get(Calendar.MONTH);
    final int day = c.get(Calendar.DAY_OF_MONTH);

    DatePickerMode mode = DatePickerMode.DEFAULT;
    if (args != null && args.getString(DatePickerDialogModule.ARG_MODE, null) != null) {
      mode =
          DatePickerMode.valueOf(
              args.getString(DatePickerDialogModule.ARG_MODE).toUpperCase(Locale.US));
    }

    DatePickerDialog dialog = null;

    switch (mode) {
      case CALENDAR:
        dialog =
            new DismissableDatePickerDialog(
                activityContext,
                activityContext
                    .getResources()
                    .getIdentifier(
                        "CalendarDatePickerDialog", "style", activityContext.getPackageName()),
                onDateSetListener,
                year,
                month,
                day);
        break;
      case SPINNER:
        dialog =
            new DismissableDatePickerDialog(
                activityContext,
                android.R.style.Theme_Holo_Light_Dialog,
                onDateSetListener,
                year,
                month,
                day);
        dialog
            .getWindow()
            .setBackgroundDrawable(new ColorDrawable(android.graphics.Color.TRANSPARENT));
        break;
      case DEFAULT:
        dialog =
            new DismissableDatePickerDialog(activityContext, onDateSetListener, year, month, day);
        break;
    }

    final DatePicker datePicker = dialog.getDatePicker();

    if (args != null && args.containsKey(DatePickerDialogModule.ARG_MINDATE)) {
      // Set minDate to the beginning of the day. We need this because of clowniness in datepicker
      // that causes it to throw an exception if minDate is greater than the internal timestamp
      // that it generates from the y/m/d passed in the constructor.
      c.setTimeInMillis(args.getLong(DatePickerDialogModule.ARG_MINDATE));
      c.set(Calendar.HOUR_OF_DAY, 0);
      c.set(Calendar.MINUTE, 0);
      c.set(Calendar.SECOND, 0);
      c.set(Calendar.MILLISECOND, 0);
      datePicker.setMinDate(c.getTimeInMillis());
    } else {
      // This is to work around a bug in DatePickerDialog where it doesn't display a title showing
      // the date under certain conditions.
      datePicker.setMinDate(DEFAULT_MIN_DATE);
    }
    if (args != null && args.containsKey(DatePickerDialogModule.ARG_MAXDATE)) {
      // Set maxDate to the end of the day, same reason as for minDate.
      c.setTimeInMillis(args.getLong(DatePickerDialogModule.ARG_MAXDATE));
      c.set(Calendar.HOUR_OF_DAY, 23);
      c.set(Calendar.MINUTE, 59);
      c.set(Calendar.SECOND, 59);
      c.set(Calendar.MILLISECOND, 999);
      datePicker.setMaxDate(c.getTimeInMillis());
    }

    return dialog;
  }

  @Override
  public void onDismiss(DialogInterface dialog) {
    super.onDismiss(dialog);
    if (mOnDismissListener != null) {
      mOnDismissListener.onDismiss(dialog);
    }
  }

  /*package*/ void setOnDateSetListener(@Nullable OnDateSetListener onDateSetListener) {
    mOnDateSetListener = onDateSetListener;
  }

  /*package*/ void setOnDismissListener(@Nullable OnDismissListener onDismissListener) {
    mOnDismissListener = onDismissListener;
  }
}
