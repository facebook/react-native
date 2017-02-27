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

import com.facebook.common.soloader.SoLoaderShim;
import com.facebook.common.logging.FLog;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.imagepipeline.backends.okhttp3.OkHttpImagePipelineConfigFactory;
import com.facebook.imagepipeline.core.ImagePipelineConfig;
import com.facebook.imagepipeline.listener.RequestListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.common.ModuleDataCleaner;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.facebook.soloader.SoLoader;

import okhttp3.OkHttpClient;

/**
 * Module to initialize the Fresco library.
 *
 * <p>Does not expose any methods to JavaScript code. For initialization and cleanup only.
 */
@ReactModule(name = "FrescoModule")
public class FrescoModule extends ReactContextBaseJavaModule implements
    ModuleDataCleaner.Cleanable {

  private @Nullable ImagePipelineConfig mConfig;

  private static boolean sHasBeenInitialized = false;

  /**
   * Create a new Fresco module with a default configuration (or the previously given
   * configuration via {@link #FrescoModule(ReactApplicationContext, ImagePipelineConfig)}.
   *
   * @param reactContext the context to use
   */
  public FrescoModule(ReactApplicationContext reactContext) {
    this(reactContext, null);
  }

  /**
   * Create a new Fresco module with a given ImagePipelineConfig.
   * This should only be called when the module has not been initialized yet.
   * You can use {@link #hasBeenInitialized()} to check this and call
   * {@link #FrescoModule(ReactApplicationContext)} if it is already initialized.
   * Otherwise, the given Fresco configuration will be ignored.
   *
   * @param reactContext the context to use
   * @param config the Fresco configuration, which will only be used for the first initialization
   */
  public FrescoModule(ReactApplicationContext reactContext, @Nullable ImagePipelineConfig config) {
    super(reactContext);
    mConfig = config;
  }

  @Override
  public void initialize() {
    super.initialize();
    if (!hasBeenInitialized()) {
      // Make sure the SoLoaderShim is configured to use our loader for native libraries.
      // This code can be removed if using Fresco from Maven rather than from source
      SoLoaderShim.setHandler(new FrescoHandler());
      if (mConfig == null) {
        mConfig = getDefaultConfig(getReactApplicationContext());
      }
      Context context = getReactApplicationContext().getApplicationContext();
      Fresco.initialize(context, mConfig);
      sHasBeenInitialized = true;
    } else if (mConfig != null) {
      FLog.w(
          ReactConstants.TAG,
          "Fresco has already been initialized with a different config. "
          + "The new Fresco configuration will be ignored!");
    }
    mConfig = null;
  }

  @Override
  public String getName() {
    return "FrescoModule";
  }

  @Override
  public void clearSensitiveData() {
    // Clear image cache.
    Fresco.getImagePipeline().clearCaches();
  }

  /**
   * Check whether the FrescoModule has already been initialized. If this is the case,
   * Calls to {@link #FrescoModule(ReactApplicationContext, ImagePipelineConfig)} will
   * ignore the given configuration.
   *
   * @return true if this module has already been initialized
   */
  public static boolean hasBeenInitialized() {
    return sHasBeenInitialized;
  }

  private static ImagePipelineConfig getDefaultConfig(Context context) {
    return getDefaultConfigBuilder(context).build();
  }

  /**
   * Get the default Fresco configuration builder.
   * Allows adding of configuration options in addition to the default values.
   *
   * @return {@link ImagePipelineConfig.Builder} that has been initialized with default values
   */
  public static ImagePipelineConfig.Builder getDefaultConfigBuilder(Context context) {
    HashSet<RequestListener> requestListeners = new HashSet<>();
    requestListeners.add(new SystraceRequestListener());

    OkHttpClient okHttpClient = OkHttpClientProvider.getOkHttpClient();
    return OkHttpImagePipelineConfigFactory
      .newBuilder(context.getApplicationContext(), okHttpClient)
      .setNetworkFetcher(new ReactOkHttpNetworkFetcher(okHttpClient))
      .setDownsampleEnabled(false)
      .setRequestListeners(requestListeners);
  }

  private static class FrescoHandler implements SoLoaderShim.Handler {
    @Override
    public void loadLibrary(String libraryName) {
      SoLoader.loadLibrary(libraryName);
    }
  }
}
