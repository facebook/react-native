/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("UNUSED_EXPRESSION", "ControlFlowWithEmptyBody", "UNUSED_PARAMETER")

package com.facebook.soloader

import android.content.Context

/**
 * This class is a stub of SoLoader used ONLY by React Native OSS.
 *
 * This allows us to do not mutate the SoLoader.init and SoLoader.loadLibrary methods, which are
 * used by the React Native, while also allowing us to implement custom JNI_OnLoad calling which
 * enables merging of SOs.
 */
public object SoLoader {

  private val loadedLibraries = mutableSetOf<String>()

  private fun mapLibName(input: String) = input

  @Suppress("UNUSED_PARAMETER")
  private fun invokeJniOnload(libraryName: String) {
    // no-op for now, till we move library to So Merging in OSS
  }

  @Deprecated("This method is a no-op and you should not be calling it")
  @JvmStatic
  public fun init(context: Context, exoPackage: Boolean) {
    // Do nothing
  }

  @JvmStatic
  public fun loadLibrary(libraryName: String): Boolean {
    if (libraryName in loadedLibraries) {
      return false
    }
    val mapLibraryName = mapLibName(libraryName)
    System.loadLibrary(mapLibraryName)
    if (libraryName != mapLibraryName) {
      invokeJniOnload(mapLibraryName)
    }
    return true
  }

  @JvmStatic
  public fun setInTestMode() {
    // Do nothing
  }
}
