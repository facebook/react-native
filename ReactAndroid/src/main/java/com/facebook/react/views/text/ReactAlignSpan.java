/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.text.TextPaint;
import android.text.style.SuperscriptSpan;
import android.view.Gravity;
import com.facebook.common.logging.FLog;

/** ratio 0 for center ratio 0.4 for top ratio */
public class ReactAlignSpan extends SuperscriptSpan implements ReactSpan {
  private static final String TAG = "ReactTopAlignSpan";
  private Integer mParentHeight;
  private String mTextAlignVertical;
  private String mParentTextAlignVertical;
  private Integer mParentGravity;

  ReactAlignSpan(String textAlignVertical) {
    mTextAlignVertical = textAlignVertical;
  }

  private double convertTextAlignToStep(String textAlign) {
    switch (textAlign) {
      case "top-child":
        return 1;
      case "center-child":
        return 0.5;
      case "bottom-child":
        return 0;
    }
    FLog.w(
        TAG,
        "unable to convert textAlign: "
            + textAlign
            + " to Integer (step) in ReactTopAlignSpan method convertTextAlignToStep.");
    // improve this
    return -1;
  }

  private double convertGravityToStep(Integer gravity) {
    if (gravity.equals(Gravity.TOP) || gravity.equals(Gravity.TOP | Gravity.START)) {
      return 1;
    } else if (gravity.equals(Gravity.CENTER_VERTICAL)
        || gravity.equals(Gravity.CENTER_VERTICAL | Gravity.START)) {
      return 0.5;
    } else if (gravity.equals(Gravity.BOTTOM) || gravity.equals(Gravity.BOTTOM | Gravity.START)) {
      return 0;
    }
    // update it
    FLog.w(
        TAG,
        "unable to convert gravity: "
            + gravity
            + " to Integer (step) in ReactTopAlignSpan method convertTextAlignToStep.");
    // improve this
    return -1;
  }

  @Override
  public void updateDrawState(TextPaint ds) {
    if (mTextAlignVertical == null || mParentGravity == null) {
      return;
    }
    double convertedTextAlignVertical = convertTextAlignToStep(mTextAlignVertical);
    double convertedParentTextAlignVertical = convertGravityToStep(mParentGravity);
    if (convertedTextAlignVertical == -1 || convertedParentTextAlignVertical == -1) {
      return;
    }
    double numberOfSteps = convertedTextAlignVertical - convertedParentTextAlignVertical;

    if (mParentHeight != null) {
      if (numberOfSteps >= 0) {
        ds.baselineShift -= (mParentHeight - ds.getTextSize()) * numberOfSteps;
      } else {
        ds.baselineShift -= (mParentHeight - ds.getTextSize() - ds.descent()) * numberOfSteps;
      }
    }
  }

  public void updateSpan(Integer height, int gravity) {
    mParentHeight = height;
    mParentGravity = gravity;
  }

  @Override
  public void updateMeasureState(TextPaint tp) {
    updateDrawState(tp);
  }
}
