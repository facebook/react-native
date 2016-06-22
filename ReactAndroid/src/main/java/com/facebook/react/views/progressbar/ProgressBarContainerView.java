// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.progressbar;

import javax.annotation.Nullable;

import android.content.Context;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;

/**
 * Controls an enclosing ProgressBar. Exists so that the ProgressBar can be recreated if
 * the style would change.
 */
/* package */ class ProgressBarContainerView extends FrameLayout {
  private static final int MAX_PROGRESS = 1000;

  private @Nullable Integer mColor;
  private boolean mIndeterminate = true;
  private boolean mAnimating = true;
  private double mProgress;
  private @Nullable ProgressBar mProgressBar;

  public ProgressBarContainerView(Context context) {
    super(context);
  }

  public void setStyle(@Nullable String styleName) {
    int style = ReactProgressBarViewManager.getStyleFromString(styleName);
    mProgressBar = ReactProgressBarViewManager.createProgressBar(getContext(), style);
    mProgressBar.setMax(MAX_PROGRESS);
    removeAllViews();
    addView(
        mProgressBar,
        new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT));
  }

  public void setColor(@Nullable Integer color) {
    this.mColor = color;
  }

  public void setIndeterminate(boolean indeterminate) {
    mIndeterminate = indeterminate;
  }

  public void setProgress(double progress) {
    mProgress = progress;
  }

  public void setAnimating(boolean animating) {
    mAnimating = animating;
  }

  public void apply() {
    if (mProgressBar == null) {
      throw new JSApplicationIllegalArgumentException("setStyle() not called");
    }

    mProgressBar.setIndeterminate(mIndeterminate);
    setColor(mProgressBar);
    mProgressBar.setProgress((int) (mProgress * MAX_PROGRESS));
    if (mAnimating) {
      mProgressBar.setVisibility(View.VISIBLE);
    } else {
      mProgressBar.setVisibility(View.GONE);
    }
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
