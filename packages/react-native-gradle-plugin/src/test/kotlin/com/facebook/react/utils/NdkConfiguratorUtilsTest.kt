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
  fun getPackagingOptionsForVariant_withHermesEnabled_andDebuggableVariant() {
    val (excludes, includes) =
        getPackagingOptionsForVariant(hermesEnabled = true, debuggableVariant = true)

    assertTrue("**/libjsc.so" in excludes)
    assertTrue("**/libjscexecutor.so" in excludes)
    assertTrue("**/libhermes-executor-release.so" in excludes)
    assertFalse("**/libjsc.so" in includes)
    assertFalse("**/libjscexecutor.so" in includes)
    assertFalse("**/libhermes-executor-release.so" in includes)

    assertTrue("**/libhermes.so" in includes)
    assertTrue("**/libhermes-executor-debug.so" in includes)
    assertFalse("**/libhermes.so" in excludes)
    assertFalse("**/libhermes-executor-debug.so" in excludes)
  }

  @Test
  fun getPackagingOptionsForVariant_withHermesEnabled_andNonDebuggableVariant() {
    val (excludes, includes) =
        getPackagingOptionsForVariant(hermesEnabled = true, debuggableVariant = false)

    assertTrue("**/libjsc.so" in excludes)
    assertTrue("**/libjscexecutor.so" in excludes)
    assertTrue("**/libhermes-executor-debug.so" in excludes)
    assertFalse("**/libjsc.so" in includes)
    assertFalse("**/libjscexecutor.so" in includes)
    assertFalse("**/libhermes-executor-debug.so" in includes)

    assertTrue("**/libhermes.so" in includes)
    assertTrue("**/libhermes-executor-release.so" in includes)
    assertFalse("**/libhermes.so" in excludes)
    assertFalse("**/libhermes-executor-release.so" in excludes)
  }

  @Test
  fun getPackagingOptionsForVariant_withHermesDisabled_andDebuggableVariant() {
    val (excludes, includes) =
        getPackagingOptionsForVariant(hermesEnabled = false, debuggableVariant = true)

    assertTrue("**/libhermes.so" in excludes)
    assertTrue("**/libhermes-executor-debug.so" in excludes)
    assertTrue("**/libhermes-executor-release.so" in excludes)
    assertFalse("**/libhermes.so" in includes)
    assertFalse("**/libhermes-executor-debug.so" in includes)
    assertFalse("**/libhermes-executor-release.so" in includes)

    assertTrue("**/libjsc.so" in includes)
    assertTrue("**/libjscexecutor.so" in includes)
    assertFalse("**/libjsc.so" in excludes)
    assertFalse("**/libjscexecutor.so" in excludes)
  }

  @Test
  fun getPackagingOptionsForVariant_withHermesDisabled_andNonDebuggableVariant() {
    val (excludes, includes) =
        getPackagingOptionsForVariant(hermesEnabled = false, debuggableVariant = false)

    assertTrue("**/libhermes.so" in excludes)
    assertTrue("**/libhermes-executor-debug.so" in excludes)
    assertTrue("**/libhermes-executor-release.so" in excludes)
    assertFalse("**/libhermes.so" in includes)
    assertFalse("**/libhermes-executor-debug.so" in includes)
    assertFalse("**/libhermes-executor-release.so" in includes)

    assertTrue("**/libjsc.so" in includes)
    assertTrue("**/libjscexecutor.so" in includes)
    assertFalse("**/libjsc.so" in excludes)
    assertFalse("**/libjscexecutor.so" in excludes)
  }
}
