/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowYogaConfigProvider
import com.facebook.testutils.shadows.ShadowYogaNodeFactory
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Test that verifies that spec of methods annotated with @ReactProp in {@link ReactShadowNode} is
 * correct
 */
@RunWith(RobolectricTestRunner::class)
@Config(
    shadows =
        [ShadowYogaConfigProvider::class, ShadowSoLoader::class, ShadowYogaNodeFactory::class])
class ReactPropForShadowNodeSpecTest {
  @Test(expected = RuntimeException::class)
  fun testMethodWithWrongNumberOfParams() {
    BaseViewManager(
            object : ReactShadowNodeImpl() {
                  @Suppress("UNUSED_PARAMETER")
                  @ReactProp(name = "prop")
                  fun setterWithIncorrectNumberOfArgs(value: Boolean, anotherValue: Int) = Unit
                }
                .javaClass)
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testMethodWithTooFewParams() {
    BaseViewManager(
            object : ReactShadowNodeImpl() {
                  @ReactProp(name = "prop") fun setterWithNoArgs() = Unit
                }
                .javaClass)
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testUnsupportedValueType() {
    BaseViewManager(
            object : ReactShadowNodeImpl() {
                  @Suppress("UNUSED_PARAMETER")
                  @ReactProp(name = "prop")
                  fun setterWithMap(value: Map<*, *>) = Unit
                }
                .javaClass)
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupInvalidNumberOfParams() {
    BaseViewManager(
            object : ReactShadowNodeImpl() {
                  @Suppress("UNUSED_PARAMETER")
                  @ReactPropGroup(names = ["prop1", "prop2"])
                  fun setterWithTooManyParams(index: Int, value: Float, boolean: Boolean) = Unit
                }
                .javaClass)
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupTooFewParams() {
    BaseViewManager(
            object : ReactShadowNodeImpl() {
                  @Suppress("UNUSED_PARAMETER")
                  @ReactPropGroup(names = ["props1", "prop2"])
                  fun setterWithTooFewParams(index: Int) = Unit
                }
                .javaClass)
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupNoIndexParam() {
    BaseViewManager(
            object : ReactShadowNodeImpl() {
                  @Suppress("UNUSED_PARAMETER")
                  @ReactPropGroup(names = ["prop1", "prop2"])
                  fun setterWithNoIndexParam(value: Float, boolean: Boolean) = Unit
                }
                .javaClass)
        .nativeProps
  }

  companion object {
    private class BaseViewManager(
        private val shadowNodeClass: Class<out ReactShadowNode<ReactShadowNodeImpl>>
    ) : ViewManager<View, ReactShadowNode<*>>() {
      override fun getName(): String = "IgnoredName"

      override fun createShadowNodeInstance(): ReactShadowNode<*>? = null

      override fun getShadowNodeClass(): Class<out ReactShadowNode<ReactShadowNodeImpl>> =
          shadowNodeClass

      override fun createViewInstance(reactContext: ThemedReactContext): View = View(null)

      override fun updateExtraData(root: View, extraData: Any?) = Unit
    }
  }
}
