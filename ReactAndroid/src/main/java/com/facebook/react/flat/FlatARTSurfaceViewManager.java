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

import com.facebook.csslayout.CSSMeasureMode;
import com.facebook.csslayout.CSSNodeAPI;
import com.facebook.csslayout.MeasureOutput;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.art.ARTSurfaceView;

/* protected */ class FlatARTSurfaceViewManager extends
    BaseViewManager<ARTSurfaceView, FlatARTSurfaceViewShadowNode> {

  private static final String REACT_CLASS = "ARTSurfaceView";

  private static final CSSNodeAPI.MeasureFunction MEASURE_FUNCTION = new CSSNodeAPI.MeasureFunction() {
    @Override
    public void measure(
        CSSNodeAPI node,
        float width,
        CSSMeasureMode widthMode,
        float height,
        CSSMeasureMode heightMode,
        MeasureOutput measureOutput) {
      throw new IllegalStateException("SurfaceView should have explicit width and height set");
    }
  };

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public FlatARTSurfaceViewShadowNode createShadowNodeInstance() {
    FlatARTSurfaceViewShadowNode node = new FlatARTSurfaceViewShadowNode();
    node.setMeasureFunction(MEASURE_FUNCTION);
    return node;
  }

  @Override
  public Class<FlatARTSurfaceViewShadowNode> getShadowNodeClass() {
    return FlatARTSurfaceViewShadowNode.class;
  }

  @Override
  protected ARTSurfaceView createViewInstance(ThemedReactContext reactContext) {
    return new ARTSurfaceView(reactContext);
  }

  @Override
  public void updateExtraData(ARTSurfaceView root, Object extraData) {
    root.setBitmap((Bitmap) extraData);
  }
}
