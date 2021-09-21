/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests

import com.facebook.react.ReactExtension
import com.facebook.react.utils.GradleUtils.createOrGet
import org.gradle.testfixtures.ProjectBuilder
import org.junit.Assert.*
import org.junit.Test

class GradleUtilsTest {

  @Test
  fun createOrGet_createsNewExtension() {
    val project = ProjectBuilder.builder().build()

    assertNull(project.extensions.findByType(ReactExtension::class.java))

    project.extensions.createOrGet("testExtension", ReactExtension::class.java, project)

    assertNotNull(project.extensions.findByType(ReactExtension::class.java))
  }

  @Test
  fun createOrGet_returnsExistingExtension() {
    val project = ProjectBuilder.builder().build()
    val expected = project.extensions.create("testExtension", ReactExtension::class.java, project)

    assertEquals(
        expected,
        project.extensions.createOrGet("testExtension", ReactExtension::class.java, project))
  }
}
