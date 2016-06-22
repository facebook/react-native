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

import java.util.Map;

import android.graphics.Color;
import android.graphics.PorterDuff.Mode;

import com.facebook.csslayout.CSSConstants;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;

public class ReactImageManager extends SimpleViewManager<ReactImageView> {

  public static final String REACT_CLASS = "RCTImageView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private ResourceDrawableIdHelper mResourceDrawableIdHelper;
  private @Nullable AbstractDraweeControllerBuilder mDraweeControllerBuilder;
  private final @Nullable Object mCallerContext;

  public ReactImageManager(
      AbstractDraweeControllerBuilder draweeControllerBuilder,
      Object callerContext) {
    mDraweeControllerBuilder = draweeControllerBuilder;
    mCallerContext = callerContext;
    mResourceDrawableIdHelper = new ResourceDrawableIdHelper();
  }

  public ReactImageManager() {
    // Lazily initialize as FrescoModule have not been initialized yet
    mDraweeControllerBuilder = null;
    mCallerContext = null;
    mResourceDrawableIdHelper = new ResourceDrawableIdHelper();
  }

  public AbstractDraweeControllerBuilder getDraweeControllerBuilder() {
    if (mDraweeControllerBuilder == null) {
      mDraweeControllerBuilder = Fresco.newDraweeControllerBuilder();
    }
    return mDraweeControllerBuilder;
  }

  public Object getCallerContext() {
    return mCallerContext;
  }

  @Override
  public ReactImageView createViewInstance(ThemedReactContext context) {
    return new ReactImageView(
        context,
        getDraweeControllerBuilder(),
        getCallerContext(),
        mResourceDrawableIdHelper);
  }

  // In JS this is Image.props.source
  @ReactProp(name = "src")
  public void setSource(ReactImageView view, @Nullable ReadableArray sources) {
    view.setSource(sources);
  }

  // In JS this is Image.props.loadingIndicatorSource.uri
  @ReactProp(name = "loadingIndicatorSrc")
  public void setLoadingIndicatorSource(ReactImageView view, @Nullable String source) {
    view.setLoadingIndicatorSource(source);
  }

  @ReactProp(name = "borderColor", customType = "Color")
  public void setBorderColor(ReactImageView view, @Nullable Integer borderColor) {
    if (borderColor == null) {
      view.setBorderColor(Color.TRANSPARENT);
    } else {
      view.setBorderColor(borderColor);
    }
  }

  @ReactProp(name = "overlayColor")
  public void setOverlayColor(ReactImageView view, @Nullable Integer overlayColor) {
    if (overlayColor == null) {
      view.setOverlayColor(Color.TRANSPARENT);
    } else {
      view.setOverlayColor(overlayColor);
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
      ViewProps.BORDER_BOTTOM_LEFT_RADIUS
  }, defaultFloat = CSSConstants.UNDEFINED)
  public void setBorderRadius(ReactImageView view, int index, float borderRadius) {
    if (!CSSConstants.isUndefined(borderRadius)) {
      borderRadius = PixelUtil.toPixelFromDIP(borderRadius);
    }

    if (index == 0) {
      view.setBorderRadius(borderRadius);
    } else {
      view.setBorderRadius(borderRadius, index - 1);
    }
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
      view.setColorFilter(tintColor, Mode.SRC_IN);
    }
  }

  @ReactProp(name = "progressiveRenderingEnabled")
  public void setProgressiveRenderingEnabled(ReactImageView view, boolean enabled) {
    view.setProgressiveRenderingEnabled(enabled);
  }

  @ReactProp(name = "fadeDuration")
  public void setFadeDuration(ReactImageView view, int durationMs) {
    view.setFadeDuration(durationMs);
  }

  @ReactProp(name = "shouldNotifyLoadEvents")
  public void setLoadHandlersRegistered(ReactImageView view, boolean shouldNotifyLoadEvents) {
    view.setShouldNotifyLoadEvents(shouldNotifyLoadEvents);
  }

  @Override
  public @Nullable Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
      ImageLoadEvent.eventNameForType(ImageLoadEvent.ON_LOAD_START),
        MapBuilder.of("registrationName", "onLoadStart"),
      ImageLoadEvent.eventNameForType(ImageLoadEvent.ON_LOAD),
        MapBuilder.of("registrationName", "onLoad"),
      ImageLoadEvent.eventNameForType(ImageLoadEvent.ON_LOAD_END),
        MapBuilder.of("registrationName", "onLoadEnd")
    );
  }

  @Override
  protected void onAfterUpdateTransaction(ReactImageView view) {
    super.onAfterUpdateTransaction(view);
    view.maybeUpdateView();
  }
}
