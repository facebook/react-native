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

import android.graphics.Color;
import android.widget.Spinner;
import android.widget.SpinnerAdapter;
import android.widget.TextView;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.views.picker.ReactDialogPickerManager;
import com.facebook.react.views.picker.ReactDropdownPickerManager;
import com.facebook.react.views.picker.ReactPicker;
import com.facebook.react.views.picker.ReactPickerManager;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;

/**
 * Integration test for {@link ReactDialogPickerManager} and {@link ReactDropdownPickerManager}
 * (and, implicitly, {@link ReactPickerManager}). Tests basic properties, events and switching
 * between spinner modes (which changes the used manager).
 */
public class ReactPickerTestCase extends ReactAppInstrumentationTestCase {

  private static interface PickerAndroidTestModule extends JavaScriptModule {
    public void selectItem(int position);
    public void setMode(String mode);
    public void setPrimaryColor(String color);
  }

  public static class PickerAndroidRecordingModule extends BaseJavaModule {
    private final List<Integer> mSelections = new ArrayList<Integer>();

    @Override
    public String getName() {
      return "PickerAndroidRecordingModule";
    }

    @ReactMethod
    public void recordSelection(int position) {
      mSelections.add(position);
    }

    public List<Integer> getSelections() {
      return new ArrayList<Integer>(mSelections);
    }
  }

  private PickerAndroidRecordingModule mRecordingModule;

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "PickerAndroidTestApp";
  }

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    mRecordingModule = new PickerAndroidRecordingModule();
    return super.createReactInstanceSpecForTest()
      .addJSModule(PickerAndroidTestModule.class)
      .addNativeModule(mRecordingModule);
  }

  public void testBasicProperties() {
    ReactPicker spinner = getViewAtPath(0, 0);
    SpinnerAdapter adapter = spinner.getAdapter();

    assertEquals(Spinner.MODE_DIALOG, spinner.getMode());
    assertEquals("prompt", spinner.getPrompt());
    assertNotNull(adapter);
    assertEquals(3, adapter.getCount());
    assertEquals("item1", ((TextView) adapter.getView(0, null, null)).getText());
    assertEquals("item2", ((TextView) adapter.getView(1, null, null)).getText());
    assertEquals("item3", ((TextView) adapter.getView(2, null, null)).getText());
    assertEquals(1, spinner.getSelectedItemPosition());

    // test colors
    assertEquals(Color.RED, ((TextView) adapter.getView(0, null, null)).getCurrentTextColor());
    assertEquals(Color.GREEN, ((TextView) adapter.getView(1, null, null)).getCurrentTextColor());
    assertEquals(Color.BLUE, ((TextView) adapter.getView(2, null, null)).getCurrentTextColor());
    assertEquals(
        Color.RED,
        ((TextView) adapter.getDropDownView(0, null, null)).getCurrentTextColor());
    assertEquals(
        Color.GREEN,
        ((TextView) adapter.getDropDownView(1, null, null)).getCurrentTextColor());
    assertEquals(
        Color.BLUE,
        ((TextView) adapter.getDropDownView(2, null, null)).getCurrentTextColor());
    getTestModule().setPrimaryColor("black");
    waitForBridgeAndUIIdle();
    assertEquals(Color.BLACK, ((TextView) adapter.getView(0, null, null)).getCurrentTextColor());
    assertEquals(Color.BLACK, ((TextView) adapter.getView(1, null, null)).getCurrentTextColor());
    assertEquals(Color.BLACK, ((TextView) adapter.getView(2, null, null)).getCurrentTextColor());
    assertEquals(
        Color.RED,
        ((TextView) adapter.getDropDownView(0, null, null)).getCurrentTextColor());
    assertEquals(
        Color.GREEN,
        ((TextView) adapter.getDropDownView(1, null, null)).getCurrentTextColor());
    assertEquals(
        Color.BLUE,
        ((TextView) adapter.getDropDownView(2, null, null)).getCurrentTextColor());

  }

  public void testDropdownPicker() {
    ReactPicker spinner = getViewAtPath(0, 1);

    assertEquals(Spinner.MODE_DROPDOWN, spinner.getMode());
  }

  public void testDisabledPicker() {
    ReactPicker spinner = getViewAtPath(0, 2);

    assertFalse(spinner.isEnabled());
  }

  public void testUpdateSelectedItem() {
    ReactPicker spinner = getViewAtPath(0, 0);
    assertEquals(1, spinner.getSelectedItemPosition());

    getTestModule().selectItem(2);
    waitForBridgeAndUIIdle();
    getInstrumentation().waitForIdleSync();

    assertEquals(2, spinner.getSelectedItemPosition());
  }

  public void testUpdateMode() {
    ReactPicker spinner = getViewAtPath(0, 1);
    assertEquals(Spinner.MODE_DROPDOWN, spinner.getMode());

    getTestModule().setMode("dialog");
    waitForBridgeAndUIIdle();
    getInstrumentation().waitForIdleSync();

    // changing the spinner mode in JS actually creates a new component on the native side, as
    // there's no way to change the mode once you have constructed a Spinner.
    ReactPicker newPicker = getViewAtPath(0, 1);
    assertTrue(spinner != newPicker);
    assertEquals(Spinner.MODE_DIALOG, newPicker.getMode());
  }

  public void testOnSelect() throws Throwable {
    runTestOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            ReactPicker spinner = getViewAtPath(0, 0);
            spinner.setSelection(2);
          }
        });

    getInstrumentation().waitForIdleSync();
    waitForBridgeAndUIIdle();

    List<Integer> selections = mRecordingModule.getSelections();
    assertEquals(1, selections.size());
    assertEquals(2, (int) selections.get(0));
  }

  public void testOnSelectSequence() throws Throwable {
    updateFirstSpinnerAndCheckLastSpinnerMatches(0);
    updateFirstSpinnerAndCheckLastSpinnerMatches(2);
    updateFirstSpinnerAndCheckLastSpinnerMatches(0);
    updateFirstSpinnerAndCheckLastSpinnerMatches(2);
  }

  private void updateFirstSpinnerAndCheckLastSpinnerMatches(
    final int indexToSelect
  ) throws Throwable {
    // The last spinner has the same selected value as the first one.
    // Test that user selection is propagated correctly to JS, to setState, and to Spinners.
    runTestOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            ReactPicker spinner = getViewAtPath(0, 0);
            spinner.setSelection(indexToSelect);
          }
        });
    getInstrumentation().waitForIdleSync();
    waitForBridgeAndUIIdle();

    ReactPicker spinnerInSync = getViewAtPath(0, 3);
    assertEquals(
      "Picker selection was not updated correctly via setState.",
      indexToSelect,
      spinnerInSync.getSelectedItemPosition());
  }

  private PickerAndroidTestModule getTestModule() {
    return getReactContext().getCatalystInstance().getJSModule(PickerAndroidTestModule.class);
  }

}
