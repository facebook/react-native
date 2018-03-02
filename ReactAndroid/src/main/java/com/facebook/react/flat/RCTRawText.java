/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.text.Spannable;
import android.text.SpannableStringBuilder;

import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * RCTRawText is a FlatTextShadowNode that can only contain raw text (but not styling).
 */
/* package */ final class RCTRawText extends FlatTextShadowNode {

  private @Nullable String mText;

  @Override
  protected void performCollectText(SpannableStringBuilder builder) {
    if (mText != null) {
      builder.append(mText);
    }
  }

  @Override
  protected void performApplySpans(
      SpannableStringBuilder builder,
      int begin,
      int end,
      boolean isEditable) {
    builder.setSpan(
        this,
        begin,
        end,
        Spannable.SPAN_INCLUSIVE_EXCLUSIVE);
  }

  @Override
  protected void performCollectAttachDetachListeners(StateBuilder stateBuilder) {
    // nothing to do
  }

  @ReactProp(name = "text")
  public void setText(@Nullable String text) {
    mText = text;
    notifyChanged(true);
  }
}
