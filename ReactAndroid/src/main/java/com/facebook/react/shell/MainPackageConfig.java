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
import com.facebook.react.modules.network.OkHttpClientProvider;

/**
 * Configuration for {@link MainReactPackage}
 */
public class MainPackageConfig {

  private final OkHttpClientProvider okHttpClientProvider;
  private final ImagePipelineConfig mFrescoConfig;

  private MainPackageConfig(Builder builder) {
    mFrescoConfig = builder.mFrescoConfig;
    okHttpClientProvider = builder.okHttpClientProvider;
  }

  public ImagePipelineConfig getFrescoConfig() {
    return mFrescoConfig;
  }

  public OkHttpClientProvider getOkHttpClientProvider() {
    return okHttpClientProvider;
  }

  public static class Builder {

    private ImagePipelineConfig mFrescoConfig;
    private OkHttpClientProvider okHttpClientProvider;

    public Builder setFrescoConfig(ImagePipelineConfig frescoConfig) {
      mFrescoConfig = frescoConfig;
      return this;
    }

    public Builder setOkHttpClientProvider(OkHttpClientProvider okHttpClientProvider) {
      this.okHttpClientProvider = okHttpClientProvider;
      return this;
    }

    public MainPackageConfig build() {
      return new MainPackageConfig(this);
    }
  }
}
