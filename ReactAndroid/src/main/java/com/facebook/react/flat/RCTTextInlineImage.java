/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.text.SpannableStringBuilder;
import android.text.Spanned;

import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.imagehelper.ImageSource;

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
  protected void performApplySpans(
      SpannableStringBuilder builder,
      int begin,
      int end,
      boolean isEditable) {
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
  public void setSource(@Nullable ReadableArray sources) {
    final String source =
        (sources == null || sources.size() == 0) ? null : sources.getMap(0).getString("uri");
    final ImageSource imageSource = source == null ? null :
        new ImageSource(getThemedContext(), source);
    getMutableSpan().setImageRequest(imageSource == null ? null :
        ImageRequestBuilder.newBuilderWithSource(imageSource.getUri()).build());
  }

  private InlineImageSpanWithPipeline getMutableSpan() {
    if (mInlineImageSpan.isFrozen()) {
      mInlineImageSpan = mInlineImageSpan.mutableCopy();
    }
    return mInlineImageSpan;
  }
}
