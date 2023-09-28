/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import org.assertj.core.api.Assertions
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Test updating view through [ViewManager] with [ReactProp] and [ReactPropGroup] annotations. */
@RunWith(RobolectricTestRunner::class)
class ReactPropAnnotationSetterTest {
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

  @Suppress("UNUSED_PARAMETER")
  private inner class ViewManagerUnderTest
  constructor(val mViewManagerUpdatesReceiver: ViewManagerUpdatesReceiver) :
    ViewManager<View?, ReactShadowNode<*>?>() {
    override fun getName(): String {
      return "RedpandasLivestreamVideoView"
    }

    override fun createShadowNodeInstance(): ReactShadowNode<*>? {
      Assertions.fail<Any>("This method should not be executed as a part of this test")
      return null
    }

    override fun getShadowNodeClass(): Class<out ReactShadowNode<*>> {
      return ReactShadowNode::class.java
    }

    override fun createViewInstance(reactContext: ThemedReactContext): View {
      Assertions.fail<Any>("This method should not be executed as a part of this test")
      return View(RuntimeEnvironment.getApplication())
    }

    override fun updateExtraData(root: View, extraData: Any) {
      Assertions.fail<Any>("This method should not be executed as a part of this test")
    }

    @ReactProp(name = "boolProp")
    fun setBoolProp(v: View?, value: Boolean) {
      mViewManagerUpdatesReceiver.onBooleanSetterCalled(value)
    }

    @ReactProp(name = "boolPropWithDefault", defaultBoolean = true)
    fun setBoolPropWithDefault(v: View?, value: Boolean) {
      mViewManagerUpdatesReceiver.onBooleanSetterCalled(value)
    }

    @ReactProp(name = "intProp")
    fun setIntProp(v: View?, value: Int) {
      mViewManagerUpdatesReceiver.onIntSetterCalled(value)
    }

    @ReactProp(name = "intPropWithDefault", defaultInt = 7168)
    fun setIntPropWithDefault(v: View?, value: Int) {
      mViewManagerUpdatesReceiver.onIntSetterCalled(value)
    }

    @ReactProp(name = "floatProp")
    fun setFloatProp(v: View?, value: Float) {
      mViewManagerUpdatesReceiver.onFloatSetterCalled(value)
    }

    @ReactProp(name = "floatPropWithDefault", defaultFloat = 14.0f)
    fun setFloatPropWithDefault(v: View?, value: Float) {
      mViewManagerUpdatesReceiver.onFloatSetterCalled(value)
    }

    @ReactProp(name = "doubleProp")
    fun setDoubleProp(v: View?, value: Double) {
      mViewManagerUpdatesReceiver.onDoubleSetterCalled(value)
    }

    @ReactProp(name = "doublePropWithDefault", defaultDouble = -88.0)
    fun setDoublePropWithDefault(v: View?, value: Double) {
      mViewManagerUpdatesReceiver.onDoubleSetterCalled(value)
    }

    @ReactProp(name = "stringProp")
    fun setStringProp(v: View?, value: String?) {
      mViewManagerUpdatesReceiver.onStringSetterCalled(value)
    }

    @ReactProp(name = "boxedBoolProp")
    fun setBoxedBoolProp(v: View?, value: Boolean?) {
      mViewManagerUpdatesReceiver.onBoxedBooleanSetterCalled(value)
    }

    @ReactProp(name = "boxedIntProp")
    fun setBoxedIntProp(v: View?, value: Int?) {
      mViewManagerUpdatesReceiver.onBoxedIntSetterCalled(value)
    }

    @ReactProp(name = "arrayProp")
    fun setArrayProp(v: View?, value: ReadableArray?) {
      mViewManagerUpdatesReceiver.onArraySetterCalled(value)
    }

    @ReactProp(name = "mapProp")
    fun setMapProp(v: View?, value: ReadableMap?) {
      mViewManagerUpdatesReceiver.onMapSetterCalled(value)
    }

    @ReactPropGroup(names = ["floatGroupPropFirst", "floatGroupPropSecond"])
    fun setFloatGroupProp(v: View?, index: Int, value: Float) {
      mViewManagerUpdatesReceiver.onFloatGroupPropSetterCalled(index, value)
    }

    @ReactPropGroup(
      names = ["floatGroupPropWithDefaultFirst", "floatGroupPropWithDefaultSecond"],
      defaultFloat = -100.0f
    )
    fun setFloatGroupPropWithDefault(v: View?, index: Int, value: Float) {
      mViewManagerUpdatesReceiver.onFloatGroupPropSetterCalled(index, value)
    }

    @ReactPropGroup(names = ["intGroupPropFirst", "intGroupPropSecond"])
    fun setIntGroupProp(v: View?, index: Int, value: Int) {
      mViewManagerUpdatesReceiver.onIntGroupPropSetterCalled(index, value)
    }

    @ReactPropGroup(
      names = ["intGroupPropWithDefaultFirst", "intGroupPropWithDefaultSecond"],
      defaultInt = 555
    )
    fun setIntGroupPropWithDefault(v: View?, index: Int, value: Int) {
      mViewManagerUpdatesReceiver.onIntGroupPropSetterCalled(index, value)
    }

    @ReactPropGroup(names = ["boxedIntGroupPropFirst", "boxedIntGroupPropSecond"])
    fun setBoxedIntGroupProp(v: View?, index: Int, value: Int?) {
      mViewManagerUpdatesReceiver.onBoxedIntGroupPropSetterCalled(index, value)
    }
  }

  private var mViewManager: ViewManagerUnderTest? = null
  private var mUpdatesReceiverMock: ViewManagerUpdatesReceiver? = null
  private var mTargetView: View? = null

  @Before
  fun setup() {
    mUpdatesReceiverMock = Mockito.mock(ViewManagerUpdatesReceiver::class.java)
    mViewManager = ViewManagerUnderTest(mUpdatesReceiverMock as ViewManagerUpdatesReceiver)
    mTargetView = View(RuntimeEnvironment.getApplication())
  }

  @Test
  fun testBooleanSetter() {
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("boolProp", true))
    Mockito.verify(mUpdatesReceiverMock)!!.onBooleanSetterCalled(true)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("boolProp", false))
    Mockito.verify(mUpdatesReceiverMock)!!.onBooleanSetterCalled(false)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("boolProp", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onBooleanSetterCalled(false)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("boolPropWithDefault", false))
    Mockito.verify(mUpdatesReceiverMock)!!.onBooleanSetterCalled(false)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("boolPropWithDefault", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onBooleanSetterCalled(true)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
  }

  @Test
  fun testIntSetter() {
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("intProp", 13))
    Mockito.verify(mUpdatesReceiverMock)!!.onIntSetterCalled(13)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("intProp", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onIntSetterCalled(0)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("intPropWithDefault", -1))
    Mockito.verify(mUpdatesReceiverMock)!!.onIntSetterCalled(-1)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("intPropWithDefault", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onIntSetterCalled(7168)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
  }

  @Test
  fun testDoubleSetter() {
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("doubleProp", 13.0))
    Mockito.verify(mUpdatesReceiverMock)!!.onDoubleSetterCalled(13.0)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("doubleProp", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onDoubleSetterCalled(0.0)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("doublePropWithDefault", -1.0))
    Mockito.verify(mUpdatesReceiverMock)!!.onDoubleSetterCalled(-1.0)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("doublePropWithDefault", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onDoubleSetterCalled(-88.0)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
  }

  @Test
  fun testFloatSetter() {
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("floatProp", 13.0))
    Mockito.verify(mUpdatesReceiverMock)!!.onFloatSetterCalled(13.0f)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("floatProp", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onFloatSetterCalled(0.0f)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("floatPropWithDefault", -1.0))
    Mockito.verify(mUpdatesReceiverMock)!!.onFloatSetterCalled(-1.0f)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("floatPropWithDefault", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onFloatSetterCalled(14.0f)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
  }

  @Test
  fun testStringSetter() {
    mViewManager!!.updateProperties(
      mTargetView!!,
      buildStyles("stringProp", "someRandomString")
    )
    Mockito.verify(mUpdatesReceiverMock)!!.onStringSetterCalled("someRandomString")
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("stringProp", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onStringSetterCalled(null)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
  }

  @Test
  fun testBoxedBooleanSetter() {
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("boxedBoolProp", true))
    Mockito.verify(mUpdatesReceiverMock)!!.onBoxedBooleanSetterCalled(java.lang.Boolean.TRUE)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("boxedBoolProp", false))
    Mockito.verify(mUpdatesReceiverMock)!!.onBoxedBooleanSetterCalled(java.lang.Boolean.FALSE)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("boxedBoolProp", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onBoxedBooleanSetterCalled(null)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
  }

  @Test
  fun testBoxedIntSetter() {
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("boxedIntProp", 55))
    Mockito.verify(mUpdatesReceiverMock)!!.onBoxedIntSetterCalled(55)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("boxedIntProp", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onBoxedIntSetterCalled(null)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
  }

  @Test
  fun testArraySetter() {
    val array: ReadableArray = JavaOnlyArray()
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("arrayProp", array))
    Mockito.verify(mUpdatesReceiverMock)!!.onArraySetterCalled(array)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("arrayProp", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onArraySetterCalled(null)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
  }

  @Test
  fun testMapSetter() {
    val map: ReadableMap = JavaOnlyMap()
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("mapProp", map))
    Mockito.verify(mUpdatesReceiverMock)!!.onMapSetterCalled(map)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("mapProp", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onMapSetterCalled(null)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
  }

  @Test
  fun testFloatGroupSetter() {
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("floatGroupPropFirst", 11.0))
    Mockito.verify(mUpdatesReceiverMock)!!.onFloatGroupPropSetterCalled(0, 11.0f)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("floatGroupPropSecond", -111.0))
    Mockito.verify(mUpdatesReceiverMock)!!.onFloatGroupPropSetterCalled(1, -111.0f)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("floatGroupPropSecond", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onFloatGroupPropSetterCalled(1, 0.0f)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(
      mTargetView!!,
      buildStyles("floatGroupPropWithDefaultFirst", null)
    )
    Mockito.verify(mUpdatesReceiverMock)!!.onFloatGroupPropSetterCalled(0, -100.0f)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
  }

  @Test
  fun testIntGroupSetter() {
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("intGroupPropFirst", -7))
    Mockito.verify(mUpdatesReceiverMock)!!.onIntGroupPropSetterCalled(0, -7)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("intGroupPropSecond", -77))
    Mockito.verify(mUpdatesReceiverMock)!!.onIntGroupPropSetterCalled(1, -77)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("intGroupPropSecond", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onIntGroupPropSetterCalled(1, 0)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(
      mTargetView!!,
      buildStyles("intGroupPropWithDefaultFirst", 5)
    )
    Mockito.verify(mUpdatesReceiverMock)!!.onIntGroupPropSetterCalled(0, 5)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(
      mTargetView!!,
      buildStyles("intGroupPropWithDefaultFirst", null)
    )
    Mockito.verify(mUpdatesReceiverMock)!!.onIntGroupPropSetterCalled(0, 555)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(
      mTargetView!!,
      buildStyles("intGroupPropWithDefaultSecond", null)
    )
    Mockito.verify(mUpdatesReceiverMock)!!.onIntGroupPropSetterCalled(1, 555)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
  }

  @Test
  fun testStringGroupSetter() {
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("boxedIntGroupPropFirst", -7))
    Mockito.verify(mUpdatesReceiverMock)!!.onBoxedIntGroupPropSetterCalled(0, -7)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(
      mTargetView!!,
      buildStyles("boxedIntGroupPropSecond", 12345)
    )
    Mockito.verify(mUpdatesReceiverMock)!!.onBoxedIntGroupPropSetterCalled(1, 12345)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("boxedIntGroupPropSecond", null))
    Mockito.verify(mUpdatesReceiverMock)!!.onBoxedIntGroupPropSetterCalled(1, null)
    Mockito.verifyNoMoreInteractions(mUpdatesReceiverMock)
    Mockito.reset(mUpdatesReceiverMock)
  }

  @Test(expected = JSApplicationIllegalArgumentException::class)
  fun testFailToUpdateBoolPropWithMap() {
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("boolProp", JavaOnlyMap()))
  }

  @Test(expected = JSApplicationIllegalArgumentException::class)
  fun testFailToUpdateStringPropWithDouble() {
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("stringProp", 14.5))
  }

  @Test(expected = JSApplicationIllegalArgumentException::class)
  fun testFailToUpdateDoublePropWithString() {
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("doubleProp", "hello"))
  }

  @Test(expected = JSApplicationIllegalArgumentException::class)
  fun testFailToUpdateArrayPropWithBool() {
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("arrayProp", false))
  }

  @Test(expected = JSApplicationIllegalArgumentException::class)
  fun testFailToUpdateMapPropWithArray() {
    mViewManager!!.updateProperties(mTargetView!!, buildStyles("mapProp", JavaOnlyArray()))
  }

  companion object {
    fun buildStyles(vararg keysAndValues: Any?): ReactStylesDiffMap {
      return ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
    }
  }
}
