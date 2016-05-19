/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 * <p/>
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.slider;

import android.annotation.TargetApi;
import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.drawable.Drawable;
import android.util.AttributeSet;
import android.widget.SeekBar;

import com.facebook.react.bridge.ReadableMap;

import javax.annotation.Nullable;

/**
 * Slider that behaves more like the iOS one, for consistency.
 * <p/>
 * On iOS, the value is 0..1. Android SeekBar only supports integer values.
 * For consistency, we pretend in JS that the value is 0..1 but set the
 * SeekBar value to 0..100.
 * <p/>
 * Note that the slider is _not_ a controlled component (setValue isn't called
 * during dragging).
 */
public class ReactSlider extends SeekBar {

  private static final String PROP_ICON_URI = "uri";
  /**
   * If step is 0 (unset) we default to this total number of steps.
   * Don't use 100 which leads to rounding errors (0.200000000001).
   */
  private static int DEFAULT_TOTAL_STEPS = 128;

  /**
   * We want custom min..max range.
   * Android only supports 0..max range so we implement this ourselves.
   */
  private double mMinValue = 0;
  private double mMaxValue = 0;

  /**
   * Value sent from JS (setState).
   * Doesn't get updated during drag (slider is not a controlled component).
   */
  private double mValue = 0;

  /**
   * If zero it's determined automatically.
   */
  private double mStep = 0;

  public ReactSlider(Context context, @Nullable AttributeSet attrs, int style) {
    super(context, attrs, style);
  }

  /* package */ void setMaxValue(double max) {
    mMaxValue = max;
    updateAll();
  }

  /* package */ void setMinValue(double min) {
    mMinValue = min;
    updateAll();
  }

  /* package */ void setValue(double value) {
    mValue = value;
    updateValue();
  }

  /* package */ void setStep(double step) {
    mStep = step;
    updateAll();
  }

  /**
   * Convert SeekBar's native progress value (e.g. 0..100) to a value
   * passed to JS (e.g. -1.0..2.5).
   */
  public double toRealProgress(int seekBarProgress) {
    if (seekBarProgress == getMax()) {
      return mMaxValue;
    }
    return seekBarProgress * mStep + mMinValue;
  }

  /**
   * Update underlying native SeekBar's values.
   */
  private void updateAll() {
    if (mStep == 0) {
      mStep = (mMaxValue - mMinValue) / (double) DEFAULT_TOTAL_STEPS;
    }
    setMax(getTotalSteps());
    updateValue();
  }

  /**
   * Update value only (optimization in case only value is set).
   */
  private void updateValue() {
    setProgress((int) Math.round(
      (mValue - mMinValue) / (mMaxValue - mMinValue) * getTotalSteps()));
  }

  private int getTotalSteps() {
    return (int) Math.ceil((mMaxValue - mMinValue) / mStep);
  }

  public void setThumbImage(ReadableMap source) {
    String uri = source != null ? source.getString(PROP_ICON_URI) : null;


    if (uri != null) {
      Drawable thumd = getDrawableByName(uri);
      setThumb(thumd);
    }

  }

  private int getDrawableResourceByName(String name) {
    return getResources().getIdentifier(
      name,
      "drawable",
      getContext().getPackageName());
  }

  private Drawable getDrawableByName(String name) {
    int drawableResId = getDrawableResourceByName(name);
    if (drawableResId != 0) {
      return getResources().getDrawable(getDrawableResourceByName(name));
    } else {
      return null;
    }
  }

  @TargetApi(21)
  public void setProgressColor(Integer value) {
    setProgressTintList(ColorStateList.valueOf(value));
  }

  @TargetApi(21)
  public void setProgressBackgroundColor(Integer value) {
    setProgressBackgroundTintList(ColorStateList.valueOf(value));
  }

  @TargetApi(21)
  public void setThumbColor(Integer value) {
    setThumbTintList(ColorStateList.valueOf(value));
  }
}
