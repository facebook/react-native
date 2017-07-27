/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.art;

import com.facebook.yoga.YogaMeasureMode;
import com.facebook.yoga.YogaMeasureFunction;
import com.facebook.yoga.YogaNode;
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

  private static final YogaMeasureFunction MEASURE_FUNCTION = new YogaMeasureFunction() {
    @Override
    public long measure(
        YogaNode node,
        float width,
        YogaMeasureMode widthMode,
        float height,
        YogaMeasureMode heightMode) {
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

  @Override
  public void setBackgroundColor(ARTSurfaceView view, int backgroundColor) {
    // As of Android N TextureView does not support calling setBackground on it.
    // It will also throw an exception when target SDK is set to N or higher.

    // Setting the background color for this view is handled in the shadow node.
  }
}
