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
import com.facebook.react.modules.network.NetworkInterceptorCreator;

import java.util.List;

/**
 * Configuration for {@link MainReactPackage}
 */
public class MainPackageConfig {

  private ImagePipelineConfig mFrescoConfig;
  private List<NetworkInterceptorCreator> mNetworkInterceptorCreators;

  private MainPackageConfig(Builder builder) {
    mFrescoConfig = builder.mFrescoConfig;
    mNetworkInterceptorCreators = builder.mNetworkInterceptorCreators;
  }

  public ImagePipelineConfig getFrescoConfig() {
    return mFrescoConfig;
  }

  public List<NetworkInterceptorCreator> getNetworkInterceptorCreators(){
    return mNetworkInterceptorCreators;
  }

  public static class Builder {

    private ImagePipelineConfig mFrescoConfig;
    private List<NetworkInterceptorCreator> mNetworkInterceptorCreators;

    public Builder setFrescoConfig(ImagePipelineConfig frescoConfig) {
      mFrescoConfig = frescoConfig;
      return this;
    }

    public Builder setInterceptor(List<NetworkInterceptorCreator> networkInterceptorCreators) {
      mNetworkInterceptorCreators = networkInterceptorCreators;
      return this;
    }

    public MainPackageConfig build() {
      return new MainPackageConfig(this);
    }
  }
}
