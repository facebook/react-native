/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.annotations.internal

import com.facebook.react.bridge.AssertionException
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.common.build.ReactBuildConfig

/**
 * Logger class to track legacy architecture usage.
 *
 * This class provides logging functionality to help track and debug usage of legacy architecture
 * components when an app is running on the new architecture. The data provided by this class will
 * help identify classes and methods that are still being used in the new architecture when they
 * shouldn't.
 */
public object LegacyArchitectureLogger {

  /**
   * Asserts and logs when legacy architecture classes are being used in New Architecture. This
   * method will throw an exception if the app is running on the new architecture and the logLevel
   * received by parameter is [LegacyArchitectureLogLevel.ERROR]. Otherwise it will show a warning
   * on logcat.
   *
   * @param name The name of the legacy class being used
   * @param logLevel The severity level of the log (ERROR or WARNING, defaults to WARNING)
   */
  @JvmStatic
  public fun assertLegacyArchitecture(
      name: String,
      logLevel: LegacyArchitectureLogLevel = LegacyArchitectureLogLevel.WARNING
  ) {
    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      executeAssert(name, logLevel)
    }
  }

  private fun executeAssert(
      name: String,
      logLevel: LegacyArchitectureLogLevel = LegacyArchitectureLogLevel.WARNING
  ) {
    // Assert is being reported only in DEBUG mode to prevent over logging in production while we
    // we are working on decoupling legacy / new architecture.
    // Long term the assert will be executed in production and debug environments.
    if (ReactBuildConfig.DEBUG) {
      val exceptionMessage = "is being executed when app is fully running on the NEW Architecture."
      when (logLevel) {
        LegacyArchitectureLogLevel.ERROR -> {
          throw AssertionException("$name $exceptionMessage")
        }

        LegacyArchitectureLogLevel.WARNING -> {
          ReactSoftExceptionLogger.logSoftException(
              ReactSoftExceptionLogger.Categories.SOFT_ASSERTIONS,
              ReactNoCrashSoftException("$name $exceptionMessage"))
        }
      }
    }
  }
}
