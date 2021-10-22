/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.gradle.BaseExtension
import org.gradle.api.Project

fun Project.configureDevPorts(androidExt: BaseExtension) {
  val devServerPort =
      project.properties["reactNativeDevServerPort"]?.toString() ?: DEFAULT_DEV_SERVER_PORT
  val inspectorProxyPort =
      project.properties["reactNativeInspectorProxyPort"]?.toString() ?: devServerPort

  androidExt.buildTypes.all {
    it.resValue("integer", "react_native_dev_server_port", devServerPort)
    it.resValue("integer", "react_native_inspector_proxy_port", inspectorProxyPort)
  }
}

const val DEFAULT_DEV_SERVER_PORT = "8081"
