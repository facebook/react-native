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

import android.text.Spannable;
import android.util.TypedValue;
import android.view.ViewGroup;
import android.widget.EditText;

import com.facebook.csslayout.CSSDirection;
import com.facebook.csslayout.CSSMeasureMode;
import com.facebook.csslayout.CSSNodeAPI;
import com.facebook.csslayout.MeasureOutput;
import com.facebook.csslayout.Spacing;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.view.MeasureUtil;
import com.facebook.react.views.text.ReactTextShadowNode;
import com.facebook.react.views.text.ReactTextUpdate;

@VisibleForTesting
public class ReactTextInputShadowNode extends ReactTextShadowNode implements
    CSSNodeAPI.MeasureFunction {

  private @Nullable EditText mEditText;
  private @Nullable float[] mComputedPadding;
  private int mJsEventCount = UNSET;

  public ReactTextInputShadowNode() {
    super(false);
    setMeasureFunction(this);
  }

  @Override
  public void setThemedContext(ThemedReactContext themedContext) {
    super.setThemedContext(themedContext);

    // TODO #7120264: cache this stuff better
    mEditText = new EditText(getThemedContext());
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
    mComputedPadding = new float[] {
        getPadding(Spacing.START),
        getPadding(Spacing.TOP),
        getPadding(Spacing.END),
        getPadding(Spacing.BOTTOM),
    };
  }

  @Override
  public long measure(
      CSSNodeAPI node,
      float width,
      CSSMeasureMode widthMode,
      float height,
      CSSMeasureMode heightMode) {
    // measure() should never be called before setThemedContext()
    EditText editText = Assertions.assertNotNull(mEditText);

    editText.setTextSize(
        TypedValue.COMPLEX_UNIT_PX,
        mFontSize == UNSET ?
            (int) Math.ceil(PixelUtil.toPixelFromSP(ViewDefaults.FONT_SIZE_SP)) : mFontSize);
    mComputedPadding = new float[] {
        getPadding(Spacing.START),
        getPadding(Spacing.TOP),
        getPadding(Spacing.END),
        getPadding(Spacing.BOTTOM),
    };
    editText.setPadding(
        (int) Math.floor(getPadding(Spacing.START)),
        (int) Math.floor(getPadding(Spacing.TOP)),
        (int) Math.floor(getPadding(Spacing.END)),
        (int) Math.floor(getPadding(Spacing.BOTTOM)));

    if (mNumberOfLines != UNSET) {
      editText.setLines(mNumberOfLines);
    }

    editText.measure(
        MeasureUtil.getMeasureSpec(width, widthMode),
        MeasureUtil.getMeasureSpec(height, heightMode));

    return MeasureOutput.make(editText.getMeasuredWidth(), editText.getMeasuredHeight());
  }

  @Override
  public void onBeforeLayout() {
    // We don't have to measure the text within the text input.
    return;
  }

  @ReactProp(name = "mostRecentEventCount")
  public void setMostRecentEventCount(int mostRecentEventCount) {
    mJsEventCount = mostRecentEventCount;
  }

  @Override
  public void onCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue) {
    super.onCollectExtraUpdates(uiViewOperationQueue);
    if (mComputedPadding != null) {
      float[] updatedPadding = mComputedPadding;
      if (getLayoutDirection() == CSSDirection.RTL) {
        updatedPadding = new float[] {
            getPadding(Spacing.END),
            getPadding(Spacing.TOP),
            getPadding(Spacing.START),
            getPadding(Spacing.BOTTOM),
        };
      }
      uiViewOperationQueue.enqueueUpdateExtraData(getReactTag(), updatedPadding);
      mComputedPadding = null;
    }

    if (mJsEventCount != UNSET) {
      Spannable preparedSpannableText = fromTextCSSNode(this);
      ReactTextUpdate reactTextUpdate =
        new ReactTextUpdate(
          preparedSpannableText,
          mJsEventCount,
          mContainsImages,
          getPadding(Spacing.START),
          getPadding(Spacing.TOP),
          getPadding(Spacing.END),
          getPadding(Spacing.BOTTOM),
          mTextAlign
        );
      uiViewOperationQueue.enqueueUpdateExtraData(getReactTag(), reactTextUpdate);
    }
  }

  @Override
  public void setPadding(int spacingType, float padding) {
    super.setPadding(spacingType, padding);
    mComputedPadding = new float[] {
        getPadding(Spacing.START),
        getPadding(Spacing.TOP),
        getPadding(Spacing.END),
        getPadding(Spacing.BOTTOM),
    };
    markUpdated();
  }
}
