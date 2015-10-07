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

import com.facebook.csslayout.CSSNode;
import com.facebook.csslayout.MeasureOutput;
import com.facebook.react.uimanager.CatalystStylesDiffMap;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.infer.annotation.Assertions;

/**
 * Node responsible for holding the style of the ProgressBar, see under
 * {@link android.R.attr.progressBarStyle} for possible styles. ReactProgressBarViewManager
 * manages how this style is applied to the ProgressBar.
 */
public class ProgressBarShadowNode extends ReactShadowNode implements CSSNode.MeasureFunction {

  private @Nullable String style;

  private final SparseIntArray mHeight = new SparseIntArray();
  private final SparseIntArray mWidth = new SparseIntArray();
  private final Set<Integer> mMeasured = new HashSet<>();

  public ProgressBarShadowNode() {
    setMeasureFunction(this);
  }

  public @Nullable String getStyle() {
    return style;
  }

  public void setStyle(String style) {
    this.style = style;
  }

  @Override
  public void measure(CSSNode node, float width, MeasureOutput measureOutput) {
    final int style = ReactProgressBarViewManager.getStyleFromString(getStyle());
    if (!mMeasured.contains(style)) {
      ProgressBar progressBar = new ProgressBar(getThemedContext(), null, style);
      final int spec = View.MeasureSpec.makeMeasureSpec(
          ViewGroup.LayoutParams.WRAP_CONTENT,
          View.MeasureSpec.UNSPECIFIED);
      progressBar.measure(spec, spec);
      mHeight.put(style, progressBar.getMeasuredHeight());
      mWidth.put(style, progressBar.getMeasuredWidth());
      mMeasured.add(style);
    }

    measureOutput.height = mHeight.get(style);
    measureOutput.width = mWidth.get(style);
  }

  @Override
  public void updateProperties(CatalystStylesDiffMap styles) {
    super.updateProperties(styles);

    if (styles.hasKey(ReactProgressBarViewManager.PROP_STYLE)) {
      String style = styles.getString(ReactProgressBarViewManager.PROP_STYLE);
      Assertions.assertNotNull(
          style,
          "style property should always be set for the progress bar component");
      // TODO(7255944): Validate progressbar style attribute
      setStyle(style);
    } else {
      setStyle(ReactProgressBarViewManager.DEFAULT_STYLE);
    }
  }
}
