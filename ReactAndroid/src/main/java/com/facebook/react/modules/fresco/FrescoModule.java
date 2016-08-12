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
import android.support.annotation.Nullable;

import com.facebook.cache.common.CacheKey;
import com.facebook.cache.disk.DiskCacheConfig;
import com.facebook.common.internal.AndroidPredicates;
import com.facebook.common.soloader.SoLoaderShim;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.imagepipeline.backends.okhttp3.OkHttpImagePipelineConfigFactory;
import com.facebook.imagepipeline.core.ImagePipelineConfig;
import com.facebook.imagepipeline.core.ImagePipelineFactory;
import com.facebook.imagepipeline.listener.RequestListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.modules.common.ModuleDataCleaner;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.facebook.soloader.SoLoader;

import okhttp3.OkHttpClient;

/**
 * Module to initialize the Fresco library.
 *
 * <p>Does not expose any methods to JavaScript code. For initialization and cleanup only.
 */
public class FrescoModule extends ReactContextBaseJavaModule implements
    ModuleDataCleaner.Cleanable {

  private @Nullable ImagePipelineConfig mConfig;

  public FrescoModule(ReactApplicationContext reactContext) {
    this(reactContext, getDefaultConfig(reactContext, null, null));
  }

  public FrescoModule(ReactApplicationContext reactContext, RequestListener listener) {
    this(reactContext, getDefaultConfig(reactContext, listener, null));
  }

  public FrescoModule(
      ReactApplicationContext reactContext,
      RequestListener listener,
      DiskCacheConfig diskCacheConfig) {
    this(reactContext, getDefaultConfig(reactContext, listener, diskCacheConfig));
  }

  public FrescoModule(ReactApplicationContext reactContext, ImagePipelineConfig config) {
    super(reactContext);
    mConfig = config;
  }

  @Override
  public void initialize() {
    super.initialize();
    // Make sure the SoLoaderShim is configured to use our loader for native libraries.
    // This code can be removed if using Fresco from Maven rather than from source
    SoLoaderShim.setHandler(new FrescoHandler());

    Context context = getReactApplicationContext().getApplicationContext();
    Fresco.initialize(context, mConfig);
    mConfig = null;
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
    imagePipelineFactory.getMainFileCache().clearAll();
    imagePipelineFactory.getSmallImageFileCache().clearAll();
  }

  private static ImagePipelineConfig getDefaultConfig(
      Context context,
      @Nullable RequestListener listener,
      @Nullable DiskCacheConfig diskCacheConfig) {
    HashSet<RequestListener> requestListeners = new HashSet<>();
    requestListeners.add(new SystraceRequestListener());
    if (listener != null) {
      requestListeners.add(listener);
    }

    OkHttpClient okHttpClient = OkHttpClientProvider.getOkHttpClient();
    ImagePipelineConfig.Builder builder =
        OkHttpImagePipelineConfigFactory.newBuilder(context.getApplicationContext(), okHttpClient);

    builder
        .setDownsampleEnabled(false)
        .setRequestListeners(requestListeners);

    if (diskCacheConfig != null) {
      builder.setMainDiskCacheConfig(diskCacheConfig);
    }

    return builder.build();
  }

  private static class FrescoHandler implements SoLoaderShim.Handler {
    @Override
    public void loadLibrary(String libraryName) {
      SoLoader.loadLibrary(libraryName);
    }
  }
}
