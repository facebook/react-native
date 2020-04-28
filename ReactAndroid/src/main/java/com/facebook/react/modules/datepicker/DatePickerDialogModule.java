/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.modules.datepicker;

import android.app.DatePickerDialog.OnDateSetListener;
import android.content.DialogInterface;
import android.content.DialogInterface.OnDismissListener;
import android.os.Bundle;
import android.widget.DatePicker;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;
import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentManager;
import com.facebook.react.bridge.*;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.module.annotations.ReactModule;

/**
 * {@link NativeModule} that allows JS to show a native date picker dialog and get called back when
 * the user selects a date.
 */
@ReactModule(name = DatePickerDialogModule.FRAGMENT_TAG)
public class DatePickerDialogModule extends ReactContextBaseJavaModule {

  @VisibleForTesting public static final String FRAGMENT_TAG = "DatePickerAndroid";

  private static final String ERROR_NO_ACTIVITY = "E_NO_ACTIVITY";

  /* package */ static final String ARG_DATE = "date";
  /* package */ static final String ARG_MINDATE = "minDate";
  /* package */ static final String ARG_MAXDATE = "maxDate";
  /* package */ static final String ARG_MODE = "mode";

  /* package */ static final String ACTION_DATE_SET = "dateSetAction";
  /* package */ static final String ACTION_DISMISSED = "dismissedAction";

  public DatePickerDialogModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public @NonNull String getName() {
    return DatePickerDialogModule.FRAGMENT_TAG;
  }

  private class DatePickerDialogListener implements OnDateSetListener, OnDismissListener {

    private final Promise mPromise;
    private boolean mPromiseResolved = false;

    public DatePickerDialogListener(final Promise promise) {
      mPromise = promise;
    }

    @Override
    public void onDateSet(DatePicker view, int year, int month, int day) {
      if (!mPromiseResolved && getReactApplicationContext().hasActiveCatalystInstance()) {
        WritableMap result = new WritableNativeMap();
        result.putString("action", ACTION_DATE_SET);
        result.putInt("year", year);
        result.putInt("month", month);
        result.putInt("day", day);
        mPromise.resolve(result);
        mPromiseResolved = true;
      }
    }

    @Override
    public void onDismiss(DialogInterface dialog) {
      if (!mPromiseResolved && getReactApplicationContext().hasActiveCatalystInstance()) {
        WritableMap result = new WritableNativeMap();
        result.putString("action", ACTION_DISMISSED);
        mPromise.resolve(result);
        mPromiseResolved = true;
      }
    }
  }

  /**
   * Show a date picker dialog.
   *
   * @param options a map containing options. Available keys are:
   *     <ul>
   *       <li>{@code date} (timestamp in milliseconds) the date to show by default
   *       <li>{@code minDate} (timestamp in milliseconds) the minimum date the user should be
   *           allowed to select
   *       <li>{@code maxDate} (timestamp in milliseconds) the maximum date the user should be
   *           allowed to select
   *       <li>{@code mode} To set the date picker mode to 'calendar/spinner/default'
   *     </ul>
   *
   * @param promise This will be invoked with parameters action, year, month (0-11), day, where
   *     action is {@code dateSetAction} or {@code dismissedAction}, depending on what the user did.
   *     If the action is dismiss, year, month and date are undefined.
   */
  @ReactMethod
  public void open(@Nullable final ReadableMap options, Promise promise) {
    FragmentActivity activity = (FragmentActivity) getCurrentActivity();
    if (activity == null) {
      promise.reject(
          ERROR_NO_ACTIVITY, "Tried to open a DatePicker dialog while not attached to an Activity");
      return;
    }

    FragmentManager fragmentManager = activity.getSupportFragmentManager();
    DialogFragment oldFragment = (DialogFragment) fragmentManager.findFragmentByTag(FRAGMENT_TAG);
    if (oldFragment != null) {
      oldFragment.dismiss();
    }
    DatePickerDialogFragment fragment = new DatePickerDialogFragment();
    if (options != null) {
      final Bundle args = createFragmentArguments(options);
      fragment.setArguments(args);
    }
    final DatePickerDialogListener listener = new DatePickerDialogListener(promise);
    fragment.setOnDismissListener(listener);
    fragment.setOnDateSetListener(listener);
    fragment.show(fragmentManager, FRAGMENT_TAG);
  }

  private Bundle createFragmentArguments(ReadableMap options) {
    final Bundle args = new Bundle();
    if (options.hasKey(ARG_DATE) && !options.isNull(ARG_DATE)) {
      args.putLong(ARG_DATE, (long) options.getDouble(ARG_DATE));
    }
    if (options.hasKey(ARG_MINDATE) && !options.isNull(ARG_MINDATE)) {
      args.putLong(ARG_MINDATE, (long) options.getDouble(ARG_MINDATE));
    }
    if (options.hasKey(ARG_MAXDATE) && !options.isNull(ARG_MAXDATE)) {
      args.putLong(ARG_MAXDATE, (long) options.getDouble(ARG_MAXDATE));
    }
    if (options.hasKey(ARG_MODE) && !options.isNull(ARG_MODE)) {
      args.putString(ARG_MODE, options.getString(ARG_MODE));
    }
    return args;
  }
}
