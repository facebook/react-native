/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;

import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.views.art.ARTVirtualNode;

/* package */ class FlatARTSurfaceViewShadowNode extends FlatShadowNode implements AndroidView {
  private boolean mPaddingChanged = false;

  /* package */ FlatARTSurfaceViewShadowNode() {
    forceMountToView();
    forceMountChildrenToView();
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
  public void onCollectExtraUpdates(UIViewOperationQueue uiUpdater) {
    super.onCollectExtraUpdates(uiUpdater);
    uiUpdater.enqueueUpdateExtraData(getReactTag(), drawOutput());
  }

  private Object drawOutput() {
    // TODO(7255985): Use TextureView and pass Surface from the view to draw on it asynchronously
    // instead of passing the bitmap (which is inefficient especially in terms of memory usage)
    Bitmap bitmap = Bitmap.createBitmap(
        (int) getLayoutWidth(),
        (int) getLayoutHeight(),
        Bitmap.Config.ARGB_8888);
    Canvas canvas = new Canvas(bitmap);
    Paint paint = new Paint();
    for (int i = 0; i < getChildCount(); i++) {
      ARTVirtualNode child = (ARTVirtualNode) getChildAt(i);
      child.draw(canvas, paint, 1f);
      child.markUpdateSeen();
    }
    return bitmap;
  }

  @Override
  public boolean needsCustomLayoutForChildren() {
    return false;
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
  public void setPadding(int spacingType, float padding) {
    if (getPadding().set(spacingType, padding)) {
      mPaddingChanged = true;
      dirty();
    }
  }
}
