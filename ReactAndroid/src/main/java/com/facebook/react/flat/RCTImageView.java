/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import com.facebook.drawee.drawable.ScalingUtils.ScaleType;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.image.ImageResizeMode;

/**
 * RCTImageView is a top-level node for Image. It can display either a remote image
 * (source must start with http:// or https://) or a local resource (a BitmapDrawable).
 */
/* package */ class RCTImageView<T extends AbstractDrawCommand & DrawImage> extends FlatShadowNode {

  static Object sCallerContext = RCTImageView.class;

  /**
   * Assigns a CallerContext to execute network requests with.
   */
  /* package */ static void setCallerContext(Object callerContext) {
    sCallerContext = callerContext;
  }

  /* package */ static Object getCallerContext() {
    return sCallerContext;
  }

  private T mDrawImage;

  /* package */ RCTImageView(T drawImage) {
    mDrawImage = drawImage;
  }

  @Override
  protected void collectState(
      StateBuilder stateBuilder,
      float left,
      float top,
      float right,
      float bottom,
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    super.collectState(
        stateBuilder,
        left,
        top,
        right,
        bottom,
        clipLeft,
        clipTop,
        clipRight,
        clipBottom);

    if (mDrawImage.hasImageRequest()) {
      mDrawImage = (T) mDrawImage.updateBoundsAndFreeze(
          left,
          top,
          right,
          bottom,
          clipLeft,
          clipTop,
          clipRight,
          clipBottom);
      stateBuilder.addDrawCommand(mDrawImage);
      stateBuilder.addAttachDetachListener(mDrawImage);
    }
  }

  @Override
  boolean doesDraw() {
    return mDrawImage.hasImageRequest() || super.doesDraw();
  }

  @ReactProp(name = "shouldNotifyLoadEvents")
  public void setShouldNotifyLoadEvents(boolean shouldNotifyLoadEvents) {
    getMutableDrawImage().setReactTag(shouldNotifyLoadEvents ? getReactTag() : 0);
  }

  @ReactProp(name = "src")
  public void setSource(@Nullable ReadableArray sources) {
    getMutableDrawImage().setSource(getThemedContext(), sources);
  }

  @ReactProp(name = "tintColor")
  public void setTintColor(int tintColor) {
    getMutableDrawImage().setTintColor(tintColor);
  }

  @ReactProp(name = ViewProps.RESIZE_MODE)
  public void setResizeMode(@Nullable String resizeMode) {
    ScaleType scaleType = ImageResizeMode.toScaleType(resizeMode);
    if (mDrawImage.getScaleType() != scaleType) {
      getMutableDrawImage().setScaleType(scaleType);
    }
  }

  @ReactProp(name = "borderColor", customType = "Color")
  public void setBorderColor(int borderColor) {
    if (mDrawImage.getBorderColor() != borderColor) {
      getMutableDrawImage().setBorderColor(borderColor);
    }
  }

  @Override
  public void setBorder(int spacingType, float borderWidth) {
    super.setBorder(spacingType, borderWidth);

    if (spacingType == Spacing.ALL && mDrawImage.getBorderWidth() != borderWidth) {
      getMutableDrawImage().setBorderWidth(borderWidth);
    }
  }

  @ReactProp(name = "borderRadius")
  public void setBorderRadius(float borderRadius) {
    if (mDrawImage.getBorderRadius() != borderRadius) {
      getMutableDrawImage().setBorderRadius(PixelUtil.toPixelFromDIP(borderRadius));
    }
  }

  @ReactProp(name = "fadeDuration")
  public void setFadeDuration(int durationMs) {
    getMutableDrawImage().setFadeDuration(durationMs);
  }

  @ReactProp(name = "progressiveRenderingEnabled")
  public void setProgressiveRenderingEnabled(boolean enabled) {
    getMutableDrawImage().setProgressiveRenderingEnabled(enabled);
  }

  private T getMutableDrawImage() {
    if (mDrawImage.isFrozen()) {
      mDrawImage = (T) mDrawImage.mutableCopy();
      invalidate();
    }

    return mDrawImage;
  }
}
