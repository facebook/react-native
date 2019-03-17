/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.switchview;

import android.content.Context;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.support.v7.widget.SwitchCompat;
import javax.annotation.Nullable;

/**
 * Switch that has its value controlled by JS. Whenever the value of the switch changes, we do not
 * allow any other changes to that switch until JS sets a value explicitly. This stops the Switch
 * from changing its value multiple times, when those changes have not been processed by JS first.
 */
/*package*/ class ReactSwitch extends SwitchCompat {

  private boolean mAllowChange;
  @Nullable private Integer mTrackColorForFalse;
  @Nullable private Integer mTrackColorForTrue;

  public ReactSwitch(Context context) {
    super(context);
    mAllowChange = true;
    mTrackColorForFalse = null;
    mTrackColorForTrue = null;
  }

  @Override
  public void setChecked(boolean checked) {
    if (mAllowChange && isChecked() != checked) {
      mAllowChange = false;
      super.setChecked(checked);
      setTrackColor(checked);
    }
  }

  void setColor(Drawable drawable, @Nullable Integer color) {
    if (color == null) {
      drawable.clearColorFilter();
    } else {
      drawable.setColorFilter(color, PorterDuff.Mode.MULTIPLY);
    }
  }

  public void setTrackColor(@Nullable Integer color) {
    setColor(super.getTrackDrawable(), color);
  }

  public void setThumbColor(@Nullable Integer color) {
    setColor(super.getThumbDrawable(), color);
  }

  /*package*/ void setOn(boolean on) {
    // If the switch has a different value than the value sent by JS, we must change it.
    if (isChecked() != on) {
      super.setChecked(on);
      setTrackColor(on);
    }
    mAllowChange = true;
  }

  public void setTrackColorForTrue(@Nullable Integer color) {
    if (color == mTrackColorForTrue) {
      return;
    }

    mTrackColorForTrue = color;
    if (isChecked()) {
      setTrackColor(mTrackColorForTrue);
    }
  }

  public void setTrackColorForFalse(@Nullable Integer color) {
    if (color == mTrackColorForFalse) {
      return;
    }

    mTrackColorForFalse = color;
    if (!isChecked()) {
      setTrackColor(mTrackColorForFalse);
    }
  }

  private void setTrackColor(boolean checked) {
    if (mTrackColorForTrue != null || mTrackColorForFalse != null) {
      // Update the track color to reflect the new value. We only want to do this if these
      // props were actually set from JS; otherwise we'll just reset the color to the default.
      Integer currentTrackColor = checked ? mTrackColorForTrue : mTrackColorForFalse;
      setTrackColor(currentTrackColor);
    }
  }
}
