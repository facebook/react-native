/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.gradle.BaseExtension
import org.gradle.testfixtures.ProjectBuilder
import org.junit.Assert.assertEquals
import org.junit.Test

class AndroidConfigurationTest {

  @Test
  fun configureDevPorts_withNoSpecifiedPort_usesDefault() {
    val project = ProjectBuilder.builder().build()
    project.pluginManager.apply("com.android.application")
    val androidExtension = project.extensions.getByType(BaseExtension::class.java)
    val debug = androidExtension.buildTypes.findByName("debug")
    val release = androidExtension.buildTypes.findByName("release")

    project.configureDevPorts(androidExtension)

    assertEquals("8081", debug?.resValues?.get("integer/react_native_dev_server_port")?.value)
    assertEquals("8081", debug?.resValues?.get("integer/react_native_inspector_proxy_port")?.value)
    assertEquals("8081", release?.resValues?.get("integer/react_native_dev_server_port")?.value)
    assertEquals(
        "8081", release?.resValues?.get("integer/react_native_inspector_proxy_port")?.value)
  }

  @Test
  fun configureDevPorts_withSpecifiedReactNativeDevServerPort_usesIt() {
    val project = ProjectBuilder.builder().build()
    project.pluginManager.apply("com.android.application")
    val androidExtension = project.extensions.getByType(BaseExtension::class.java)
    val debug = androidExtension.buildTypes.findByName("debug")
    val release = androidExtension.buildTypes.findByName("release")

    project.extensions.extraProperties["reactNativeDevServerPort"] = "42424"

    project.configureDevPorts(androidExtension)

    assertEquals("42424", debug?.resValues?.get("integer/react_native_dev_server_port")?.value)
    assertEquals("42424", debug?.resValues?.get("integer/react_native_inspector_proxy_port")?.value)
    assertEquals("42424", release?.resValues?.get("integer/react_native_dev_server_port")?.value)
    assertEquals(
        "42424", release?.resValues?.get("integer/react_native_inspector_proxy_port")?.value)
  }

  @Test
  fun configureDevPorts_withSpecifiedReactNativeInspectorProxyPort_usesIt() {
    val project = ProjectBuilder.builder().build()
    project.pluginManager.apply("com.android.application")
    val androidExtension = project.extensions.getByType(BaseExtension::class.java)
    val debug = androidExtension.buildTypes.findByName("debug")
    val release = androidExtension.buildTypes.findByName("release")

    project.extensions.extraProperties["reactNativeInspectorProxyPort"] = "42424"

    project.configureDevPorts(androidExtension)

    assertEquals("8081", debug?.resValues?.get("integer/react_native_dev_server_port")?.value)
    assertEquals("42424", debug?.resValues?.get("integer/react_native_inspector_proxy_port")?.value)
    assertEquals("8081", release?.resValues?.get("integer/react_native_dev_server_port")?.value)
    assertEquals(
        "42424", release?.resValues?.get("integer/react_native_inspector_proxy_port")?.value)
  }
}
