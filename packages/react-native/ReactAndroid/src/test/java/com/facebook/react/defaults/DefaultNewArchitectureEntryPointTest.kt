/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class DefaultNewArchitectureEntryPointTest {

  @Test
  fun isConfigurationValid_withEverythingOff_returnsTrue() {
    val (isValid, _) =
        DefaultNewArchitectureEntryPoint.isConfigurationValid(
            turboModulesEnabled = false, fabricEnabled = false, bridgelessEnabled = false)
    assertThat(isValid).isTrue()
  }

  @Test
  fun isConfigurationValid_withNewArchOn_returnsTrue() {
    val (isValid, _) =
        DefaultNewArchitectureEntryPoint.isConfigurationValid(
            turboModulesEnabled = true, fabricEnabled = true, bridgelessEnabled = false)
    assertThat(isValid).isTrue()
  }

  @Test
  fun isConfigurationValid_withTurboModulesOnlyOn_returnsTrue() {
    val (isValid, _) =
        DefaultNewArchitectureEntryPoint.isConfigurationValid(
            turboModulesEnabled = true, fabricEnabled = false, bridgelessEnabled = false)
    assertThat(isValid).isTrue()
  }

  @Test
  fun isConfigurationValid_withBridgelessOn_returnsTrue() {
    val (isValid, _) =
        DefaultNewArchitectureEntryPoint.isConfigurationValid(
            turboModulesEnabled = true, fabricEnabled = true, bridgelessEnabled = true)
    assertThat(isValid).isTrue()
  }

  @Test
  fun isConfigurationValid_withFabricWithoutTurboModules_returnsFalse() {
    val (isValid, errorMessage) =
        DefaultNewArchitectureEntryPoint.isConfigurationValid(
            turboModulesEnabled = false, fabricEnabled = true, bridgelessEnabled = false)
    assertThat(isValid).isFalse()
    assertThat(errorMessage)
        .isEqualTo(
            "fabricEnabled=true requires turboModulesEnabled=true (is now false) - Please update your DefaultNewArchitectureEntryPoint.load() parameters.")
  }

  @Test
  fun isConfigurationValid_withBridgelessWithoutTurboModules_returnsFalse() {
    val (isValid, errorMessage) =
        DefaultNewArchitectureEntryPoint.isConfigurationValid(
            turboModulesEnabled = false, fabricEnabled = true, bridgelessEnabled = true)
    assertThat(isValid).isFalse()
    assertThat(errorMessage)
        .isEqualTo(
            "fabricEnabled=true requires turboModulesEnabled=true (is now false) - Please update your DefaultNewArchitectureEntryPoint.load() parameters.")
  }

  @Test
  fun isConfigurationValid_withBridgelessWithoutFabric_returnsFalse() {
    val (isValid, errorMessage) =
        DefaultNewArchitectureEntryPoint.isConfigurationValid(
            turboModulesEnabled = true, fabricEnabled = false, bridgelessEnabled = true)
    assertThat(isValid).isFalse()
    assertThat(errorMessage)
        .isEqualTo(
            "bridgelessEnabled=true requires (turboModulesEnabled=true AND fabricEnabled=true) - Please update your DefaultNewArchitectureEntryPoint.load() parameters.")
  }
}
