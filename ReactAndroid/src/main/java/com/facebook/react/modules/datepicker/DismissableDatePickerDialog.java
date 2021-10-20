/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.datepicker;

import android.app.DatePickerDialog;
import android.content.Context;
import android.content.res.TypedArray;
import android.os.Build;
import android.util.AttributeSet;
import android.widget.DatePicker;
import androidx.annotation.Nullable;
import java.lang.reflect.Field;
import java.lang.reflect.Method;

public class DismissableDatePickerDialog extends DatePickerDialog {

  public DismissableDatePickerDialog(
      Context context,
      @Nullable DatePickerDialog.OnDateSetListener callback,
      int year,
      int monthOfYear,
      int dayOfMonth) {
    super(context, callback, year, monthOfYear, dayOfMonth);
    fixSpinner(context, year, monthOfYear, dayOfMonth);
  }

  public DismissableDatePickerDialog(
      Context context,
      int theme,
      @Nullable DatePickerDialog.OnDateSetListener callback,
      int year,
      int monthOfYear,
      int dayOfMonth) {
    super(context, theme, callback, year, monthOfYear, dayOfMonth);
    fixSpinner(context, year, monthOfYear, dayOfMonth);
  }

  private void fixSpinner(Context context, int year, int month, int dayOfMonth) {
    if (Build.VERSION.SDK_INT == Build.VERSION_CODES.N) {
      try {
        // Get the theme's android:datePickerMode
        final int MODE_SPINNER = 2;
        Class<?> styleableClass = Class.forName("com.android.internal.R$styleable");
        Field datePickerStyleableField = styleableClass.getField("DatePicker");
        int[] datePickerStyleable = (int[]) datePickerStyleableField.get(null);

        final TypedArray a =
            context.obtainStyledAttributes(
                null, datePickerStyleable, android.R.attr.datePickerStyle, 0);
        Field datePickerModeStyleableField = styleableClass.getField("DatePicker_datePickerMode");
        int datePickerModeStyleable = datePickerModeStyleableField.getInt(null);
        final int mode = a.getInt(datePickerModeStyleable, MODE_SPINNER);
        a.recycle();

        if (mode == MODE_SPINNER) {
          DatePicker datePicker =
              (DatePicker)
                  findField(DatePickerDialog.class, DatePicker.class, "mDatePicker").get(this);
          Class<?> delegateClass = Class.forName("android.widget.DatePickerSpinnerDelegate");
          Field delegateField = findField(DatePicker.class, delegateClass, "mDelegate");
          Object delegate = delegateField.get(datePicker);
          Class<?> spinnerDelegateClass;
          spinnerDelegateClass = Class.forName("android.widget.DatePickerSpinnerDelegate");

          // In 7.0 Nougat for some reason the datePickerMode is ignored and the delegate is
          // DatePickerClockDelegate
          if (delegate.getClass() != spinnerDelegateClass) {
            delegateField.set(datePicker, null); // throw out the DatePickerClockDelegate!
            datePicker.removeAllViews(); // remove the DatePickerClockDelegate views
            Method createSpinnerUIDelegate =
                DatePicker.class.getDeclaredMethod(
                    "createSpinnerUIDelegate",
                    Context.class,
                    AttributeSet.class,
                    int.class,
                    int.class);
            createSpinnerUIDelegate.setAccessible(true);

            // Instantiate a DatePickerSpinnerDelegate throughout createSpinnerUIDelegate method
            delegate =
                createSpinnerUIDelegate.invoke(
                    datePicker, context, null, android.R.attr.datePickerStyle, 0);
            delegateField.set(
                datePicker, delegate); // set the DatePicker.mDelegate to the spinner delegate
            datePicker.setCalendarViewShown(false);
            // Initialize the date for the DatePicker delegate again
            datePicker.init(year, month, dayOfMonth, this);
          }
        }
      } catch (Exception e) {
        throw new RuntimeException(e);
      }
    }
  }

  private static Field findField(Class objectClass, Class fieldClass, String expectedName) {
    try {
      Field field = objectClass.getDeclaredField(expectedName);
      field.setAccessible(true);
      return field;
    } catch (NoSuchFieldException e) {
    } // ignore
    // search for it if it wasn't found under the expected ivar name
    for (Field searchField : objectClass.getDeclaredFields()) {
      if (searchField.getType() == fieldClass) {
        searchField.setAccessible(true);
        return searchField;
      }
    }
    return null;
  }
}
