/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.events

import android.annotation.SuppressLint
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.fabric.FabricSoLoader
import com.facebook.react.uimanager.events.BatchEventDispatchedListener

/**
 * Class that acts as a proxy between the list of EventBeats registered in C++ and the Android side.
 */
@SuppressLint("MissingNativeLoadLibrary")
@DoNotStrip
public final class EventBeatManager() : BatchEventDispatchedListener {

  @Suppress("NoHungarianNotation") @DoNotStrip private val mHybridData: HybridData = initHybrid()

  private external fun tick()

  @Deprecated("Deprecated on v0.72.0 Use EventBeatManager() instead")
  @Suppress("UNUSED_PARAMETER")
  public constructor(reactApplicationContext: ReactApplicationContext?) : this()

  override public fun onBatchEventDispatched() {
    tick()
  }

  private companion object {
    init {
      FabricSoLoader.staticInit()
    }

    @JvmStatic private external fun initHybrid(): HybridData
  }
}
