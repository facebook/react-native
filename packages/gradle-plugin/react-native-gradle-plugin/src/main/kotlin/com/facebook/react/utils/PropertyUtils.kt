/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

/** Collection of all the Gradle Properties that are accepted by React Native Gradle Plugin. */
object PropertyUtils {

  /** Public property that toggles the New Architecture */
  const val NEW_ARCH_ENABLED = "newArchEnabled"
  const val SCOPED_NEW_ARCH_ENABLED = "react.newArchEnabled"

  /** Public property that toggles the New Architecture */
  const val HERMES_ENABLED = "hermesEnabled"
  const val SCOPED_HERMES_ENABLED = "react.hermesEnabled"

  /** Public property that allows to control which architectures to build for React Native. */
  const val REACT_NATIVE_ARCHITECTURES = "reactNativeArchitectures"
  const val SCOPED_REACT_NATIVE_ARCHITECTURES = "react.nativeArchitectures"

  /**
   * Internal Property that acts as a killswitch to configure the JDK version and align it for app
   * and all the libraries.
   */
  const val INTERNAL_DISABLE_JAVA_VERSION_ALIGNMENT = "react.internal.disableJavaVersionAlignment"

  /**
   * Internal Property that allows to specify a local Maven repository to use for React Native
   * artifacts It's used on CI to test templates against a version of React Native built on the fly.
   */
  const val INTERNAL_REACT_NATIVE_MAVEN_LOCAL_REPO = "react.internal.mavenLocalRepo"

  /**
   * Internal property used to specify where the Windows Bash executable is located. This is useful
   * for contributors who are running Windows on their machine.
   */
  const val INTERNAL_REACT_WINDOWS_BASH = "react.internal.windowsBashPath"

  /**
   * Internal property to force the build to use Hermes from the latest nightly. This speeds up the
   * build at the cost of not testing the latest integration against Hermes.
   */
  const val INTERNAL_USE_HERMES_NIGHTLY = "react.internal.useHermesNightly"

  /** Internal property used to override the publishing group for the React Native artifacts. */
  const val INTERNAL_PUBLISHING_GROUP = "react.internal.publishingGroup"
  const val DEFAULT_INTERNAL_PUBLISHING_GROUP = "com.facebook.react"

  /** Internal property used to control the version name of React Native */
  const val INTERNAL_VERSION_NAME = "VERSION_NAME"
}
