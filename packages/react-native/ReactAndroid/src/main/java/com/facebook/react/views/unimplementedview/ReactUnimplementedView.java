/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.unimplementedview;

import android.content.Context;
import android.graphics.Color;
import android.view.Gravity;
import android.widget.LinearLayout;
import androidx.appcompat.widget.AppCompatTextView;
import com.facebook.infer.annotation.Nullsafe;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactUnimplementedView extends LinearLayout {
  private AppCompatTextView mTextView;

  public ReactUnimplementedView(Context context) {
    super(context);
    mTextView = new AppCompatTextView(context);
    mTextView.setLayoutParams(
        new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.MATCH_PARENT));
    mTextView.setGravity(Gravity.CENTER);
    mTextView.setTextColor(Color.WHITE);

    setBackgroundColor(0x55ff0000);
    setGravity(Gravity.CENTER_HORIZONTAL);
    setOrientation(LinearLayout.VERTICAL);
    addView(mTextView);
  }

  public void setName(String name) {
    mTextView.setText("'" + name + "' is not Fabric compatible yet.");
  }
}
