/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.deviceinfo

import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.DisplayMetricsHolder
import junit.framework.TestCase
import org.assertj.core.api.Assertions
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentCaptor
import org.mockito.ArgumentMatchers
import org.mockito.MockedStatic
import org.mockito.Mockito.*
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class DeviceInfoModuleTest : TestCase() {

  private lateinit var deviceInfoModule: DeviceInfoModule
  private lateinit var fakePortraitDisplayMetrics: WritableMap
  private lateinit var fakeLandscapeDisplayMetrics: WritableMap
  private lateinit var reactContext: BridgeReactContext
  private lateinit var displayMetricsHolder: MockedStatic<DisplayMetricsHolder>

  @Before
  public override fun setUp() {
    fakePortraitDisplayMetrics = JavaOnlyMap()
    fakePortraitDisplayMetrics.putInt("width", 100)
    fakePortraitDisplayMetrics.putInt("height", 200)
    fakeLandscapeDisplayMetrics = JavaOnlyMap()
    fakeLandscapeDisplayMetrics.putInt("width", 200)
    fakeLandscapeDisplayMetrics.putInt("height", 100)

    displayMetricsHolder = mockStatic(DisplayMetricsHolder::class.java)
    reactContext = spy(BridgeReactContext(RuntimeEnvironment.getApplication()))
    val catalystInstanceMock = ReactTestHelper.createMockCatalystInstance()
    reactContext.initialize(catalystInstanceMock)
    deviceInfoModule = DeviceInfoModule(reactContext)
  }

  @After
  fun teardown() {
    displayMetricsHolder.close()
  }

  @Test
  fun test_itDoesNotEmitAnEvent_whenDisplayMetricsNotChanged() {
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics)
    deviceInfoModule.typedExportedConstants
    deviceInfoModule.emitUpdateDimensionsEvent()
    verify(reactContext, times(0))
        ?.emitDeviceEvent(ArgumentMatchers.anyString(), ArgumentMatchers.any())
  }

  @Test
  fun test_itEmitsOneEvent_whenDisplayMetricsChangedOnce() {
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics)
    deviceInfoModule.typedExportedConstants
    givenDisplayMetricsHolderContains(fakeLandscapeDisplayMetrics)
    deviceInfoModule.emitUpdateDimensionsEvent()
    verifyUpdateDimensionsEventsEmitted(reactContext, fakeLandscapeDisplayMetrics)
  }

  @Test
  fun test_itEmitsJustOneEvent_whenUpdateRequestedMultipleTimes() {
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics)
    deviceInfoModule.typedExportedConstants
    givenDisplayMetricsHolderContains(fakeLandscapeDisplayMetrics)
    deviceInfoModule.emitUpdateDimensionsEvent()
    deviceInfoModule.emitUpdateDimensionsEvent()
    verifyUpdateDimensionsEventsEmitted(reactContext, fakeLandscapeDisplayMetrics)
  }

  @Test
  fun test_itEmitsMultipleEvents_whenDisplayMetricsChangedBetweenUpdates() {
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics)
    deviceInfoModule.typedExportedConstants
    deviceInfoModule.emitUpdateDimensionsEvent()
    givenDisplayMetricsHolderContains(fakeLandscapeDisplayMetrics)
    deviceInfoModule.emitUpdateDimensionsEvent()
    givenDisplayMetricsHolderContains(fakePortraitDisplayMetrics)
    deviceInfoModule.emitUpdateDimensionsEvent()
    givenDisplayMetricsHolderContains(fakeLandscapeDisplayMetrics)
    deviceInfoModule.emitUpdateDimensionsEvent()
    verifyUpdateDimensionsEventsEmitted(
        reactContext,
        fakeLandscapeDisplayMetrics,
        fakePortraitDisplayMetrics,
        fakeLandscapeDisplayMetrics)
  }

  private fun givenDisplayMetricsHolderContains(fakeDisplayMetrics: WritableMap?) {
    displayMetricsHolder
        .`when`<WritableMap> { DisplayMetricsHolder.getDisplayMetricsWritableMap(1.0) }
        .thenAnswer { fakeDisplayMetrics }
  }

  companion object {
    private fun verifyUpdateDimensionsEventsEmitted(
        context: ReactContext?,
        vararg expectedEvents: WritableMap
    ) {
      val expectedEventList = listOf(*expectedEvents)
      val captor = ArgumentCaptor.forClass(WritableMap::class.java)
      verify(context, times(expectedEventList.size))
          ?.emitDeviceEvent(ArgumentMatchers.eq("didUpdateDimensions"), captor.capture())
      val actualEvents = captor.allValues
      Assertions.assertThat(actualEvents).isEqualTo(expectedEventList)
    }
  }
}
