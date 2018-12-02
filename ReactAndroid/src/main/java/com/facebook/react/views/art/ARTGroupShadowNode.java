/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.art;

import com.facebook.react.uimanager.ReactShadowNodeImpl;
import javax.annotation.Nullable;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Region;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual ARTGroup view
 */
public class ARTGroupShadowNode extends ARTVirtualNode {

  protected @Nullable RectF mClipping;

  public ARTGroupShadowNode() { }

  @ReactProp(name = "clipping")
  public void setClipping(@Nullable ReadableArray clippingDims) {
    float[] clippingData = PropHelper.toFloatArray(clippingDims);
    if (clippingData != null) {
      mClipping = createClipping(clippingData);
      markUpdated();
    }
  }

  @Override
  public boolean isVirtual() {
    return true;
  }

  public void draw(Canvas canvas, Paint paint, float opacity) {
    opacity *= mOpacity;
    if (opacity > MIN_OPACITY_FOR_DRAW) {
      saveAndSetupCanvas(canvas);

      if (mClipping != null) {
        canvas.clipRect(
          mClipping.left * mScale,
          mClipping.top * mScale,
          mClipping.right * mScale,
          mClipping.bottom * mScale,
          Region.Op.REPLACE);
      }

      for (int i = 0; i < getChildCount(); i++) {
        ARTVirtualNode child = (ARTVirtualNode) getChildAt(i);
        child.draw(canvas, paint, opacity);
        child.markUpdateSeen();
      }

      restoreCanvas(canvas);
    }
  }

  /**
   * Creates a {@link RectF} from an array of dimensions
   * (e.g. [x, y, width, height])
   *
   * @param data the array of dimensions
   * @return the {@link RectF} that can used to clip the canvas
   */
  private static RectF createClipping(float[] data) {
    if (data.length != 4) {
      throw new JSApplicationIllegalArgumentException(
          "Clipping should be array of length 4 (e.g. [x, y, width, height])");
    }
    RectF clippingRect = new RectF(
      data[0], data[1], data[0] + data[2], data[1] + data[3]);
    return clippingRect;
  }
}
