/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.model

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class ModelAutolinkingDependenciesJsonTest {

  @Test
  fun nameCleansed_withoutScope() {
    assertThat("name").isEqualTo(ModelAutolinkingDependenciesJson("", "name", null).nameCleansed)
    assertThat(
        "react_native").isEqualTo(ModelAutolinkingDependenciesJson("", "react~native", null).nameCleansed)
    assertThat(
        "react_native").isEqualTo(ModelAutolinkingDependenciesJson("", "react*native", null).nameCleansed)
    assertThat(
        "react_native").isEqualTo(ModelAutolinkingDependenciesJson("", "react!native", null).nameCleansed)
    assertThat(
        "react_native").isEqualTo(ModelAutolinkingDependenciesJson("", "react'native", null).nameCleansed)
    assertThat(
        "react_native").isEqualTo(ModelAutolinkingDependenciesJson("", "react(native", null).nameCleansed)
    assertThat(
        "react_native").isEqualTo(ModelAutolinkingDependenciesJson("", "react)native", null).nameCleansed)
    assertThat(
        "react_native").isEqualTo(
        ModelAutolinkingDependenciesJson("", "react~*!'()native", null).nameCleansed)
  }

  @Test
  fun nameCleansed_withScope() {
    assertThat(
        "react-native_package").isEqualTo(
        ModelAutolinkingDependenciesJson("", "@react-native/package", null).nameCleansed)
    assertThat(
        "this_is_a_more_complicated_example_of_weird_packages").isEqualTo(
        ModelAutolinkingDependenciesJson(
                "", "@this*is~a(more)complicated/example!of~weird)packages", null)
            .nameCleansed)
  }
}
