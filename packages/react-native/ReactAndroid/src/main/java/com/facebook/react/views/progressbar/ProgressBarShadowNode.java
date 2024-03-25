/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.progressbar;

import android.util.SparseIntArray;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureOutput;
import com.facebook.yoga.YogaNode;
import java.util.HashSet;
import java.util.Set;

/**
 * Node responsible for holding the style of the ProgressBar, see under {@link
 * android.R.attr.progressBarStyle} for possible styles. ReactProgressBarViewManager manages how
 * this style is applied to the ProgressBar.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ProgressBarShadowNode extends LayoutShadowNode implements YogaMeasureFunction {

  private String mStyle = ReactProgressBarViewManager.DEFAULT_STYLE;

  private final SparseIntArray mHeight;
  private final SparseIntArray mWidth;
  private final Set<Integer> mMeasured;

  public ProgressBarShadowNode() {
    mHeight = new SparseIntArray();
    mWidth = new SparseIntArray();
    mMeasured = new HashSet<>();
    initMeasureFunction();
  }

  private void initMeasureFunction() {
    setMeasureFunction(this);
  }

  public @Nullable String getStyle() {
    return mStyle;
  }

  @ReactProp(name = ReactProgressBarViewManager.PROP_STYLE)
  public void setStyle(@Nullable String style) {
    mStyle = style == null ? ReactProgressBarViewManager.DEFAULT_STYLE : style;
  }

  @Override
  public long measure(
      YogaNode node,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode) {
    final int style = ReactProgressBarViewManager.getStyleFromString(getStyle());
    if (!mMeasured.contains(style)) {
      ProgressBar progressBar =
          ReactProgressBarViewManager.createProgressBar(getThemedContext(), style);
      final int spec =
          View.MeasureSpec.makeMeasureSpec(
              ViewGroup.LayoutParams.WRAP_CONTENT, View.MeasureSpec.UNSPECIFIED);
      progressBar.measure(spec, spec);
      mHeight.put(style, progressBar.getMeasuredHeight());
      mWidth.put(style, progressBar.getMeasuredWidth());
      mMeasured.add(style);
    }

    return YogaMeasureOutput.make(mWidth.get(style), mHeight.get(style));
  }
}
