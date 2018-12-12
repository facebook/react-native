/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
import android.os.Build;

import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.bridge.LifecycleEventListener;

/**
 * Shadow node for ART virtual tree root - ARTSurfaceView
 */
public class ARTSurfaceViewShadowNode extends LayoutShadowNode
  implements TextureView.SurfaceTextureListener, LifecycleEventListener {

  private @Nullable Surface mSurface;

  private @Nullable Integer mBackgroundColor;

  @ReactProp(name = ViewProps.BACKGROUND_COLOR, customType = "Color")
  public void setBackgroundColor(Integer color) {
    mBackgroundColor = color;
    markUpdated();
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
    drawOutput(false);
    uiUpdater.enqueueUpdateExtraData(getReactTag(), this);
  }

  private void drawOutput(boolean markAsUpdated) {
    if (mSurface == null || !mSurface.isValid()) {
      markChildrenUpdatesSeen(this);
      return;
    }

    try {
      Canvas canvas = mSurface.lockCanvas(null);
      canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
      if (mBackgroundColor != null) {
        canvas.drawColor(mBackgroundColor);
      }

      Paint paint = new Paint();
      for (int i = 0; i < getChildCount(); i++) {
        ARTVirtualNode child = (ARTVirtualNode) getChildAt(i);
        child.draw(canvas, paint, 1f);
        if (markAsUpdated) {
          child.markUpdated();
        } else {
          child.markUpdateSeen();
        }
      }

      if (mSurface == null) {
        return;
      }
      mSurface.unlockCanvasAndPost(canvas);
    } catch (IllegalArgumentException | IllegalStateException e) {
      FLog.e(ReactConstants.TAG, e.getClass().getSimpleName() + " in Surface.unlockCanvasAndPost");
    }
  }

  public void setupSurfaceTextureListener(ARTSurfaceView surfaceView) {
    SurfaceTexture surface = surfaceView.getSurfaceTexture();
    surfaceView.setSurfaceTextureListener(this);
    if (surface != null && mSurface == null) {
      mSurface = new Surface(surface);
      drawOutput(true);
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
  public void setThemedContext(ThemedReactContext themedContext) {
    super.setThemedContext(themedContext);
    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.N) {
      themedContext.addLifecycleEventListener(this);
    }
  }

  @Override
  public void dispose() {
    super.dispose();
    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.N) {
      getThemedContext().removeLifecycleEventListener(this);
    }
  }

  @Override
  public void onHostResume() {
    drawOutput(false);
  }

  @Override
  public void onHostPause() {}

  @Override
  public void onHostDestroy() {}

  @Override
  public void onSurfaceTextureAvailable(SurfaceTexture surface, int width, int height) {
    mSurface = new Surface(surface);
    drawOutput(false);
  }

  @Override
  public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) {
    mSurface.release();
    mSurface = null;
    return true;
  }

  @Override
  public void onSurfaceTextureSizeChanged(SurfaceTexture surface, int width, int height) {}

  @Override
  public void onSurfaceTextureUpdated(SurfaceTexture surface) {}
}
