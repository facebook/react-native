/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import org.mockito.Mockito.never
import org.mockito.Mockito.reset
import org.mockito.Mockito.spy
import org.mockito.Mockito.verify
import android.util.DisplayMetrics
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.Spacing.*
import com.facebook.yoga.YogaAlign
import com.facebook.yoga.YogaConstants
import com.facebook.yoga.YogaFlexDirection
import com.facebook.yoga.YogaJustify
import com.facebook.yoga.YogaPositionType
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.eq
import org.mockito.ArgumentMatchers.anyFloat
import org.mockito.ArgumentMatchers.anyInt
import org.mockito.Mockito.mockStatic
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LayoutPropertyApplicatorTest {
  @Before
  fun setup () {
    DisplayMetricsHolder.setWindowDisplayMetrics(DisplayMetrics())
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
  }

  @After 
  fun teardown () {
    DisplayMetricsHolder.setWindowDisplayMetrics(null)
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  private fun buildStyles(vararg keysAndValues: Any?): ReactStylesDiffMap {
    return ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
  }

  @Test
  fun testDimensions() {
    var reactShadowNode = spy(LayoutShadowNode())
    var map =
        spy(buildStyles("width", 10.0f, "height", 10.0f, "left", 10.0f, "top", 10.0))

    reactShadowNode.updateProperties(map)
    verify(reactShadowNode).setStyleWidth(anyFloat())
    verify(map).getFloat(eq("width"), anyFloat())
    verify(reactShadowNode).setStyleHeight(anyFloat())
    verify(map).getFloat(eq("height"), anyFloat())
    verify(reactShadowNode).setPosition(eq(START), anyFloat())
    verify(map).getFloat(eq("left"), anyFloat())
    verify(reactShadowNode).setPosition(eq(TOP), anyFloat())
    verify(map).getFloat(eq("top"), anyFloat())

    reactShadowNode = spy(LayoutShadowNode())
    map = spy(buildStyles())

    reactShadowNode.updateProperties(map)
    verify(reactShadowNode, never()).setStyleWidth(anyFloat())
    verify(map, never()).getFloat(eq("width"), anyFloat())
    verify(reactShadowNode, never()).setStyleHeight(anyFloat())
    verify(map, never()).getFloat(eq("height"), anyFloat())
    verify(reactShadowNode, never()).setPosition(eq(START), anyFloat())
    verify(map, never()).getFloat(eq("left"), anyFloat())
    verify(reactShadowNode, never()).setPosition(eq(TOP), anyFloat())
    verify(map, never()).getFloat(eq("top"), anyFloat())
  }

   @Test
   fun testFlex() {
     var reactShadowNode = spy(LayoutShadowNode())
     var map = spy(buildStyles("flex", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).flex = anyFloat()
     verify(map).getFloat("flex", 0.0f)

     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles())

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode, never()).flex = anyFloat()
     verify(map, never()).getFloat("flex", 0.0f)
   }

   @Test
   fun testPosition() {
     var reactShadowNode = spy(LayoutShadowNode())
     var map = spy(buildStyles("position", "absolute", "bottom", 10.0f, "right", 5.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setPosition(eq(BOTTOM), anyFloat())
     verify(reactShadowNode).setPosition(eq(END), anyFloat())
     verify(reactShadowNode).setPositionType(any(YogaPositionType::class.java))
     verify(map).getFloat("bottom", Float.NaN)
     verify(map).getFloat("right", Float.NaN)

     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles())

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode, never()).setPosition(eq(BOTTOM), anyFloat())
     verify(reactShadowNode, never()).setPosition(eq(END), anyFloat())
     verify(reactShadowNode, never()).setPositionType(any(YogaPositionType::class.java))
     verify(map, never()).getFloat("bottom", Float.NaN)
     verify(map, never()).getFloat("right", Float.NaN)
   }

   @Test
   fun testMargin() {
     // margin
     var reactShadowNode = spy(LayoutShadowNode())
     var map = spy(buildStyles("margin", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setMargin(eq(ALL), anyFloat())
     verify(map).getFloat("margin", YogaConstants.UNDEFINED)

     // marginVertical
     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles("marginVertical", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setMargin(eq(VERTICAL), anyFloat())
     verify(map).getFloat("marginVertical", YogaConstants.UNDEFINED)

     // marginHorizontal
     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles("marginHorizontal", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setMargin(eq(HORIZONTAL), anyFloat())
     verify(map).getFloat("marginHorizontal", YogaConstants.UNDEFINED)

     // marginTop
     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles("marginTop", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setMargin(eq(TOP), anyFloat())
     verify(map).getFloat("marginTop", YogaConstants.UNDEFINED)

     // marginBottom
     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles("marginBottom", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setMargin(eq(BOTTOM), anyFloat())
     verify(map).getFloat("marginBottom", YogaConstants.UNDEFINED)

     // marginLeft
     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles("marginLeft", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setMargin(eq(START), anyFloat())
     verify(map).getFloat("marginLeft", YogaConstants.UNDEFINED)

     // marginRight
     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles("marginRight", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setMargin(eq(END), anyFloat())
     verify(map).getFloat("marginRight", YogaConstants.UNDEFINED)

     // no margin
     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles())

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode, never()).setMargin(anyInt(), anyFloat())
     verify(map, never()).getFloat("margin", YogaConstants.UNDEFINED)
   }

   @Test
   fun testPadding() {
     // padding
     var reactShadowNode = spy(LayoutShadowNode())
     var map = spy(buildStyles("padding", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setPadding(eq(ALL), anyFloat())
     verify(map).getFloat("padding", YogaConstants.UNDEFINED)

     // paddingVertical
     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles("paddingVertical", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setPadding(eq(VERTICAL), anyFloat())
     verify(map).getFloat("paddingVertical", YogaConstants.UNDEFINED)

     // paddingHorizontal
     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles("paddingHorizontal", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setPadding(eq(HORIZONTAL), anyFloat())
     verify(map).getFloat("paddingHorizontal", YogaConstants.UNDEFINED)

     // paddingTop
     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles("paddingTop", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setPadding(eq(TOP), anyFloat())
     verify(map).getFloat("paddingTop", YogaConstants.UNDEFINED)

     // paddingBottom
     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles("paddingBottom", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setPadding(eq(BOTTOM), anyFloat())
     verify(map).getFloat("paddingBottom", YogaConstants.UNDEFINED)

     // paddingLeft
     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles("paddingLeft", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setPadding(eq(START), anyFloat())
     verify(map).getFloat("paddingLeft", YogaConstants.UNDEFINED)

     // paddingRight
     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles("paddingRight", 10.0))

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setPadding(eq(END), anyFloat())
     verify(map).getFloat("paddingRight", YogaConstants.UNDEFINED)

     // no padding
     reactShadowNode = spy(LayoutShadowNode())
     map = spy(buildStyles())

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode, never()).setPadding(anyInt(), anyFloat())
     verify(map, never()).getFloat("padding", YogaConstants.UNDEFINED)
   }

   @Test
   fun testEnumerations() {
     var reactShadowNode = spy(LayoutShadowNode())
     var map =
         buildStyles(
             "flexDirection",
             "column",
             "alignSelf",
             "stretch",
             "alignItems",
             "center",
             "justifyContent",
             "space_between",
             "position",
             "relative")

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setFlexDirection(YogaFlexDirection.COLUMN)
     verify(reactShadowNode).setAlignSelf(YogaAlign.STRETCH)
     verify(reactShadowNode).setAlignItems(YogaAlign.CENTER)
     verify(reactShadowNode).setJustifyContent(YogaJustify.SPACE_BETWEEN)
     verify(reactShadowNode).setPositionType(YogaPositionType.RELATIVE)

     reactShadowNode = spy(LayoutShadowNode())
     map = buildStyles()
     reactShadowNode.updateProperties(map)

     verify(reactShadowNode, never()).setFlexDirection(any(YogaFlexDirection::class.java))
     verify(reactShadowNode, never()).setAlignSelf(any(YogaAlign::class.java))
     verify(reactShadowNode, never()).setAlignItems(any(YogaAlign::class.java))
     verify(reactShadowNode, never()).setJustifyContent(any(YogaJustify::class.java))
     verify(reactShadowNode, never()).setPositionType(any(YogaPositionType::class.java))
   }

   @Test
   fun testPropertiesResetToDefault() {
     var displayMetrics = DisplayMetrics()
     displayMetrics.density = 1.0f
     DisplayMetricsHolder.setWindowDisplayMetrics(displayMetrics)

     var reactShadowNode = spy(LayoutShadowNode())
     var map =
         buildStyles(
             "width",
             10.0f,
             "height",
             10.0f,
             "left",
             10.0f,
             "top",
             10.0f,
             "flex",
             1.0f,
             "padding",
             10.0f,
             "marginLeft",
             10.0f,
             "borderTopWidth",
             10.0f,
             "flexDirection",
             "row",
             "alignSelf",
             "stretch",
             "alignItems",
             "center",
             "justifyContent",
             "space_between",
             "position",
             "absolute")

     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setStyleWidth(10.0f)
     verify(reactShadowNode).setStyleHeight(10.0f)
     verify(reactShadowNode).setPosition(START, 10.0f)
     verify(reactShadowNode).setPosition(TOP, 10.0f)
     verify(reactShadowNode).flex = 1.0f
     verify(reactShadowNode).setPadding(ALL, 10.0f)
     verify(reactShadowNode).setMargin(START, 10.0f)
     verify(reactShadowNode).setBorder(TOP, 10.0f)
     verify(reactShadowNode).setFlexDirection(YogaFlexDirection.ROW)
     verify(reactShadowNode).setAlignSelf(YogaAlign.STRETCH)
     verify(reactShadowNode).setAlignItems(YogaAlign.CENTER)
     verify(reactShadowNode).setJustifyContent(YogaJustify.SPACE_BETWEEN)
     verify(reactShadowNode).setPositionType(YogaPositionType.ABSOLUTE)

     map =
         buildStyles(
             "width",
             null,
             "height",
             null,
             "left",
             null,
             "top",
             null,
             "flex",
             null,
             "padding",
             null,
             "marginLeft",
             null,
             "borderTopWidth",
             null,
             "flexDirection",
             null,
             "alignSelf",
             null,
             "alignItems",
             null,
             "justifyContent",
             null,
             "position",
             null)

     reset(reactShadowNode)
     reactShadowNode.updateProperties(map)
     verify(reactShadowNode).setStyleWidth(YogaConstants.UNDEFINED)
     verify(reactShadowNode).setStyleHeight(YogaConstants.UNDEFINED)
     verify(reactShadowNode).setPosition(START, YogaConstants.UNDEFINED)
     verify(reactShadowNode).setPosition(TOP, YogaConstants.UNDEFINED)
     verify(reactShadowNode).flex = 0.0f
     verify(reactShadowNode).setPadding(ALL, YogaConstants.UNDEFINED)
     verify(reactShadowNode).setMargin(START, YogaConstants.UNDEFINED)
     verify(reactShadowNode).setBorder(TOP, YogaConstants.UNDEFINED)
     verify(reactShadowNode).setFlexDirection(YogaFlexDirection.COLUMN)
     verify(reactShadowNode).setAlignSelf(YogaAlign.AUTO)
     verify(reactShadowNode).setAlignItems(YogaAlign.STRETCH)
     verify(reactShadowNode).setJustifyContent(YogaJustify.FLEX_START)
     verify(reactShadowNode).setPositionType(YogaPositionType.RELATIVE)
   }

   @Test
   fun testSettingDefaultStyleValues() {
     val pixelUtil = mockStatic(PixelUtil::class.java)
     pixelUtil
       .`when`<Float> { PixelUtil.toPixelFromDIP(anyFloat()) }
       .thenAnswer {
         return@thenAnswer it.arguments[0]
       }
     val nodesSize = 7
     val nodes = Array(nodesSize) {
       val node = LayoutShadowNode()
       node.setDefaultPadding(START, 15.0f)
       node.setDefaultPadding(TOP, 25.0f)
       node.setDefaultPadding(END, 35.0f)
       node.setDefaultPadding(BOTTOM, 45.0f)
       node
     }

     val mapNodes =  Array(nodesSize) {
        when (it) {
          0 -> buildStyles("paddingLeft", 10.0f, "paddingHorizontal", 5.0)
          1 -> buildStyles("padding", 10.0f, "paddingTop", 5.0)
          2 -> buildStyles("paddingLeft", 10.0f, "paddingVertical", 5.0)
          3 -> buildStyles("paddingBottom", 10.0f, "paddingHorizontal", 5.0)
          4 -> buildStyles("padding", null, "paddingTop", 5.0)
          5 -> buildStyles("paddingRight", 10.0f, "paddingHorizontal", null, "paddingVertical", 7.0)
          6 -> buildStyles("margin", 5.0)
          else -> {
            null
          }
        }
     }

     for (i in 0..nodesSize) {
       nodes[i].updateProperties(mapNodes[i])
     }

     assertEquals(10.0f, nodes[0].getPadding(START), .0001f)
     assertEquals(25.0f, nodes[0].getPadding(TOP), .0001f)
     assertEquals(5.0f, nodes[0].getPadding(END), .0001f)
     assertEquals(45.0f, nodes[0].getPadding(BOTTOM), .0001f)

     assertEquals(10.0f, nodes[1].getPadding(START), .0001f)
     assertEquals(5.0f, nodes[1].getPadding(TOP), .0001f)
     assertEquals(10.0f, nodes[1].getPadding(END), .0001f)
     assertEquals(10.0f, nodes[1].getPadding(BOTTOM), .0001f)

     assertEquals(10.0f, nodes[2].getPadding(START), .0001f)
     assertEquals(5.0f, nodes[2].getPadding(TOP), .0001f)
     assertEquals(35.0f, nodes[2].getPadding(END), .0001f)
     assertEquals(5.0f, nodes[2].getPadding(BOTTOM), .0001f)

     assertEquals(5.0f, nodes[3].getPadding(START), .0001f)
     assertEquals(25.0f, nodes[3].getPadding(TOP), .0001f)
     assertEquals(5.0f, nodes[3].getPadding(END), .0001f)
     assertEquals(10.0f, nodes[3].getPadding(BOTTOM), .0001f)

     assertEquals(15.0f, nodes[4].getPadding(START), .0001f)
     assertEquals(5.0f, nodes[4].getPadding(TOP), .0001f)
     assertEquals(35.0f, nodes[4].getPadding(END), .0001f)
     assertEquals(45.0f, nodes[4].getPadding(BOTTOM), .0001f)

     assertEquals(15.0f, nodes[5].getPadding(START), .0001f)
     assertEquals(7.0f, nodes[5].getPadding(TOP), .0001f)
     assertEquals(10.0f, nodes[5].getPadding(END), .0001f)
     assertEquals(7.0f, nodes[5].getPadding(BOTTOM), .0001f)

     assertEquals(15.0f, nodes[6].getPadding(START), .0001f)
     assertEquals(25.0f, nodes[6].getPadding(TOP), .0001f)
     assertEquals(35.0f, nodes[6].getPadding(END), .0001f)
     assertEquals(45.0f, nodes[6].getPadding(BOTTOM), .0001f)
   }
}
