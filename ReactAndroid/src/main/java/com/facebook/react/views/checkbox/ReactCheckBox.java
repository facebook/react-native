/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * <p>This source code is licensed under the BSD-style license found in the LICENSE file in the root
 * directory of this source tree. An additional grant of patent rights can be found in the PATENTS
 * file in the same directory.
 */
package com.facebook.react.views.checkbox;

import android.content.Context;
import android.widget.CheckBox;

/** CheckBox that has its value controlled by JS. */
/*package*/ class ReactCheckBox extends CheckBox {

  private boolean mAllowChange;

  public ReactCheckBox(Context context) {
    super(context);
    mAllowChange = true;
  }

  @Override
  public void setChecked(boolean checked) {
    if (mAllowChange) {
      mAllowChange = false;
      super.setChecked(checked);
    }
  }

  /*package*/ void setOn(boolean on) {
    // If the checkbox has a different value than the value sent by JS, we must change it.
    if (isChecked() != on) {
      super.setChecked(on);
    }
    mAllowChange = true;
  }
}
