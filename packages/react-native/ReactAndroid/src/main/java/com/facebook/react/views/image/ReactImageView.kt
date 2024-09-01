/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // As we depend on ReactFeatureFlags still

package com.facebook.react.views.image

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.Shader
import android.graphics.Shader.TileMode
import android.graphics.drawable.Animatable
import android.graphics.drawable.Drawable
import android.net.Uri
import com.facebook.common.references.CloseableReference
import com.facebook.common.util.UriUtil
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder
import com.facebook.drawee.controller.ControllerListener
import com.facebook.drawee.controller.ForwardingControllerListener
import com.facebook.drawee.drawable.AutoRotateDrawable
import com.facebook.drawee.drawable.RoundedColorDrawable
import com.facebook.drawee.drawable.ScalingUtils
import com.facebook.drawee.generic.GenericDraweeHierarchyBuilder
import com.facebook.drawee.generic.RoundingParams
import com.facebook.drawee.view.GenericDraweeView
import com.facebook.imagepipeline.bitmaps.PlatformBitmapFactory
import com.facebook.imagepipeline.common.ResizeOptions
import com.facebook.imagepipeline.image.CloseableImage
import com.facebook.imagepipeline.image.ImageInfo
import com.facebook.imagepipeline.postprocessors.IterativeBoxBlurPostProcessor
import com.facebook.imagepipeline.request.BasePostprocessor
import com.facebook.imagepipeline.request.ImageRequest
import com.facebook.imagepipeline.request.ImageRequestBuilder
import com.facebook.imagepipeline.request.Postprocessor
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags.enableBackgroundStyleApplicator
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags.loadVectorDrawablesOnImages
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags.useNewReactImageViewBackgroundDrawing
import com.facebook.react.modules.fresco.ReactNetworkImageRequest
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.FloatUtil.floatsEqual
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.util.RNLog
import com.facebook.react.views.image.ImageLoadEvent.Companion.createErrorEvent
import com.facebook.react.views.image.ImageLoadEvent.Companion.createLoadEndEvent
import com.facebook.react.views.image.ImageLoadEvent.Companion.createLoadEvent
import com.facebook.react.views.image.ImageLoadEvent.Companion.createLoadStartEvent
import com.facebook.react.views.image.ImageLoadEvent.Companion.createProgressEvent
import com.facebook.react.views.image.ImageResizeMode.defaultTileMode
import com.facebook.react.views.image.ImageResizeMode.defaultValue
import com.facebook.react.views.image.MultiPostprocessor.Companion.from
import com.facebook.react.views.imagehelper.ImageSource
import com.facebook.react.views.imagehelper.ImageSource.Companion.getTransparentBitmapImageSource
import com.facebook.react.views.imagehelper.MultiSourceHelper.getBestSourceForSize
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper.Companion.instance
import com.facebook.react.views.view.ReactViewBackgroundManager
import com.facebook.yoga.YogaConstants
import kotlin.math.abs

/**
 * Wrapper class around Fresco's GenericDraweeView, enabling persisting props across multiple view
 * update and consistent processing of both static and network images.
 */
@OptIn(UnstableReactNativeAPI::class)
public class ReactImageView(
    context: Context,
    private val draweeControllerBuilder: AbstractDraweeControllerBuilder<*, *, *, *>,
    private val globalImageLoadListener: GlobalImageLoadListener?,
    private var callerContext: Any?
) : GenericDraweeView(context, buildHierarchy(context)) {

  private val sources: MutableList<ImageSource> = mutableListOf()
  internal var imageSource: ImageSource? = null
  private var cachedImageSource: ImageSource? = null
  private var defaultImageDrawable: Drawable? = null
  private var loadingImageDrawable: Drawable? = null
  private var backgroundImageDrawable: RoundedColorDrawable? = null
  private var backgroundColor = 0x00000000
  private var borderColor = 0
  private var overlayColor = 0
  private var borderWidth = 0f
  private var borderRadius = YogaConstants.UNDEFINED
  private var borderCornerRadii: FloatArray? = null
  private var scaleType = defaultValue()
  private var tileMode = defaultTileMode()
  private var isDirty = false
  private var tilePostprocessor: TilePostprocessor? = null
  private var iterativeBoxBlurPostProcessor: IterativeBoxBlurPostProcessor? = null
  private var downloadListener: ReactImageDownloadListener<ImageInfo>? = null
  private var controllerForTesting: ControllerListener<ImageInfo>? = null
  private var fadeDurationMs = -1
  private var progressiveRenderingEnabled = false
  private var headers: ReadableMap? = null
  private var resizeMultiplier = 1.0f
  private val reactBackgroundManager = ReactViewBackgroundManager(this)
  private var resizeMethod = ImageResizeMethod.AUTO

  init {
    reactBackgroundManager.setOverflow("hidden")
    // Workaround Android bug where ImageView visibility is not propagated to the Drawable, so you
    // have to manually update visibility. Will be resolved once we move to VitoView.
    setLegacyVisibilityHandlingEnabled(true)
  }

  public fun updateCallerContext(callerContext: Any?) {
    if (this.callerContext != callerContext) {
      this.callerContext = callerContext
      isDirty = true
    }
  }

  public fun setShouldNotifyLoadEvents(shouldNotify: Boolean) {
    // Skip update if shouldNotify is already in sync with the download listener
    if (shouldNotify == (downloadListener != null)) {
      return
    }

    if (!shouldNotify) {
      downloadListener = null
    } else {
      val eventDispatcher =
          UIManagerHelper.getEventDispatcherForReactTag((context as ReactContext), id)

      downloadListener =
          object : ReactImageDownloadListener<ImageInfo>() {
            override fun onProgressChange(loaded: Int, total: Int) {
              // TODO: Somehow get image size and convert `loaded` and `total` to image bytes.
              if (eventDispatcher == null || imageSource == null) {
                return
              }
              // TODO: Somehow get image size and convert `loaded` and `total` to image bytes.
              eventDispatcher.dispatchEvent(
                  createProgressEvent(
                      UIManagerHelper.getSurfaceId(this@ReactImageView),
                      id,
                      imageSource?.source,
                      loaded,
                      total))
            }

            override fun onSubmit(id: String, callerContext: Any?) {
              if (eventDispatcher == null) {
                return
              }
              eventDispatcher.dispatchEvent(
                  createLoadStartEvent(UIManagerHelper.getSurfaceId(this@ReactImageView), getId()))
            }

            override fun onFinalImageSet(
                id: String,
                imageInfo: ImageInfo?,
                animatable: Animatable?
            ) {
              if (imageInfo != null && imageSource != null && eventDispatcher != null) {
                eventDispatcher.dispatchEvent(
                    createLoadEvent(
                        UIManagerHelper.getSurfaceId(this@ReactImageView),
                        getId(),
                        imageSource?.source,
                        imageInfo.width,
                        imageInfo.height))
                eventDispatcher.dispatchEvent(
                    createLoadEndEvent(UIManagerHelper.getSurfaceId(this@ReactImageView), getId()))
              }
            }

            override fun onFailure(id: String, throwable: Throwable) {
              if (eventDispatcher == null) {
                return
              }
              eventDispatcher.dispatchEvent(
                  createErrorEvent(
                      UIManagerHelper.getSurfaceId(this@ReactImageView), getId(), throwable))
            }
          }
    }
    isDirty = true
  }

  public fun setBlurRadius(blurRadius: Float) {
    // Divide `blurRadius` by 2 to more closely match other platforms.
    val pixelBlurRadius = blurRadius.dpToPx().toInt() / 2
    iterativeBoxBlurPostProcessor =
        if (pixelBlurRadius == 0) {
          null
        } else {
          IterativeBoxBlurPostProcessor(2, pixelBlurRadius)
        }
    isDirty = true
  }

  public override fun setBackgroundColor(backgroundColor: Int) {
    if (enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBackgroundColor(this, backgroundColor)
    } else if (useNewReactImageViewBackgroundDrawing()) {
      reactBackgroundManager.backgroundColor = backgroundColor
    } else if (this.backgroundColor != backgroundColor) {
      this.backgroundColor = backgroundColor
      backgroundImageDrawable = RoundedColorDrawable(backgroundColor)
      isDirty = true
    }
  }

  public fun setBorderColor(borderColor: Int) {
    if (enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBorderColor(this, LogicalEdge.ALL, borderColor)
    } else if (useNewReactImageViewBackgroundDrawing()) {
      reactBackgroundManager.setBorderColor(Spacing.ALL, borderColor)
    } else if (this.borderColor != borderColor) {
      this.borderColor = borderColor
      isDirty = true
    }
  }

  public fun setOverlayColor(overlayColor: Int) {
    if (this.overlayColor != overlayColor) {
      this.overlayColor = overlayColor
      isDirty = true
    }
  }

  public fun setBorderWidth(borderWidth: Float) {
    val newBorderWidth = borderWidth.dpToPx()
    if (enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBorderWidth(this, LogicalEdge.ALL, borderWidth)
    } else if (useNewReactImageViewBackgroundDrawing()) {
      reactBackgroundManager.setBorderWidth(Spacing.ALL, newBorderWidth)
    } else if (!floatsEqual(this.borderWidth, newBorderWidth)) {
      this.borderWidth = newBorderWidth
      isDirty = true
    }
  }

  public fun setBorderRadius(borderRadius: Float) {
    if (enableBackgroundStyleApplicator()) {
      val radius =
          if (borderRadius.isNaN()) null
          else LengthPercentage(borderRadius.pxToDp(), LengthPercentageType.POINT)
      BackgroundStyleApplicator.setBorderRadius(this, BorderRadiusProp.BORDER_RADIUS, radius)
    } else if (useNewReactImageViewBackgroundDrawing()) {
      reactBackgroundManager.setBorderRadius(borderRadius)
    } else if (!floatsEqual(this.borderRadius, borderRadius)) {
      this.borderRadius = borderRadius
      isDirty = true
    }
  }

  public fun setBorderRadius(borderRadius: Float, position: Int) {
    if (enableBackgroundStyleApplicator()) {
      val radius =
          if (borderRadius.isNaN()) null
          else LengthPercentage(borderRadius.pxToDp(), LengthPercentageType.POINT)
      BackgroundStyleApplicator.setBorderRadius(this, BorderRadiusProp.values()[position], radius)
    } else if (useNewReactImageViewBackgroundDrawing()) {
      reactBackgroundManager.setBorderRadius(borderRadius, position + 1)
    } else {
      if (borderCornerRadii == null) {
        borderCornerRadii = FloatArray(4) { YogaConstants.UNDEFINED }
      }

      if (!floatsEqual(borderCornerRadii?.get(position), borderRadius)) {
        borderCornerRadii?.set(position, borderRadius)
        isDirty = true
      }
    }
  }

  public fun setScaleType(scaleType: ScalingUtils.ScaleType) {
    if (this.scaleType !== scaleType) {
      this.scaleType = scaleType
      isDirty = true
    }
  }

  public fun setTileMode(tileMode: TileMode) {
    if (this.tileMode != tileMode) {
      this.tileMode = tileMode
      tilePostprocessor = if (isTiled) TilePostprocessor() else null
      isDirty = true
    }
  }

  public fun setResizeMethod(resizeMethod: ImageResizeMethod) {
    if (this.resizeMethod != resizeMethod) {
      this.resizeMethod = resizeMethod
      isDirty = true
    }
  }

  public fun setResizeMultiplier(multiplier: Float) {
    val isNewMultiplier = abs((resizeMultiplier - multiplier).toDouble()) > 0.0001f
    if (isNewMultiplier) {
      resizeMultiplier = multiplier
      isDirty = true
    }
  }

  public fun setSource(sources: ReadableArray?) {
    val tmpSources = mutableListOf<ImageSource>()

    if (sources == null || sources.size() == 0) {
      tmpSources.add(getTransparentBitmapImageSource(context))
    } else if (sources.size() == 1) {
      // Optimize for the case where we have just one uri, case in which we don't need the sizes
      val source = sources.getMap(0)
      var imageSource = ImageSource(context, source.getString("uri"))
      if (Uri.EMPTY == imageSource.uri) {
        warnImageSource(source.getString("uri"))
        imageSource = getTransparentBitmapImageSource(context)
      }
      tmpSources.add(imageSource)
    } else {
      for (idx in 0 until sources.size()) {
        val source = sources.getMap(idx)
        var imageSource =
            ImageSource(
                context,
                source.getString("uri"),
                source.getDouble("width"),
                source.getDouble("height"))
        if (Uri.EMPTY == imageSource.uri) {
          warnImageSource(source.getString("uri"))
          imageSource = getTransparentBitmapImageSource(context)
        }
        tmpSources.add(imageSource)
      }
    }

    // Don't reset sources and dirty node if sources haven't changed
    if (this.sources == tmpSources) {
      return
    }

    this.sources.clear()
    this.sources.addAll(tmpSources)
    isDirty = true
  }

  public fun setDefaultSource(name: String?) {
    val newDefaultDrawable = instance.getResourceDrawable(context, name)
    if (defaultImageDrawable != newDefaultDrawable) {
      defaultImageDrawable = newDefaultDrawable
      isDirty = true
    }
  }

  public fun setLoadingIndicatorSource(name: String?) {
    val drawable = instance.getResourceDrawable(context, name)
    val newLoadingIndicatorSource = drawable?.let { AutoRotateDrawable(it, 1000) }
    if (loadingImageDrawable != newLoadingIndicatorSource) {
      loadingImageDrawable = newLoadingIndicatorSource
      isDirty = true
    }
  }

  public fun setProgressiveRenderingEnabled(enabled: Boolean) {
    progressiveRenderingEnabled = enabled
    // no worth marking as dirty if it already rendered.
  }

  public fun setFadeDuration(durationMs: Int) {
    fadeDurationMs = durationMs
    // no worth marking as dirty if it already rendered.
  }

  public fun setHeaders(headers: ReadableMap?) {
    this.headers = headers
  }

  // Disable rasterizing to offscreen layer in order to preserve background effects like box-shadow
  // or outline which may draw outside of bounds.
  public override fun hasOverlappingRendering(): Boolean = false

  public override fun onDraw(canvas: Canvas) {
    if (enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.clipToPaddingBox(this, canvas)
    } else if (useNewReactImageViewBackgroundDrawing()) {
      reactBackgroundManager.maybeClipToPaddingBox(canvas)
    }
    super.onDraw(canvas)
  }

  public fun maybeUpdateView() {
    if (!isDirty) {
      return
    }

    if (hasMultipleSources() && (width <= 0 || height <= 0)) {
      // If we need to choose from multiple uris but the size is not yet set, wait for layout pass
      return
    }

    setSourceImage()
    val imageSourceSafe = this.imageSource ?: return
    val doResize = shouldResize(imageSourceSafe)

    if (doResize && (width <= 0 || height <= 0)) {
      // If need a resize and the size is not yet set, wait until the layout pass provides one
      return
    }

    if (isTiled && (width <= 0 || height <= 0)) {
      // If need to tile and the size is not yet set, wait until the layout pass provides one
      return
    }

    // We store this in a local variable as it's coming from super.getHierarchy()
    val hierarchy = this.hierarchy
    hierarchy.actualImageScaleType = scaleType

    if (defaultImageDrawable != null) {
      hierarchy.setPlaceholderImage(defaultImageDrawable, scaleType)
    }

    if (loadingImageDrawable != null) {
      hierarchy.setPlaceholderImage(loadingImageDrawable, ScalingUtils.ScaleType.CENTER)
    }

    getCornerRadii(computedCornerRadii)

    val roundingParams = hierarchy.roundingParams
    if (roundingParams != null) {
      roundingParams.setCornersRadii(
          computedCornerRadii[0],
          computedCornerRadii[1],
          computedCornerRadii[2],
          computedCornerRadii[3])

      backgroundImageDrawable?.let { background ->
        background.setBorder(borderColor, borderWidth)
        roundingParams.cornersRadii?.let { background.radii = it }
        hierarchy.setBackgroundImage(background)
      }
      roundingParams.setBorder(borderColor, borderWidth)
      if (overlayColor != Color.TRANSPARENT) {
        roundingParams.setOverlayColor(overlayColor)
      } else {
        // make sure the default rounding method is used.
        roundingParams.setRoundingMethod(RoundingParams.RoundingMethod.BITMAP_ONLY)
      }
      hierarchy.roundingParams = roundingParams
    }
    hierarchy.fadeDuration =
        when {
          fadeDurationMs >= 0 -> fadeDurationMs
          imageSourceSafe.isResource -> 0
          else -> REMOTE_IMAGE_FADE_DURATION_MS
        }

    val drawable = getDrawableIfUnsupported(imageSourceSafe)
    if (drawable != null) {
      maybeUpdateViewFromDrawable(drawable)
    } else {
      maybeUpdateViewFromRequest(doResize)
    }

    isDirty = false
  }

  private fun maybeUpdateViewFromRequest(doResize: Boolean) {
    val uri = this.imageSource?.uri ?: return

    val postprocessorList = mutableListOf<Postprocessor>()
    iterativeBoxBlurPostProcessor?.let { postprocessorList.add(it) }
    tilePostprocessor?.let { postprocessorList.add(it) }
    val postprocessor = from(postprocessorList)

    val resizeOptions = if (doResize) resizeOptions else null

    val imageRequestBuilder =
        ImageRequestBuilder.newBuilderWithSource(uri)
            .setPostprocessor(postprocessor)
            .setResizeOptions(resizeOptions)
            .setAutoRotateEnabled(true)
            .setProgressiveRenderingEnabled(progressiveRenderingEnabled)

    val imageRequest: ImageRequest =
        ReactNetworkImageRequest.fromBuilderWithHeaders(imageRequestBuilder, headers)

    globalImageLoadListener?.onLoadAttempt(uri)

    @Suppress("UNCHECKED_CAST") // Unsafe cast necessary as this java class used raw generics
    val builder =
        draweeControllerBuilder
            as
            AbstractDraweeControllerBuilder<
                *, ImageRequest, CloseableReference<CloseableImage>, ImageInfo>

    // This builder is reused
    builder.reset()

    builder.setImageRequest(imageRequest).setAutoPlayAnimations(true).setOldController(controller)

    callerContext?.let { builder.setCallerContext(it) }

    cachedImageSource?.let { cachedSource ->
      val cachedImageRequest =
          ImageRequestBuilder.newBuilderWithSource(cachedSource.uri)
              .setPostprocessor(postprocessor)
              .setResizeOptions(resizeOptions)
              .setAutoRotateEnabled(true)
              .setProgressiveRenderingEnabled(progressiveRenderingEnabled)
              .build()
      builder.setLowResImageRequest(cachedImageRequest)
    }

    if (downloadListener != null && controllerForTesting != null) {
      val combinedListener: ForwardingControllerListener<ImageInfo> =
          ForwardingControllerListener<ImageInfo>()
      combinedListener.addListener(downloadListener)
      combinedListener.addListener(controllerForTesting)
      builder.setControllerListener(combinedListener)
    } else if (controllerForTesting != null) {
      builder.setControllerListener(controllerForTesting)
    } else if (downloadListener != null) {
      builder.setControllerListener(downloadListener)
    }

    if (downloadListener != null) {
      hierarchy.setProgressBarImage(downloadListener)
    }

    controller = builder.build()

    // Reset again so the DraweeControllerBuilder clears all it's references. Otherwise, this causes
    // a memory leak.
    builder.reset()
  }

  private fun maybeUpdateViewFromDrawable(drawable: Drawable) {
    val shouldNotify = downloadListener != null

    val eventDispatcher =
        if (shouldNotify) {
          UIManagerHelper.getEventDispatcherForReactTag((context as ReactContext), id)
        } else {
          null
        }

    eventDispatcher?.dispatchEvent(
        createLoadStartEvent(UIManagerHelper.getSurfaceId(this@ReactImageView), id))

    hierarchy.setImage(drawable, 1f, false)

    if (eventDispatcher != null && imageSource != null) {
      eventDispatcher.dispatchEvent(
          createLoadEvent(
              UIManagerHelper.getSurfaceId(this@ReactImageView),
              id,
              imageSource?.source,
              width,
              height))
      eventDispatcher.dispatchEvent(
          createLoadEndEvent(UIManagerHelper.getSurfaceId(this@ReactImageView), id))
    }
  }

  private fun getCornerRadii(computedCorners: FloatArray) {
    val defaultBorderRadius = if (!YogaConstants.isUndefined(borderRadius)) borderRadius else 0f

    val radii = borderCornerRadii ?: FloatArray(4) { Float.NaN }
    computedCorners[0] = if (!YogaConstants.isUndefined(radii[0])) radii[0] else defaultBorderRadius
    computedCorners[1] = if (!YogaConstants.isUndefined(radii[1])) radii[1] else defaultBorderRadius
    computedCorners[2] = if (!YogaConstants.isUndefined(radii[2])) radii[2] else defaultBorderRadius
    computedCorners[3] = if (!YogaConstants.isUndefined(radii[3])) radii[3] else defaultBorderRadius
  }

  @VisibleForTesting
  public fun setControllerListener(controllerListener: ControllerListener<ImageInfo>?) {
    controllerForTesting = controllerListener
    isDirty = true
    maybeUpdateView()
  }

  protected override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    if (w > 0 && h > 0) {
      isDirty = isDirty || hasMultipleSources() || isTiled
      maybeUpdateView()
    }
  }

  private fun hasMultipleSources(): Boolean = sources.size > 1

  private val isTiled: Boolean
    get() = tileMode != TileMode.CLAMP

  private fun setSourceImage() {
    imageSource = null
    if (sources.isEmpty()) {
      sources.add(getTransparentBitmapImageSource(context))
    } else if (hasMultipleSources()) {
      val multiSource = getBestSourceForSize(width, height, sources)
      imageSource = multiSource.bestResult
      cachedImageSource = multiSource.bestResultInCache
      return
    }
    imageSource = sources[0]
  }

  private fun shouldResize(imageSource: ImageSource): Boolean =
      // Resizing is inferior to scaling. See http://frescolib.org/docs/resizing-rotating.html#_
      // We resize here only for images likely to be from the device's camera, where the app
      // developer
      // has no control over the original size
      when (resizeMethod) {
        ImageResizeMethod.AUTO ->
            (UriUtil.isLocalContentUri(imageSource.uri) || UriUtil.isLocalFileUri(imageSource.uri))
        ImageResizeMethod.RESIZE -> true
        else -> false
      }

  /**
   * Checks if the provided ImageSource should not be requested through Fresco and instead loaded
   * directly from the resources table. Fresco explicitly does not support a number of drawable
   * types like VectorDrawable but they can still be mounted in the image hierarchy.
   *
   * @param imageSource
   * @return drawable resource if Fresco cannot load the image, null otherwise
   */
  private fun getDrawableIfUnsupported(imageSource: ImageSource): Drawable? {
    if (!loadVectorDrawablesOnImages()) {
      return null
    }
    val resourceName = imageSource.source
    if (!imageSource.isResource || resourceName == null) {
      return null
    }
    val drawableHelper = instance
    val isVectorDrawable = drawableHelper.isVectorDrawable(context, resourceName)
    if (!isVectorDrawable) {
      return null
    }
    return drawableHelper.getResourceDrawable(context, resourceName)
  }

  private val resizeOptions: ResizeOptions?
    get() {
      val width = Math.round(width.toFloat() * resizeMultiplier)
      val height = Math.round(height.toFloat() * resizeMultiplier)
      if (width <= 0 || height <= 0) {
        return null
      }
      return ResizeOptions(width, height)
    }

  private fun warnImageSource(uri: String?) {
    // TODO(T189014077): This code-path produces an infinite loop of js calls with logbox.
    // This is an issue with Fabric view preallocation, react, and LogBox. Fix.
    // The bug:
    // 1. An app renders an <Image/>
    // 2. Fabric preallocates <Image/>; sets a null src to ReactImageView (potential problem?).
    // 3. ReactImageView detects the null src; displays a warning in LogBox (via this code).
    // 3. LogBox renders an <Image/>, which fabric preallocates.
    // 4. Rinse and repeat.
    if (ReactBuildConfig.DEBUG && !ReactFeatureFlags.enableBridgelessArchitecture) {
      RNLog.w(context as ReactContext, "ReactImageView: Image source \"$uri\" doesn't exist")
    }
  }

  private inner class TilePostprocessor : BasePostprocessor() {
    override fun process(
        source: Bitmap,
        bitmapFactory: PlatformBitmapFactory
    ): CloseableReference<Bitmap> {
      val destRect = Rect(0, 0, width, height)
      scaleType.getTransform(tileMatrix, destRect, source.width, source.height, 0.0f, 0.0f)

      val paint = Paint()
      paint.isAntiAlias = true
      val shader: Shader = BitmapShader(source, tileMode, tileMode)
      shader.setLocalMatrix(tileMatrix)
      paint.setShader(shader)

      val output = bitmapFactory.createBitmap(width, height)
      try {
        val canvas = Canvas(output.get())
        canvas.drawRect(destRect, paint)
        return output.clone()
      } finally {
        CloseableReference.closeSafely(output)
      }
    }
  }

  public companion object {
    public const val REMOTE_IMAGE_FADE_DURATION_MS: Int = 300

    private val computedCornerRadii = FloatArray(4)

    // Fresco lacks support for repeating images, see https://github.com/facebook/fresco/issues/1575
    // We implement it here as a postprocessing step.
    private val tileMatrix = Matrix()

    // We can't specify rounding in XML, so have to do so here
    private fun buildHierarchy(context: Context) =
        GenericDraweeHierarchyBuilder(context.resources)
            .setRoundingParams(
                RoundingParams.fromCornersRadius(0f).apply { setPaintFilterBitmap(true) })
            .build()
  }
}
