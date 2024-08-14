/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.soloader

/**
 * This class is a manually created MergedSoMapping.
 *
 * It's used to support so-merging for React Native OSS.
 *
 * When adding a new library that contains a JNI_OnLoad method, you need to make sure you add a new
 * entry in the [invokeJniOnload] method, the [mapLibName] method as well as a new external function
 * that will take care of calling the JNI_OnLoad method.
 */
public object MergedSoMapping {

  public fun mapLibName(input: String): String =
      when (input) {
        "react_newarchdefaults" -> "reactnative"
        "mapbufferjni" -> "reactnative"
        else -> input
      }

  public fun invokeJniOnload(libraryName: String): Unit {
    when (libraryName) {
      "react_newarchdefaults" -> libreact_newarchdefaults_so()
      "mapbufferjni" -> libmapbufferjni_so()
      "reactnative" -> libreactnative_so()
    }
  }

  public external fun libreact_newarchdefaults_so(): Int

  public external fun libmapbufferjni_so(): Int

  public external fun libreactnative_so(): Int
}
