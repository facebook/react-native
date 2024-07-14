/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.osslibraryexample

import com.facebook.fbreact.specs.NativeSampleModuleSpec
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeSampleModuleSpec.NAME)
public class NativeSampleModule(reactContext: ReactApplicationContext?) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  private companion object {
    const val NAME = "NativeSampleModule"
  }

  @ReactMethod
  public fun getRandomNumber(): Int {
    return (0..99).random()
  }
}
