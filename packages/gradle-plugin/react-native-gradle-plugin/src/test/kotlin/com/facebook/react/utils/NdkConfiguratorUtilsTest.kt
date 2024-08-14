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

    assertThat(excludes).containsExactly("**/libjsc.so", "**/libjscexecutor.so")
    assertThat(includes).doesNotContain("**/libjsc.so", "**/libjscexecutor.so")

    assertThat(includes).containsExactly("**/libhermes.so", "**/libhermes_executor.so")
    assertThat(excludes).doesNotContain("**/libhermes.so", "**/libhermes_executor.so")
  }

  @Test
  fun getPackagingOptionsForVariant_withHermesDisabled() {
    val (excludes, includes) = getPackagingOptionsForVariant(hermesEnabled = false)

    assertThat(excludes).containsExactly("**/libhermes.so", "**/libhermes_executor.so")
    assertThat(includes).doesNotContain("**/libhermes.so", "**/libhermes_executor.so")

    assertThat(includes).containsExactly("**/libjsc.so", "**/libjscexecutor.so")
    assertThat(excludes).doesNotContain("**/libjsc.so", "**/libjscexecutor.so")
  }
}
