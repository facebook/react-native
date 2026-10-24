/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.accessibilityinfo

import android.content.res.Configuration
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers
import org.mockito.kotlin.never
import org.mockito.kotlin.spy
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class, ShadowNativeLoader::class])
class AccessibilityInfoModuleTest {

  private lateinit var reactContext: BridgeReactContext
  private lateinit var module: AccessibilityInfoModule

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    reactContext = spy(BridgeReactContext(RuntimeEnvironment.getApplication()))
    reactContext.initializeWithInstance(ReactTestHelper.createMockCatalystInstance())
    module = AccessibilityInfoModule(reactContext)
  }

  @Test
  fun boldTextIsEnabledForAPositiveFontWeightAdjustment() {
    assertThat(AccessibilityInfoModule.isBoldTextEnabled(300)).isTrue()
  }

  @Test
  fun boldTextIsDisabledWithoutAFontWeightAdjustment() {
    assertThat(AccessibilityInfoModule.isBoldTextEnabled(0)).isFalse()
  }

  @Test
  fun boldTextIsDisabledForANegativeFontWeightAdjustment() {
    assertThat(AccessibilityInfoModule.isBoldTextEnabled(-100)).isFalse()
  }

  @Test
  fun boldTextIsDisabledWhenTheFontWeightAdjustmentIsUndefined() {
    assertThat(
            AccessibilityInfoModule.isBoldTextEnabled(
                Configuration.FONT_WEIGHT_ADJUSTMENT_UNDEFINED
            )
        )
        .isFalse()
  }

  @Test
  fun aConfigurationChangeSendsBoldTextDidChangeOnce() {
    module.onHostResume()

    dispatchConfigurationChange(setFontWeightAdjustment(300))
    dispatchConfigurationChange(setFontWeightAdjustment(300))

    verify(reactContext, times(1)).emitDeviceEvent(BOLD_TEXT_EVENT, true)
    assertThat(currentBoldText()).isTrue()
  }

  @Test
  fun turningBoldTextOffSendsFalse() {
    setFontWeightAdjustment(300)
    module = AccessibilityInfoModule(reactContext)
    module.onHostResume()

    dispatchConfigurationChange(setFontWeightAdjustment(0))

    verify(reactContext, times(1)).emitDeviceEvent(BOLD_TEXT_EVENT, false)
    assertThat(currentBoldText()).isFalse()
  }

  @Test
  fun noEventIsSentWhilePaused() {
    module.onHostResume()
    module.onHostPause()

    dispatchConfigurationChange(setFontWeightAdjustment(300))

    verifyNoBoldTextEvent()
  }

  @Test
  fun resumingTwiceAndPausingOnceStopsTheEvents() {
    module.onHostResume()
    module.onHostResume()
    module.onHostPause()

    dispatchConfigurationChange(setFontWeightAdjustment(300))

    verifyNoBoldTextEvent()
  }

  @Test
  fun noEventIsSentAfterInvalidate() {
    module.onHostResume()
    module.invalidate()

    dispatchConfigurationChange(setFontWeightAdjustment(300))

    verifyNoBoldTextEvent()
  }

  @Test
  fun aChangeWhilePausedIsSentOnResume() {
    module.onHostResume()
    module.onHostPause()

    setFontWeightAdjustment(300)
    module.onHostResume()

    verify(reactContext, times(1)).emitDeviceEvent(BOLD_TEXT_EVENT, true)
  }

  @Test
  @Config(sdk = [30])
  fun boldTextIsAlwaysFalseBeforeAndroid12() {
    module = AccessibilityInfoModule(reactContext)
    module.onHostResume()
    module.onHostPause()
    module.invalidate()

    assertThat(currentBoldText()).isFalse()
    verifyNoBoldTextEvent()
  }

  private fun currentBoldText(): Boolean {
    var result: Boolean? = null
    module.isBoldTextEnabled(Callback { args -> result = args[0] as Boolean })
    return checkNotNull(result)
  }

  private fun verifyNoBoldTextEvent() {
    verify(reactContext, never())
        .emitDeviceEvent(
            ArgumentMatchers.eq(BOLD_TEXT_EVENT),
            ArgumentMatchers.any(),
        )
  }

  private fun setFontWeightAdjustment(adjustment: Int): Configuration {
    val resources = RuntimeEnvironment.getApplication().resources
    val config = Configuration(resources.configuration).apply { fontWeightAdjustment = adjustment }
    @Suppress("DEPRECATION") resources.updateConfiguration(config, resources.displayMetrics)
    return config
  }

  private fun dispatchConfigurationChange(config: Configuration) {
    RuntimeEnvironment.getApplication().onConfigurationChanged(config)
  }

  private companion object {
    const val BOLD_TEXT_EVENT = "boldTextDidChange"
  }
}
