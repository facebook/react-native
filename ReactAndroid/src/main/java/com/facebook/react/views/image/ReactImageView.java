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

import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.drawable.Animatable;
import android.graphics.drawable.Drawable;
import android.net.Uri;

import com.facebook.common.util.UriUtil;
import com.facebook.csslayout.CSSConstants;
import com.facebook.csslayout.FloatUtil;
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
import com.facebook.imagepipeline.core.ImagePipeline;
import com.facebook.imagepipeline.core.ImagePipelineFactory;
import com.facebook.imagepipeline.image.ImageInfo;
import com.facebook.imagepipeline.request.BasePostprocessor;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.imagepipeline.request.Postprocessor;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.SystemClock;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;

/**
 * Wrapper class around Fresco's GenericDraweeView, enabling persisting props across multiple view
 * update and consistent processing of both static and network images.
 */
public class ReactImageView extends GenericDraweeView {

  public static final int REMOTE_IMAGE_FADE_DURATION_MS = 300;

  private static float[] sComputedCornerRadii = new float[4];

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

    void getRadii(Bitmap source, float[] computedCornerRadii, float[] mappedRadii) {
        ScalingUtils.getTransform(
            sMatrix,
            new Rect(0, 0, source.getWidth(), source.getHeight()),
            source.getWidth(),
            source.getHeight(),
            0.0f,
            0.0f,
            mScaleType);
        sMatrix.invert(sInverse);

        mappedRadii[0] = sInverse.mapRadius(computedCornerRadii[0]);
        mappedRadii[1] = mappedRadii[0];

        mappedRadii[2] = sInverse.mapRadius(computedCornerRadii[1]);
        mappedRadii[3] = mappedRadii[2];

        mappedRadii[4] = sInverse.mapRadius(computedCornerRadii[2]);
        mappedRadii[5] = mappedRadii[4];

        mappedRadii[6] = sInverse.mapRadius(computedCornerRadii[3]);
        mappedRadii[7] = mappedRadii[6];
    }

    @Override
    public void process(Bitmap output, Bitmap source) {
      cornerRadii(sComputedCornerRadii);

      output.setHasAlpha(true);
      if (FloatUtil.floatsEqual(sComputedCornerRadii[0], 0f) &&
          FloatUtil.floatsEqual(sComputedCornerRadii[1], 0f) &&
          FloatUtil.floatsEqual(sComputedCornerRadii[2], 0f) &&
          FloatUtil.floatsEqual(sComputedCornerRadii[3], 0f)) {
        super.process(output, source);
        return;
      }
      Paint paint = new Paint();
      paint.setAntiAlias(true);
      paint.setShader(new BitmapShader(source, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP));
      Canvas canvas = new Canvas(output);

      float[] radii = new float[8];

      getRadii(source, sComputedCornerRadii, radii);

      Path pathForBorderRadius = new Path();

      pathForBorderRadius.addRoundRect(
          new RectF(0, 0, source.getWidth(), source.getHeight()),
          radii,
          Path.Direction.CW);

      canvas.drawPath(pathForBorderRadius, paint);
    }
  }

  private class ImageSource {
    private @Nullable Uri mUri;
    private String mSource;
    private double mSize;
    private boolean mIsLocalImage;

    public ImageSource(String source, double width, double height) {
      mSource = source;
      mSize = width * height;
    }

    public ImageSource(String source) {
      this(source, 0.0d, 0.0d);
    }

    public String getSource() {
      return mSource;
    }

    public Uri getUri() {
      if (mUri == null) {
        computeUri();
      }
      return Assertions.assertNotNull(mUri);
    }

    public double getSize() {
      return mSize;
    }

    public boolean isLocalImage() {
      if (mUri == null) {
        computeUri();
      }
      return mIsLocalImage;
    }

    private void computeUri() {
      try {
        mUri = Uri.parse(mSource);
        // Verify scheme is set, so that relative uri (used by static resources) are not handled.
        if (mUri.getScheme() == null) {
          mUri = null;
        }
      } catch (Exception e) {
        // ignore malformed uri, then attempt to extract resource ID.
      }
      if (mUri == null) {
        mUri = mResourceDrawableIdHelper.getResourceDrawableUri(getContext(), mSource);
        mIsLocalImage = true;
      } else {
        mIsLocalImage = false;
      }
    }
  }

  private final ResourceDrawableIdHelper mResourceDrawableIdHelper;
  private final List<ImageSource> mSources;

  private @Nullable ImageSource mImageSource;
  private @Nullable ImageSource mCachedImageSource;
  private @Nullable Drawable mLoadingImageDrawable;
  private int mBorderColor;
  private int mOverlayColor;
  private float mBorderWidth;
  private float mBorderRadius = CSSConstants.UNDEFINED;
  private @Nullable float[] mBorderCornerRadii;
  private ScalingUtils.ScaleType mScaleType;
  private boolean mIsDirty;
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
      @Nullable Object callerContext,
      ResourceDrawableIdHelper resourceDrawableIdHelper) {
    super(context, buildHierarchy(context));
    mScaleType = ImageResizeMode.defaultValue();
    mDraweeControllerBuilder = draweeControllerBuilder;
    mRoundedCornerPostprocessor = new RoundedCornerPostprocessor();
    mCallerContext = callerContext;
    mResourceDrawableIdHelper = resourceDrawableIdHelper;
    mSources = new LinkedList<>();
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
              new ImageLoadEvent(getId(), SystemClock.nanoTime(), ImageLoadEvent.ON_LOAD_START)
          );
        }

        @Override
        public void onFinalImageSet(
            String id,
            @Nullable final ImageInfo imageInfo,
            @Nullable Animatable animatable) {
          if (imageInfo != null) {
            mEventDispatcher.dispatchEvent(
              new ImageLoadEvent(getId(), SystemClock.nanoTime(), ImageLoadEvent.ON_LOAD)
            );
            mEventDispatcher.dispatchEvent(
              new ImageLoadEvent(getId(), SystemClock.nanoTime(), ImageLoadEvent.ON_LOAD_END)
            );
          }
        }

        @Override
        public void onFailure(String id, Throwable throwable) {
          mEventDispatcher.dispatchEvent(
            new ImageLoadEvent(getId(), SystemClock.nanoTime(), ImageLoadEvent.ON_ERROR)
          );
          mEventDispatcher.dispatchEvent(
            new ImageLoadEvent(getId(), SystemClock.nanoTime(), ImageLoadEvent.ON_LOAD_END)
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
    if (!FloatUtil.floatsEqual(mBorderRadius, borderRadius)) {
      mBorderRadius = borderRadius;
      mIsDirty = true;
    }
  }

  public void setBorderRadius(float borderRadius, int position) {
    if (mBorderCornerRadii == null) {
      mBorderCornerRadii = new float[4];
      Arrays.fill(mBorderCornerRadii, CSSConstants.UNDEFINED);
    }

    if (!FloatUtil.floatsEqual(mBorderCornerRadii[position], borderRadius)) {
      mBorderCornerRadii[position] = borderRadius;
      mIsDirty = true;
    }
  }

  public void setScaleType(ScalingUtils.ScaleType scaleType) {
    mScaleType = scaleType;
    mIsDirty = true;
  }

  public void setSource(@Nullable ReadableArray sources) {
    mSources.clear();
    if (sources != null && sources.size() != 0) {
      // Optimize for the case where we have just one uri, case in which we don't need the sizes
      if (sources.size() == 1) {
        mSources.add(new ImageSource(sources.getMap(0).getString("uri")));
      } else {
        for (int idx = 0; idx < sources.size(); idx++) {
          ReadableMap source = sources.getMap(idx);
          mSources.add(new ImageSource(
            source.getString("uri"),
            source.getDouble("width"),
            source.getDouble("height")));
        }
      }
    }
    mIsDirty = true;
  }

  public void setLoadingIndicatorSource(@Nullable String name) {
    Drawable drawable = mResourceDrawableIdHelper.getResourceDrawable(getContext(), name);
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

  private void cornerRadii(float[] computedCorners) {
    float defaultBorderRadius = !CSSConstants.isUndefined(mBorderRadius) ? mBorderRadius : 0;

    computedCorners[0] = mBorderCornerRadii != null && !CSSConstants.isUndefined(mBorderCornerRadii[0]) ? mBorderCornerRadii[0] : defaultBorderRadius;
    computedCorners[1] = mBorderCornerRadii != null && !CSSConstants.isUndefined(mBorderCornerRadii[1]) ? mBorderCornerRadii[1] : defaultBorderRadius;
    computedCorners[2] = mBorderCornerRadii != null && !CSSConstants.isUndefined(mBorderCornerRadii[2]) ? mBorderCornerRadii[2] : defaultBorderRadius;
    computedCorners[3] = mBorderCornerRadii != null && !CSSConstants.isUndefined(mBorderCornerRadii[3]) ? mBorderCornerRadii[3] : defaultBorderRadius;
  }

  public void maybeUpdateView() {
    if (!mIsDirty) {
      return;
    }

    if (hasMultipleSources() && (getWidth() <= 0 || getHeight() <= 0)) {
      // If we need to choose from multiple uris but the size is not yet set, wait for layout pass
      return;
    }

    setSourceImage();
    if (mImageSource == null) {
      return;
    }

    boolean doResize = shouldResize(mImageSource);
    if (doResize && (getWidth() <= 0 || getHeight() <= 0)) {
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

    RoundingParams roundingParams = hierarchy.getRoundingParams();

    if (usePostprocessorScaling) {
      roundingParams.setCornersRadius(0);
    } else {
      cornerRadii(sComputedCornerRadii);

      roundingParams.setCornersRadii(sComputedCornerRadii[0], sComputedCornerRadii[1], sComputedCornerRadii[2], sComputedCornerRadii[3]);
    }

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
            : mImageSource.isLocalImage() ? 0 : REMOTE_IMAGE_FADE_DURATION_MS);

    Postprocessor postprocessor = usePostprocessorScaling ? mRoundedCornerPostprocessor : null;

    ResizeOptions resizeOptions = doResize ? new ResizeOptions(getWidth(), getHeight()) : null;

    ImageRequest imageRequest = ImageRequestBuilder.newBuilderWithSource(mImageSource.getUri())
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

    if (mCachedImageSource != null) {
      ImageRequest cachedImageRequest =
        ImageRequestBuilder.newBuilderWithSource(mCachedImageSource.getUri())
          .setPostprocessor(postprocessor)
          .setResizeOptions(resizeOptions)
          .setAutoRotateEnabled(true)
          .setProgressiveRenderingEnabled(mProgressiveRenderingEnabled)
          .build();
      mDraweeControllerBuilder.setLowResImageRequest(cachedImageRequest);
    }

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
      mIsDirty = mIsDirty || hasMultipleSources();
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

  private boolean hasMultipleSources() {
    return mSources.size() > 1;
  }

  private void setSourceImage() {
    mImageSource = null;
    if (mSources.isEmpty()) {
      return;
    }
    if (hasMultipleSources()) {
      setImageSourceFromMultipleSources();
      return;
    }

    mImageSource = mSources.get(0);
  }

  /**
   * Chooses the image source with the size closest to the target image size. Must be called only
   * after the layout pass when the sizes of the target image have been computed, and when there
   * are at least two sources to choose from.
   */
  private void setImageSourceFromMultipleSources() {
    ImagePipeline imagePipeline = ImagePipelineFactory.getInstance().getImagePipeline();
    final double targetImageSize = getWidth() * getHeight();
    double bestPrecision = Double.MAX_VALUE;
    double bestCachePrecision = Double.MAX_VALUE;
    for (ImageSource source : mSources) {
      final double precision = Math.abs(1.0 - (source.getSize()) / targetImageSize);
      if (precision < bestPrecision) {
        bestPrecision = precision;
        mImageSource = source;
      }

      if (precision < bestCachePrecision &&
          (imagePipeline.isInBitmapMemoryCache(source.getUri()) ||
          imagePipeline.isInDiskCacheSync(source.getUri()))) {
        bestCachePrecision = precision;
        mCachedImageSource = source;
      }
    }

    // don't use cached image source if it's the same as the image source
    if (mCachedImageSource != null &&
      mImageSource.getSource().equals(mCachedImageSource.getSource())) {
      mCachedImageSource = null;
    }
  }

  private static boolean shouldResize(ImageSource imageSource) {
    // Resizing is inferior to scaling. See http://frescolib.org/docs/resizing-rotating.html#_
    // We resize here only for images likely to be from the device's camera, where the app developer
    // has no control over the original size
    return
      UriUtil.isLocalContentUri(imageSource.getUri()) ||
      UriUtil.isLocalFileUri(imageSource.getUri());
  }
}
