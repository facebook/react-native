// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.progressbar;

import javax.annotation.Nullable;

import android.content.Context;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;

/**
 * Controls an enclosing ProgressBar. Exists so that the ProgressBar can be recreated if
 * the style would change.
 */
class ProgressBarContainerView extends FrameLayout {
  private @Nullable Integer mColor;
  private @Nullable ProgressBar mProgressBar;

  public ProgressBarContainerView(Context context) {
    super(context);
  }

  public void setStyle(@Nullable String styleName) {
    int style = ReactProgressBarViewManager.getStyleFromString(styleName);
    mProgressBar = new ProgressBar(getContext(), null, style);
    removeAllViews();
    addView(
        mProgressBar,
        new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT));
  }

  public void setColor(@Nullable Integer color) {
    this.mColor = color;
  }

  public void apply() {
    if (mProgressBar == null) {
      throw new JSApplicationIllegalArgumentException("setStyle() not called");
    }
    setColor(mProgressBar);
  }

  private void setColor(ProgressBar progressBar) {
    Drawable drawable;
    if (progressBar.isIndeterminate()) {
      drawable = progressBar.getIndeterminateDrawable();
    } else {
      drawable = progressBar.getProgressDrawable();
    }

    if (drawable == null) {
      return;
    }

    if (mColor != null) {
      drawable.setColorFilter(mColor, PorterDuff.Mode.SRC_IN);
    } else {
      drawable.clearColorFilter();
    }
  }
}
