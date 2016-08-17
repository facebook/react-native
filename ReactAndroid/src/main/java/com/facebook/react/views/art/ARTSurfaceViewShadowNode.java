/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.art;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.view.Surface;

import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ReactShadowNode;

/**
 * Shadow node for ART virtual tree root - ARTSurfaceView
 */
public class ARTSurfaceViewShadowNode extends LayoutShadowNode {

  private Surface mSurface;

  public void setSurface(Surface surface) {
    mSurface = surface;
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
  }

  private void drawOutput() {
    if (mSurface == null) {
      markChildrenUpdatesSeen(this);      
      return;
    }

    Canvas canvas = mSurface.lockHardwareCanvas();

    Paint paint = new Paint();
    for (int i = 0; i < getChildCount(); i++) {
      ARTVirtualNode child = (ARTVirtualNode) getChildAt(i);
      child.draw(canvas, paint, 1f);
      child.markUpdateSeen();
    }

    mSurface.unlockCanvasAndPost(canvas);
  }

  private void markChildrenUpdatesSeen(ReactShadowNode shadowNode) {
    for (int i = 0; i < shadowNode.getChildCount(); i++) {
        ReactShadowNode child = (ReactShadowNode) shadowNode.getChildAt(i);
        child.markUpdateSeen();
        markChildrenUpdatesSeen(child);
      }
  }
}
