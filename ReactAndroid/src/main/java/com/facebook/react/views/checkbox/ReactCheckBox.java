/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.checkbox;

import android.support.v7.widget.AppCompatCheckBox;

import com.facebook.react.uimanager.ThemedReactContext;

/**
 * CheckBox that has its value controlled by JS. Whenever the value of the checkbox changes, we do not
 * allow any other changes to that checkbox until JS sets a value explicitly. This stops the CheckBox
 * from changing its value multiple times, when those changes have not been processed by JS first.
 */
/*package*/ class ReactCheckBox extends AppCompatCheckBox {

  private boolean mAllowChange;
  private ThemedReactContext mReactContext;

  public ReactCheckBox(ThemedReactContext reactContext) {
    super(reactContext);
    mReactContext = reactContext;
    mAllowChange = true;
  }

  @Override
  public void setChecked(boolean checked) {
    if (mAllowChange) {
      mAllowChange = false;
      super.setChecked(checked);
    }
  }

  void setOn(boolean on) {
    // If the switch has a different value than the value sent by JS, we must change it.
    if (isChecked() != on) {
      super.setChecked(on);
    }
    mAllowChange = true;
  }

  public ThemedReactContext getReactContext() {
    return mReactContext;
  }

}
