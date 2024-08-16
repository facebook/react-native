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
        "fabricjni" -> "reactnative"
        "hermesinstancejni" -> "reactnative"
        "mapbufferjni" -> "reactnative"
        "react_featureflagsjni" -> "reactnative"
        "react_newarchdefaults" -> "reactnative"
        "rninstance" -> "reactnative"
        "turbomodulejsijni" -> "reactnative"
        "yoga" -> "reactnative"
        else -> input
      }

  public fun invokeJniOnload(libraryName: String): Unit {
    when (libraryName) {
      "fabricjni" -> libfabricjni_so()
      "hermesinstancejni" -> libhermesinstancejni_so()
      "mapbufferjni" -> libmapbufferjni_so()
      "react_featureflagsjni" -> libreact_featureflagsjni_so()
      "react_newarchdefaults" -> libreact_newarchdefaults_so()
      "reactnative" -> libreactnative_so()
      "rninstance" -> librninstance_so()
      "turbomodulejsijni" -> libturbomodulejsijni_so()
      "yoga" -> libyoga_so()
    }
  }

  public external fun libfabricjni_so(): Int

  public external fun libhermesinstancejni_so(): Int

  public external fun libmapbufferjni_so(): Int

  public external fun libreact_featureflagsjni_so(): Int

  public external fun libreact_newarchdefaults_so(): Int

  public external fun libreactnative_so(): Int

  public external fun librninstance_so(): Int

  public external fun libturbomodulejsijni_so(): Int

  public external fun libyoga_so(): Int
}
