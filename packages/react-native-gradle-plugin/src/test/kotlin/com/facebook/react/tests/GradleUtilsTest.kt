/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests

import com.facebook.react.ReactAppExtension
import com.facebook.react.utils.GradleUtils.createOrGet
import org.gradle.testfixtures.ProjectBuilder
import org.junit.Assert.*
import org.junit.Test

class GradleUtilsTest {

  @Test
  fun createOrGet_createsNewExtension() {
    val project = ProjectBuilder.builder().build()

    assertNull(project.extensions.findByType(ReactAppExtension::class.java))

    project.extensions.createOrGet("testExtension", ReactAppExtension::class.java, project)

    assertNotNull(project.extensions.findByType(ReactAppExtension::class.java))
  }

  @Test
  fun createOrGet_returnsExistingExtension() {
    val project = ProjectBuilder.builder().build()
    val expected =
        project.extensions.create("testExtension", ReactAppExtension::class.java, project)

    assertEquals(
        expected,
        project.extensions.createOrGet("testExtension", ReactAppExtension::class.java, project))
  }
}
