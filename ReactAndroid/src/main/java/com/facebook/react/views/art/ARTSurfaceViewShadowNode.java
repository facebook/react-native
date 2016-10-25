/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.art;

import javax.annotation.Nullable;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Color;
import android.view.Surface;
import android.graphics.PorterDuff;
import android.graphics.SurfaceTexture;
import android.view.TextureView;

import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ReactShadowNode;

/**
 * Shadow node for ART virtual tree root - ARTSurfaceView
 */
public class ARTSurfaceViewShadowNode extends LayoutShadowNode
  implements TextureView.SurfaceTextureListener {

  private @Nullable Surface mSurface;

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
      FLog.e(ReactConstants.TAG, e.getClass().getSimpleName() + " in Surface.unlockCanvasAndPost");
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
