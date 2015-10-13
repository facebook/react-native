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

import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIProp;

/**
 * Manages instances of ProgressBar. ProgressBar is wrapped in a FrameLayout because the style of
 * the ProgressBar can only be set in the constructor; whenever the style of a ProgressBar changes,
 * we have to drop the existing ProgressBar (if there is one) and create a new one with the style
 * given.
 */
public class ReactProgressBarViewManager extends
    BaseViewManager<FrameLayout, ProgressBarShadowNode> {

  /* package */ static final String PROP_STYLE = "styleAttr";

  /* package */ static final String REACT_CLASS = "AndroidProgressBar";
  /* package */ static final String DEFAULT_STYLE = "Large";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected FrameLayout createViewInstance(ThemedReactContext context) {
    return new FrameLayout(context);
  }

  @ReactProp(name = PROP_STYLE)
  public void setStyle(FrameLayout view, @Nullable String styleName) {
    final int style = getStyleFromString(styleName);
    view.removeAllViews();
    view.addView(
        new ProgressBar(view.getContext(), null, style),
        new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT));
  }

  @Override
  public ProgressBarShadowNode createShadowNodeInstance() {
    return new ProgressBarShadowNode();
  }

  @Override
  public Class<ProgressBarShadowNode> getShadowNodeClass() {
    return ProgressBarShadowNode.class;
  }

  @Override
  public void updateExtraData(FrameLayout root, Object extraData) {
    // do nothing
  }

  /* package */ static int getStyleFromString(@Nullable String styleStr) {
    if (styleStr == null) {
      throw new JSApplicationIllegalArgumentException(
          "ProgressBar needs to have a style, null received");
    } else if (styleStr.equals("Horizontal")) {
      return android.R.attr.progressBarStyleHorizontal;
    }  else if (styleStr.equals("Small")) {
      return android.R.attr.progressBarStyleSmall;
    } else if (styleStr.equals("Large")) {
      return android.R.attr.progressBarStyleLarge;
    } else if (styleStr.equals("Inverse")) {
      return android.R.attr.progressBarStyleInverse;
    } else if (styleStr.equals("SmallInverse")) {
      return android.R.attr.progressBarStyleSmallInverse;
    } else if (styleStr.equals("LargeInverse")) {
      return android.R.attr.progressBarStyleLargeInverse;
    } else {
      throw new JSApplicationIllegalArgumentException("Unknown ProgressBar style: " + styleStr);
    }
  }

}
