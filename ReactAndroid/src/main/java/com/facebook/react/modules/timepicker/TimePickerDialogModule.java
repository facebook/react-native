/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.timepicker;

import android.app.Activity;
import android.app.DialogFragment;
import android.app.FragmentManager;
import android.app.TimePickerDialog.OnTimeSetListener;
import android.content.DialogInterface;
import android.content.DialogInterface.OnDismissListener;
import android.os.Bundle;
import android.widget.TimePicker;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.module.annotations.ReactModule;

import javax.annotation.Nullable;

/**
 * {@link NativeModule} that allows JS to show a native time picker dialog and get called back when
 * the user selects a time.
 */
@ReactModule(name = "TimePickerAndroid")
public class TimePickerDialogModule extends ReactContextBaseJavaModule {

  @VisibleForTesting
  public static final String FRAGMENT_TAG = "TimePickerAndroid";

  private static final String ERROR_NO_ACTIVITY = "E_NO_ACTIVITY";

  /* package */ static final String ARG_HOUR = "hour";
  /* package */ static final String ARG_MINUTE = "minute";
  /* package */ static final String ARG_IS24HOUR = "is24Hour";
  /* package */ static final String ARG_MODE = "mode";
  /* package */ static final String ACTION_TIME_SET = "timeSetAction";
  /* package */ static final String ACTION_DISMISSED = "dismissedAction";

  public TimePickerDialogModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "TimePickerAndroid";
  }

  private class TimePickerDialogListener implements OnTimeSetListener, OnDismissListener {

    private final Promise mPromise;
    private boolean mPromiseResolved = false;

    public TimePickerDialogListener(Promise promise) {
      mPromise = promise;
    }

    @Override
    public void onTimeSet(TimePicker view, int hour, int minute) {
      if (!mPromiseResolved && getReactApplicationContext().hasActiveCatalystInstance()) {
        WritableMap result = new WritableNativeMap();
        result.putString("action", ACTION_TIME_SET);
        result.putInt("hour", hour);
        result.putInt("minute", minute);
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

  @ReactMethod
  public void open(@Nullable final ReadableMap options, Promise promise) {

    Activity activity = getCurrentActivity();
    if (activity == null) {
      promise.reject(
          ERROR_NO_ACTIVITY,
          "Tried to open a TimePicker dialog while not attached to an Activity");
      return;
    }
    // We want to support both android.app.Activity and the pre-Honeycomb FragmentActivity
    // (for apps that use it for legacy reasons). This unfortunately leads to some code duplication.
    if (activity instanceof android.support.v4.app.FragmentActivity) {
      android.support.v4.app.FragmentManager fragmentManager =
          ((android.support.v4.app.FragmentActivity) activity).getSupportFragmentManager();
      android.support.v4.app.DialogFragment oldFragment =
          (android.support.v4.app.DialogFragment) fragmentManager.findFragmentByTag(FRAGMENT_TAG);
      if (oldFragment != null) {
        oldFragment.dismiss();
      }
      SupportTimePickerDialogFragment fragment = new SupportTimePickerDialogFragment();
      if (options != null) {
        Bundle args = createFragmentArguments(options);
        fragment.setArguments(args);
      }
      TimePickerDialogListener listener = new TimePickerDialogListener(promise);
      fragment.setOnDismissListener(listener);
      fragment.setOnTimeSetListener(listener);
      fragment.show(fragmentManager, FRAGMENT_TAG);
    } else {
      FragmentManager fragmentManager = activity.getFragmentManager();
      DialogFragment oldFragment = (DialogFragment) fragmentManager.findFragmentByTag(FRAGMENT_TAG);
      if (oldFragment != null) {
        oldFragment.dismiss();
      }
      TimePickerDialogFragment fragment = new TimePickerDialogFragment();
      if (options != null) {
        final Bundle args = createFragmentArguments(options);
        fragment.setArguments(args);
      }
      TimePickerDialogListener listener = new TimePickerDialogListener(promise);
      fragment.setOnDismissListener(listener);
      fragment.setOnTimeSetListener(listener);
      fragment.show(fragmentManager, FRAGMENT_TAG);
    }
  }

  private Bundle createFragmentArguments(ReadableMap options) {
    final Bundle args = new Bundle();
    if (options.hasKey(ARG_HOUR) && !options.isNull(ARG_HOUR)) {
      args.putInt(ARG_HOUR, options.getInt(ARG_HOUR));
    }
    if (options.hasKey(ARG_MINUTE) && !options.isNull(ARG_MINUTE)) {
      args.putInt(ARG_MINUTE, options.getInt(ARG_MINUTE));
    }
    if (options.hasKey(ARG_IS24HOUR) && !options.isNull(ARG_IS24HOUR)) {
      args.putBoolean(ARG_IS24HOUR, options.getBoolean(ARG_IS24HOUR));
    }
    if (options.hasKey(ARG_MODE) && !options.isNull(ARG_MODE)) {
      args.putString(ARG_MODE, options.getString(ARG_MODE));
    }
    return args;
  }
}
