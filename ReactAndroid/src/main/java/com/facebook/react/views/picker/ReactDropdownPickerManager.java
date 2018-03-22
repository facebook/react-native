/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.picker;

import android.widget.Spinner;

import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;

/**
 * {@link ReactPickerManager} for {@link ReactPicker} with {@link Spinner#MODE_DROPDOWN}.
 */
@ReactModule(name = ReactDropdownPickerManager.REACT_CLASS)
public class ReactDropdownPickerManager extends ReactPickerManager {

  protected static final String REACT_CLASS = "AndroidDropdownPicker";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ReactPicker createViewInstance(ThemedReactContext reactContext) {
    return new ReactPicker(reactContext, Spinner.MODE_DROPDOWN);
  }
}
