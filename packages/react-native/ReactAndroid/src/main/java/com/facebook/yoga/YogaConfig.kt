/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

public abstract class YogaConfig {
  public abstract fun setExperimentalFeatureEnabled(
      feature: YogaExperimentalFeature,
      enabled: Boolean,
  )

  public abstract fun setUseWebDefaults(useWebDefaults: Boolean)

  public abstract fun setPointScaleFactor(pixelsInPoint: Float)

  public abstract fun setErrata(errata: YogaErrata)

  public abstract fun getErrata(): YogaErrata

  public abstract fun setLogger(logger: YogaLogger)

  public abstract fun getLogger(): YogaLogger

  protected abstract fun getNativePointer(): Long

  public companion object {
    public var SPACING_TYPE: Int = 1
  }
}
