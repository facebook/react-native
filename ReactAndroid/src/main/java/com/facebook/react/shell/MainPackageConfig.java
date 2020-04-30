/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.shell;

import com.facebook.imagepipeline.core.ImagePipelineConfig;

/** Configuration for {@link MainReactPackage} */
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
