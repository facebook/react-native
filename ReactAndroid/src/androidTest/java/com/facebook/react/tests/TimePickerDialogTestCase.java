/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.tests;

import java.util.ArrayList;
import java.util.List;

import android.app.TimePickerDialog;
import android.content.DialogInterface;
import android.support.v4.app.DialogFragment;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.timepicker.TimePickerDialogModule;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;

/**
 * Test case for {@link TimePickerDialogModule} options and callbacks.
 */
public class TimePickerDialogTestCase extends ReactAppInstrumentationTestCase {

  private static interface TimePickerDialogTestModule extends JavaScriptModule {
    public void showTimePickerDialog(WritableMap options);
  }

  private static class TimePickerDialogRecordingModule extends BaseJavaModule {

    private final List<Integer[]> mTimes = new ArrayList<Integer[]>();
    private int mDismissed = 0;
    private int mErrors = 0;

    @Override
    public String getName() {
      return "TimePickerDialogRecordingModule";
    }

    @ReactMethod
    public void recordTime(int hour, int minute) {
      mTimes.add(new Integer[] {hour, minute});
    }

    @ReactMethod
    public void recordDismissed() {
      mDismissed++;
    }

    @ReactMethod
    public void recordError() {
      mErrors++;
    }

    public List<Integer[]> getTimes() {
      return new ArrayList<Integer[]>(mTimes);
    }

    public int getDismissed() {
      return mDismissed;
    }

    public int getErrors() {
      return mErrors;
    }
  }

  final TimePickerDialogRecordingModule mRecordingModule = new TimePickerDialogRecordingModule();

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    return super.createReactInstanceSpecForTest()
        .addNativeModule(mRecordingModule)
        .addJSModule(TimePickerDialogTestModule.class);
  }

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "TimePickerDialogTestApp";
  }

  private TimePickerDialogTestModule getTestModule() {
    return getReactContext().getCatalystInstance().getJSModule(TimePickerDialogTestModule.class);
  }

  private DialogFragment showDialog(WritableMap options) {
    getTestModule().showTimePickerDialog(options);

    waitForBridgeAndUIIdle();
    getInstrumentation().waitForIdleSync();

    return (DialogFragment) getActivity().getSupportFragmentManager()
        .findFragmentByTag(TimePickerDialogModule.FRAGMENT_TAG);
  }

  public void testShowBasicTimePicker() {
    final DialogFragment fragment = showDialog(null);

    assertNotNull(fragment);
  }

  public void testPresetTimeAndCallback() throws Throwable {
    final WritableMap options = new WritableNativeMap();
    options.putInt("hour", 4);
    options.putInt("minute", 5);

    final DialogFragment fragment = showDialog(options);

    List<Integer[]> recordedTimes = mRecordingModule.getTimes();
    assertEquals(0, recordedTimes.size());

    runTestOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            ((TimePickerDialog) fragment.getDialog())
                .getButton(DialogInterface.BUTTON_POSITIVE).performClick();
          }
        });

    getInstrumentation().waitForIdleSync();
    waitForBridgeAndUIIdle();

    assertEquals(0, mRecordingModule.getErrors());
    assertEquals(0, mRecordingModule.getDismissed());

    recordedTimes = mRecordingModule.getTimes();
    assertEquals(1, recordedTimes.size());
    assertEquals(4, (int) recordedTimes.get(0)[0]);
    assertEquals(5, (int) recordedTimes.get(0)[1]);
  }

  public void testDismissCallback() throws Throwable {
    final DialogFragment fragment = showDialog(null);

    assertEquals(0, mRecordingModule.getDismissed());

    runTestOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            fragment.getDialog().dismiss();
          }
        });

    getInstrumentation().waitForIdleSync();
    waitForBridgeAndUIIdle();

    assertEquals(0, mRecordingModule.getErrors());
    assertEquals(0, mRecordingModule.getTimes().size());
    assertEquals(1, mRecordingModule.getDismissed());
  }

}
