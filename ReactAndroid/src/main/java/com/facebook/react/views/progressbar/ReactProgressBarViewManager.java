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

import android.content.Context;
import android.widget.ProgressBar;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewProps;

/**
 * Manages instances of ProgressBar. ProgressBar is wrapped in a ProgressBarContainerView because
 * the style of the ProgressBar can only be set in the constructor; whenever the style of a
 * ProgressBar changes, we have to drop the existing ProgressBar (if there is one) and create a new
 * one with the style given.
 */
public class ReactProgressBarViewManager extends
    BaseViewManager<ProgressBarContainerView, ProgressBarShadowNode> {

  /* package */ static final String PROP_STYLE = "styleAttr";
  /* package */ static final String PROP_INDETERMINATE = "indeterminate";
  /* package */ static final String PROP_PROGRESS = "progress";

  /* package */ static final String REACT_CLASS = "AndroidProgressBar";
  /* package */ static final String DEFAULT_STYLE = "Normal";

  private static Object sProgressBarCtorLock = new Object();

  /**
   * We create ProgressBars on both the UI and shadow threads. There is a race condition in the
   * ProgressBar constructor that may cause crashes when two ProgressBars are constructed at the
   * same time on two different threads. This static ctor wrapper protects against that.
   */
  public static ProgressBar createProgressBar(Context context, int style) {
    synchronized (sProgressBarCtorLock) {
      return new ProgressBar(context, null, style);
    }
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ProgressBarContainerView createViewInstance(ThemedReactContext context) {
    return new ProgressBarContainerView(context);
  }

  @ReactProp(name = PROP_STYLE)
  public void setStyle(ProgressBarContainerView view, @Nullable String styleName) {
    view.setStyle(styleName);
  }

  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  public void setColor(ProgressBarContainerView view, @Nullable Integer color) {
    view.setColor(color);
  }

  @ReactProp(name = PROP_INDETERMINATE)
  public void setIndeterminate(ProgressBarContainerView view, boolean indeterminate) {
    view.setIndeterminate(indeterminate);
  }

  @ReactProp(name = PROP_PROGRESS)
  public void setProgress(ProgressBarContainerView view, double progress) {
    view.setProgress(progress);
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
  public void updateExtraData(ProgressBarContainerView root, Object extraData) {
    // do nothing
  }

  @Override
  protected void onAfterUpdateTransaction(ProgressBarContainerView view) {
    view.apply();
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
    } else if (styleStr.equals("Normal")) {
      return android.R.attr.progressBarStyle;
    } else {
      throw new JSApplicationIllegalArgumentException("Unknown ProgressBar style: " + styleStr);
    }
  }

}
