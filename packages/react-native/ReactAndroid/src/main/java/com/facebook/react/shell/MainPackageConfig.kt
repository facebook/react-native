/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.shell

import com.facebook.imagepipeline.core.ImagePipelineConfig

/** Configuration for [MainReactPackage] */
public class MainPackageConfig private constructor(builder: Builder) {
  public val frescoConfig: ImagePipelineConfig = builder.mFrescoConfig

  public class Builder {
    internal lateinit var mFrescoConfig: ImagePipelineConfig

    public fun setFrescoConfig(frescoConfig: ImagePipelineConfig): Builder {
      mFrescoConfig = frescoConfig
      return this
    }

    public fun build(): MainPackageConfig {
      if (!::mFrescoConfig.isInitialized) {
        throw IllegalStateException("Fresco config must be set")
      }
      return MainPackageConfig(this)
    }
  }
}
