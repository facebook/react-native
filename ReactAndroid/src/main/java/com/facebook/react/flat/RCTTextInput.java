/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import android.text.SpannableStringBuilder;

import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.text.ReactTextUpdate;

import static com.facebook.react.views.text.ReactTextShadowNode.UNSET;

public class RCTTextInput extends RCTVirtualText implements AndroidView {
  private int mJsEventCount = UNSET;
  private boolean mPaddingChanged = false;

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
