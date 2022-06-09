/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.common;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.ReactConstants;

/**
 * Cleans sensitive user data from native modules that implement the {@code Cleanable} interface.
 * This is useful e.g. when a user logs out from an app.
 */
public class ModuleDataCleaner {

  /**
   * Indicates a module may contain sensitive user data and should be cleaned on logout.
   *
   * <p>Types of data that should be cleaned: - Persistent data (disk) that may contain user
   * information or content. - Retained (static) in-memory data that may contain user info or
   * content.
   *
   * <p>Note that the following types of modules do not need to be cleaned here: - Modules whose
   * user data is kept in memory in non-static fields, assuming the app uses a separate instance for
   * each viewer context. - Modules that remove all persistent data (temp files, etc) when the
   * catalyst instance is destroyed. This is because logout implies that the instance is destroyed.
   * Apps should enforce this.
   */
  public interface Cleanable {

    void clearSensitiveData();
  }

  /**
   * Please use the cleanDataFromModules(ReactContext) instead. This method is not compatible with
   * bridgeless mode.
   *
   * @deprecated
   */
  public static void cleanDataFromModules(CatalystInstance catalystInstance) {
    for (NativeModule nativeModule : catalystInstance.getNativeModules()) {
      if (nativeModule instanceof Cleanable) {
        FLog.d(ReactConstants.TAG, "Cleaning data from " + nativeModule.getName());
        ((Cleanable) nativeModule).clearSensitiveData();
      }
    }
  }

  public static void cleanDataFromModules(ReactContext reactContext) {
    for (NativeModule nativeModule : reactContext.getNativeModules()) {
      if (nativeModule instanceof Cleanable) {
        FLog.d(ReactConstants.TAG, "Cleaning data from " + nativeModule.getName());
        ((Cleanable) nativeModule).clearSensitiveData();
      }
    }
  }
}
