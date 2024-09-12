/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.soloader

import com.facebook.soloader.ExternalSoMapping

/**
 * This class is a manually created MergedSoMapping.
 *
 * It's used to support so-merging for React Native OSS.
 *
 * When adding a new library that contains a JNI_OnLoad method, you need to make sure you add a new
 * entry in the [invokeJniOnload] method, the [mapLibName] method as well as a new external function
 * that will take care of calling the JNI_OnLoad method.
 */
public object OpenSourceMergedSoMapping : ExternalSoMapping {

  override public fun mapLibName(input: String): String =
      when (input) {
        "fabricjni",
        "jsinspector",
        "mapbufferjni",
        "react_devsupportjni",
        "react_featureflagsjni",
        "react_newarchdefaults",
        "reactnativeblob",
        "reactnativejni",
        "rninstance",
        "turbomodulejsijni",
        "uimanagerjni",
        "yoga" -> {
          "reactnative"
        }
        "hermes_executor",
        "hermesinstancejni",
        "jsijniprofiler" -> {
          "hermestooling"
        }
        "jscexecutor",
        "jscruntime",
        "jscinstance" -> {
          "jsctooling"
        }
        else -> input
      }

  override public fun invokeJniOnload(libraryName: String): Unit {
    when (libraryName) {
      "fabricjni" -> libfabricjni_so()
      "hermes_executor" -> libhermes_executor_so()
      "hermesinstancejni" -> libhermesinstancejni_so()
      "hermestooling" -> libhermestooling_so()
      "jscexecutor" -> libjscexecutor_so()
      "jscinstance" -> libjscinstance_so()
      "jscruntime" -> libjscruntime_so()
      "jsctooling" -> libjsctooling_so()
      "jsijniprofiler" -> libjsijniprofiler_so()
      "jsinspector" -> libjsinspector_so()
      "mapbufferjni" -> libmapbufferjni_so()
      "react_devsupportjni" -> libreact_devsupportjni_so()
      "react_featureflagsjni" -> libreact_featureflagsjni_so()
      "react_newarchdefaults" -> libreact_newarchdefaults_so()
      "reactnative" -> libreactnative_so()
      "reactnativeblob" -> libreactnativeblob_so()
      "reactnativejni" -> libreactnativejni_so()
      "rninstance" -> librninstance_so()
      "turbomodulejsijni" -> libturbomodulejsijni_so()
      "uimanagerjni" -> libuimanagerjni_so()
      "yoga" -> libyoga_so()
    }
  }

  public external fun libfabricjni_so(): Int

  public external fun libhermes_executor_so(): Int

  public external fun libhermesinstancejni_so(): Int

  public external fun libhermestooling_so(): Int

  public external fun libjscexecutor_so(): Int

  public external fun libjscinstance_so(): Int

  public external fun libjscruntime_so(): Int

  public external fun libjsctooling_so(): Int

  public external fun libjsijniprofiler_so(): Int

  public external fun libjsinspector_so(): Int

  public external fun libmapbufferjni_so(): Int

  public external fun libreact_devsupportjni_so(): Int

  public external fun libreact_featureflagsjni_so(): Int

  public external fun libreact_newarchdefaults_so(): Int

  public external fun libreactnative_so(): Int

  public external fun libreactnativeblob_so(): Int

  public external fun libreactnativejni_so(): Int

  public external fun librninstance_so(): Int

  public external fun libturbomodulejsijni_so(): Int

  public external fun libuimanagerjni_so(): Int

  public external fun libyoga_so(): Int
}
