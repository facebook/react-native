/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.picker;

import android.widget.Spinner;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.viewmanagers.AndroidDialogPickerManagerDelegate;
import com.facebook.react.viewmanagers.AndroidDialogPickerManagerInterface;

/** {@link ReactPickerManager} for {@link ReactPicker} with {@link Spinner#MODE_DIALOG}. */
@ReactModule(name = ReactDialogPickerManager.REACT_CLASS)
public class ReactDialogPickerManager extends ReactPickerManager
    implements AndroidDialogPickerManagerInterface<ReactPicker> {

  public static final String REACT_CLASS = "AndroidDialogPicker";

  private final ViewManagerDelegate<ReactPicker> mDelegate;

  public ReactDialogPickerManager() {
    mDelegate = new AndroidDialogPickerManagerDelegate<>(this);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ReactPicker createViewInstance(ThemedReactContext reactContext) {
    return new ReactPicker(reactContext, Spinner.MODE_DIALOG);
  }

  @Override
  protected ViewManagerDelegate<ReactPicker> getDelegate() {
    return mDelegate;
  }

  @Override
  public void setBackgroundColor(@NonNull ReactPicker view, @Nullable Integer backgroundColor) {
    view.setStagedBackgroundColor(backgroundColor);
  }
}
