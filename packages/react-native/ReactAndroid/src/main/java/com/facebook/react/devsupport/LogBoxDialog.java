/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.app.Activity;
import android.app.Dialog;
import android.view.View;
import android.view.Window;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.R;

/** Dialog for displaying JS errors in LogBox. */
@Nullsafe(Nullsafe.Mode.LOCAL)
class LogBoxDialog extends Dialog {
  public LogBoxDialog(Activity context, View reactRootView) {
    super(context, R.style.Theme_Catalyst_LogBox);

    requestWindowFeature(Window.FEATURE_NO_TITLE);
    setContentView(reactRootView);
  }
}
