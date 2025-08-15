/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ModuleHolder
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.ReactConstants

internal object ReactPackageHelper {

  /**
   * A helper method to iterate over a list of Native Modules and convert them to an iterable.
   *
   * @param reactPackage
   * @param reactApplicationContext
   * @return
   */
  fun getNativeModuleIterator(
      reactPackage: ReactPackage,
      reactApplicationContext: ReactApplicationContext,
  ): Iterable<ModuleHolder> {
    FLog.d(
        ReactConstants.TAG,
        "${reactPackage.javaClass.simpleName} is not a LazyReactPackage, falling back to old version.",
    )
    @Suppress("DEPRECATION")
    val nativeModules = reactPackage.createNativeModules(reactApplicationContext)
    return Iterable {
      object : Iterator<ModuleHolder> {
        var position = 0

        override fun next(): ModuleHolder = ModuleHolder(nativeModules[position++])

        override fun hasNext(): Boolean = position < nativeModules.size
      }
    }
  }
}
