/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.timepicker;

import android.app.Dialog;
import android.app.TimePickerDialog.OnTimeSetListener;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnDismissListener;
import android.os.Build;
import android.os.Bundle;
import android.text.format.DateFormat;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;
import java.util.Calendar;
import java.util.Locale;

@SuppressWarnings("ValidFragment")
public class TimePickerDialogFragment extends DialogFragment {

  @Nullable private OnTimeSetListener mOnTimeSetListener;
  @Nullable private OnDismissListener mOnDismissListener;

  @Override
  public Dialog onCreateDialog(Bundle savedInstanceState) {
    final Bundle args = getArguments();
    return createDialog(args, getActivity(), mOnTimeSetListener);
  }

  /*package*/ static Dialog createDialog(
      Bundle args, Context activityContext, @Nullable OnTimeSetListener onTimeSetListener) {
    final Calendar now = Calendar.getInstance();
    int hour = now.get(Calendar.HOUR_OF_DAY);
    int minute = now.get(Calendar.MINUTE);
    boolean is24hour = DateFormat.is24HourFormat(activityContext);

    TimePickerMode mode = TimePickerMode.DEFAULT;
    if (args != null && args.getString(TimePickerDialogModule.ARG_MODE, null) != null) {
      mode =
          TimePickerMode.valueOf(
              args.getString(TimePickerDialogModule.ARG_MODE).toUpperCase(Locale.US));
    }

    if (args != null) {
      hour = args.getInt(TimePickerDialogModule.ARG_HOUR, now.get(Calendar.HOUR_OF_DAY));
      minute = args.getInt(TimePickerDialogModule.ARG_MINUTE, now.get(Calendar.MINUTE));
      is24hour =
          args.getBoolean(
              TimePickerDialogModule.ARG_IS24HOUR, DateFormat.is24HourFormat(activityContext));
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      if (mode == TimePickerMode.CLOCK) {
        return new DismissableTimePickerDialog(
            activityContext,
            activityContext
                .getResources()
                .getIdentifier("ClockTimePickerDialog", "style", activityContext.getPackageName()),
            onTimeSetListener,
            hour,
            minute,
            is24hour);
      } else if (mode == TimePickerMode.SPINNER) {
        return new DismissableTimePickerDialog(
            activityContext,
            activityContext
                .getResources()
                .getIdentifier(
                    "SpinnerTimePickerDialog", "style", activityContext.getPackageName()),
            onTimeSetListener,
            hour,
            minute,
            is24hour);
      }
    }
    return new DismissableTimePickerDialog(
        activityContext, onTimeSetListener, hour, minute, is24hour);
  }

  @Override
  public void onDismiss(DialogInterface dialog) {
    super.onDismiss(dialog);
    if (mOnDismissListener != null) {
      mOnDismissListener.onDismiss(dialog);
    }
  }

  public void setOnDismissListener(@Nullable OnDismissListener onDismissListener) {
    mOnDismissListener = onDismissListener;
  }

  public void setOnTimeSetListener(@Nullable OnTimeSetListener onTimeSetListener) {
    mOnTimeSetListener = onTimeSetListener;
  }
}
