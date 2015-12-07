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

import com.facebook.react.uimanager.ReactProp;

/**
 * RCTRawText is a FlatTextShadowNode that can only contain raw text (but not styling).
 */
/* package */ class RCTRawText extends FlatTextShadowNode {

  private @Nullable String mText;

  @Override
  protected void collectText(SpannableStringBuilder builder) {
    if (mText != null) {
      builder.append(mText);
    }

    // RCTRawText cannot have any children, so no recursive calls needed.
  }

  @Override
  protected void applySpans(SpannableStringBuilder builder) {
    // no spans and no children so nothing to do here.
  }

  @ReactProp(name = "text")
  public void setText(@Nullable String text) {
    mText = text;
    notifyChanged(true);
  }
}
