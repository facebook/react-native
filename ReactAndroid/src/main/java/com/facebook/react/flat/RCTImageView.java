/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.content.Context;
import android.content.res.Resources;
import android.net.Uri;

import com.facebook.csslayout.Spacing;
import com.facebook.drawee.drawable.ScalingUtils.ScaleType;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.views.image.ImageResizeMode;

/**
 * RCTImageView is a top-level node for Image. It can display either a remote image
 * (source must start wtih http:// or https://) or a local resource (a BitmapDrawable).
 */
/* package */ class RCTImageView<T extends AbstractDrawCommand & DrawImage> extends FlatShadowNode {

  static Object sCallerContext = RCTImageView.class;

  /**
   * Assignes a CallerContext to execute network requests with.
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

  @ReactProp(name = "src")
  public void setSource(@Nullable String source) {
    if (source == null) {
      getMutableDrawImage().setImageRequest(null);
      return;
    }

    final ImageRequestBuilder imageRequestBuilder;
    if (isNetworkResource(source)) {
      imageRequestBuilder = ImageRequestBuilder.newBuilderWithSource(Uri.parse(source));
    } else {
      Context context = getThemedContext();
      Resources resources = context.getResources();
      int resId = resources.getIdentifier(
          source,
          "drawable",
          context.getPackageName());
      imageRequestBuilder = ImageRequestBuilder.newBuilderWithResourceId(resId);
    }

    getMutableDrawImage().setImageRequest(imageRequestBuilder.build());
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

  private T getMutableDrawImage() {
    if (mDrawImage.isFrozen()) {
      mDrawImage = (T) mDrawImage.mutableCopy();
      invalidate();
    }

    return mDrawImage;
  }

  private static boolean isNetworkResource(String source) {
    return source.startsWith("http://") || source.startsWith("https://");
  }
}
