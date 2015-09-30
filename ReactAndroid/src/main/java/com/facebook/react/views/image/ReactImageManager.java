/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.image;

import javax.annotation.Nullable;

import android.graphics.Color;

import com.facebook.csslayout.CSSConstants;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.ReactPropGroup;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewProps;

public class ReactImageManager extends SimpleViewManager<ReactImageView> {

  public static final String REACT_CLASS = "RCTImageView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private final @Nullable AbstractDraweeControllerBuilder mDraweeControllerBuilder;
  private final @Nullable Object mCallerContext;

  public ReactImageManager(
      AbstractDraweeControllerBuilder draweeControllerBuilder,
      Object callerContext) {
    mDraweeControllerBuilder = draweeControllerBuilder;
    mCallerContext = callerContext;
  }

  public ReactImageManager() {
    mDraweeControllerBuilder = null;
    mCallerContext = null;
  }

  @Override
  public ReactImageView createViewInstance(ThemedReactContext context) {
    return new ReactImageView(
        context,
        mDraweeControllerBuilder == null ?
            Fresco.newDraweeControllerBuilder() : mDraweeControllerBuilder,
        mCallerContext);
  }

  // In JS this is Image.props.source.uri
  @ReactProp(name = "src")
  public void setSource(ReactImageView view, @Nullable String source) {
    view.setSource(source);
  }

  @ReactProp(name = "borderColor", customType = "Color")
  public void setBorderColor(ReactImageView view, @Nullable Integer borderColor) {
    if (borderColor == null) {
      view.setBorderColor(Color.TRANSPARENT);
    } else {
      view.setBorderColor(borderColor);
    }
  }

  @ReactProp(name = "borderWidth")
  public void setBorderWidth(ReactImageView view, float borderWidth) {
    view.setBorderWidth(borderWidth);
  }

  @ReactPropGroup(names = {
      ViewProps.BORDER_RADIUS,
      ViewProps.BORDER_TOP_LEFT_RADIUS,
      ViewProps.BORDER_TOP_RIGHT_RADIUS,
      ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
      ViewProps.BORDER_BOTTOM_LEFT_RADIUS,
      ViewProps.BORDER_TOP_LEFT_HORIZONTAL_RADIUS,
      ViewProps.BORDER_TOP_LEFT_VERTICAL_RADIUS,
      ViewProps.BORDER_TOP_RIGHT_HORIZONTAL_RADIUS,
      ViewProps.BORDER_TOP_RIGHT_VERTICAL_RADIUS,
      ViewProps.BORDER_BOTTOM_RIGHT_HORIZONTAL_RADIUS,
      ViewProps.BORDER_BOTTOM_RIGHT_VERTICAL_RADIUS,
      ViewProps.BORDER_BOTTOM_LEFT_HORIZONTAL_RADIUS,
      ViewProps.BORDER_BOTTOM_LEFT_VERTICAL_RADIUS
  }, defaultFloat = CSSConstants.UNDEFINED)
  public void setBorderRadius(ReactImageView view, int index, float radius) {
    if (!CSSConstants.isUndefined(radius)) {
      radius = PixelUtil.toPixelFromDIP(radius);
    }

    if (index == 0) {
      view.setBorderRadius(0, 8, radius);
      return;
    }

    if (index < 5) {
      view.setBorderRadius((index-1)*2, 2, radius);
      return;
    }

    view.setBorderRadius(index-5, 1, radius);
  }

  @ReactProp(name = ViewProps.RESIZE_MODE)
  public void setResizeMode(ReactImageView view, @Nullable String resizeMode) {
    view.setScaleType(ImageResizeMode.toScaleType(resizeMode));
  }

  @ReactProp(name = "tintColor", customType = "Color")
  public void setTintColor(ReactImageView view, @Nullable Integer tintColor) {
    if (tintColor == null) {
      view.clearColorFilter();
    } else {
      view.setColorFilter(tintColor);
    }
  }

  @Override
  protected void onAfterUpdateTransaction(ReactImageView view) {
    super.onAfterUpdateTransaction(view);
    view.maybeUpdateView();
  }
}
