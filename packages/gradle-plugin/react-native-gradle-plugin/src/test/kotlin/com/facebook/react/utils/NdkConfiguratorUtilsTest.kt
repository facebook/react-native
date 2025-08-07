/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.utils.NdkConfiguratorUtils.getPackagingOptionsForVariant
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class NdkConfiguratorUtilsTest {

  @Test
  fun getPackagingOptionsForVariant_withHermesEnabledAndThirdPartyJSCDisabled() {
    val (excludes, includes) =
        getPackagingOptionsForVariant(
            hermesEnabled = true,
            useThirdPartyJSC = false,
        )

    assertThat(excludes).containsExactly("**/libjsc.so", "**/libjsctooling.so")
    assertThat(includes).doesNotContain("**/libjsc.so", "**/libjsctooling.so")

    assertThat(includes).containsExactly("**/libhermesvm.so", "**/libhermestooling.so")
    assertThat(excludes).doesNotContain("**/libhermesvm.so", "**/libhermestooling.so")
  }

  @Test
  fun getPackagingOptionsForVariant_withHermesEnabledAndThirdPartyJSC() {
    val (excludes, includes) =
        getPackagingOptionsForVariant(
            hermesEnabled = true,
            useThirdPartyJSC = true,
        )

    assertThat(excludes).containsExactly("**/libjsc.so", "**/libjsctooling.so")
    assertThat(includes).doesNotContain("**/libjsc.so", "**/libjsctooling.so")

    assertThat(includes).containsExactly("**/libhermesvm.so", "**/libhermestooling.so")
    assertThat(excludes).doesNotContain("**/libhermesvm.so", "**/libhermestooling.so")
  }

  @Test
  fun getPackagingOptionsForVariant_withHermesDisabledAndThirdPartyJSCDisabled() {
    val (excludes, includes) =
        getPackagingOptionsForVariant(
            hermesEnabled = false,
            useThirdPartyJSC = false,
        )

    assertThat(excludes).containsExactly("**/libhermesvm.so", "**/libhermestooling.so")
    assertThat(includes).doesNotContain("**/libhermesvm.so", "**/libhermestooling.so")

    assertThat(includes).containsExactly("**/libjsc.so", "**/libjsctooling.so")
    assertThat(excludes).doesNotContain("**/libjsc.so", "**/libjsctooling.so")
  }

  @Test
  fun getPackagingOptionsForVariant_withHermesDisabledAndThirdPartyJSC() {
    val (excludes, includes) =
        getPackagingOptionsForVariant(
            hermesEnabled = false,
            useThirdPartyJSC = true,
        )

    assertThat(includes).containsExactly("**/libjsc.so")
    assertThat(excludes)
        .containsExactly("**/libhermesvm.so", "**/libhermestooling.so", "**/libjsctooling.so")
  }
}
