/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowYogaConfigProvider
import com.facebook.testutils.shadows.ShadowYogaNodeFactory
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mock
import org.mockito.Mockito.reset
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoMoreInteractions
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/** Test [ReactProp] and [ReactPropGroup] annotations for [ReactShadowNode] */
@RunWith(RobolectricTestRunner::class)
@Config(
    shadows =
        [ShadowYogaConfigProvider::class, ShadowSoLoader::class, ShadowYogaNodeFactory::class])
class ReactPropForShadowNodeSetterTest {
  interface ViewManagerUpdatesReceiver {
    fun onBooleanSetterCalled(value: Boolean)

    fun onIntSetterCalled(value: Int)

    fun onDoubleSetterCalled(value: Double)

    fun onFloatSetterCalled(value: Float)

    fun onStringSetterCalled(value: String?)

    fun onBoxedBooleanSetterCalled(value: Boolean?)

    fun onBoxedIntSetterCalled(value: Int?)

    fun onArraySetterCalled(value: ReadableArray?)

    fun onMapSetterCalled(value: ReadableMap?)

    fun onFloatGroupPropSetterCalled(index: Int, value: Float)

    fun onIntGroupPropSetterCalled(index: Int, value: Int)

    fun onBoxedIntGroupPropSetterCalled(index: Int, value: Int?)
  }

  private inner class ShadowViewUnderTest(
      val viewManagerUpdatesReceiver: ViewManagerUpdatesReceiver
  ) : ReactShadowNodeImpl() {

    init {
      setViewClassName("ShadowViewUnderTest")
      val context = BridgeReactContext(RuntimeEnvironment.getApplication())
      setThemedContext(ThemedReactContext(context, context, null, -1))
    }

    @ReactProp(name = "boolProp")
    fun setBoolProp(value: Boolean) {
      viewManagerUpdatesReceiver.onBooleanSetterCalled(value)
    }

    @ReactProp(name = "stringProp")
    fun setStringProp(value: String?) {
      viewManagerUpdatesReceiver.onStringSetterCalled(value)
    }

    @ReactProp(name = "boxedIntProp")
    fun setBoxedIntProp(value: Int?) {
      viewManagerUpdatesReceiver.onBoxedIntSetterCalled(value)
    }

    @ReactPropGroup(names = ["floatGroupPropFirst", "floatGroupPropSecond"])
    fun setFloatGroupProp(index: Int, value: Float) {
      viewManagerUpdatesReceiver.onFloatGroupPropSetterCalled(index, value)
    }
  }

  private lateinit var shadowView: ShadowViewUnderTest
  private lateinit var updatesReceiverMock: ViewManagerUpdatesReceiver

  @Before
  fun setup() {
    updatesReceiverMock = mock(ViewManagerUpdatesReceiver::class.java)
    shadowView = ShadowViewUnderTest(updatesReceiverMock)
  }

  @Test
  fun testBooleanSetter() {
    shadowView.updateProperties(buildStyles("boolProp", true))
    verify(updatesReceiverMock).onBooleanSetterCalled(true)
    verifyNoMoreInteractions(updatesReceiverMock)
    reset(updatesReceiverMock)

    shadowView.updateProperties(buildStyles("boolProp", false))
    verify(updatesReceiverMock).onBooleanSetterCalled(false)
    verifyNoMoreInteractions(updatesReceiverMock)
    reset(updatesReceiverMock)

    shadowView.updateProperties(buildStyles("boolProp", null))
    verify(updatesReceiverMock).onBooleanSetterCalled(false)
    verifyNoMoreInteractions(updatesReceiverMock)
    reset(updatesReceiverMock)
  }

  @Test
  fun testStringSetter() {
    shadowView.updateProperties(buildStyles("stringProp", "someRandomString"))
    verify(updatesReceiverMock).onStringSetterCalled("someRandomString")
    verifyNoMoreInteractions(updatesReceiverMock)
    reset(updatesReceiverMock)

    shadowView.updateProperties(buildStyles("stringProp", null))
    verify(updatesReceiverMock).onStringSetterCalled(null)
    verifyNoMoreInteractions(updatesReceiverMock)
    reset(updatesReceiverMock)
  }

  @Test
  fun testFloatGroupSetter() {
    shadowView.updateProperties(buildStyles("floatGroupPropFirst", 11.0))
    verify(updatesReceiverMock).onFloatGroupPropSetterCalled(0, 11.0f)
    verifyNoMoreInteractions(updatesReceiverMock)
    reset(updatesReceiverMock)

    shadowView.updateProperties(buildStyles("floatGroupPropSecond", -111.0))
    verify(updatesReceiverMock).onFloatGroupPropSetterCalled(1, -111.0f)
    verifyNoMoreInteractions(updatesReceiverMock)
    reset(updatesReceiverMock)

    shadowView.updateProperties(buildStyles("floatGroupPropSecond", null))
    verify(updatesReceiverMock).onFloatGroupPropSetterCalled(1, 0.0f)
    verifyNoMoreInteractions(updatesReceiverMock)
    reset(updatesReceiverMock)
  }

  companion object {
    fun buildStyles(vararg keysAndValues: Any?) = ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
  }
}
