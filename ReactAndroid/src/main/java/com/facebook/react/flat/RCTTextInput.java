/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.text.SpannableStringBuilder;
import android.util.TypedValue;
import android.view.ViewGroup;
import android.widget.EditText;

import com.facebook.csslayout.CSSNode;
import com.facebook.csslayout.MeasureOutput;
import com.facebook.csslayout.Spacing;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.text.ReactTextUpdate;

import static com.facebook.react.views.text.ReactTextShadowNode.UNSET;

public class RCTTextInput extends RCTVirtualText implements AndroidView, CSSNode.MeasureFunction {

  private int mJsEventCount = UNSET;
  private boolean mPaddingChanged = false;
  private int mNumberOfLines = UNSET;
  private @Nullable EditText mEditText;

  public RCTTextInput() {
    forceMountToView();
    setMeasureFunction(this);
  }

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

    setDefaultPadding(Spacing.LEFT, mEditText.getPaddingLeft());
    setDefaultPadding(Spacing.TOP, mEditText.getPaddingTop());
    setDefaultPadding(Spacing.RIGHT, mEditText.getPaddingRight());
    setDefaultPadding(Spacing.BOTTOM, mEditText.getPaddingBottom());
  }

  @Override
  public void measure(CSSNode node, float width, float height, MeasureOutput measureOutput) {
    // measure() should never be called before setThemedContext()
    EditText editText = Assertions.assertNotNull(mEditText);

    int fontSize = getFontSize();
    measureOutput.width = width;
    editText.setTextSize(
        TypedValue.COMPLEX_UNIT_PX,
        fontSize == UNSET ?
            (int) Math.ceil(PixelUtil.toPixelFromSP(ViewDefaults.FONT_SIZE_SP)) : fontSize);
    Spacing padding = getPadding();
    editText.setPadding(
        (int) Math.ceil(padding.get(Spacing.LEFT)),
        (int) Math.ceil(padding.get(Spacing.TOP)),
        (int) Math.ceil(padding.get(Spacing.RIGHT)),
        (int) Math.ceil(padding.get(Spacing.BOTTOM)));

    if (mNumberOfLines != UNSET) {
      editText.setLines(mNumberOfLines);
    }

    editText.measure(0 /* unspecified */, 0 /* unspecified */);
    measureOutput.height = editText.getMeasuredHeight();
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
          new ReactTextUpdate(getText(), mJsEventCount, false);
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

  @Override
  public void setPadding(int spacingType, float padding) {
    if (getPadding().set(spacingType, padding)) {
      mPaddingChanged = true;
      dirty();
    }
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

  /**
   * Returns a new CharSequence that includes all the text and styling information to create Layout.
   */
  SpannableStringBuilder getText() {
    SpannableStringBuilder sb = new SpannableStringBuilder();
    collectText(sb);
    applySpans(sb);
    return sb;
  }

  @Override
  public boolean needsCustomLayoutForChildren() {
    return false;
  }
}
