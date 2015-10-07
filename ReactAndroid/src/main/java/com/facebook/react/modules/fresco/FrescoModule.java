/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.fresco;

import java.util.HashSet;

import android.content.Context;

import com.facebook.cache.common.CacheKey;
import com.facebook.common.internal.AndroidPredicates;
import com.facebook.common.soloader.SoLoaderShim;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.imagepipeline.backends.okhttp.OkHttpImagePipelineConfigFactory;
import com.facebook.imagepipeline.core.ImagePipelineConfig;
import com.facebook.imagepipeline.core.ImagePipelineFactory;
import com.facebook.imagepipeline.listener.RequestListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.modules.common.ModuleDataCleaner;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.facebook.soloader.SoLoader;

import com.squareup.okhttp.OkHttpClient;

/**
 * Module to initialize the Fresco library.
 *
 * <p>Does not expose any methods to JavaScript code. For initialization and cleanup only.
 */
public class FrescoModule extends ReactContextBaseJavaModule implements
    ModuleDataCleaner.Cleanable {

  public FrescoModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }


  @Override
  public void initialize() {
    super.initialize();
    // Make sure the SoLoaderShim is configured to use our loader for native libraries.
    // This code can be removed if using Fresco from Maven rather than from source
    SoLoaderShim.setHandler(
        new SoLoaderShim.Handler() {
          @Override
          public void loadLibrary(String libraryName) {
            SoLoader.loadLibrary(libraryName);
          }
        });

    HashSet<RequestListener> requestListeners = new HashSet<>();
    requestListeners.add(new SystraceRequestListener());

    Context context = this.getReactApplicationContext().getApplicationContext();
    OkHttpClient okHttpClient = OkHttpClientProvider.getOkHttpClient();
    ImagePipelineConfig config = OkHttpImagePipelineConfigFactory
        .newBuilder(context, okHttpClient)
        .setDownsampleEnabled(false)
        .setRequestListeners(requestListeners)
        .build();
    Fresco.initialize(context, config);
  }

  @Override
  public String getName() {
    return "FrescoModule";
  }

  @Override
  public void clearSensitiveData() {
    // Clear image cache.
    ImagePipelineFactory imagePipelineFactory = Fresco.getImagePipelineFactory();
    imagePipelineFactory.getBitmapMemoryCache().removeAll(AndroidPredicates.<CacheKey>True());
    imagePipelineFactory.getEncodedMemoryCache().removeAll(AndroidPredicates.<CacheKey>True());
    imagePipelineFactory.getMainDiskStorageCache().clearAll();
    imagePipelineFactory.getSmallImageDiskStorageCache().clearAll();
  }
}
