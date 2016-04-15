/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.image;

import android.net.Uri;

import com.facebook.common.executors.CallerThreadExecutor;
import com.facebook.datasource.BaseDataSubscriber;
import com.facebook.datasource.DataSource;
import com.facebook.datasource.DataSubscriber;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class ImageLoaderModule extends ReactContextBaseJavaModule {

  private static final String ERROR_INVALID_URI = "E_INVALID_URI";
  private static final String ERROR_PREFETCH_FAILURE = "E_PREFETCH_FAILURE";

  public ImageLoaderModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ImageLoader";
  }

  /**
   * Prefetches the given image to the Fresco image disk cache.
   *
   * @param uriString the URI of the remote image to prefetch
   * @param promise the promise that is fulfilled when the image is successfully prefetched
   *                or rejected when there is an error
   */
  @ReactMethod
  public void prefetchImage(String uriString, final Promise promise) {
    if (uriString == null || uriString.isEmpty()) {
      promise.reject(ERROR_INVALID_URI, "Cannot prefetch an image for an empty URI");
      return;
    }

    Uri uri = Uri.parse(uriString);
    ImageRequest request = ImageRequestBuilder.newBuilderWithSource(uri).build();

    DataSource<Void> prefetchSource = Fresco.getImagePipeline().prefetchToDiskCache(request, this);
    DataSubscriber<Void> prefetchSubscriber = new BaseDataSubscriber<Void>() {
      @Override
      protected void onNewResultImpl(DataSource<Void> dataSource) {
        if (!dataSource.isFinished()) {
          return;
        }
        try {
          promise.resolve(true);
        } finally {
          dataSource.close();
        }
      }

      @Override
      protected void onFailureImpl(DataSource<Void> dataSource) {
        try {
          promise.reject(ERROR_PREFETCH_FAILURE, dataSource.getFailureCause());
        } finally {
          dataSource.close();
        }
      }
    };
    prefetchSource.subscribe(prefetchSubscriber, CallerThreadExecutor.getInstance());
  }
}
