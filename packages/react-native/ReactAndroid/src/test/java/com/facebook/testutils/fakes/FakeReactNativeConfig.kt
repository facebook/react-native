/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.fakes

import com.facebook.react.fabric.ReactNativeConfig

/** A fake [ReactNativeConfig] that returns default values for all methods without accessing JNI. */
class FakeReactNativeConfig : ReactNativeConfig {
  override fun getBool(param: String): Boolean = false

  override fun getInt64(param: String): Long = 0L

  override fun getString(param: String): String = ""

  override fun getDouble(param: String): Double = 0.0
}
