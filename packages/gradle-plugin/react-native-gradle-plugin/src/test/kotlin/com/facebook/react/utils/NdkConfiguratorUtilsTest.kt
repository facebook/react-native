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

    assertThat("**/libjsc.so" in excludes).isTrue()
    assertThat("**/libjscexecutor.so" in excludes).isTrue()
    assertThat("**/libjsc.so" in includes).isFalse()
    assertThat("**/libjscexecutor.so" in includes).isFalse()

    assertThat("**/libhermes.so" in includes).isTrue()
    assertThat("**/libhermes_executor.so" in includes).isTrue()
    assertThat("**/libhermes.so" in excludes).isFalse()
    assertThat("**/libhermes_executor.so" in excludes).isFalse()
  }

  @Test
  fun getPackagingOptionsForVariant_withHermesDisabled() {
    val (excludes, includes) = getPackagingOptionsForVariant(hermesEnabled = false)

    assertThat("**/libhermes.so" in excludes).isTrue()
    assertThat("**/libhermes_executor.so" in excludes).isTrue()
    assertThat("**/libhermes.so" in includes).isFalse()
    assertThat("**/libhermes_executor.so" in includes).isFalse()

    assertThat("**/libjsc.so" in includes).isTrue()
    assertThat("**/libjscexecutor.so" in includes).isTrue()
    assertThat("**/libjsc.so" in excludes).isFalse()
    assertThat("**/libjscexecutor.so" in excludes).isFalse()
  }
}
