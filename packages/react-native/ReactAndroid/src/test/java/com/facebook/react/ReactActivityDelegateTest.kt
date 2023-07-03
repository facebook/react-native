/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.os.Bundle
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReactActivityDelegateTest {

  val nullDelegate: ReactActivity? = null

  @Test
  fun delegateWithFabricEnabled_populatesInitialPropsCorrectly() {
    val delegate =
        object : ReactActivityDelegate(nullDelegate, "test-delegate") {
          override fun isFabricEnabled() = true

          val inspectLaunchOptions: Bundle?
            get() = composeLaunchOptions()
        }

    assertNotNull(delegate.inspectLaunchOptions)
    assertTrue(delegate.inspectLaunchOptions!!.containsKey("concurrentRoot"))
    assertTrue(delegate.inspectLaunchOptions!!.getBoolean("concurrentRoot"))
  }

  @Test
  fun delegateWithoutFabricEnabled_hasNullInitialProperties() {
    val delegate =
        object : ReactActivityDelegate(nullDelegate, "test-delegate") {
          override fun isFabricEnabled() = false

          val inspectLaunchOptions: Bundle?
            get() = composeLaunchOptions()
        }

    assertNull(delegate.inspectLaunchOptions)
  }

  @Test
  fun delegateWithFabricEnabled_composesInitialPropertiesCorrectly() {
    val delegate =
        object : ReactActivityDelegate(nullDelegate, "test-delegate") {
          override fun isFabricEnabled() = true

          override fun getLaunchOptions(): Bundle =
              Bundle().apply { putString("test-property", "test-value") }

          val inspectLaunchOptions: Bundle?
            get() = composeLaunchOptions()
        }

    assertNotNull(delegate.inspectLaunchOptions)
    assertTrue(delegate.inspectLaunchOptions!!.containsKey("concurrentRoot"))
    assertTrue(delegate.inspectLaunchOptions!!.getBoolean("concurrentRoot"))
    assertTrue(delegate.inspectLaunchOptions!!.containsKey("test-property"))
    assertEquals("test-value", delegate.inspectLaunchOptions!!.getString("test-property"))
  }
}
