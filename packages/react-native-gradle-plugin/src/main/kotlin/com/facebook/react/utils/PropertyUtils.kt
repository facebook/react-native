/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

/** Collection of all the Gradle Propreties that are accepted by React Native Gradle Plugin. */
object PropertyUtils {

  /**
   * Internal Property that acts as a killswitch to configure the JDK version and align it for app
   * and all the libraries.
   */
  const val INTERNAL_DISABLE_JAVA_VERSION_ALIGNMENT = "react.internal.disableJavaVersionAlignment"
}
