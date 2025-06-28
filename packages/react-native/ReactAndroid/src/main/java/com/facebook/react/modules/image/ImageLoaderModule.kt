/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.image

import android.net.Uri
import android.util.SparseArray
import com.facebook.common.executors.CallerThreadExecutor
import com.facebook.common.references.CloseableReference
import com.facebook.datasource.BaseDataSubscriber
import com.facebook.datasource.DataSource
import com.facebook.datasource.DataSubscriber
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.fbreact.specs.NativeImageLoaderAndroidSpec
import com.facebook.imagepipeline.core.ImagePipeline
import com.facebook.imagepipeline.image.CloseableImage
import com.facebook.imagepipeline.request.ImageRequest
import com.facebook.imagepipeline.request.ImageRequestBuilder
import com.facebook.react.bridge.GuardedAsyncTask
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.buildReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.fresco.ReactNetworkImageRequest
import com.facebook.react.views.image.ReactCallerContextFactory
import com.facebook.react.views.imagehelper.ImageSource

@ReactModule(name = NativeImageLoaderAndroidSpec.NAME)
internal class ImageLoaderModule : NativeImageLoaderAndroidSpec, LifecycleEventListener {
  private var _imagePipeline: ImagePipeline? = null

  private val enqueuedRequestMonitor = Any()
  private val enqueuedRequests: SparseArray<DataSource<Void?>> = SparseArray<DataSource<Void?>>()
  private var callerContextFactory: ReactCallerContextFactory? = null

  private val callerContext: Any?
    get() = callerContextFactory?.getOrCreateCallerContext("", "") ?: field

  private var imagePipeline: ImagePipeline
    get() = _imagePipeline ?: Fresco.getImagePipeline()
    set(value) {
      _imagePipeline = value
    }

  constructor(reactContext: ReactApplicationContext) : super(reactContext) {
    this.callerContext = this
  }

  constructor(reactContext: ReactApplicationContext, callerContext: Any?) : super(reactContext) {
    this.callerContext = callerContext
  }

  constructor(
      reactContext: ReactApplicationContext,
      imagePipeline: ImagePipeline,
      callerContextFactory: ReactCallerContextFactory
  ) : super(reactContext) {
    this.callerContextFactory = callerContextFactory
    this.imagePipeline = imagePipeline
    this.callerContext = null
  }

  /**
   * Fetch the width and height of the given image.
   *
   * @param uriString the URI of the remote image
   * @param promise the promise that is fulfilled when operation successfully completed or rejected
   *   when there is an error
   */
  @ReactMethod
  override fun getSize(uriString: String?, promise: Promise) {
    if (uriString.isNullOrEmpty()) {
      promise.reject(ERROR_INVALID_URI, "Cannot get the size of an image for an empty URI")
      return
    }
    val source = ImageSource(reactApplicationContext, uriString)
    val request: ImageRequest = ImageRequestBuilder.newBuilderWithSource(source.uri).build()
    val dataSource: DataSource<CloseableReference<CloseableImage>> =
        this.imagePipeline.fetchDecodedImage(request, this.callerContext)
    val dataSubscriber: DataSubscriber<CloseableReference<CloseableImage>> =
        object : BaseDataSubscriber<CloseableReference<CloseableImage>>() {
          override fun onNewResultImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {
            if (!dataSource.isFinished) {
              return
            }
            val ref = dataSource.result
            if (ref != null) {
              try {
                val image: CloseableImage = ref.get()
                val sizes = buildReadableMap {
                  put("width", image.width)
                  put("height", image.height)
                }
                promise.resolve(sizes)
              } catch (e: Exception) {
                promise.reject(ERROR_GET_SIZE_FAILURE, e)
              } finally {
                CloseableReference.closeSafely(ref)
              }
            } else {
              promise.reject(ERROR_GET_SIZE_FAILURE, "Failed to get the size of the image")
            }
          }

          override fun onFailureImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {
            promise.reject(ERROR_GET_SIZE_FAILURE, dataSource.failureCause)
          }
        }
    dataSource.subscribe(dataSubscriber, CallerThreadExecutor.getInstance())
  }

  /**
   * Fetch the width and height of the given image with headers.
   *
   * @param uriString the URI of the remote image
   * @param headers headers send with the request
   * @param promise the promise that is fulfilled when operation successfully completed or rejected
   *   when there is an error
   */
  @ReactMethod
  override fun getSizeWithHeaders(uriString: String?, headers: ReadableMap?, promise: Promise) {
    if (uriString.isNullOrEmpty()) {
      promise.reject(ERROR_INVALID_URI, "Cannot get the size of an image for an empty URI")
      return
    }
    val source = ImageSource(reactApplicationContext, uriString)
    val imageRequestBuilder: ImageRequestBuilder =
        ImageRequestBuilder.newBuilderWithSource(source.uri)
    val request: ImageRequest =
        ReactNetworkImageRequest.fromBuilderWithHeaders(imageRequestBuilder, headers)
    val dataSource: DataSource<CloseableReference<CloseableImage>> =
        this.imagePipeline.fetchDecodedImage(request, this.callerContext)
    val dataSubscriber: DataSubscriber<CloseableReference<CloseableImage>> =
        object : BaseDataSubscriber<CloseableReference<CloseableImage>>() {
          override fun onNewResultImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {
            if (!dataSource.isFinished) {
              return
            }
            val ref = dataSource.result
            if (ref != null) {
              try {
                val image: CloseableImage = ref.get()
                val sizes = buildReadableMap {
                  put("width", image.width)
                  put("height", image.height)
                }
                promise.resolve(sizes)
              } catch (e: Exception) {
                promise.reject(ERROR_GET_SIZE_FAILURE, e)
              } finally {
                CloseableReference.closeSafely(ref)
              }
            } else {
              promise.reject(ERROR_GET_SIZE_FAILURE, "Failed to get the size of the image")
            }
          }

          override fun onFailureImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {
            promise.reject(ERROR_GET_SIZE_FAILURE, dataSource.failureCause)
          }
        }
    dataSource.subscribe(dataSubscriber, CallerThreadExecutor.getInstance())
  }

  /**
   * Prefetches the given image to the Fresco image disk cache.
   *
   * @param uriString the URI of the remote image to prefetch
   * @param requestIdAsDouble the client-supplied request ID used to identify this request
   * @param promise the promise that is fulfilled when the image is successfully prefetched or
   *   rejected when there is an error
   */
  override fun prefetchImage(uriString: String?, requestIdAsDouble: Double, promise: Promise) {
    val requestId = requestIdAsDouble.toInt()
    if (uriString.isNullOrEmpty()) {
      promise.reject(ERROR_INVALID_URI, "Cannot prefetch an image for an empty URI")
      return
    }
    val uri = Uri.parse(uriString)
    val request: ImageRequest = ImageRequestBuilder.newBuilderWithSource(uri).build()
    val prefetchSource: DataSource<Void?> =
        this.imagePipeline.prefetchToDiskCache(request, this.callerContext)
    val prefetchSubscriber =
        object : BaseDataSubscriber<Void?>() {
          override fun onNewResultImpl(dataSource: DataSource<Void?>) {
            if (!dataSource.isFinished) {
              return
            }
            try {
              removeRequest(requestId)
              promise.resolve(true)
            } catch (e: Exception) {
              promise.reject(ERROR_PREFETCH_FAILURE, e)
            } finally {
              dataSource.close()
            }
          }

          override fun onFailureImpl(dataSource: DataSource<Void?>) {
            try {
              removeRequest(requestId)
              promise.reject(ERROR_PREFETCH_FAILURE, dataSource.failureCause)
            } finally {
              dataSource.close()
            }
          }
        }
    registerRequest(requestId, prefetchSource)
    prefetchSource.subscribe(prefetchSubscriber, CallerThreadExecutor.getInstance())
  }

  override fun abortRequest(requestId: Double) {
    val request = removeRequest(requestId.toInt())
    request?.close()
  }

  @ReactMethod
  override fun queryCache(uris: ReadableArray, promise: Promise) {
    // perform cache interrogation in async task as disk cache checks are expensive
    @Suppress("DEPRECATION", "StaticFieldLeak")
    object : GuardedAsyncTask<Void, Void>(reactApplicationContext) {
          override fun doInBackgroundGuarded(vararg params: Void) {
            val result = buildReadableMap {
              val imagePipeline: ImagePipeline = this@ImageLoaderModule.imagePipeline
              repeat(uris.size()) {
                val uriString = uris.getString(it)
                if (!uriString.isNullOrEmpty()) {
                  val uri = Uri.parse(uriString)
                  if (imagePipeline.isInBitmapMemoryCache(uri)) {
                    put(uriString, "memory")
                  } else if (imagePipeline.isInDiskCacheSync(uri)) {
                    put(uriString, "disk")
                  }
                }
              }
            }
            promise.resolve(result)
          }
        }
        .executeOnExecutor(GuardedAsyncTask.THREAD_POOL_EXECUTOR)
  }

  private fun registerRequest(requestId: Int, request: DataSource<Void?>) {
    synchronized(enqueuedRequestMonitor) { enqueuedRequests.put(requestId, request) }
  }

  private fun removeRequest(requestId: Int): DataSource<Void?>? {
    synchronized(enqueuedRequestMonitor) {
      val request: DataSource<Void?>? = enqueuedRequests.get(requestId)
      enqueuedRequests.remove(requestId)
      return request
    }
  }

  override fun onHostResume(): Unit = Unit

  override fun onHostPause(): Unit = Unit

  override fun onHostDestroy() {
    // cancel all requests
    synchronized(enqueuedRequestMonitor) {
      var i = 0
      val size: Int = enqueuedRequests.size()
      while (i < size) {
        val enqueuedRequest: DataSource<Void?> = enqueuedRequests.valueAt(i)
        enqueuedRequest.close()
        i++
      }
      enqueuedRequests.clear()
    }
  }

  companion object {
    private const val ERROR_INVALID_URI = "E_INVALID_URI"
    private const val ERROR_PREFETCH_FAILURE = "E_PREFETCH_FAILURE"
    private const val ERROR_GET_SIZE_FAILURE = "E_GET_SIZE_FAILURE"

    const val NAME: String = "ImageLoader"
  }
}
