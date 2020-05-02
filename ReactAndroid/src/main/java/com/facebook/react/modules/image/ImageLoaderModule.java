/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.image;

import android.net.Uri;
import android.util.SparseArray;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.common.executors.CallerThreadExecutor;
import com.facebook.common.references.CloseableReference;
import com.facebook.datasource.BaseDataSubscriber;
import com.facebook.datasource.DataSource;
import com.facebook.datasource.DataSubscriber;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.fbreact.specs.NativeImageLoaderAndroidSpec;
import com.facebook.imagepipeline.core.ImagePipeline;
import com.facebook.imagepipeline.image.CloseableImage;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.GuardedAsyncTask;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.fresco.ReactNetworkImageRequest;
import com.facebook.react.views.image.ReactCallerContextFactory;
import com.facebook.react.views.imagehelper.ImageSource;

@ReactModule(name = ImageLoaderModule.NAME)
public class ImageLoaderModule extends NativeImageLoaderAndroidSpec
    implements LifecycleEventListener {

  private static final String ERROR_INVALID_URI = "E_INVALID_URI";
  private static final String ERROR_PREFETCH_FAILURE = "E_PREFETCH_FAILURE";
  private static final String ERROR_GET_SIZE_FAILURE = "E_GET_SIZE_FAILURE";
  public static final String NAME = "ImageLoader";

  private @Nullable final Object mCallerContext;
  private final Object mEnqueuedRequestMonitor = new Object();
  private final SparseArray<DataSource<Void>> mEnqueuedRequests = new SparseArray<>();
  private @Nullable ImagePipeline mImagePipeline = null;
  private @Nullable ReactCallerContextFactory mCallerContextFactory;

  public ImageLoaderModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mCallerContext = this;
  }

  public ImageLoaderModule(ReactApplicationContext reactContext, Object callerContext) {
    super(reactContext);
    mCallerContext = callerContext;
  }

  public ImageLoaderModule(
      ReactApplicationContext reactContext,
      ImagePipeline imagePipeline,
      ReactCallerContextFactory callerContextFactory) {
    super(reactContext);
    mCallerContextFactory = callerContextFactory;
    mImagePipeline = imagePipeline;
    mCallerContext = null;
  }

  private @Nullable Object getCallerContext() {
    return mCallerContextFactory != null
        ? mCallerContextFactory.getOrCreateCallerContext("", "")
        : mCallerContext;
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  private ImagePipeline getImagePipeline() {
    return mImagePipeline != null ? mImagePipeline : Fresco.getImagePipeline();
  }

  /**
   * Fetch the width and height of the given image.
   *
   * @param uriString the URI of the remote image to prefetch
   * @param promise the promise that is fulfilled when the image is successfully prefetched or
   *     rejected when there is an error
   */
  @ReactMethod
  public void getSize(final String uriString, final Promise promise) {
    if (uriString == null || uriString.isEmpty()) {
      promise.reject(ERROR_INVALID_URI, "Cannot get the size of an image for an empty URI");
      return;
    }

    ImageSource source = new ImageSource(getReactApplicationContext(), uriString);
    ImageRequest request = ImageRequestBuilder.newBuilderWithSource(source.getUri()).build();

    DataSource<CloseableReference<CloseableImage>> dataSource =
        getImagePipeline().fetchDecodedImage(request, getCallerContext());

    DataSubscriber<CloseableReference<CloseableImage>> dataSubscriber =
        new BaseDataSubscriber<CloseableReference<CloseableImage>>() {
          @Override
          protected void onNewResultImpl(
              DataSource<CloseableReference<CloseableImage>> dataSource) {
            if (!dataSource.isFinished()) {
              return;
            }
            CloseableReference<CloseableImage> ref = dataSource.getResult();
            if (ref != null) {
              try {
                CloseableImage image = ref.get();

                WritableMap sizes = Arguments.createMap();
                sizes.putInt("width", image.getWidth());
                sizes.putInt("height", image.getHeight());

                promise.resolve(sizes);
              } catch (Exception e) {
                promise.reject(ERROR_GET_SIZE_FAILURE, e);
              } finally {
                CloseableReference.closeSafely(ref);
              }
            } else {
              promise.reject(ERROR_GET_SIZE_FAILURE);
            }
          }

          @Override
          protected void onFailureImpl(DataSource<CloseableReference<CloseableImage>> dataSource) {
            promise.reject(ERROR_GET_SIZE_FAILURE, dataSource.getFailureCause());
          }
        };
    dataSource.subscribe(dataSubscriber, CallerThreadExecutor.getInstance());
  }

  /**
   * Fetch the width and height of the given image with headers.
   *
   * @param uriString the URI of the remote image to prefetch
   * @param headers headers send with the request
   * @param promise the promise that is fulfilled when the image is successfully prefetched or
   *     rejected when there is an error
   */
  @ReactMethod
  public void getSizeWithHeaders(
      final String uriString, final ReadableMap headers, final Promise promise) {
    if (uriString == null || uriString.isEmpty()) {
      promise.reject(ERROR_INVALID_URI, "Cannot get the size of an image for an empty URI");
      return;
    }

    ImageSource source = new ImageSource(getReactApplicationContext(), uriString);
    ImageRequestBuilder imageRequestBuilder =
        ImageRequestBuilder.newBuilderWithSource(source.getUri());
    ImageRequest request =
        ReactNetworkImageRequest.fromBuilderWithHeaders(imageRequestBuilder, headers);

    DataSource<CloseableReference<CloseableImage>> dataSource =
        getImagePipeline().fetchDecodedImage(request, getCallerContext());

    DataSubscriber<CloseableReference<CloseableImage>> dataSubscriber =
        new BaseDataSubscriber<CloseableReference<CloseableImage>>() {
          @Override
          protected void onNewResultImpl(
              DataSource<CloseableReference<CloseableImage>> dataSource) {
            if (!dataSource.isFinished()) {
              return;
            }
            CloseableReference<CloseableImage> ref = dataSource.getResult();
            if (ref != null) {
              try {
                CloseableImage image = ref.get();

                WritableMap sizes = Arguments.createMap();
                sizes.putInt("width", image.getWidth());
                sizes.putInt("height", image.getHeight());

                promise.resolve(sizes);
              } catch (Exception e) {
                promise.reject(ERROR_GET_SIZE_FAILURE, e);
              } finally {
                CloseableReference.closeSafely(ref);
              }
            } else {
              promise.reject(ERROR_GET_SIZE_FAILURE);
            }
          }

          @Override
          protected void onFailureImpl(DataSource<CloseableReference<CloseableImage>> dataSource) {
            promise.reject(ERROR_GET_SIZE_FAILURE, dataSource.getFailureCause());
          }
        };
    dataSource.subscribe(dataSubscriber, CallerThreadExecutor.getInstance());
  }

  /**
   * Prefetches the given image to the Fresco image disk cache.
   *
   * @param uriString the URI of the remote image to prefetch
   * @param requestIdAsDouble the client-supplied request ID used to identify this request
   * @param promise the promise that is fulfilled when the image is successfully prefetched or
   *     rejected when there is an error
   */
  @Override
  public void prefetchImage(
      final String uriString, final double requestIdAsDouble, final Promise promise) {
    final int requestId = (int) requestIdAsDouble;

    if (uriString == null || uriString.isEmpty()) {
      promise.reject(ERROR_INVALID_URI, "Cannot prefetch an image for an empty URI");
      return;
    }

    Uri uri = Uri.parse(uriString);
    ImageRequest request = ImageRequestBuilder.newBuilderWithSource(uri).build();

    DataSource<Void> prefetchSource =
        getImagePipeline().prefetchToDiskCache(request, getCallerContext());
    DataSubscriber<Void> prefetchSubscriber =
        new BaseDataSubscriber<Void>() {
          @Override
          protected void onNewResultImpl(DataSource<Void> dataSource) {
            if (!dataSource.isFinished()) {
              return;
            }
            try {
              removeRequest(requestId);
              promise.resolve(true);
            } catch (Exception e) {
              promise.reject(ERROR_PREFETCH_FAILURE, e);
            } finally {
              dataSource.close();
            }
          }

          @Override
          protected void onFailureImpl(DataSource<Void> dataSource) {
            try {
              removeRequest(requestId);
              promise.reject(ERROR_PREFETCH_FAILURE, dataSource.getFailureCause());
            } finally {
              dataSource.close();
            }
          }
        };
    registerRequest(requestId, prefetchSource);
    prefetchSource.subscribe(prefetchSubscriber, CallerThreadExecutor.getInstance());
  }

  @Override
  public void abortRequest(double requestId) {
    DataSource<Void> request = removeRequest((int) requestId);
    if (request != null) {
      request.close();
    }
  }

  @ReactMethod
  public void queryCache(final ReadableArray uris, final Promise promise) {
    // perform cache interrogation in async task as disk cache checks are expensive
    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        WritableMap result = Arguments.createMap();
        ImagePipeline imagePipeline = getImagePipeline();
        for (int i = 0; i < uris.size(); i++) {
          String uriString = uris.getString(i);
          final Uri uri = Uri.parse(uriString);
          if (imagePipeline.isInBitmapMemoryCache(uri)) {
            result.putString(uriString, "memory");
          } else if (imagePipeline.isInDiskCacheSync(uri)) {
            result.putString(uriString, "disk");
          }
        }
        promise.resolve(result);
      }
    }.executeOnExecutor(GuardedAsyncTask.THREAD_POOL_EXECUTOR);
  }

  private void registerRequest(int requestId, DataSource<Void> request) {
    synchronized (mEnqueuedRequestMonitor) {
      mEnqueuedRequests.put(requestId, request);
    }
  }

  private @Nullable DataSource<Void> removeRequest(int requestId) {
    synchronized (mEnqueuedRequestMonitor) {
      DataSource<Void> request = mEnqueuedRequests.get(requestId);
      mEnqueuedRequests.remove(requestId);
      return request;
    }
  }

  @Override
  public void onHostResume() {}

  @Override
  public void onHostPause() {}

  @Override
  public void onHostDestroy() {
    // cancel all requests
    synchronized (mEnqueuedRequestMonitor) {
      for (int i = 0, size = mEnqueuedRequests.size(); i < size; i++) {
        @Nullable DataSource<Void> enqueuedRequest = mEnqueuedRequests.valueAt(i);
        if (enqueuedRequest != null) {
          enqueuedRequest.close();
        }
      }
      mEnqueuedRequests.clear();
    }
  }
}
