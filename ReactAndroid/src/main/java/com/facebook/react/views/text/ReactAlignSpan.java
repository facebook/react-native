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
  private static final String TAG = "ReactAlignSpan";
  private Integer mParentHeight;
  private String mTextAlignVertical;
  private Integer mParentGravity;
  private int mParentLineCount;
  private int mCurrentLine;
  private float mCalculatedHeight;

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
    if (mTextAlignVertical == null
        || mParentHeight == null
        || mParentGravity == null
        || mCalculatedHeight == 0.0f
        || mParentLineCount == 0.0f) {
      return;
    }
    double convertedTextAlignVertical = convertTextAlignToStep(mTextAlignVertical);
    double convertedParentTextAlignVertical = convertGravityToStep(mParentGravity);
    if (convertedTextAlignVertical == -1 || convertedParentTextAlignVertical == -1) {
      return;
    }
    double numberOfSteps = convertedTextAlignVertical - convertedParentTextAlignVertical;
    if (numberOfSteps == 0) {
      return;
    }
    double margin = mParentHeight - mCalculatedHeight;
    double lineHeight = mCalculatedHeight / mParentLineCount;
    double additionalLines = lineHeight * mCurrentLine;
    if (numberOfSteps < 0) {
      additionalLines = lineHeight * (mParentLineCount - mCurrentLine - 1) * -1;
    }
    ds.baselineShift -= margin * numberOfSteps + additionalLines;
  }

  public void updateSpan(
      Integer height, int gravity, int lineCount, float calculatedHeight, int currentLine) {
    mParentHeight = height;
    mParentGravity = gravity;
    mParentLineCount = lineCount;
    mCalculatedHeight = calculatedHeight;
    mCurrentLine = currentLine;
  }

  @Override
  public void updateMeasureState(TextPaint tp) {
    updateDrawState(tp);
  }
}
