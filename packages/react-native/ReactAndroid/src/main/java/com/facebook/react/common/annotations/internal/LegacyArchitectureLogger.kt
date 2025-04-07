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

  private val tag: String = "LegacyArchitectureLogger"

  /**
   * Whether the OSS_LEGACY_WARNINGS_ENABLED should be enabled or not for OSS users. This is
   * controlled through the `legacyWarningsEnabled` property in the gradle.properties file.
   */
  @JvmField public var OSS_LEGACY_WARNINGS_ENABLED: Boolean = false

  private val exceptionMessage: String
    get() =
        if (OSS_LEGACY_WARNINGS_ENABLED) {
          "is being executed when app is fully running on the NEW Architecture."
        } else {
          "is being executed when `legacyWarningsEnabled` is enabled. " +
              "You're accessing a legacy API that will be removed in a future version of React Native. " +
              "You should investigate the stacktrace you find below and understand which class is " +
              "accessing this API and clean it up."
        }

  /**
   * Asserts and logs when legacy architecture components are being used in new architecture. This
   * method will throw an exception if the app is running on the new architecture and the logLevel
   * received by parameter is [LegacyArchitectureLogLevel.ERROR].
   *
   * @param name The name of the legacy component being used
   * @param logLevel The severity level of the log (ERROR or WARNING, defaults to WARNING)
   */
  @JvmStatic
  public fun assertWhenLegacyArchitectureMinifyingEnabled(
      name: String,
      logLevel: LegacyArchitectureLogLevel = LegacyArchitectureLogLevel.WARNING
  ) {
    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE ||
        OSS_LEGACY_WARNINGS_ENABLED) {
      when (logLevel) {
        LegacyArchitectureLogLevel.ERROR -> {
          throw AssertionException("$name $exceptionMessage")
        }
        LegacyArchitectureLogLevel.WARNING -> {
          ReactSoftExceptionLogger.logSoftException(
              tag, ReactNoCrashSoftException("$name $exceptionMessage"))
        }
      }
    }
  }
}
