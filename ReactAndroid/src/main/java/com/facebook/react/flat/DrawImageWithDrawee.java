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

import java.util.LinkedList;
import java.util.List;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffColorFilter;
import android.graphics.drawable.Animatable;
import android.net.Uri;

import com.facebook.drawee.controller.ControllerListener;
import com.facebook.drawee.drawable.ScalingUtils.ScaleType;
import com.facebook.drawee.generic.GenericDraweeHierarchy;
import com.facebook.drawee.generic.RoundingParams;
import com.facebook.imagepipeline.common.ResizeOptions;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.views.image.ImageLoadEvent;
import com.facebook.react.views.image.ImageResizeMode;
import com.facebook.react.views.image.ReactImageView;
import com.facebook.react.views.imagehelper.ImageSource;
import com.facebook.react.views.imagehelper.MultiSourceHelper;
import com.facebook.react.views.imagehelper.MultiSourceHelper.MultiSourceResult;

/**
 * DrawImageWithDrawee is a DrawCommand that can draw a local or remote image.
 * It uses DraweeRequestHelper internally to fetch and cache the images.
 */
/* package */ final class DrawImageWithDrawee extends AbstractDrawCommand
    implements DrawImage, ControllerListener {
  private static final String LOCAL_FILE_SCHEME = "file";
  private static final String LOCAL_CONTENT_SCHEME = "content";

  private final List<ImageSource> mSources = new LinkedList<>();
  private @Nullable DraweeRequestHelper mRequestHelper;
  private @Nullable PorterDuffColorFilter mColorFilter;
  private ScaleType mScaleType = ImageResizeMode.defaultValue();
  private float mBorderWidth;
  private float mBorderRadius;
  private int mBorderColor;
  private int mReactTag;
  private boolean mProgressiveRenderingEnabled;
  private int mFadeDuration = ReactImageView.REMOTE_IMAGE_FADE_DURATION_MS;
  private @Nullable FlatViewGroup.InvalidateCallback mCallback;

  @Override
  public boolean hasImageRequest() {
    return !mSources.isEmpty();
  }

  @Override
  public void setSource(Context context, @Nullable ReadableArray sources) {
    mSources.clear();
    if (sources != null && sources.size() != 0) {
      // Optimize for the case where we have just one uri, case in which we don't need the sizes
      if (sources.size() == 1) {
        ReadableMap source = sources.getMap(0);
        mSources.add(new ImageSource(context, source.getString("uri")));
      } else {
        for (int idx = 0; idx < sources.size(); idx++) {
          ReadableMap source = sources.getMap(idx);
          mSources.add(new ImageSource(
              context,
              source.getString("uri"),
              source.getDouble("width"),
              source.getDouble("height")));
        }
      }
    }
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
  public void setProgressiveRenderingEnabled(boolean enabled) {
    mProgressiveRenderingEnabled = enabled;
  }

  @Override
  public void setReactTag(int reactTag) {
    mReactTag = reactTag;
  }

  @Override
  public void onDraw(Canvas canvas) {
    if (mRequestHelper != null) {
      mRequestHelper.getDrawable().draw(canvas);
    }
  }

  @Override
  public void onAttached(FlatViewGroup.InvalidateCallback callback) {
    mCallback = callback;

    if (mRequestHelper == null) {
      // this is here to help us debug t12048319, in which we have a null request helper on attach
      throw new RuntimeException(
          "No DraweeRequestHelper - width: " +
              (getRight() - getLeft()) +
              " - height: " + (getBottom() - getTop() +
              " - number of sources: " + mSources.size()));
    }

    GenericDraweeHierarchy hierarchy = mRequestHelper.getHierarchy();

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
    if (mRequestHelper != null) {
      mRequestHelper.detach();
    }
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
    MultiSourceResult multiSource = MultiSourceHelper.getBestSourceForSize(
        Math.round(getRight() - getLeft()),
        Math.round(getBottom() - getTop()),
        mSources);
    ImageSource source = multiSource.getBestResult();
    ImageSource cachedSource = multiSource.getBestResultInCache();
    if (source == null) {
      mRequestHelper = null;
      return;
    }

    ResizeOptions resizeOptions = null;
    if (shouldResize(source)) {
      final int width = (int) (getRight() - getLeft());
      final int height = (int) (getBottom() - getTop());
      resizeOptions = new ResizeOptions(width, height);
    }

    ImageRequest imageRequest = ImageRequestBuilder.newBuilderWithSource(source.getUri())
        .setResizeOptions(resizeOptions)
        .setProgressiveRenderingEnabled(mProgressiveRenderingEnabled)
        .build();

    ImageRequest cachedImageRequest = null;
    if (cachedSource != null) {
      cachedImageRequest = ImageRequestBuilder.newBuilderWithSource(cachedSource.getUri())
          .setResizeOptions(resizeOptions)
          .setProgressiveRenderingEnabled(mProgressiveRenderingEnabled)
          .build();
    }
    mRequestHelper = new
      DraweeRequestHelper(Assertions.assertNotNull(imageRequest), cachedImageRequest, this);
  }

  private boolean shouldDisplayBorder() {
    return mBorderColor != 0 || mBorderRadius >= 0.5f;
  }

  private static boolean shouldResize(ImageSource imageSource) {
    // Resizing is inferior to scaling. See http://frescolib.org/docs/resizing-rotating.html
    // We resize here only for images likely to be from the device's camera, where the app developer
    // has no control over the original size
    Uri uri = imageSource.getUri();
    String type = uri == null ? null : uri.getScheme();
    // one day, we can replace this with what non-Nodes does, which is:
    // UriUtil.isLocalContentUri || UriUtil.isLocalFileUri
    // not doing this just to save including eyt another BUCK dependency
    return LOCAL_FILE_SCHEME.equals(type) || LOCAL_CONTENT_SCHEME.equals(type);
  }

  @Override
  protected void onDebugDrawHighlight(Canvas canvas) {
    if (mCallback != null) {
      debugDrawCautionHighlight(canvas, "Invalidate Drawee");
    }
  }
}
