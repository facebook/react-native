/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests;

import android.app.DatePickerDialog;
import android.content.DialogInterface;
import android.widget.DatePicker;
import androidx.fragment.app.DialogFragment;
import androidx.fragment.app.Fragment;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.datepicker.DatePickerDialogModule;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

/** Test case for {@link DatePickerDialogModule} options and callbacks. */
public class DatePickerDialogTestCase extends ReactAppInstrumentationTestCase {

  private static interface DatePickerDialogTestModule extends JavaScriptModule {
    public void showDatePickerDialog(WritableMap options);
  }

  private static class DatePickerDialogRecordingModule extends BaseJavaModule {

    private final List<Integer[]> mDates = new ArrayList<Integer[]>();
    private int mDismissed = 0;
    private int mErrors = 0;

    @Override
    public String getName() {
      return "DatePickerDialogRecordingModule";
    }

    @ReactMethod
    public void recordDate(int year, int month, int day) {
      mDates.add(new Integer[] {year, month, day});
    }

    @ReactMethod
    public void recordDismissed() {
      mDismissed++;
    }

    @ReactMethod
    public void recordError() {
      mErrors++;
    }

    public List<Integer[]> getDates() {
      return new ArrayList<Integer[]>(mDates);
    }

    public int getDismissed() {
      return mDismissed;
    }

    public int getErrors() {
      return mErrors;
    }
  }

  final DatePickerDialogRecordingModule mRecordingModule = new DatePickerDialogRecordingModule();

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    return super.createReactInstanceSpecForTest().addNativeModule(mRecordingModule);
  }

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "DatePickerDialogTestApp";
  }

  private static long getDateInMillis(int year, int month, int date) {
    final Calendar c = Calendar.getInstance();
    c.set(Calendar.YEAR, year);
    c.set(Calendar.MONTH, month);
    c.set(Calendar.DATE, date);
    return c.getTimeInMillis();
  }

  private DatePickerDialogTestModule getTestModule() {
    return getReactContext().getCatalystInstance().getJSModule(DatePickerDialogTestModule.class);
  }

  private DialogFragment showDialog(WritableMap options) {
    getTestModule().showDatePickerDialog(options);

    waitForBridgeAndUIIdle();
    getInstrumentation().waitForIdleSync();

    return (DialogFragment)
        getActivity()
            .getSupportFragmentManager()
            .findFragmentByTag(DatePickerDialogModule.FRAGMENT_TAG);
  }

  public void testShowBasicDatePicker() {
    final Fragment datePickerFragment = showDialog(null);

    assertNotNull(datePickerFragment);
  }

  public void testPresetDate() {
    final WritableMap options = new WritableNativeMap();
    options.putDouble("date", getDateInMillis(2020, 5, 6));

    final DialogFragment datePickerFragment = showDialog(options);
    final DatePicker datePicker =
        ((DatePickerDialog) datePickerFragment.getDialog()).getDatePicker();

    assertEquals(2020, datePicker.getYear());
    assertEquals(5, datePicker.getMonth());
    assertEquals(6, datePicker.getDayOfMonth());
  }

  public void testCallback() throws Throwable {
    final WritableMap options = new WritableNativeMap();
    options.putDouble("date", getDateInMillis(2020, 5, 6));

    final DialogFragment datePickerFragment = showDialog(options);

    runTestOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            ((DatePickerDialog) datePickerFragment.getDialog())
                .getButton(DialogInterface.BUTTON_POSITIVE)
                .performClick();
          }
        });

    getInstrumentation().waitForIdleSync();
    waitForBridgeAndUIIdle();

    assertEquals(0, mRecordingModule.getErrors());
    assertEquals(1, mRecordingModule.getDates().size());
    assertEquals(2020, (int) mRecordingModule.getDates().get(0)[0]);
    assertEquals(5, (int) mRecordingModule.getDates().get(0)[1]);
    assertEquals(6, (int) mRecordingModule.getDates().get(0)[2]);
  }

  public void testDismissCallback() throws Throwable {
    final DialogFragment datePickerFragment = showDialog(null);

    runTestOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            datePickerFragment.getDialog().dismiss();
          }
        });

    getInstrumentation().waitForIdleSync();
    waitForBridgeAndUIIdle();

    assertEquals(0, mRecordingModule.getErrors());
    assertEquals(0, mRecordingModule.getDates().size());
    assertEquals(1, mRecordingModule.getDismissed());
  }
}
