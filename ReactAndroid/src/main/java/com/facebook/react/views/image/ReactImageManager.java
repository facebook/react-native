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

import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.react.uimanager.CSSColorUtil;
import com.facebook.react.uimanager.CatalystStylesDiffMap;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIProp;
import com.facebook.react.uimanager.ViewProps;

public class ReactImageManager extends SimpleViewManager<ReactImageView> {

  public static final String REACT_CLASS = "RCTImageView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  // In JS this is Image.props.source.uri
  @UIProp(UIProp.Type.STRING)
  public static final String PROP_SRC = "src";
  @UIProp(UIProp.Type.NUMBER)
  public static final String PROP_BORDER_RADIUS = "borderRadius";
  @UIProp(UIProp.Type.STRING)
  public static final String PROP_RESIZE_MODE = ViewProps.RESIZE_MODE;
  private static final String PROP_TINT_COLOR = "tintColor";

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

  @Override
  public void updateView(final ReactImageView view, final CatalystStylesDiffMap props) {
    super.updateView(view, props);

    if (props.hasKey(PROP_RESIZE_MODE)) {
      view.setScaleType(ImageResizeMode.toScaleType(props.getString(PROP_RESIZE_MODE)));
    }
    if (props.hasKey(PROP_SRC)) {
       view.setSource(props.getString(PROP_SRC));
    }
    if (props.hasKey(PROP_BORDER_RADIUS)) {
      view.setBorderRadius(props.getFloat(PROP_BORDER_RADIUS, 0.0f));
    }
    if (props.hasKey(PROP_TINT_COLOR)) {
      String tintColorString = props.getString(PROP_TINT_COLOR);
      if (tintColorString == null) {
        view.clearColorFilter();
      } else {
        view.setColorFilter(CSSColorUtil.getColor(tintColorString));
      }
    }
    view.maybeUpdateView();
  }
}
