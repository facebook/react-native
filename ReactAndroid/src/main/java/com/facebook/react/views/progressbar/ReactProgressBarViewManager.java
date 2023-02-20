/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.progressbar;

import android.content.Context;
import android.util.Pair;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.viewmanagers.AndroidProgressBarManagerDelegate;
import com.facebook.react.viewmanagers.AndroidProgressBarManagerInterface;
import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureOutput;
import java.util.WeakHashMap;

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

  private final WeakHashMap<Integer, Pair<Integer, Integer>> mMeasuredStyles = new WeakHashMap<>();

  /* package */ static final String PROP_STYLE = "styleAttr";
  /* package */ static final String PROP_ATTR = "typeAttr";
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
  @ReactProp(name = PROP_ATTR)
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
      FLog.w(ReactConstants.TAG, "ProgressBar needs to have a style, null received");
      return android.R.attr.progressBarStyle;
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
      FLog.w(ReactConstants.TAG, "Unknown ProgressBar style: " + styleStr);
      return android.R.attr.progressBarStyle;
    }
  }

  @Override
  public long measure(
      Context context,
      ReadableMap localData,
      ReadableMap props,
      ReadableMap state,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode,
      @Nullable float[] attachmentsPositions) {

    final Integer style =
        ReactProgressBarViewManager.getStyleFromString(props.getString(PROP_STYLE));
    Pair<Integer, Integer> value = mMeasuredStyles.get(style);
    if (value == null) {
      ProgressBar progressBar = ReactProgressBarViewManager.createProgressBar(context, style);

      final int spec =
          View.MeasureSpec.makeMeasureSpec(
              ViewGroup.LayoutParams.WRAP_CONTENT, View.MeasureSpec.UNSPECIFIED);
      progressBar.measure(spec, spec);
      value = Pair.create(progressBar.getMeasuredWidth(), progressBar.getMeasuredHeight());
      mMeasuredStyles.put(style, value);
    }

    return YogaMeasureOutput.make(
        PixelUtil.toDIPFromPixel(value.first), PixelUtil.toDIPFromPixel(value.second));
  }
}
