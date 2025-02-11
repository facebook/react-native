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
  fun getPackagingOptionsForVariant_withHermesEnabled() {
    val (excludes, includes) = getPackagingOptionsForVariant(hermesEnabled = true)

    assertThat(excludes).containsExactly("**/libjsc.so", "**/libjsctooling.so")
    assertThat(includes).doesNotContain("**/libjsc.so", "**/libjsctooling.so")

    assertThat(includes).containsExactly("**/libhermes.so", "**/libhermestooling.so")
    assertThat(excludes).doesNotContain("**/libhermes.so", "**/libhermestooling.so")
  }

  @Test
  fun getPackagingOptionsForVariant_withHermesDisabled() {
    val (excludes, includes) = getPackagingOptionsForVariant(hermesEnabled = false)

    assertThat(excludes).containsExactly("**/libhermes.so", "**/libhermestooling.so")
    assertThat(includes).doesNotContain("**/libhermes.so", "**/libhermestooling.so")

    assertThat(includes).containsExactly("**/libjsc.so", "**/libjsctooling.so")
    assertThat(excludes).doesNotContain("**/libjsc.so", "**/libjsctooling.so")
  }
}
