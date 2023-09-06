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
import java.util.Date
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/** Test that verifies that spec of methods annotated with @ReactProp is correct */
@RunWith(RobolectricTestRunner::class)
@Suppress("UNUSED_PARAMETER")
class ReactPropAnnotationSetterSpecTest {
  private abstract inner class BaseViewManager : ViewManager<View, ReactShadowNode<*>>() {
    override fun getName(): String = "IgnoredName"

    override fun createShadowNodeInstance(): ReactShadowNode<*> = createShadowNodeInstance()

    override fun getShadowNodeClass(): Class<out ReactShadowNode<*>> = ReactShadowNode::class.java

    override fun createViewInstance(reactContext: ThemedReactContext): View =
        createViewInstance(reactContext)

    override fun updateExtraData(root: View, extraData: Any) {}
  }

  @Test(expected = RuntimeException::class)
  fun testMethodWithWrongNumberOfParams() {
    object : BaseViewManager() {
          @ReactProp(name = "prop")
          fun setterWithIncorrectNumberOfArgs(v: View?, value: Boolean, otherValue: Boolean) {}
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testMethodWithTooFewParams() {
    object : BaseViewManager() {
          @ReactProp(name = "prop") fun setterWithTooFewParams(v: View?) {}
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testUnsupportedPropValueType() {
    object : BaseViewManager() {
          @ReactProp(name = "prop") fun setterWithUnsupportedValueType(v: View?, value: Date?) {}
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testSetterWithNonViewParam() {
    object : BaseViewManager() {
          @ReactProp(name = "prop") fun setterWithNonViewParam(v: Any?, value: Boolean) {}
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupInvalidNumberOfParams() {
    object : BaseViewManager() {
          @ReactPropGroup(names = ["prop1", "prop2"])
          fun setterWithInvalidNumberOfParams(v: View?, index: Int, value: Float, other: Float) {}
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupTooFewParams() {
    object : BaseViewManager() {
          @ReactPropGroup(names = ["prop1", "prop2"])
          fun setterWithTooFewParams(v: View?, index: Int) {}
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupNoIndexParam() {
    object : BaseViewManager() {
          @ReactPropGroup(names = ["prop1", "prop2"])
          fun setterWithoutIndexParam(v: View?, value: Float, sth: Float) {}
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupNoViewParam() {
    object : BaseViewManager() {
          @ReactPropGroup(names = ["prop1", "prop2"])
          fun setterWithoutViewParam(v: Any?, index: Int, value: Float) {}
        }
        .nativeProps
  }

  @Test(expected = RuntimeException::class)
  fun testGroupUnsupportedPropType() {
    object : BaseViewManager() {
          @ReactPropGroup(names = ["prop1", "prop2"])
          fun setterWithUnsupportedPropType(v: View?, index: Int, value: Long) {}
        }
        .nativeProps
  }
}
