/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.shell;

import com.facebook.imagepipeline.core.ImagePipelineConfig;
import com.facebook.react.modules.network.DefaultOkHttpProvider;
import com.facebook.react.modules.network.OkHttpClientProvider;

import javax.annotation.Nullable;

/**
 * Configuration for {@link MainReactPackage}
 */
public class MainPackageConfig {

  private final @Nullable OkHttpClientProvider mHttpClientProvider;

  private final ImagePipelineConfig mFrescoConfig;

  private MainPackageConfig(Builder builder) {
    mFrescoConfig = builder.mFrescoConfig;
    mHttpClientProvider = builder.mHttpClientProvider;
  }

  public ImagePipelineConfig getFrescoConfig() {
    return mFrescoConfig;
  }
  
  public @Nullable OkHttpClientProvider getHttpClientProvider() {
    return mHttpClientProvider;
  }

  public static class Builder {

    private ImagePipelineConfig mFrescoConfig;
    private @Nullable  OkHttpClientProvider mHttpClientProvider;

    public Builder setFrescoConfig(ImagePipelineConfig frescoConfig) {
      mFrescoConfig = frescoConfig;
      return this;
    }

    /**
     * Allows to provide a custom OkHttp client provider that will be used
     * for networking calls from JavaScript (especially the fetch API).
     * This can be useful for example in hybrid apps which have their own
     * OkHttp client configured with custom headers, logging, etc.
     *
     * This does not configure the networking client the Image JavaScript
     * component uses when fetching images.
     */
    public Builder setHttpClientProvider(@Nullable OkHttpClientProvider httpClientProvider) {
      this.mHttpClientProvider = httpClientProvider;
      return this;
    }

    public MainPackageConfig build() {
      return new MainPackageConfig(this);
    }
  }
}
