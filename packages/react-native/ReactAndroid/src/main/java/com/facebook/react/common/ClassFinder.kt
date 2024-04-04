/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

import com.facebook.react.BuildConfig
import kotlin.jvm.Throws

public object ClassFinder {

  /**
   * We don't run the ModuleInfoProvider Annotation Processor in OSS, so there is no need to attempt
   * to call Class.forName() as we know for sure that those classes won't be there.
   */
  @JvmStatic
  public fun canLoadClassesFromAnnotationProcessors(): Boolean = BuildConfig.IS_INTERNAL_BUILD

  @JvmStatic
  @Throws(ClassNotFoundException::class)
  public fun findClass(className: String): Class<*>? {
    if (canLoadClassesFromAnnotationProcessors().not()) {
      return null
    }
    return Class.forName(className)
  }
}
