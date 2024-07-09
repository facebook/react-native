/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.model

import org.junit.Assert.assertEquals
import org.junit.Test

class ModelAutolinkingDependenciesJsonTest {

  @Test
  fun nameCleansed_withoutScope() {
    assertEquals("name", ModelAutolinkingDependenciesJson("", "name", null).nameCleansed)
    assertEquals(
        "react_native", ModelAutolinkingDependenciesJson("", "react~native", null).nameCleansed)
    assertEquals(
        "react_native", ModelAutolinkingDependenciesJson("", "react*native", null).nameCleansed)
    assertEquals(
        "react_native", ModelAutolinkingDependenciesJson("", "react!native", null).nameCleansed)
    assertEquals(
        "react_native", ModelAutolinkingDependenciesJson("", "react'native", null).nameCleansed)
    assertEquals(
        "react_native", ModelAutolinkingDependenciesJson("", "react(native", null).nameCleansed)
    assertEquals(
        "react_native", ModelAutolinkingDependenciesJson("", "react)native", null).nameCleansed)
    assertEquals(
        "react_native",
        ModelAutolinkingDependenciesJson("", "react~*!'()native", null).nameCleansed)
  }

  @Test
  fun nameCleansed_withScope() {
    assertEquals(
        "react-native_package",
        ModelAutolinkingDependenciesJson("", "@react-native/package", null).nameCleansed)
    assertEquals(
        "this_is_a_more_complicated_example_of_weird_packages",
        ModelAutolinkingDependenciesJson(
                "", "@this*is~a(more)complicated/example!of~weird)packages", null)
            .nameCleansed)
  }
}
