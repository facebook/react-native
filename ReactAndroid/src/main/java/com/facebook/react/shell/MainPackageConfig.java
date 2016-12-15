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

/**
 * Configuration for {@link MainReactPackage}
 */
public class MainPackageConfig {

  private ImagePipelineConfig mFrescoConfig;

  private MainPackageConfig(Builder builder) {
    mFrescoConfig = builder.mFrescoConfig;
  }

  public ImagePipelineConfig getFrescoConfig() {
    return mFrescoConfig;
  }

  public static class Builder {

    private ImagePipelineConfig mFrescoConfig;

    public Builder setFrescoConfig(ImagePipelineConfig frescoConfig) {
      mFrescoConfig = frescoConfig;
      return this;
    }

    public MainPackageConfig build() {
      return new MainPackageConfig(this);
    }
  }
}
