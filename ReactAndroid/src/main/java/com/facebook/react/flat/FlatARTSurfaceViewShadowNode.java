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

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.SurfaceTexture;
import android.util.Log;
import android.view.Surface;
import android.view.TextureView;

import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.views.art.ARTVirtualNode;
import com.facebook.yoga.YogaValue;
import com.facebook.yoga.YogaUnit;

/* package */ class FlatARTSurfaceViewShadowNode extends FlatShadowNode
    implements AndroidView, TextureView.SurfaceTextureListener {
  private boolean mPaddingChanged = false;
  private @Nullable Surface mSurface;

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
    drawOutput();
    uiUpdater.enqueueUpdateExtraData(getReactTag(), this);
  }

  private void drawOutput() {
    if (mSurface == null || !mSurface.isValid()) {
      markChildrenUpdatesSeen(this);
      return;
    }

    try {
      Canvas canvas = mSurface.lockCanvas(null);
      canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);

      Paint paint = new Paint();
      for (int i = 0; i < getChildCount(); i++) {
        ARTVirtualNode child = (ARTVirtualNode) getChildAt(i);
        child.draw(canvas, paint, 1f);
        child.markUpdateSeen();
      }

      if (mSurface == null) {
        return;
      }

      mSurface.unlockCanvasAndPost(canvas);
    } catch (IllegalArgumentException | IllegalStateException e) {
      Log.e(ReactConstants.TAG, e.getClass().getSimpleName() + " in Surface.unlockCanvasAndPost");
    }
  }

  private void markChildrenUpdatesSeen(ReactShadowNode shadowNode) {
    for (int i = 0; i < shadowNode.getChildCount(); i++) {
      ReactShadowNode child = shadowNode.getChildAt(i);
      child.markUpdateSeen();
      markChildrenUpdatesSeen(child);
    }
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
    YogaValue current = getStylePadding(spacingType);
    if (current.unit != YogaUnit.PIXEL || current.value != padding) {
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
  public void onSurfaceTextureAvailable(SurfaceTexture surface, int width, int height) {
    mSurface = new Surface(surface);
    drawOutput();
  }

  @Override
  public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) {
    surface.release();
    mSurface = null;
    return true;
  }

  @Override
  public void onSurfaceTextureSizeChanged(SurfaceTexture surface, int width, int height) {}

  @Override
  public void onSurfaceTextureUpdated(SurfaceTexture surface) {}
}
