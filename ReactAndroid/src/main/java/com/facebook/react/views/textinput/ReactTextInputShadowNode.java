/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.textinput;

import javax.annotation.Nullable;

import android.text.Spanned;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;

import com.facebook.csslayout.CSSNode;
import com.facebook.csslayout.MeasureOutput;
import com.facebook.csslayout.Spacing;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.uimanager.CatalystStylesDiffMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.views.text.ReactTextShadowNode;

/* package */ class ReactTextInputShadowNode extends ReactTextShadowNode implements
    CSSNode.MeasureFunction {

  private static final int MEASURE_SPEC = View.MeasureSpec.makeMeasureSpec(
      ViewGroup.LayoutParams.WRAP_CONTENT,
      View.MeasureSpec.UNSPECIFIED);

  private @Nullable EditText mEditText;
  private int mFontSize;
  private @Nullable float[] mComputedPadding;
  private int mJsEventCount = UNSET;
  private int mNumLines = UNSET;

  public ReactTextInputShadowNode() {
    super(false);
    mFontSize = (int) Math.ceil(PixelUtil.toPixelFromSP(ViewDefaults.FONT_SIZE_SP));
    setMeasureFunction(this);
  }

  @Override
  protected void setThemedContext(ThemedReactContext themedContext) {
    super.setThemedContext(themedContext);

    // TODO #7120264: cache this stuff better
    mEditText = new EditText(getThemedContext());
    // This is needed to fix an android bug since 4.4.3 which will throw an NPE in measure,
    // setting the layoutParams fixes it: https://code.google.com/p/android/issues/detail?id=75877
    mEditText.setLayoutParams(
        new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT));

    setDefaultPadding(Spacing.LEFT, mEditText.getPaddingLeft());
    setDefaultPadding(Spacing.TOP, mEditText.getPaddingTop());
    setDefaultPadding(Spacing.RIGHT, mEditText.getPaddingRight());
    setDefaultPadding(Spacing.BOTTOM, mEditText.getPaddingBottom());
    mComputedPadding = spacingToFloatArray(getStylePadding());
  }

  @Override
  public void measure(CSSNode node, float width, MeasureOutput measureOutput) {
    // measure() should never be called before setThemedContext()
    EditText editText = Assertions.assertNotNull(mEditText);

    measureOutput.width = width;
    editText.setTextSize(TypedValue.COMPLEX_UNIT_PX, mFontSize);
    mComputedPadding = spacingToFloatArray(getStylePadding());
    editText.setPadding(
        (int) Math.ceil(getStylePadding().get(Spacing.LEFT)),
        (int) Math.ceil(getStylePadding().get(Spacing.TOP)),
        (int) Math.ceil(getStylePadding().get(Spacing.RIGHT)),
        (int) Math.ceil(getStylePadding().get(Spacing.BOTTOM)));

    if (mNumLines != UNSET) {
      editText.setLines(mNumLines);
    }

    editText.measure(MEASURE_SPEC, MEASURE_SPEC);
    measureOutput.height = editText.getMeasuredHeight();
  }

  @Override
  public void onBeforeLayout() {
    // We don't have to measure the text within the text input.
    return;
  }

  @Override
  public void updateProperties(CatalystStylesDiffMap styles) {
    super.updateProperties(styles);
    if (styles.hasKey(ViewProps.FONT_SIZE)) {
      float fontSize = styles.getFloat(ViewProps.FONT_SIZE, ViewDefaults.FONT_SIZE_SP);
      mFontSize = (int) Math.ceil(PixelUtil.toPixelFromSP(fontSize));
    }

    if (styles.hasKey(ReactTextInputManager.PROP_TEXT_INPUT_MOST_RECENT_EVENT_COUNT)) {
      mJsEventCount =
          styles.getInt(ReactTextInputManager.PROP_TEXT_INPUT_MOST_RECENT_EVENT_COUNT, 0);
    }

    if (styles.hasKey(ViewProps.NUMBER_OF_LINES)) {
      mNumLines = styles.getInt(ViewProps.NUMBER_OF_LINES, UNSET);
    }
  }

  @Override
  public void onCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue) {
    super.onCollectExtraUpdates(uiViewOperationQueue);
    if (mComputedPadding != null) {
      uiViewOperationQueue.enqueueUpdateExtraData(getReactTag(), mComputedPadding);
      mComputedPadding = null;
    }

    if (mJsEventCount != UNSET) {
      Spanned preparedSpannedText = fromTextCSSNode(this);
      ReactTextUpdate reactTextUpdate = new ReactTextUpdate(preparedSpannedText, mJsEventCount);
      uiViewOperationQueue.enqueueUpdateExtraData(getReactTag(), reactTextUpdate);
    }
  }

  @Override
  public void setPadding(int spacingType, float padding) {
    super.setPadding(spacingType, padding);
    mComputedPadding = spacingToFloatArray(getStylePadding());
    markUpdated();
  }

  private static float[] spacingToFloatArray(Spacing spacing) {
    return new float[] {
        spacing.get(Spacing.LEFT),
        spacing.get(Spacing.TOP),
        spacing.get(Spacing.RIGHT),
        spacing.get(Spacing.BOTTOM),
    };
  }
}
