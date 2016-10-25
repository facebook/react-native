/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.art;

import com.facebook.csslayout.CSSMeasureMode;
import com.facebook.csslayout.CSSNodeAPI;
import com.facebook.csslayout.MeasureOutput;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.ThemedReactContext;

/**
 * ViewManager for ARTSurfaceView React views. Renders as a {@link ARTSurfaceView} and handles
 * invalidating the native view on shadow view updates happening in the underlying tree.
 */
@ReactModule(name = ARTSurfaceViewManager.REACT_CLASS)
public class ARTSurfaceViewManager extends
    BaseViewManager<ARTSurfaceView, ARTSurfaceViewShadowNode> {

  protected static final String REACT_CLASS = "ARTSurfaceView";

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
  public ARTSurfaceViewShadowNode createShadowNodeInstance() {
    ARTSurfaceViewShadowNode node = new ARTSurfaceViewShadowNode();
    node.setMeasureFunction(MEASURE_FUNCTION);
    return node;
  }

  @Override
  public Class<ARTSurfaceViewShadowNode> getShadowNodeClass() {
    return ARTSurfaceViewShadowNode.class;
  }

  @Override
  protected ARTSurfaceView createViewInstance(ThemedReactContext reactContext) {
    return new ARTSurfaceView(reactContext);
  }

  @Override
  public void updateExtraData(ARTSurfaceView root, Object extraData) {
    root.setSurfaceTextureListener((ARTSurfaceViewShadowNode) extraData);
  }
}
