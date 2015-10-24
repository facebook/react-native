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

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.net.Uri;

import com.facebook.common.util.UriUtil;
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.drawee.controller.ControllerListener;
import com.facebook.drawee.drawable.ScalingUtils;
import com.facebook.drawee.generic.GenericDraweeHierarchy;
import com.facebook.drawee.generic.GenericDraweeHierarchyBuilder;
import com.facebook.drawee.generic.RoundingParams;
import com.facebook.drawee.interfaces.DraweeController;
import com.facebook.drawee.view.GenericDraweeView;
import com.facebook.imagepipeline.common.ResizeOptions;
import com.facebook.imagepipeline.request.BasePostprocessor;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.imagepipeline.request.Postprocessor;
import com.facebook.react.uimanager.PixelUtil;

/**
 * Wrapper class around Fresco's GenericDraweeView, enabling persisting props across multiple view
 * update and consistent processing of both static and network images.
 */
public class ReactImageView extends GenericDraweeView {

  private static final int REMOTE_IMAGE_FADE_DURATION_MS = 300;
  public static final String TAG = ReactImageView.class.getSimpleName();

  /*
   * Implementation note re rounded corners:
   *
   * Fresco's built-in rounded corners only work for 'cover' resize mode -
   * this is a limitation in Android itself. Fresco has a workaround for this, but
   * it requires knowing the background color.
   *
   * So for the other modes, we use a postprocessor.
   * Because the postprocessor uses a modified bitmap, that would just get cropped in
   * 'cover' mode, so we fall back to Fresco's normal implementation.
   */
  private static final Matrix sMatrix = new Matrix();
  private static final Matrix sInverse = new Matrix();

  private class RoundedCornerPostprocessor extends BasePostprocessor {

    float getRadius(Bitmap source) {
        ScalingUtils.getTransform(
            sMatrix,
            new Rect(0, 0, source.getWidth(), source.getHeight()),
            source.getWidth(),
            source.getHeight(),
            0.0f,
            0.0f,
            mScaleType);
        sMatrix.invert(sInverse);
        return sInverse.mapRadius(mBorderRadius);
    }

    @Override
    public void process(Bitmap output, Bitmap source) {
      output.setHasAlpha(true);
      if (mBorderRadius < 0.01f) {
        super.process(output, source);
        return;
      }
      Paint paint = new Paint();
      paint.setAntiAlias(true);
      paint.setShader(new BitmapShader(source, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP));
      Canvas canvas = new Canvas(output);
      float radius = getRadius(source);
      canvas.drawRoundRect(
          new RectF(0, 0, source.getWidth(), source.getHeight()),
          radius,
          radius,
          paint);
    }
  }

  private @Nullable Uri mUri;
  private int mBorderColor;
  private float mBorderWidth;
  private float mBorderRadius;
  private ScalingUtils.ScaleType mScaleType;
  private boolean mIsDirty;
  private boolean mIsLocalImage;
  private final AbstractDraweeControllerBuilder mDraweeControllerBuilder;
  private final RoundedCornerPostprocessor mRoundedCornerPostprocessor;
  private final @Nullable Object mCallerContext;
  private @Nullable ControllerListener mControllerListener;
  private int mImageFadeDuration = -1;

  // We can't specify rounding in XML, so have to do so here
  private static GenericDraweeHierarchy buildHierarchy(Context context) {
    return new GenericDraweeHierarchyBuilder(context.getResources())
        .setRoundingParams(RoundingParams.fromCornersRadius(0))
        .build();
  }

  public ReactImageView(
      Context context,
      AbstractDraweeControllerBuilder draweeControllerBuilder,
      @Nullable Object callerContext) {
    super(context, buildHierarchy(context));
    mScaleType = ImageResizeMode.defaultValue();
    mDraweeControllerBuilder = draweeControllerBuilder;
    mRoundedCornerPostprocessor = new RoundedCornerPostprocessor();
    mCallerContext = callerContext;
  }

  public void setBorderColor(int borderColor) {
    mBorderColor = borderColor;
    mIsDirty = true;
  }

  public void setBorderWidth(float borderWidth) {
    mBorderWidth = PixelUtil.toPixelFromDIP(borderWidth);
    mIsDirty = true;
  }

  public void setBorderRadius(float borderRadius) {
    mBorderRadius = PixelUtil.toPixelFromDIP(borderRadius);
    mIsDirty = true;
  }

  public void setScaleType(ScalingUtils.ScaleType scaleType) {
    mScaleType = scaleType;
    mIsDirty = true;
  }

  public void setSource(@Nullable String source) {
    mUri = null;
    if (source != null) {
      try {
        mUri = Uri.parse(source);
        // Verify scheme is set, so that relative uri (used by static resources) are not handled.
        if (mUri.getScheme() == null) {
          mUri = null;
        }
      } catch (Exception e) {
        // ignore malformed uri, then attempt to extract resource ID.
      }
      if (mUri == null) {
        mUri = getResourceDrawableUri(getContext(), source);
        mIsLocalImage = true;
      } else {
        mIsLocalImage = false;
      }
    }
    mIsDirty = true;
  }

  public void maybeUpdateView() {
    if (!mIsDirty) {
      return;
    }

    boolean doResize = shouldResize(mUri);
    if (doResize && (getWidth() <= 0 || getHeight() <=0)) {
      // If need a resize and the size is not yet set, wait until the layout pass provides one
      return;
    }

    GenericDraweeHierarchy hierarchy = getHierarchy();
    hierarchy.setActualImageScaleType(mScaleType);

    boolean usePostprocessorScaling =
        mScaleType != ScalingUtils.ScaleType.CENTER_CROP &&
        mScaleType != ScalingUtils.ScaleType.FOCUS_CROP;
    float hierarchyRadius = usePostprocessorScaling ? 0 : mBorderRadius;

    RoundingParams roundingParams = hierarchy.getRoundingParams();
    roundingParams.setCornersRadius(hierarchyRadius);
    roundingParams.setBorder(mBorderColor, mBorderWidth);
    hierarchy.setRoundingParams(roundingParams);
    hierarchy.setFadeDuration(mImageFadeDuration >= 0
            ? mImageFadeDuration
            : mIsLocalImage ? 0 : REMOTE_IMAGE_FADE_DURATION_MS);

    Postprocessor postprocessor = usePostprocessorScaling ? mRoundedCornerPostprocessor : null;

    ResizeOptions resizeOptions = doResize ? new ResizeOptions(getWidth(), getHeight()) : null;

    ImageRequest imageRequest = ImageRequestBuilder.newBuilderWithSource(mUri)
        .setPostprocessor(postprocessor)
        .setResizeOptions(resizeOptions)
        .build();

    DraweeController draweeController = mDraweeControllerBuilder
        .reset()
        .setAutoPlayAnimations(true)
        .setCallerContext(mCallerContext)
        .setOldController(getController())
        .setImageRequest(imageRequest)
        .setControllerListener(mControllerListener)
        .build();
    setController(draweeController);
    mIsDirty = false;
  }

  // VisibleForTesting
  public void setControllerListener(ControllerListener controllerListener) {
    mControllerListener = controllerListener;
    mIsDirty = true;
    maybeUpdateView();
  }

  // VisibleForTesting
  public void setImageFadeDuration(int imageFadeDuration) {
    mImageFadeDuration = imageFadeDuration;
    mIsDirty = true;
    maybeUpdateView();
  }

  @Override
  protected void onSizeChanged(int w, int h, int oldw, int oldh) {
    super.onSizeChanged(w, h, oldw, oldh);
    if (w > 0 && h > 0) {
      maybeUpdateView();
    }
  }

  /**
   * ReactImageViews only render a single image.
   */
  @Override
  public boolean hasOverlappingRendering() {
    return false;
  }

  private static boolean shouldResize(@Nullable Uri uri) {
    // Resizing is inferior to scaling. See http://frescolib.org/docs/resizing-rotating.html#_
    // We resize here only for images likely to be from the device's camera, where the app developer
    // has no control over the original size
    return uri != null && (UriUtil.isLocalContentUri(uri) || UriUtil.isLocalFileUri(uri));
  }

  private static @Nullable Uri getResourceDrawableUri(Context context, @Nullable String name) {
    if (name == null || name.isEmpty()) {
      return null;
    }
    name = name.toLowerCase().replace("-", "_");
    int resId = context.getResources().getIdentifier(
        name,
        "drawable",
        context.getPackageName());
    return new Uri.Builder()
        .scheme(UriUtil.LOCAL_RESOURCE_SCHEME)
        .path(String.valueOf(resId))
        .build();
  }
}
