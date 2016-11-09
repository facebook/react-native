// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.view;

import android.view.View;

import com.facebook.csslayout.CSSMeasureMode;

public class MeasureUtil {

  public static int getMeasureSpec(float size, CSSMeasureMode mode) {
    if (mode == CSSMeasureMode.EXACTLY) {
      return View.MeasureSpec.makeMeasureSpec((int) size, View.MeasureSpec.EXACTLY);
    } else if (mode == CSSMeasureMode.AT_MOST) {
      return View.MeasureSpec.makeMeasureSpec((int) size, View.MeasureSpec.AT_MOST);
    } else {
      return View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED);
    }
  }
}
