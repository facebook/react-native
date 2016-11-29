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
import javax.annotation.OverridingMethodsMustInvokeSuper;

import android.os.Build;
import android.text.Layout;
import android.text.Spannable;
import android.util.TypedValue;
import android.view.ViewGroup;
import android.widget.EditText;

import com.facebook.yoga.YogaDirection;
import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaNodeAPI;
import com.facebook.yoga.YogaMeasureOutput;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.view.MeasureUtil;
import com.facebook.react.views.text.ReactTextShadowNode;
import com.facebook.react.views.text.ReactTextUpdate;

@VisibleForTesting
public class ReactTextInputShadowNode extends ReactTextShadowNode implements
    YogaMeasureFunction {

  private @Nullable EditText mEditText;
  private @Nullable float[] mComputedPadding;
  private int mJsEventCount = UNSET;

  public ReactTextInputShadowNode() {
    mTextBreakStrategy = (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) ?
        0 : Layout.BREAK_STRATEGY_SIMPLE;
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
      YogaNodeAPI node,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode) {
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

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (editText.getBreakStrategy() != mTextBreakStrategy) {
        editText.setBreakStrategy(mTextBreakStrategy);
      }
    }

    editText.measure(
        MeasureUtil.getMeasureSpec(width, widthMode),
        MeasureUtil.getMeasureSpec(height, heightMode));

    return YogaMeasureOutput.make(editText.getMeasuredWidth(), editText.getMeasuredHeight());
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
  public void setTextBreakStrategy(@Nullable String textBreakStrategy) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return;
    }

    if (textBreakStrategy == null || "simple".equals(textBreakStrategy)) {
      mTextBreakStrategy = Layout.BREAK_STRATEGY_SIMPLE;
    } else if ("highQuality".equals(textBreakStrategy)) {
      mTextBreakStrategy = Layout.BREAK_STRATEGY_HIGH_QUALITY;
    } else if ("balanced".equals(textBreakStrategy)) {
      mTextBreakStrategy = Layout.BREAK_STRATEGY_BALANCED;
    } else {
      throw new JSApplicationIllegalArgumentException("Invalid textBreakStrategy: " + textBreakStrategy);
    }
  }

  @Override
  public void onCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue) {
    super.onCollectExtraUpdates(uiViewOperationQueue);
    if (mComputedPadding != null) {
      float[] updatedPadding = mComputedPadding;
      if (getLayoutDirection() == YogaDirection.RTL) {
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
          mTextAlign,
          mTextBreakStrategy
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
