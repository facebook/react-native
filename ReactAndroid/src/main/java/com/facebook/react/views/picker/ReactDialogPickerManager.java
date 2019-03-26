/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.picker;

import android.widget.Spinner;

import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;

/**
 * {@link ReactPickerManager} for {@link ReactPicker} with {@link Spinner#MODE_DIALOG}.
 */
@ReactModule(name = ReactDialogPickerManager.REACT_CLASS)
public class ReactDialogPickerManager extends ReactPickerManager {

  protected static final String REACT_CLASS = "AndroidDialogPicker";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ReactPicker createViewInstance(ThemedReactContext reactContext) {
    return new ReactPicker(reactContext, Spinner.MODE_DIALOG);
  }
}
