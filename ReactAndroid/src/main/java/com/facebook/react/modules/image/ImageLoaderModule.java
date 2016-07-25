/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.image;

import javax.annotation.Nullable;

import android.net.Uri;
import android.util.SparseArray;

import com.facebook.common.executors.CallerThreadExecutor;
import com.facebook.common.references.CloseableReference;
import com.facebook.datasource.BaseDataSubscriber;
import com.facebook.datasource.DataSource;
import com.facebook.datasource.DataSubscriber;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.imagepipeline.image.CloseableImage;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

public class ImageLoaderModule extends ReactContextBaseJavaModule implements
  LifecycleEventListener {

  private static final String ERROR_INVALID_URI = "E_INVALID_URI";
  private static final String ERROR_PREFETCH_FAILURE = "E_PREFETCH_FAILURE";
  private static final String ERROR_GET_SIZE_FAILURE = "E_GET_SIZE_FAILURE";

  private final Object mCallerContext;
  private final Object mEnqueuedRequestMonitor = new Object();
  private final SparseArray<DataSource<Void>> mEnqueuedRequests = new SparseArray<>();

  public ImageLoaderModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mCallerContext = this;
  }

  public ImageLoaderModule(ReactApplicationContext reactContext, Object callerContext) {
    super(reactContext);
    mCallerContext = callerContext;
  }

  @Override
  public String getName() {
    return "ImageLoader";
  }

  /**
   * Fetch the width and height of the given image.
   *
   * @param uriString the URI of the remote image to prefetch
   * @param promise the promise that is fulfilled when the image is successfully prefetched
   *                or rejected when there is an error
   */
  @ReactMethod
  public void getSize(
      final String uriString,
      final Promise promise) {
    if (uriString == null || uriString.isEmpty()) {
      promise.reject(ERROR_INVALID_URI, "Cannot get the size of an image for an empty URI");
      return;
    }

    Uri uri = Uri.parse(uriString);
    ImageRequest request = ImageRequestBuilder.newBuilderWithSource(uri).build();

    DataSource<CloseableReference<CloseableImage>> dataSource =
      Fresco.getImagePipeline().fetchDecodedImage(request, mCallerContext);

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
   * @param requestId the client-supplied request ID used to identify this request
   * @param promise the promise that is fulfilled when the image is successfully prefetched
   *                or rejected when there is an error
   */
  @ReactMethod
  public void prefetchImage(
    final String uriString,
    final int requestId,
    final Promise promise)
  {
    if (uriString == null || uriString.isEmpty()) {
      promise.reject(ERROR_INVALID_URI, "Cannot prefetch an image for an empty URI");
      return;
    }

    Uri uri = Uri.parse(uriString);
    ImageRequest request = ImageRequestBuilder.newBuilderWithSource(uri).build();

    DataSource<Void> prefetchSource =
      Fresco.getImagePipeline().prefetchToDiskCache(request, mCallerContext);
    DataSubscriber<Void> prefetchSubscriber = new BaseDataSubscriber<Void>() {
      @Override
      protected void onNewResultImpl(DataSource<Void> dataSource) {
        if (!dataSource.isFinished()) {
          return;
        }
        try {
          removeRequest(requestId);
          promise.resolve(true);
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

  @ReactMethod
  public void abortRequest(final int requestId) {
    DataSource<Void> request = removeRequest(requestId);
    if (request != null) {
      request.close();
    }
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
  public void onHostResume() {
  }

  @Override
  public void onHostPause() {
  }

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
