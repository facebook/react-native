/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.tests.createProject
import com.facebook.react.utils.BackwardCompatUtils.configureBackwardCompatibilityReactMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class BackwardCompatUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun configureBackwardCompatibilityReactMap_addsEmptyReactMap() {
    val project = createProject()

    configureBackwardCompatibilityReactMap(project)

    assertThat(project.extensions.extraProperties.has("react")).isTrue()
    @Suppress("UNCHECKED_CAST")
    assertThat(project.extensions.extraProperties.get("react") as Map<String, Any?>).isEmpty()
  }

  @Test
  fun configureBackwardCompatibilityReactMap_withExistingMapSetByUser_wipesTheMap() {
    val project = createProject()
    project.extensions.extraProperties.set("react", mapOf("enableHermes" to true))

    configureBackwardCompatibilityReactMap(project)

    assertThat(project.extensions.extraProperties.has("react")).isTrue()
    @Suppress("UNCHECKED_CAST")
    assertThat(project.extensions.extraProperties.get("react") as Map<String, Any?>).isEmpty()
  }
}
