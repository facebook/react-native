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
import android.text.Spanned;

import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * RCTTextInlineImage
 */
/* package */ class RCTTextInlineImage extends FlatTextShadowNode {

  private InlineImageSpanWithPipeline mInlineImageSpan = new InlineImageSpanWithPipeline();

  @Override
  public void setStyleWidth(float width) {
    super.setStyleWidth(width);

    if (mInlineImageSpan.getWidth() != width) {
      getMutableSpan().setWidth(width);
      notifyChanged(true);
    }
  }

  @Override
  public void setStyleHeight(float height) {
    super.setStyleHeight(height);

    if (mInlineImageSpan.getHeight() != height) {
      getMutableSpan().setHeight(height);
      notifyChanged(true);
    }
  }

  @Override
  protected void performCollectText(SpannableStringBuilder builder) {
    builder.append("I");
  }

  @Override
  protected void performApplySpans(SpannableStringBuilder builder, int begin, int end) {
    mInlineImageSpan.freeze();
    builder.setSpan(
        mInlineImageSpan,
        begin,
        end,
        Spanned.SPAN_INCLUSIVE_EXCLUSIVE);
  }

  @Override
  protected void performCollectAttachDetachListeners(StateBuilder stateBuilder) {
    // mInlineImageSpan should already be frozen so no need to freeze it again
    stateBuilder.addAttachDetachListener(mInlineImageSpan);
  }

  @ReactProp(name = "src")
  public void setSource(@Nullable String source) {
    getMutableSpan().setImageRequest(
        ImageRequestHelper.createImageRequest(getThemedContext(), source));
  }

  private InlineImageSpanWithPipeline getMutableSpan() {
    if (mInlineImageSpan.isFrozen()) {
      mInlineImageSpan = mInlineImageSpan.mutableCopy();
    }
    return mInlineImageSpan;
  }
}
