/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.build

import com.facebook.react.BuildConfig
import kotlin.jvm.JvmField

/**
 * Convenience class for accessing auto-generated BuildConfig so that a) other modules can just
 * depend on this module instead of having to manually depend on generating their own build config
 * and b) we don't have to deal with IntelliJ getting confused about the autogenerated BuildConfig
 * class all over the place.
 */
public object ReactBuildConfig {

  @JvmField public val DEBUG: Boolean = BuildConfig.DEBUG

  @JvmField public val IS_INTERNAL_BUILD: Boolean = BuildConfig.IS_INTERNAL_BUILD

  /**
   * `true` if Perfetto was enabled on this build (`WITH_PERFETTO=1`), indicating it is a profiling
   * build.
   */
  @JvmField public val ENABLE_PERFETTO: Boolean = BuildConfig.ENABLE_PERFETTO

  @JvmField public val EXOPACKAGE_FLAGS: Int = BuildConfig.EXOPACKAGE_FLAGS

  /** [Experimental] Enable React Native DevTools in release builds. */
  @JvmField
  public val UNSTABLE_ENABLE_FUSEBOX_RELEASE: Boolean = BuildConfig.UNSTABLE_ENABLE_FUSEBOX_RELEASE

  @JvmField
  public val UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE: Boolean =
      BuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE
}
