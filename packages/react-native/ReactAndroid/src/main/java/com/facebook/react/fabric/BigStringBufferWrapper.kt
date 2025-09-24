/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import android.annotation.SuppressLint
import android.content.res.AssetManager
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStripAny

/** TODO: Description */
@SuppressLint("MissingNativeLoadLibrary")
@DoNotStripAny
public class BigStringBufferWrapper {

  private val mHybridData: HybridData

  public constructor(fileName: String) {
    mHybridData = initHybridFromFile(fileName)
  }

  public constructor(assetManager: AssetManager, assetURL: String) {
    mHybridData = initHybridFromAssets(assetManager, assetURL)
  }

  private external fun initHybridFromFile(fileName: String): HybridData

  private external fun initHybridFromAssets(
          assetManager: AssetManager,
          assetURL: String
  ): HybridData
}
