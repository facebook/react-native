/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import org.assertj.core.api.Assertions
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Verifies that prop constants are generated properly based on `ReactProp` annotation. */
@RunWith(RobolectricTestRunner::class)
class ReactPropConstantsTest {
  @Suppress("UNUSED_PARAMETER")
  private inner class ViewManagerUnderTest : ViewManager<View?, ReactShadowNode<*>?>() {
    override fun getName(): String {
      return "SomeView"
    }

    override fun createShadowNodeInstance(): ReactShadowNode<*>? {
      error("This method should not be executed as a part of this test")
    }

    override fun createViewInstance(reactContext: ThemedReactContext): View {
      error("This method should not be executed as a part of this test")
    }

    override fun getShadowNodeClass(): Class<out ReactShadowNode<*>> {
      return ReactShadowNode::class.java
    }

    override fun updateExtraData(root: View, extraData: Any) {
      error("This method should not be executed as a part of this test")
    }

    @ReactProp(name = "boolProp") fun setBoolProp(v: View?, value: Boolean) = Unit

    @ReactProp(name = "intProp") fun setIntProp(v: View?, value: Int) = Unit

    @ReactProp(name = "floatProp") fun setFloatProp(v: View?, value: Float) = Unit

    @ReactProp(name = "doubleProp") fun setDoubleProp(v: View?, value: Double) = Unit

    @ReactProp(name = "stringProp") fun setStringProp(v: View?, value: String?) = Unit

    @ReactProp(name = "boxedBoolProp") fun setBoxedBoolProp(v: View?, value: Boolean?) = Unit

    @ReactProp(name = "boxedIntProp") fun setBoxedIntProp(v: View?, value: Int?) = Unit

    @ReactProp(name = "arrayProp") fun setArrayProp(v: View?, value: ReadableArray?) = Unit

    @ReactProp(name = "mapProp") fun setMapProp(v: View?, value: ReadableMap?) = Unit

    @ReactPropGroup(names = ["floatGroupPropFirst", "floatGroupPropSecond"])
    fun setFloatGroupProp(v: View?, index: Int, value: Float) = Unit

    @ReactPropGroup(names = ["intGroupPropFirst", "intGroupPropSecond"])
    fun setIntGroupProp(v: View?, index: Int, value: Int) = Unit

    @ReactPropGroup(names = ["boxedIntGroupPropFirst", "boxedIntGroupPropSecond"])
    fun setBoxedIntGroupProp(v: View?, index: Int, value: Int?) = Unit

    @ReactProp(name = "customIntProp", customType = "date")
    fun customIntProp(v: View?, value: Int) = Unit

    @ReactPropGroup(
        names = ["customBoxedIntGroupPropFirst", "customBoxedIntGroupPropSecond"],
        customType = "color")
    fun customIntGroupProp(v: View?, index: Int, value: Int?) = Unit
  }

  @Test
  fun testNativePropsIncludeCorrectTypes() {
    val viewManagers = listOf<ViewManager<*, *>>(ViewManagerUnderTest())
    val reactContext = BridgeReactContext(RuntimeEnvironment.getApplication())
    val uiManagerModule = UIManagerModule(reactContext, viewManagers, 0)
    val constants: Map<*, *> =
        valueAtPath(uiManagerModule.constants as Map<*, *>, "SomeView", "NativeProps")

    Assertions.assertThat(constants)
        .isEqualTo(
            MapBuilder.builder<String, String>()
                .put("boolProp", "boolean")
                .put("intProp", "number")
                .put("doubleProp", "number")
                .put("floatProp", "number")
                .put("stringProp", "String")
                .put("boxedBoolProp", "boolean")
                .put("boxedIntProp", "number")
                .put("arrayProp", "Array")
                .put("mapProp", "Map")
                .put("floatGroupPropFirst", "number")
                .put("floatGroupPropSecond", "number")
                .put("intGroupPropFirst", "number")
                .put("intGroupPropSecond", "number")
                .put("boxedIntGroupPropFirst", "number")
                .put("boxedIntGroupPropSecond", "number")
                .put("customIntProp", "date")
                .put("customBoxedIntGroupPropFirst", "color")
                .put("customBoxedIntGroupPropSecond", "color")
                .build())
  }

  companion object {
    private fun valueAtPath(nestedMap: Map<*, *>, vararg keyPath: String): Map<*, *> {
      require(keyPath.isNotEmpty()) { "keyPath must not be empty" }
      var value: Map<*, *> = nestedMap
      for (key in keyPath) {
        require(key in value) { "Key '$key' not found in the map" }
        require(value[key] is Map<*, *>) { "Key '$key' must be a map itself" }
        value = value[key] as Map<*, *>
      }
      return value
    }
  }
}
