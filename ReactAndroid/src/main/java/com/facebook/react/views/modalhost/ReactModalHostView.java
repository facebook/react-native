/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.modalhost;

import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.graphics.drawable.ColorDrawable;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;

import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.views.view.ReactViewGroup;

/**
 * A Modal view that works as a base ViewGroup to host other views.
 */
public class ReactModalHostView extends ViewGroup {

  private ReactViewGroup mHostView;
  private Dialog mDialog;

  public ReactModalHostView(Context context) {
    super(context);

    mHostView = new ReactViewGroup(context);
    mHostView.setLayoutParams(new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

    mDialog = new Dialog(context, android.R.style.Theme_DeviceDefault_Dialog_NoActionBar);
    mDialog.setContentView(mHostView);
    mDialog.show();
    mDialog.getWindow().setLayout(
        WindowManager.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.MATCH_PARENT);
  }

  public void setBackgroundDrawable(ColorDrawable color) {
    mDialog.getWindow().setBackgroundDrawable(color);
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
  }

  @Override
  public void addView(View child, int index) {
    mHostView.addView(child, index);
  }

  @Override
  public int getChildCount() {
    return mHostView.getChildCount();
  }

  @Override
  public View getChildAt(int index) {
    return mHostView.getChildAt(index);
  }

  @Override
  public void removeView(View child) {
    mHostView.removeView(child);
  }

  /*package*/ void setOnDismissListener(DialogInterface.OnDismissListener listener) {
    mDialog.setOnDismissListener(listener);
  }

  @VisibleForTesting
  public Dialog getDialog() {
    return mDialog;
  }
}
