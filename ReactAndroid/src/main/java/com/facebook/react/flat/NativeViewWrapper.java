/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaUnit;
import com.facebook.yoga.YogaValue;

import javax.annotation.Nullable;

/* package */ final class NativeViewWrapper extends FlatShadowNode implements AndroidView {

  @Nullable
  private final ReactShadowNode mReactShadowNode;
  private final boolean mNeedsCustomLayoutForChildren;
  private boolean mPaddingChanged = false;
  private boolean mForceMountGrandChildrenToView;

  /* package */ NativeViewWrapper(ViewManager viewManager) {
    ReactShadowNode reactShadowNode = viewManager.createShadowNodeInstance();
    if (reactShadowNode instanceof YogaMeasureFunction) {
      mReactShadowNode = reactShadowNode;
      setMeasureFunction((YogaMeasureFunction) reactShadowNode);
    } else {
      mReactShadowNode = null;
    }

    if (viewManager instanceof ViewGroupManager) {
      ViewGroupManager viewGroupManager = (ViewGroupManager) viewManager;
      mNeedsCustomLayoutForChildren = viewGroupManager.needsCustomLayoutForChildren();
      mForceMountGrandChildrenToView = viewGroupManager.shouldPromoteGrandchildren();
    } else {
      mNeedsCustomLayoutForChildren = false;
    }

    forceMountToView();
    forceMountChildrenToView();
  }

  @Override
  public boolean needsCustomLayoutForChildren() {
    return mNeedsCustomLayoutForChildren;
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
  public void setBackgroundColor(int backgroundColor) {
    // suppress, this is handled by a ViewManager
  }

  @Override
  public void setReactTag(int reactTag) {
    super.setReactTag(reactTag);
    if (mReactShadowNode != null) {
      mReactShadowNode.setReactTag(reactTag);
    }
  }

  @Override
  public void setThemedContext(ThemedReactContext themedContext) {
    super.setThemedContext(themedContext);

    if (mReactShadowNode != null) {
      mReactShadowNode.setThemedContext(themedContext);
    }
  }

  @Override
  /* package*/ void handleUpdateProperties(ReactStylesDiffMap styles) {
    if (mReactShadowNode != null) {
      mReactShadowNode.updateProperties(styles);
    }
  }

  @Override
  public void addChildAt(ReactShadowNode child, int i) {
    super.addChildAt(child, i);
    if (mForceMountGrandChildrenToView && child instanceof FlatShadowNode) {
      ((FlatShadowNode) child).forceMountChildrenToView();
    }
  }

  @Override
  public void setPadding(int spacingType, float padding) {
    YogaValue current = getStylePadding(spacingType);
    if (current.unit != YogaUnit.POINT || current.value != padding) {
      super.setPadding(spacingType, padding);
      mPaddingChanged = true;
      markUpdated();
    }
  }

  @Override
  public void setPaddingPercent(int spacingType, float percent) {
    YogaValue current = getStylePadding(spacingType);
    if (current.unit != YogaUnit.PERCENT || current.value != percent) {
      super.setPadding(spacingType, percent);
      mPaddingChanged = true;
      markUpdated();
    }
  }

  @Override
  public void onCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue) {
    if (mReactShadowNode != null && mReactShadowNode.hasUnseenUpdates()) {
      mReactShadowNode.onCollectExtraUpdates(uiViewOperationQueue);
      markUpdateSeen();
    }
  }
}
