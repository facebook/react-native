/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests

/** Annotation to specify an Operating System to override the "os.name" System Property. */
@Retention(AnnotationRetention.RUNTIME) annotation class WithOs(val os: OS, val arch: String = "")

enum class OS(val propertyName: String) {
  WIN("Windows"),
  MAC("MacOs"),
  LINUX("Linux"),
}
