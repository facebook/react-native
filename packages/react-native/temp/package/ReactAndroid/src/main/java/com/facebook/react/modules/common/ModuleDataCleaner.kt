/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.common

import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.ReactConstants

/**
 * Cleans sensitive user data from native modules that implement the [Cleanable] interface. This is
 * useful e.g. when a user logs out from an app.
 */
public object ModuleDataCleaner {

  @JvmStatic
  public fun cleanDataFromModules(reactContext: ReactContext) {
    reactContext.nativeModules.forEach { nativeModule ->
      if (nativeModule is Cleanable) {
        FLog.d(ReactConstants.TAG, "Cleaning data from ${nativeModule.getName()}")
        nativeModule.clearSensitiveData()
      }
    }
  }

  /**
   * Indicates a module may contain sensitive user data and should be cleaned on logout.
   *
   * Types of data that should be cleaned: - Persistent data (disk) that may contain user
   * information or content. - Retained (static) in-memory data that may contain user info or
   * content.
   *
   * Note that the following types of modules do not need to be cleaned here: - Modules whose user
   * data is kept in memory in non-static fields, assuming the app uses a separate instance for each
   * viewer context. - Modules that remove all persistent data (temp files, etc) when the catalyst
   * instance is destroyed. This is because logout implies that the instance is destroyed. Apps
   * should enforce this.
   */
  public fun interface Cleanable {
    public fun clearSensitiveData()
  }
}
