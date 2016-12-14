/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 * <p>
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.switchview;

import android.annotation.TargetApi;
import android.content.Context;
import android.content.res.ColorStateList;
import android.content.res.TypedArray;
import android.graphics.Color;
import android.graphics.drawable.RippleDrawable;
import android.os.Build;
import android.support.v4.content.ContextCompat;
import android.support.v4.graphics.drawable.DrawableCompat;
import android.support.v7.widget.SwitchCompat;
import android.util.TypedValue;

import com.facebook.react.R;

/**
 * Switch that has its value controlled by JS. Whenever the value of the switch changes, we do not
 * allow any other changes to that switch until JS sets a value explicitly. This stops the Switch
 * from changing its value multiple times, when those changes have not been processed by JS first.
 */
/*package*/ class ReactSwitch extends SwitchCompat {

  private boolean mAllowChange;
  private int mSwitchColor;
  private boolean isDarkTheme;

  public ReactSwitch(Context context) {
    super(context);
    mAllowChange = true;
    mSwitchColor = getDefaultSwitchColor();
  }

  @Override
  public void setChecked(boolean checked) {
    if (mAllowChange) {
      mAllowChange = false;
      super.setChecked(checked);
    }
  }

  /*package*/ void setOn(boolean on) {
    // If the switch has a different value than the value sent by JS, we must change it.
    if (isChecked() != on) {
      super.setChecked(on);
    }
    mAllowChange = true;
  }

  public void setSwitchColor(int themeColor) {
    if (themeColor == 0) return;
    this.mSwitchColor = themeColor;
    setThumbColor();
    setTrackColor();
    setRippleColor();
  }

  public void setDarkTheme(boolean isDarkTheme) {
    this.isDarkTheme = isDarkTheme;
    setSwitchColor(mSwitchColor);
  }

  @TargetApi(Build.VERSION_CODES.LOLLIPOP)
  private void setRippleColor() {

    if (getBackground() == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP
            || !(getBackground() instanceof RippleDrawable)) {
      return;
    }

    final int[][] states = new int[2][];
    final int[] colors = new int[2];

    // Unchecked State
    states[0] = new int[]{-android.R.attr.state_checked};
    colors[0] = ContextCompat.getColor(getContext(),
            isDarkTheme ? R.color.ripple_material_dark : R.color.ripple_material_light);

    // Checked state
    states[1] = new int[]{android.R.attr.state_checked};
    colors[1] = Color.argb(0x4D, Color.red(mSwitchColor), Color.green(mSwitchColor),
            Color.blue(mSwitchColor));

    ColorStateList colorStateList = new ColorStateList(states, colors);
    ((RippleDrawable) getBackground()).setColor(colorStateList);
  }

  private void setThumbColor() {

    final int[][] states = new int[3][];
    final int[] colors = new int[3];

    // Disabled state
    states[0] = new int[]{-android.R.attr.state_enabled};
    colors[0] = ContextCompat.getColor(getContext(), isDarkTheme
            ? R.color.switch_thumb_normal_material_dark
            : R.color.switch_thumb_normal_material_light);

    // Checked state
    states[1] = new int[]{android.R.attr.state_checked};
    colors[1] = mSwitchColor;

    // Unchecked enabled state state
    states[2] = new int[0];
    colors[2] = ContextCompat.getColor(getContext(), isDarkTheme
            ? R.color.switch_thumb_normal_material_dark
            : R.color.switch_thumb_normal_material_light);

    ColorStateList colorStateList = new ColorStateList(states, colors);
    DrawableCompat.setTintList(getThumbDrawable(), colorStateList);
  }

  private void setTrackColor() {
    final int[][] states = new int[3][];
    final int[] colors = new int[3];

    // Light: #000000, Opacity 38%
    // Dark: #FFFFFF, Opacity 30%
    int disabledColor = isDarkTheme ? Color.WHITE : Color.BLACK;
    int trackColor = Color.argb(isDarkTheme ? 0x1E : 0x61,
            Color.red(disabledColor),
            Color.green(disabledColor),
            Color.blue(disabledColor));

    // Disabled state
    states[0] = new int[]{-android.R.attr.state_enabled};
    colors[0] = trackColor;

    // Checked state
    states[1] = new int[]{android.R.attr.state_checked};
    colors[1] = Color.argb(0x4D, Color.red(mSwitchColor), Color.green(mSwitchColor),
            Color.blue(mSwitchColor));

    states[2] = new int[0];
    colors[2] = trackColor;

    ColorStateList colorStateList = new ColorStateList(states, colors);
    DrawableCompat.setTintList(getTrackDrawable(), colorStateList);
  }

  private int getDefaultSwitchColor() {
    TypedValue typedValue = new TypedValue();

    TypedArray a = getContext().obtainStyledAttributes(typedValue.data, new int[] { R.attr.colorAccent });
    int color = a.getColor(0, 0);

    a.recycle();
    return color;
  }

}
