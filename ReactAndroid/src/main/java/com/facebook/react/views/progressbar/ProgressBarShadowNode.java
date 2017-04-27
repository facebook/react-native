/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.progressbar;

import javax.annotation.Nullable;

import java.util.HashSet;
import java.util.Set;

import android.util.SparseIntArray;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;

import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaNode;
import com.facebook.yoga.YogaMeasureOutput;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Node responsible for holding the style of the ProgressBar, see under
 * {@link android.R.attr.progressBarStyle} for possible styles. ReactProgressBarViewManager
 * manages how this style is applied to the ProgressBar.
 */
public class ProgressBarShadowNode extends LayoutShadowNode implements YogaMeasureFunction {

  private String mStyle = ReactProgressBarViewManager.DEFAULT_STYLE;

  private final SparseIntArray mHeight = new SparseIntArray();
  private final SparseIntArray mWidth = new SparseIntArray();
  private final Set<Integer> mMeasured = new HashSet<>();

  public ProgressBarShadowNode() {
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
      ProgressBar progressBar = ReactProgressBarViewManager.createProgressBar(getThemedContext(), style);
      final int spec = View.MeasureSpec.makeMeasureSpec(
          ViewGroup.LayoutParams.WRAP_CONTENT,
          View.MeasureSpec.UNSPECIFIED);
      progressBar.measure(spec, spec);
      mHeight.put(style, progressBar.getMeasuredHeight());
      mWidth.put(style, progressBar.getMeasuredWidth());
      mMeasured.add(style);
    }

    return YogaMeasureOutput.make(mWidth.get(style), mHeight.get(style));
  }
}
