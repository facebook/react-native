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

import com.facebook.csslayout.Spacing;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.text.ReactTextUpdate;

import static com.facebook.react.views.text.ReactTextShadowNode.UNSET;

public class RCTTextInput extends RCTVirtualText {
  private int mJsEventCount = UNSET;
  private @Nullable float[] mComputedPadding;

  public RCTTextInput() {
    forceMountToView();
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

    if (mComputedPadding != null) {
      uiViewOperationQueue.enqueueUpdateExtraData(getReactTag(), mComputedPadding);
      mComputedPadding = null;
    }

    ReactTextUpdate reactTextUpdate =
        new ReactTextUpdate(getText(), mJsEventCount, false);
    uiViewOperationQueue.enqueueUpdateExtraData(getReactTag(), reactTextUpdate);
  }

  @ReactProp(name = "mostRecentEventCount")
  public void setMostRecentEventCount(int mostRecentEventCount) {
    mJsEventCount = mostRecentEventCount;
  }

  @Override
  public void setPadding(int spacingType, float padding) {
    super.setPadding(spacingType, padding);
    mComputedPadding = spacingToFloatArray(getPadding());
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

  /**
   * Returns a new CharSequence that includes all the text and styling information to create Layout.
   */
  SpannableStringBuilder getText() {
    SpannableStringBuilder sb = new SpannableStringBuilder();
    collectText(sb);
    applySpans(sb);
    return sb;
  }
}
