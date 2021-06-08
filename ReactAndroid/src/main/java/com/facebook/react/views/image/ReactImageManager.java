/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image;

import android.graphics.Color;
import android.graphics.PorterDuff.Mode;
import androidx.annotation.Nullable;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.yoga.YogaConstants;
import java.util.Map;

@ReactModule(name = ReactImageManager.REACT_CLASS)
public class ReactImageManager extends SimpleViewManager<ReactImageView> {

  public static final String REACT_CLASS = "RCTImageView";

  private @Nullable AbstractDraweeControllerBuilder mDraweeControllerBuilder;
  private @Nullable GlobalImageLoadListener mGlobalImageLoadListener;
  private final @Nullable Object mCallerContext;
  private final @Nullable ReactCallerContextFactory mCallerContextFactory;

  /**
   * @deprecated use {@link ReactImageManager#ReactImageManager(AbstractDraweeControllerBuilder,
   *     ReactCallerContextFactory)} instead.
   */
  @Deprecated
  public ReactImageManager(
      @Nullable AbstractDraweeControllerBuilder draweeControllerBuilder,
      @Nullable Object callerContext) {
    this(draweeControllerBuilder, null, callerContext);
  }

  /**
   * @deprecated use {@link ReactImageManager#ReactImageManager(AbstractDraweeControllerBuilder,
   *     GlobalImageLoadListener, ReactCallerContextFactory)} instead.
   */
  @Deprecated
  public ReactImageManager(
      @Nullable AbstractDraweeControllerBuilder draweeControllerBuilder,
      @Nullable GlobalImageLoadListener globalImageLoadListener,
      @Nullable Object callerContext) {
    mDraweeControllerBuilder = draweeControllerBuilder;
    mGlobalImageLoadListener = globalImageLoadListener;
    mCallerContext = callerContext;
    mCallerContextFactory = null;
  }

  public ReactImageManager(
      @Nullable AbstractDraweeControllerBuilder draweeControllerBuilder,
      @Nullable ReactCallerContextFactory callerContextFactory) {
    this(draweeControllerBuilder, null, callerContextFactory);
  }

  public ReactImageManager(
      @Nullable AbstractDraweeControllerBuilder draweeControllerBuilder,
      @Nullable GlobalImageLoadListener globalImageLoadListener,
      @Nullable ReactCallerContextFactory callerContextFactory) {
    mDraweeControllerBuilder = draweeControllerBuilder;
    mGlobalImageLoadListener = globalImageLoadListener;
    mCallerContextFactory = callerContextFactory;
    mCallerContext = null;
  }

  public ReactImageManager() {
    // Lazily initialize as FrescoModule have not been initialized yet
    mDraweeControllerBuilder = null;
    mCallerContext = null;
    mCallerContextFactory = null;
  }

  public AbstractDraweeControllerBuilder getDraweeControllerBuilder() {
    if (mDraweeControllerBuilder == null) {
      mDraweeControllerBuilder = Fresco.newDraweeControllerBuilder();
    }
    return mDraweeControllerBuilder;
  }

  /** @deprecated use {@link ReactCallerContextFactory} instead */
  @Deprecated
  public Object getCallerContext() {
    return mCallerContext;
  }

  @Override
  public ReactImageView createViewInstance(ThemedReactContext context) {
    Object callerContext =
        mCallerContextFactory != null
            ? mCallerContextFactory.getOrCreateCallerContext(context.getModuleName(), null)
            : getCallerContext();
    return new ReactImageView(
        context, getDraweeControllerBuilder(), mGlobalImageLoadListener, callerContext);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @ReactProp(name = "accessible")
  public void setAccessible(ReactImageView view, boolean accessible) {
    view.setFocusable(accessible);
  }

  // In JS this is Image.props.source
  @ReactProp(name = "src")
  public void setSource(ReactImageView view, @Nullable ReadableArray sources) {
    view.setSource(sources);
  }

  @ReactProp(name = "blurRadius")
  public void setBlurRadius(ReactImageView view, float blurRadius) {
    view.setBlurRadius(blurRadius);
  }

  @ReactProp(name = "internal_analyticTag")
  public void setInternal_AnalyticsTag(ReactImageView view, @Nullable String analyticTag) {
    if (mCallerContextFactory != null) {
      view.updateCallerContext(
          mCallerContextFactory.getOrCreateCallerContext(
              ((ThemedReactContext) view.getContext()).getModuleName(), analyticTag));
    }
  }

  // In JS this is Image.props.defaultSource
  @ReactProp(name = "defaultSrc")
  public void setDefaultSource(ReactImageView view, @Nullable String source) {
    view.setDefaultSource(source);
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

  @ReactProp(name = "overlayColor", customType = "Color")
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

  @ReactPropGroup(
      names = {
        ViewProps.BORDER_RADIUS,
        ViewProps.BORDER_TOP_LEFT_RADIUS,
        ViewProps.BORDER_TOP_RIGHT_RADIUS,
        ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
        ViewProps.BORDER_BOTTOM_LEFT_RADIUS
      },
      defaultFloat = YogaConstants.UNDEFINED)
  public void setBorderRadius(ReactImageView view, int index, float borderRadius) {
    if (!YogaConstants.isUndefined(borderRadius)) {
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
    view.setTileMode(ImageResizeMode.toTileMode(resizeMode));
  }

  @ReactProp(name = ViewProps.RESIZE_METHOD)
  public void setResizeMethod(ReactImageView view, @Nullable String resizeMethod) {
    if (resizeMethod == null || "auto".equals(resizeMethod)) {
      view.setResizeMethod(ImageResizeMethod.AUTO);
    } else if ("resize".equals(resizeMethod)) {
      view.setResizeMethod(ImageResizeMethod.RESIZE);
    } else if ("scale".equals(resizeMethod)) {
      view.setResizeMethod(ImageResizeMethod.SCALE);
    } else {
      throw new JSApplicationIllegalArgumentException(
          "Invalid resize method: '" + resizeMethod + "'");
    }
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

  @ReactProp(name = "headers")
  public void setHeaders(ReactImageView view, ReadableMap headers) {
    view.setHeaders(headers);
  }

  @Override
  public @Nullable Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
        ImageLoadEvent.eventNameForType(ImageLoadEvent.ON_LOAD_START),
        MapBuilder.of("registrationName", "onLoadStart"),
        ImageLoadEvent.eventNameForType(ImageLoadEvent.ON_PROGRESS),
        MapBuilder.of("registrationName", "onProgress"),
        ImageLoadEvent.eventNameForType(ImageLoadEvent.ON_LOAD),
        MapBuilder.of("registrationName", "onLoad"),
        ImageLoadEvent.eventNameForType(ImageLoadEvent.ON_ERROR),
        MapBuilder.of("registrationName", "onError"),
        ImageLoadEvent.eventNameForType(ImageLoadEvent.ON_LOAD_END),
        MapBuilder.of("registrationName", "onLoadEnd"));
  }

  @Override
  protected void onAfterUpdateTransaction(ReactImageView view) {
    super.onAfterUpdateTransaction(view);
    view.maybeUpdateView();
  }
}
