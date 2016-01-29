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
import android.graphics.drawable.Drawable;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.drawable.Animatable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.SystemClock;

import com.facebook.common.util.UriUtil;
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder;
import com.facebook.drawee.controller.BaseControllerListener;
import com.facebook.drawee.controller.ControllerListener;
import com.facebook.drawee.controller.ForwardingControllerListener;
import com.facebook.drawee.drawable.AutoRotateDrawable;
import com.facebook.drawee.drawable.ScalingUtils;
import com.facebook.drawee.generic.GenericDraweeHierarchy;
import com.facebook.drawee.generic.GenericDraweeHierarchyBuilder;
import com.facebook.drawee.generic.RoundingParams;
import com.facebook.drawee.view.GenericDraweeView;
import com.facebook.imagepipeline.common.ResizeOptions;
import com.facebook.imagepipeline.image.ImageInfo;
import com.facebook.imagepipeline.request.BasePostprocessor;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.imagepipeline.request.Postprocessor;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;

/**
 * Wrapper class around Fresco's GenericDraweeView, enabling persisting props across multiple view
 * update and consistent processing of both static and network images.
 */
public class ReactImageView extends GenericDraweeView {

  public static final int REMOTE_IMAGE_FADE_DURATION_MS = 300;

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
  private @Nullable Drawable mLoadingImageDrawable;
  private int mBorderColor;
  private int mOverlayColor;
  private float mBorderWidth;
  private float mBorderRadius;
  private ScalingUtils.ScaleType mScaleType;
  private boolean mIsDirty;
  private boolean mIsLocalImage;
  private final AbstractDraweeControllerBuilder mDraweeControllerBuilder;
  private final RoundedCornerPostprocessor mRoundedCornerPostprocessor;
  private @Nullable ControllerListener mControllerListener;
  private @Nullable ControllerListener mControllerForTesting;
  private final @Nullable Object mCallerContext;
  private int mFadeDurationMs = -1;
  private boolean mProgressiveRenderingEnabled;

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

  public void setShouldNotifyLoadEvents(boolean shouldNotify) {
    if (!shouldNotify) {
      mControllerListener = null;
    } else {
      final EventDispatcher mEventDispatcher = ((ReactContext) getContext()).
          getNativeModule(UIManagerModule.class).getEventDispatcher();

      mControllerListener = new BaseControllerListener<ImageInfo>() {
        @Override
        public void onSubmit(String id, Object callerContext) {
          mEventDispatcher.dispatchEvent(
              new ImageLoadEvent(getId(), SystemClock.uptimeMillis(), ImageLoadEvent.ON_LOAD_START)
          );
        }

        @Override
        public void onFinalImageSet(
            String id,
            @Nullable final ImageInfo imageInfo,
            @Nullable Animatable animatable) {
          if (imageInfo != null) {
            mEventDispatcher.dispatchEvent(
                new ImageLoadEvent(getId(), SystemClock.uptimeMillis(), ImageLoadEvent.ON_LOAD_END)
            );
            mEventDispatcher.dispatchEvent(
                new ImageLoadEvent(getId(), SystemClock.uptimeMillis(), ImageLoadEvent.ON_LOAD)
            );
          }
        }

        @Override
        public void onFailure(String id, Throwable throwable) {
          mEventDispatcher.dispatchEvent(
              new ImageLoadEvent(getId(), SystemClock.uptimeMillis(), ImageLoadEvent.ON_LOAD_END)
          );
        }
      };
    }

    mIsDirty = true;
  }

  public void setBorderColor(int borderColor) {
    mBorderColor = borderColor;
    mIsDirty = true;
  }

  public void setOverlayColor(int overlayColor) {
    mOverlayColor = overlayColor;
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

  public void setLoadingIndicatorSource(@Nullable String name) {
    Drawable drawable = getResourceDrawable(getContext(), name);
    mLoadingImageDrawable =
        drawable != null ? (Drawable) new AutoRotateDrawable(drawable, 1000) : null;
    mIsDirty = true;
  }

  public void setProgressiveRenderingEnabled(boolean enabled) {
    mProgressiveRenderingEnabled = enabled;
    // no worth marking as dirty if it already rendered..
  }

  public void setFadeDuration(int durationMs) {
    mFadeDurationMs = durationMs;
    // no worth marking as dirty if it already rendered..
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

    if (mLoadingImageDrawable != null) {
      hierarchy.setPlaceholderImage(mLoadingImageDrawable, ScalingUtils.ScaleType.CENTER);
    }

    boolean usePostprocessorScaling =
        mScaleType != ScalingUtils.ScaleType.CENTER_CROP &&
        mScaleType != ScalingUtils.ScaleType.FOCUS_CROP;
    float hierarchyRadius = usePostprocessorScaling ? 0 : mBorderRadius;

    RoundingParams roundingParams = hierarchy.getRoundingParams();
    roundingParams.setCornersRadius(hierarchyRadius);
    roundingParams.setBorder(mBorderColor, mBorderWidth);
    if (mOverlayColor != Color.TRANSPARENT) {
        roundingParams.setOverlayColor(mOverlayColor);
    } else {
        // make sure the default rounding method is used.
        roundingParams.setRoundingMethod(RoundingParams.RoundingMethod.BITMAP_ONLY);
    }
    hierarchy.setRoundingParams(roundingParams);
    hierarchy.setFadeDuration(
        mFadeDurationMs >= 0
            ? mFadeDurationMs
            : mIsLocalImage ? 0 : REMOTE_IMAGE_FADE_DURATION_MS);

    Postprocessor postprocessor = usePostprocessorScaling ? mRoundedCornerPostprocessor : null;

    ResizeOptions resizeOptions = doResize ? new ResizeOptions(getWidth(), getHeight()) : null;

    ImageRequest imageRequest = ImageRequestBuilder.newBuilderWithSource(mUri)
        .setPostprocessor(postprocessor)
        .setResizeOptions(resizeOptions)
        .setAutoRotateEnabled(true)
        .setProgressiveRenderingEnabled(mProgressiveRenderingEnabled)
        .build();

    // This builder is reused
    mDraweeControllerBuilder.reset();

    mDraweeControllerBuilder
        .setAutoPlayAnimations(true)
        .setCallerContext(mCallerContext)
        .setOldController(getController())
        .setImageRequest(imageRequest);

    if (mControllerListener != null && mControllerForTesting != null) {
      ForwardingControllerListener combinedListener = new ForwardingControllerListener();
      combinedListener.addListener(mControllerListener);
      combinedListener.addListener(mControllerForTesting);
      mDraweeControllerBuilder.setControllerListener(combinedListener);
    } else if (mControllerForTesting != null) {
      mDraweeControllerBuilder.setControllerListener(mControllerForTesting);
    } else if (mControllerListener != null) {
      mDraweeControllerBuilder.setControllerListener(mControllerListener);
    }

    setController(mDraweeControllerBuilder.build());
    mIsDirty = false;
  }

  // VisibleForTesting
  public void setControllerListener(ControllerListener controllerListener) {
    mControllerForTesting = controllerListener;
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

  private static int getResourceDrawableId(Context context, @Nullable String name) {
    if (name == null || name.isEmpty()) {
      return 0;
    }
    return context.getResources().getIdentifier(
        name.toLowerCase().replace("-", "_"),
        "drawable",
        context.getPackageName());
  }

  private static @Nullable Drawable getResourceDrawable(Context context, @Nullable String name) {
    int resId = getResourceDrawableId(context, name);
    return resId > 0 ? context.getResources().getDrawable(resId) : null;
  }

  private static Uri getResourceDrawableUri(Context context, @Nullable String name) {
    int resId = getResourceDrawableId(context, name);
    return resId > 0 ? new Uri.Builder()
        .scheme(UriUtil.LOCAL_RESOURCE_SCHEME)
        .path(String.valueOf(resId))
        .build() : Uri.EMPTY;
  }
}
