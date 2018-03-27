/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import static com.facebook.react.views.text.ReactRawTextShadowNode.PROP_TEXT;
import static com.facebook.react.views.text.ReactTextShadowNode.UNSET;

import android.annotation.TargetApi;
import android.os.Build;
import android.text.SpannableStringBuilder;
import android.util.TypedValue;
import android.view.ViewGroup;
import android.widget.EditText;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.text.ReactTextUpdate;
import com.facebook.react.views.view.MeasureUtil;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureOutput;
import com.facebook.yoga.YogaNode;
import javax.annotation.Nullable;

public class RCTTextInput extends RCTVirtualText implements AndroidView, YogaMeasureFunction {

  @Nullable private String mText;
  private int mJsEventCount = UNSET;
  private boolean mPaddingChanged = false;
  private int mNumberOfLines = UNSET;
  private @Nullable EditText mEditText;

  public RCTTextInput() {
    forceMountToView();
    setMeasureFunction(this);
  }

  @Override
  protected void notifyChanged(boolean shouldRemeasure) {
    super.notifyChanged(shouldRemeasure);
    // needed to trigger onCollectExtraUpdates
    markUpdated();
  }

  @TargetApi(Build.VERSION_CODES.JELLY_BEAN_MR1)
  @Override
  public void setThemedContext(ThemedReactContext themedContext) {
    super.setThemedContext(themedContext);

    mEditText = new EditText(themedContext);
    // This is needed to fix an android bug since 4.4.3 which will throw an NPE in measure,
    // setting the layoutParams fixes it: https://code.google.com/p/android/issues/detail?id=75877
    mEditText.setLayoutParams(
        new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT));

    setDefaultPadding(Spacing.START, mEditText.getPaddingStart());
    setDefaultPadding(Spacing.TOP, mEditText.getPaddingTop());
    setDefaultPadding(Spacing.END, mEditText.getPaddingEnd());
    setDefaultPadding(Spacing.BOTTOM, mEditText.getPaddingBottom());
    mEditText.setPadding(0, 0, 0, 0);
  }

  @Override
  public long measure(
      YogaNode node,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode) {
    // measure() should never be called before setThemedContext()
    EditText editText = Assertions.assertNotNull(mEditText);

    int fontSize = getFontSize();
    editText.setTextSize(
        TypedValue.COMPLEX_UNIT_PX,
        fontSize == UNSET ?
            (int) Math.ceil(PixelUtil.toPixelFromSP(ViewDefaults.FONT_SIZE_SP)) : fontSize);

    if (mNumberOfLines != UNSET) {
      editText.setLines(mNumberOfLines);
    }

    editText.measure(
        MeasureUtil.getMeasureSpec(width, widthMode),
        MeasureUtil.getMeasureSpec(height, heightMode));
    return YogaMeasureOutput.make(editText.getMeasuredWidth(), editText.getMeasuredHeight());
  }

  @Override
  public boolean isVirtual() {
    return false;
  }

  @Override
  public boolean isVirtualAnchor() {
    return true;
  }

  @Override
  public void setBackgroundColor(int backgroundColor) {
    // suppress, this is handled by a ViewManager
  }

  @Override
  public void onCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue) {
    super.onCollectExtraUpdates(uiViewOperationQueue);
    if (mJsEventCount != UNSET) {
      ReactTextUpdate reactTextUpdate =
          new ReactTextUpdate(
              getText(),
              mJsEventCount,
              false,
              getPadding(Spacing.START),
              getPadding(Spacing.TOP),
              getPadding(Spacing.END),
              getPadding(Spacing.BOTTOM),
              UNSET);
      // TODO: the Float.NaN should be replaced with the real line height see D3592781
      uiViewOperationQueue.enqueueUpdateExtraData(getReactTag(), reactTextUpdate);
    }
  }

  @ReactProp(name = "mostRecentEventCount")
  public void setMostRecentEventCount(int mostRecentEventCount) {
    mJsEventCount = mostRecentEventCount;
  }

  @ReactProp(name = ViewProps.NUMBER_OF_LINES, defaultInt = Integer.MAX_VALUE)
  public void setNumberOfLines(int numberOfLines) {
    mNumberOfLines = numberOfLines;
    notifyChanged(true);
  }

  @ReactProp(name = PROP_TEXT)
  public void setText(@Nullable String text) {
    mText = text;
    notifyChanged(true);
  }

  @Override
  public void setPadding(int spacingType, float padding) {
    super.setPadding(spacingType, padding);
    mPaddingChanged = true;
    dirty();
  }

  @Override
  public boolean isPaddingChanged() {
    return mPaddingChanged;
  }

  @Override
  public void resetPaddingChanged() {
    mPaddingChanged = false;
  }

  @Override
  boolean shouldAllowEmptySpans() {
    return true;
  }

  @Override
  boolean isEditable() {
    return true;
  }

  @Override
  protected void performCollectText(SpannableStringBuilder builder) {
    if (mText != null) {
      builder.append(mText);
    }
    super.performCollectText(builder);
  }

  @Override
  public boolean needsCustomLayoutForChildren() {
    return false;
  }
}
