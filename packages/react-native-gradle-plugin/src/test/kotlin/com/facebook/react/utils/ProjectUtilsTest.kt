/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.tests.createProject
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
}
