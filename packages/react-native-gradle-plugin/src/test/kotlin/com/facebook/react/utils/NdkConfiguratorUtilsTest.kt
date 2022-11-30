/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.utils.NdkConfiguratorUtils.getPackagingOptionsForVariant
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class NdkConfiguratorUtilsTest {

  @Test
  fun getPackagingOptionsForVariant_withHermesEnabled() {
    val (excludes, includes) = getPackagingOptionsForVariant(hermesEnabled = true)

    assertTrue("**/libjsc.so" in excludes)
    assertTrue("**/libjscexecutor.so" in excludes)
    assertFalse("**/libjsc.so" in includes)
    assertFalse("**/libjscexecutor.so" in includes)

    assertTrue("**/libhermes.so" in includes)
    assertTrue("**/libhermes_executor.so" in includes)
    assertFalse("**/libhermes.so" in excludes)
    assertFalse("**/libhermes_executor.so" in excludes)
  }

  @Test
  fun getPackagingOptionsForVariant_withHermesDisabled() {
    val (excludes, includes) = getPackagingOptionsForVariant(hermesEnabled = false)

    assertTrue("**/libhermes.so" in excludes)
    assertTrue("**/libhermes_executor.so" in excludes)
    assertFalse("**/libhermes.so" in includes)
    assertFalse("**/libhermes_executor.so" in includes)

    assertTrue("**/libjsc.so" in includes)
    assertTrue("**/libjscexecutor.so" in includes)
    assertFalse("**/libjsc.so" in excludes)
    assertFalse("**/libjscexecutor.so" in excludes)
  }
}
