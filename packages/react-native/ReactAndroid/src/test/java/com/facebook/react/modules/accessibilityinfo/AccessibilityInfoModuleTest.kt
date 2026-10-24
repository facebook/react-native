/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.accessibilityinfo

import android.app.UiModeManager
import android.content.Context
import android.content.ContextWrapper
import android.os.Build
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
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.spy
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], shadows = [ShadowSoLoader::class, ShadowNativeLoader::class])
class AccessibilityInfoModuleTest {

  private lateinit var uiModeManager: UiModeManager
  private lateinit var reactContext: BridgeReactContext
  private lateinit var module: AccessibilityInfoModule

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val application = RuntimeEnvironment.getApplication()
    val context =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
          uiModeManager = mock()
          whenever(uiModeManager.contrast).thenReturn(0f)
          UiModeContext(application, uiModeManager)
        } else {
          // Mockito can't mock the API 34 UiModeManager on older versions, so use Robolectric's.
          application
        }
    reactContext = spy(BridgeReactContext(context))
    reactContext.initializeWithInstance(ReactTestHelper.createMockCatalystInstance())
    module = AccessibilityInfoModule(reactContext)
  }

  @Test
  fun aContrastChangeSendsContrastLevelDidChangeOnce() {
    module.onHostResume()
    val listener = registeredListener()

    whenever(uiModeManager.contrast).thenReturn(0.5f)
    listener.onContrastChanged(0.5f)
    listener.onContrastChanged(0.5f)

    verify(reactContext, times(1)).emitDeviceEvent(CONTRAST_LEVEL_EVENT, 0.5)
    assertThat(currentContrastLevel()).isEqualTo(0.5)
  }

  @Test
  fun aNegativeContrastIsSent() {
    module.onHostResume()

    whenever(uiModeManager.contrast).thenReturn(-1f)
    registeredListener().onContrastChanged(-1f)

    verify(reactContext, times(1)).emitDeviceEvent(CONTRAST_LEVEL_EVENT, -1.0)
  }

  @Test
  fun resumingTwiceRegistersOneListener() {
    module.onHostResume()
    module.onHostResume()

    verify(uiModeManager, times(1)).addContrastChangeListener(any(), any())
  }

  @Test
  fun pausingRemovesTheListener() {
    module.onHostResume()
    val listener = registeredListener()

    module.onHostPause()

    verify(uiModeManager).removeContrastChangeListener(listener)
  }

  @Test
  fun invalidatingRemovesTheListener() {
    module.onHostResume()
    val listener = registeredListener()

    module.invalidate()

    verify(uiModeManager).removeContrastChangeListener(listener)
  }

  @Test
  fun aChangeWhilePausedIsSentOnResume() {
    module.onHostResume()
    module.onHostPause()

    whenever(uiModeManager.contrast).thenReturn(1f)
    module.onHostResume()

    verify(reactContext, times(1)).emitDeviceEvent(CONTRAST_LEVEL_EVENT, 1.0)
  }

  @Test
  @Config(sdk = [33])
  fun theContrastLevelIsAlwaysZeroBeforeAndroid14() {
    module.onHostResume()
    module.onHostPause()
    module.invalidate()

    assertThat(currentContrastLevel()).isEqualTo(0.0)
    verify(reactContext, never())
        .emitDeviceEvent(
            ArgumentMatchers.eq(CONTRAST_LEVEL_EVENT),
            ArgumentMatchers.any(),
        )
  }

  private fun registeredListener(): UiModeManager.ContrastChangeListener {
    val captor = argumentCaptor<UiModeManager.ContrastChangeListener>()
    verify(uiModeManager).addContrastChangeListener(any(), captor.capture())
    return captor.firstValue
  }

  private fun currentContrastLevel(): Double {
    var result: Double? = null
    module.getContrastLevel(Callback { args -> result = args[0] as Double })
    return checkNotNull(result)
  }

  /** Serves a mock [UiModeManager], since Robolectric doesn't call contrast listeners. */
  private class UiModeContext(base: Context, private val uiModeManager: UiModeManager) :
      ContextWrapper(base) {
    override fun getApplicationContext(): Context = this

    override fun getSystemService(name: String): Any? =
        if (name == Context.UI_MODE_SERVICE) uiModeManager else super.getSystemService(name)
  }

  private companion object {
    const val CONTRAST_LEVEL_EVENT = "contrastLevelDidChange"
  }
}
