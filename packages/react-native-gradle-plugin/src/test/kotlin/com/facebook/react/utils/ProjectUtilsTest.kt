/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.tests.createProject
import com.facebook.react.utils.ProjectUtils.isHermesEnabled
import com.facebook.react.utils.ProjectUtils.isNewArchEnabled
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ProjectUtilsTest {

  @Test
  fun isNewArchEnabled_returnsFalseByDefault() {
    assertFalse(createProject().isNewArchEnabled)
  }

  @Test
  fun isNewArchEnabled_withDisabled_returnsFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("newArchEnabled", "false")
    assertFalse(project.isNewArchEnabled)
  }

  @Test
  fun isNewArchEnabled_withEnabled_returnsTrue() {
    val project = createProject()
    project.extensions.extraProperties.set("newArchEnabled", "true")
    assertTrue(project.isNewArchEnabled)
  }

  @Test
  fun isNewArchEnabled_withInvalid_returnsFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("newArchEnabled", "¯\\_(ツ)_/¯")
    assertFalse(project.isNewArchEnabled)
  }

  @Test
  fun isHermesEnabled_returnsTrueByDefault() {
    assertTrue(createProject().isHermesEnabled)
  }

  @Test
  fun isNewArchEnabled_withDisabledViaProperty_returnsFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("hermesEnabled", "false")
    assertFalse(project.isHermesEnabled)
  }

  @Test
  fun isHermesEnabled_withEnabledViaProperty_returnsTrue() {
    val project = createProject()
    project.extensions.extraProperties.set("hermesEnabled", "true")
    assertTrue(project.isHermesEnabled)
  }

  @Test
  fun isHermesEnabled_withInvalidViaProperty_returnsTrue() {
    val project = createProject()
    project.extensions.extraProperties.set("hermesEnabled", "¯\\_(ツ)_/¯")
    assertTrue(project.isHermesEnabled)
  }

  @Test
  fun isHermesEnabled_withDisabledViaExt_returnsFalse() {
    val project = createProject()
    val extMap = mapOf("enableHermes" to false)
    project.extensions.extraProperties.set("react", extMap)
    assertFalse(project.isHermesEnabled)
  }

  @Test
  fun isHermesEnabled_withEnabledViaExt_returnsTrue() {
    val project = createProject()
    val extMap = mapOf("enableHermes" to true)
    project.extensions.extraProperties.set("react", extMap)
    assertTrue(project.isHermesEnabled)
  }

  @Test
  fun isHermesEnabled_withDisabledViaExtAsString_returnsFalse() {
    val project = createProject()
    val extMap = mapOf("enableHermes" to "false")
    project.extensions.extraProperties.set("react", extMap)
    assertFalse(project.isHermesEnabled)
  }

  @Test
  fun isHermesEnabled_withInvalidViaExt_returnsTrue() {
    val project = createProject()
    val extMap = mapOf("enableHermes" to "¯\\_(ツ)_/¯")
    project.extensions.extraProperties.set("react", extMap)
    assertTrue(project.isHermesEnabled)
  }
}
