/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReactActivityBackPressedCallbackTest {

  @Test
  fun getBackPressedCallback_isEnabledByDefault() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()

    assertThat(activity.backPressedCallback.isEnabled).isTrue()
  }

  @Test
  fun invokeDefaultOnBackPressed_restoresDisabledState() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()
    activity.backPressedCallback.isEnabled = false

    activity.invokeDefaultOnBackPressed()

    assertThat(activity.backPressedCallback.isEnabled).isFalse()
  }

  @Test
  fun invokeDefaultOnBackPressed_restoresEnabledState() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()

    activity.invokeDefaultOnBackPressed()

    assertThat(activity.backPressedCallback.isEnabled).isTrue()
  }

  @Test
  fun systemNavigationObserver_notifiesJsWhenCallbackDisabled() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()
    activity.backPressedCallback.isEnabled = false

    activity.onSystemNavigationBackInvoked()

    assertThat(activity.delegatedBackPressCount).isEqualTo(1)
  }

  @Test
  fun systemNavigationObserver_doesNotNotifyJsWhenCallbackEnabled() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()

    activity.onSystemNavigationBackInvoked()

    assertThat(activity.delegatedBackPressCount).isEqualTo(0)
  }

  @Test
  fun setInterceptEnabled_true_enablesCallbackBelowApi36() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()
    activity.backPressedCallback.isEnabled = false

    activity.setInterceptEnabled(true)

    assertThat(activity.backPressedCallback.isEnabled).isTrue()
  }

  @Test
  fun setInterceptEnabled_false_disablesCallbackBelowApi36() {
    val activity = Robolectric.buildActivity(TestReactActivity::class.java).get()

    activity.setInterceptEnabled(false)

    assertThat(activity.backPressedCallback.isEnabled).isFalse()
  }

  class TestReactActivity : ReactActivity() {
    var delegatedBackPressCount: Int = 0

    override fun getMainComponentName(): String = "Test"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
      return object : ReactActivityDelegate(this, "Test") {
        override fun onBackPressed(): Boolean {
          delegatedBackPressCount++
          return true
        }
      }
    }
  }
}
