/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.art;

import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.ReactShadowNodeImpl;
import com.facebook.react.uimanager.annotations.ReactProp;
import javax.annotation.Nullable;

/**
 * Base class for ARTView virtual nodes: {@link ARTGroupShadowNode}, {@link ARTShapeShadowNode} and
 * indirectly for {@link ARTTextShadowNode}.
 */
public abstract class ARTVirtualNode extends ReactShadowNodeImpl {

  protected static final float MIN_OPACITY_FOR_DRAW = 0.01f;

  private static final float[] sMatrixData = new float[9];
  private static final float[] sRawMatrix = new float[9];

  protected float mOpacity = 1f;
  private @Nullable Matrix mMatrix = new Matrix();

  protected final float mScale;

  public ARTVirtualNode() {
    mScale = DisplayMetricsHolder.getWindowDisplayMetrics().density;
  }

  protected ARTVirtualNode(ARTVirtualNode artVirtualNode) {
    super(artVirtualNode);
    mScale = artVirtualNode.mScale;
    mOpacity = artVirtualNode.mOpacity;
    mMatrix = new Matrix(artVirtualNode.mMatrix);
  }

  @Override
  public boolean isVirtual() {
    return true;
  }

  public abstract void draw(Canvas canvas, Paint paint, float opacity);

  /**
   * Sets up the transform matrix on the canvas before an element is drawn.
   *
   * NB: for perf reasons this does not apply opacity, as that would mean creating a new canvas
   * layer (which allocates an offscreen bitmap) and having it composited afterwards. Instead, the
   * drawing code should apply opacity recursively.
   *
   * @param canvas the canvas to set up
   */
  protected final void saveAndSetupCanvas(Canvas canvas) {
    canvas.save();
    if (mMatrix != null) {
      canvas.concat(mMatrix);
    }
  }

  /**
   * Restore the canvas after an element was drawn. This is always called in mirror with
   * {@link #saveAndSetupCanvas}.
   *
   * @param canvas the canvas to restore
   */
  protected void restoreCanvas(Canvas canvas) {
    canvas.restore();
  }

  @ReactProp(name = "opacity", defaultFloat = 1f)
  public void setOpacity(float opacity) {
    mOpacity = opacity;
    markUpdated();
  }

  @ReactProp(name = "transform")
  public void setTransform(@Nullable ReadableArray transformArray) {
    if (transformArray != null) {
      int matrixSize = PropHelper.toFloatArray(transformArray, sMatrixData);
      if (matrixSize == 6) {
        setupMatrix();
      } else if (matrixSize != -1) {
        throw new JSApplicationIllegalArgumentException("Transform matrices must be of size 6");
      }
    } else {
      mMatrix = null;
    }
    markUpdated();
  }

  protected void setupMatrix() {
    sRawMatrix[0] = sMatrixData[0];
    sRawMatrix[1] = sMatrixData[2];
    sRawMatrix[2] = sMatrixData[4] * mScale;
    sRawMatrix[3] = sMatrixData[1];
    sRawMatrix[4] = sMatrixData[3];
    sRawMatrix[5] = sMatrixData[5] * mScale;
    sRawMatrix[6] = 0;
    sRawMatrix[7] = 0;
    sRawMatrix[8] = 1;
    if (mMatrix == null) {
      mMatrix = new Matrix();
    }
    mMatrix.setValues(sRawMatrix);
  }
}
