/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.picker;

import android.widget.Spinner;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.viewmanagers.AndroidDropdownPickerManagerDelegate;
import com.facebook.react.viewmanagers.AndroidDropdownPickerManagerInterface;

/** {@link ReactPickerManager} for {@link ReactPicker} with {@link Spinner#MODE_DROPDOWN}. */
@ReactModule(name = ReactDropdownPickerManager.REACT_CLASS)
public class ReactDropdownPickerManager extends ReactPickerManager
    implements AndroidDropdownPickerManagerInterface<ReactPicker> {

  public static final String REACT_CLASS = "AndroidDropdownPicker";

  private final ViewManagerDelegate<ReactPicker> mDelegate;

  public ReactDropdownPickerManager() {
    mDelegate = new AndroidDropdownPickerManagerDelegate<>(this);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ReactPicker createViewInstance(ThemedReactContext reactContext) {
    return new ReactPicker(reactContext, Spinner.MODE_DROPDOWN);
  }

  @Override
  protected ViewManagerDelegate<ReactPicker> getDelegate() {
    return mDelegate;
  }
}
