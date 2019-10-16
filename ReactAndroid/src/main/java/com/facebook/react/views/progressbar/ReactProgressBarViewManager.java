/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.progressbar;

import android.content.Context;
import android.widget.ProgressBar;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.AndroidProgressBarManagerDelegate;
import com.facebook.react.viewmanagers.AndroidProgressBarManagerInterface;

/**
 * Manages instances of ProgressBar. ProgressBar is wrapped in a ProgressBarContainerView because
 * the style of the ProgressBar can only be set in the constructor; whenever the style of a
 * ProgressBar changes, we have to drop the existing ProgressBar (if there is one) and create a new
 * one with the style given.
 */
@ReactModule(name = ReactProgressBarViewManager.REACT_CLASS)
public class ReactProgressBarViewManager
    extends BaseViewManager<ProgressBarContainerView, ProgressBarShadowNode>
    implements AndroidProgressBarManagerInterface<ProgressBarContainerView> {

  public static final String REACT_CLASS = "AndroidProgressBar";

  /* package */ static final String PROP_STYLE = "styleAttr";
  /* package */ static final String PROP_INDETERMINATE = "indeterminate";
  /* package */ static final String PROP_PROGRESS = "progress";
  /* package */ static final String PROP_ANIMATING = "animating";

  /* package */ static final String DEFAULT_STYLE = "Normal";

  private static Object sProgressBarCtorLock = new Object();

  private final ViewManagerDelegate<ProgressBarContainerView> mDelegate;

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

  public ReactProgressBarViewManager() {
    mDelegate = new AndroidProgressBarManagerDelegate<>(this);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ProgressBarContainerView createViewInstance(ThemedReactContext context) {
    return new ProgressBarContainerView(context);
  }

  @Override
  @ReactProp(name = PROP_STYLE)
  public void setStyleAttr(ProgressBarContainerView view, @Nullable String styleName) {
    view.setStyle(styleName);
  }

  @Override
  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  public void setColor(ProgressBarContainerView view, @Nullable Integer color) {
    view.setColor(color);
  }

  @Override
  @ReactProp(name = PROP_INDETERMINATE)
  public void setIndeterminate(ProgressBarContainerView view, boolean indeterminate) {
    view.setIndeterminate(indeterminate);
  }

  @Override
  @ReactProp(name = PROP_PROGRESS)
  public void setProgress(ProgressBarContainerView view, double progress) {
    view.setProgress(progress);
  }

  @Override
  @ReactProp(name = PROP_ANIMATING)
  public void setAnimating(ProgressBarContainerView view, boolean animating) {
    view.setAnimating(animating);
  }

  @Override
  public void setTestID(ProgressBarContainerView view, @Nullable String value) {
    super.setTestId(view, value);
  }

  @Override
  public void setTypeAttr(ProgressBarContainerView view, @Nullable String value) {}

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

  @Override
  protected ViewManagerDelegate<ProgressBarContainerView> getDelegate() {
    return mDelegate;
  }

  /* package */ static int getStyleFromString(@Nullable String styleStr) {
    if (styleStr == null) {
      throw new JSApplicationIllegalArgumentException(
          "ProgressBar needs to have a style, null received");
    } else if (styleStr.equals("Horizontal")) {
      return android.R.attr.progressBarStyleHorizontal;
    } else if (styleStr.equals("Small")) {
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
