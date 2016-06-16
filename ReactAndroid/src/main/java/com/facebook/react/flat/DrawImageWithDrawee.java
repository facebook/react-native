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

import java.util.HashMap;
import java.util.Map;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffColorFilter;
import android.graphics.drawable.Animatable;

import com.facebook.drawee.controller.ControllerListener;
import com.facebook.drawee.drawable.ScalingUtils.ScaleType;
import com.facebook.drawee.generic.GenericDraweeHierarchy;
import com.facebook.drawee.generic.RoundingParams;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.views.image.ImageLoadEvent;
import com.facebook.react.views.image.ImageResizeMode;
import com.facebook.react.views.image.ReactImageView;

/**
 * DrawImageWithDrawee is DrawCommand that can draw a local or remote image.
 * It uses DraweeRequestHelper internally to fetch and cache the images.
 */
/* package */ final class DrawImageWithDrawee extends AbstractDrawCommand
    implements DrawImage, ControllerListener {

  private @Nullable Map<String, Double> mSources;
  private @Nullable String mImageSource;
  private @Nullable Context mContext;
  private @Nullable DraweeRequestHelper mRequestHelper;
  private @Nullable PorterDuffColorFilter mColorFilter;
  private ScaleType mScaleType = ImageResizeMode.defaultValue();
  private float mBorderWidth;
  private float mBorderRadius;
  private int mBorderColor;
  private int mReactTag;
  private int mFadeDuration = ReactImageView.REMOTE_IMAGE_FADE_DURATION_MS;
  private @Nullable FlatViewGroup.InvalidateCallback mCallback;

  @Override
  public boolean hasImageRequest() {
    return mSources != null && !mSources.isEmpty();
  }

  @Override
  public void setSource(Context context, @Nullable ReadableArray sources) {
    if (mSources == null) {
      mSources = new HashMap<>();
    }
    mSources.clear();
    if (sources != null && sources.size() != 0) {
      // Optimize for the case where we have just one uri, case in which we don't need the sizes
      if (sources.size() == 1) {
        mSources.put(sources.getMap(0).getString("uri"), 0.0d);
      } else {
        for (int idx = 0; idx < sources.size(); idx++) {
          ReadableMap source = sources.getMap(idx);
          mSources.put(
              source.getString("uri"),
              source.getDouble("width") * source.getDouble("height"));
        }
      }
    }
    mContext = context;
  }

  @Override
  public void setTintColor(int tintColor) {
    if (tintColor == 0) {
      mColorFilter = null;
    } else {
      mColorFilter = new PorterDuffColorFilter(tintColor, PorterDuff.Mode.SRC_ATOP);
    }
  }

  @Override
  public void setScaleType(ScaleType scaleType) {
    mScaleType = scaleType;
  }

  @Override
  public ScaleType getScaleType() {
    return mScaleType;
  }

  @Override
  public void setBorderWidth(float borderWidth) {
    mBorderWidth = borderWidth;
  }

  @Override
  public float getBorderWidth() {
    return mBorderWidth;
  }

  @Override
  public void setBorderRadius(float borderRadius) {
    mBorderRadius = borderRadius;
  }

  @Override
  public float getBorderRadius() {
    return mBorderRadius;
  }

  @Override
  public void setBorderColor(int borderColor) {
    mBorderColor = borderColor;
  }

  @Override
  public int getBorderColor() {
    return mBorderColor;
  }

  @Override
  public void setFadeDuration(int fadeDuration) {
    mFadeDuration = fadeDuration;
  }

  @Override
  public void setReactTag(int reactTag) {
    mReactTag = reactTag;
  }

  @Override
  public void onDraw(Canvas canvas) {
    Assertions.assumeNotNull(mRequestHelper).getDrawable().draw(canvas);
  }

  @Override
  public void onAttached(FlatViewGroup.InvalidateCallback callback) {
    mCallback = callback;

    GenericDraweeHierarchy hierarchy = Assertions.assumeNotNull(mRequestHelper).getHierarchy();

    RoundingParams roundingParams = hierarchy.getRoundingParams();
    if (shouldDisplayBorder()) {
      if (roundingParams == null) {
        roundingParams = new RoundingParams();
      }

      roundingParams.setBorder(mBorderColor, mBorderWidth);
      roundingParams.setCornersRadius(mBorderRadius);

      // changes won't take effect until we re-apply rounding params, so do it now.
      hierarchy.setRoundingParams(roundingParams);
    } else if (roundingParams != null) {
      // clear rounding params
      hierarchy.setRoundingParams(null);
    }

    hierarchy.setActualImageScaleType(mScaleType);
    hierarchy.setActualImageColorFilter(mColorFilter);
    hierarchy.setFadeDuration(mFadeDuration);

    hierarchy.getTopLevelDrawable().setBounds(
        Math.round(getLeft()),
        Math.round(getTop()),
        Math.round(getRight()),
        Math.round(getBottom()));

    mRequestHelper.attach(callback);
  }

  @Override
  public void onDetached() {
    Assertions.assumeNotNull(mRequestHelper).detach();
  }

  @Override
  public void onSubmit(String id, Object callerContext) {
    if (mCallback != null && mReactTag != 0) {
      mCallback.dispatchImageLoadEvent(mReactTag, ImageLoadEvent.ON_LOAD_START);
    }
  }

  @Override
  public void onFinalImageSet(
      String id,
      @Nullable Object imageInfo,
      @Nullable Animatable animatable) {
    if (mCallback != null && mReactTag != 0) {
      mCallback.dispatchImageLoadEvent(mReactTag, ImageLoadEvent.ON_LOAD);
      mCallback.dispatchImageLoadEvent(mReactTag, ImageLoadEvent.ON_LOAD_END);
    }
  }

  @Override
  public void onIntermediateImageSet(String id, @Nullable Object imageInfo) {
  }

  @Override
  public void onIntermediateImageFailed(String id, Throwable throwable) {
  }

  @Override
  public void onFailure(String id, Throwable throwable) {
    if (mCallback != null && mReactTag != 0) {
      mCallback.dispatchImageLoadEvent(mReactTag, ImageLoadEvent.ON_ERROR);
      mCallback.dispatchImageLoadEvent(mReactTag, ImageLoadEvent.ON_LOAD_END);
    }
  }

  @Override
  public void onRelease(String id) {
  }

  @Override
  protected void onBoundsChanged() {
    super.onBoundsChanged();
    computeRequestHelper();
  }

  private void computeRequestHelper() {
    mImageSource = getSourceImage();
    if (mImageSource == null) {
      mRequestHelper = null;
      return;
    }
    ImageRequest imageRequest =
        ImageRequestHelper.createImageRequest(Assertions.assertNotNull(mContext),
        mImageSource);
    mRequestHelper = new DraweeRequestHelper(Assertions.assertNotNull(imageRequest), this);
  }

  private @Nullable String getSourceImage() {
    if (mSources == null || mSources.isEmpty()) {
      return null;
    }
    if (hasMultipleSources()) {
      final double targetImageSize = (getRight() - getLeft()) * (getBottom() - getTop());
      return MultiSourceImageHelper.getImageSourceFromMultipleSources(targetImageSize, mSources);
    }
    return mSources.keySet().iterator().next();
  }

  private boolean hasMultipleSources() {
    return Assertions.assertNotNull(mSources).size() > 1;
  }

  private boolean shouldDisplayBorder() {
    return mBorderColor != 0 || mBorderRadius >= 0.5f;
  }
}
