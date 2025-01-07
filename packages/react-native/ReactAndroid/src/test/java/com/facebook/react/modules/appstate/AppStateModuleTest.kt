/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.appstate

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.mockito.ArgumentCaptor
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class AppStateModuleTest {
  private lateinit var appStateModule: AppStateModule
  private lateinit var reactContext: ReactApplicationContext
  private lateinit var arguments: MockedStatic<Arguments>

  @Before
  fun setUp() {
    reactContext = mock()
    appStateModule = AppStateModule(reactContext)

    arguments = mockStatic(Arguments::class.java)
    arguments.`when`<WritableArray>(Arguments::createArray).thenAnswer { JavaOnlyArray() }
    arguments.`when`<WritableMap>(Arguments::createMap).thenAnswer { JavaOnlyMap() }

    // we check whether we have an active react instance before emitting an event,
    // therefore for the tests we need this returning `true`.
    whenever(reactContext.hasActiveReactInstance()).thenReturn(true)
  }

  @After
  fun tearDown() {
    arguments.close()
  }

  @Test
  fun testGetCurrentAppState() {
    val successCallbackMock: Callback = mock()
    val errorCallbackMock: Callback = mock()

    appStateModule.onHostResume()
    appStateModule.getCurrentAppState(successCallbackMock, errorCallbackMock)

    val activeAppStateMap =
        Arguments.createMap().apply { putString("app_state", AppStateModule.APP_STATE_ACTIVE) }
    verify(successCallbackMock, times(1)).invoke(activeAppStateMap)

    appStateModule.onHostPause()
    appStateModule.getCurrentAppState(successCallbackMock, errorCallbackMock)

    val backgroundAppStateMap =
        Arguments.createMap().apply { putString("app_state", AppStateModule.APP_STATE_BACKGROUND) }
    verify(successCallbackMock, times(1)).invoke(backgroundAppStateMap)
  }

  @Test
  fun testOnHostResume() {
    appStateModule.onHostResume()

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableMap::class.java)

    verifyModuleInitializes()
    verify(reactContext).hasActiveReactInstance()
    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("appStateDidChange")
    assertThat(eventArgumentsCaptor.value.getString("app_state"))
        .isEqualTo(AppStateModule.APP_STATE_ACTIVE)
  }

  @Test
  fun testOnHostPause() {
    appStateModule.onHostPause()

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(WritableMap::class.java)

    verifyModuleInitializes()
    verify(reactContext).hasActiveReactInstance()
    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("appStateDidChange")
    assertThat(eventArgumentsCaptor.value.getString("app_state"))
        .isEqualTo(AppStateModule.APP_STATE_BACKGROUND)
  }

  @Test
  fun testOnHostDestroy() {
    appStateModule.onHostDestroy()

    verifyModuleInitializes()
    verify(reactContext, never()).hasActiveReactInstance()
    verify(reactContext, never()).emitDeviceEvent(any<String>(), any())
  }

  @Test
  fun testOnWindowFocusChange() {
    appStateModule.onWindowFocusChange(true)

    val eventNameCaptor = ArgumentCaptor.forClass(String::class.java)
    val eventArgumentsCaptor = ArgumentCaptor.forClass(Boolean::class.java)

    verifyModuleInitializes()
    verify(reactContext).hasActiveReactInstance()
    verify(reactContext).emitDeviceEvent(eventNameCaptor.capture(), eventArgumentsCaptor.capture())

    assertThat(eventNameCaptor.value).isEqualTo("appStateFocusChange")
    assertThat(eventArgumentsCaptor.value).isEqualTo(true)
  }

  /** Verifies that the module initializes correctly before checking a lifecycle event */
  private fun verifyModuleInitializes() {
    verify(reactContext).addLifecycleEventListener(appStateModule)
    verify(reactContext).addWindowFocusChangeListener(appStateModule)
    verify(reactContext).lifecycleState
  }
}
