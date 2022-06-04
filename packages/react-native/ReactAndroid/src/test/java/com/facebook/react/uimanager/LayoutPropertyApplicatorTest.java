/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import static junit.framework.Assert.assertEquals;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyFloat;
import static org.mockito.Matchers.anyInt;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.powermock.api.mockito.PowerMockito.mockStatic;

import android.util.DisplayMetrics;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.yoga.YogaAlign;
import com.facebook.yoga.YogaConstants;
import com.facebook.yoga.YogaFlexDirection;
import com.facebook.yoga.YogaJustify;
import com.facebook.yoga.YogaPositionType;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

@PrepareForTest({PixelUtil.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class LayoutPropertyApplicatorTest {

  @Rule public PowerMockRule rule = new PowerMockRule();

  @Before
  public void setup() {
    DisplayMetricsHolder.setWindowDisplayMetrics(new DisplayMetrics());
    DisplayMetricsHolder.setScreenDisplayMetrics(new DisplayMetrics());
  }

  @After
  public void teardown() {
    DisplayMetricsHolder.setWindowDisplayMetrics(null);
    DisplayMetricsHolder.setScreenDisplayMetrics(null);
  }

  public ReactStylesDiffMap buildStyles(Object... keysAndValues) {
    return new ReactStylesDiffMap(JavaOnlyMap.of(keysAndValues));
  }

  @Test
  public void testDimensions() {
    LayoutShadowNode reactShadowNode = spy(new LayoutShadowNode());
    ReactStylesDiffMap map =
        spy(buildStyles("width", 10.0, "height", 10.0, "left", 10.0, "top", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setStyleWidth(anyFloat());
    verify(map).getFloat(eq("width"), anyFloat());
    verify(reactShadowNode).setStyleHeight(anyFloat());
    verify(map).getFloat(eq("height"), anyFloat());
    verify(reactShadowNode).setPosition(eq(Spacing.START), anyFloat());
    verify(map).getFloat(eq("left"), anyFloat());
    verify(reactShadowNode).setPosition(eq(Spacing.TOP), anyFloat());
    verify(map).getFloat(eq("top"), anyFloat());

    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles());

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode, never()).setStyleWidth(anyFloat());
    verify(map, never()).getFloat(eq("width"), anyFloat());
    verify(reactShadowNode, never()).setStyleHeight(anyFloat());
    verify(map, never()).getFloat(eq("height"), anyFloat());
    verify(reactShadowNode, never()).setPosition(eq(Spacing.START), anyFloat());
    verify(map, never()).getFloat(eq("left"), anyFloat());
    verify(reactShadowNode, never()).setPosition(eq(Spacing.TOP), anyFloat());
    verify(map, never()).getFloat(eq("top"), anyFloat());
  }

  @Test
  public void testFlex() {
    LayoutShadowNode reactShadowNode = spy(new LayoutShadowNode());
    ReactStylesDiffMap map = spy(buildStyles("flex", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setFlex(anyFloat());
    verify(map).getFloat("flex", 0.f);

    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles());

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode, never()).setFlex(anyFloat());
    verify(map, never()).getFloat("flex", 0.f);
  }

  @Test
  public void testPosition() {
    LayoutShadowNode reactShadowNode = spy(new LayoutShadowNode());
    ReactStylesDiffMap map = spy(buildStyles("position", "absolute", "bottom", 10.0, "right", 5.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPosition(eq(Spacing.BOTTOM), anyFloat());
    verify(reactShadowNode).setPosition(eq(Spacing.END), anyFloat());
    verify(reactShadowNode).setPositionType(any(YogaPositionType.class));
    verify(map).getFloat("bottom", Float.NaN);
    verify(map).getFloat("right", Float.NaN);

    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles());

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode, never()).setPosition(eq(Spacing.BOTTOM), anyFloat());
    verify(reactShadowNode, never()).setPosition(eq(Spacing.END), anyFloat());
    verify(reactShadowNode, never()).setPositionType(any(YogaPositionType.class));
    verify(map, never()).getFloat("bottom", Float.NaN);
    verify(map, never()).getFloat("right", Float.NaN);
  }

  @Test
  public void testMargin() {
    // margin
    LayoutShadowNode reactShadowNode = spy(new LayoutShadowNode());
    ReactStylesDiffMap map = spy(buildStyles("margin", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setMargin(eq(Spacing.ALL), anyFloat());
    verify(map).getFloat("margin", YogaConstants.UNDEFINED);

    // marginVertical
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("marginVertical", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setMargin(eq(Spacing.VERTICAL), anyFloat());
    verify(map).getFloat("marginVertical", YogaConstants.UNDEFINED);

    // marginHorizontal
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("marginHorizontal", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setMargin(eq(Spacing.HORIZONTAL), anyFloat());
    verify(map).getFloat("marginHorizontal", YogaConstants.UNDEFINED);

    // marginTop
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("marginTop", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setMargin(eq(Spacing.TOP), anyFloat());
    verify(map).getFloat("marginTop", YogaConstants.UNDEFINED);

    // marginBottom
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("marginBottom", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setMargin(eq(Spacing.BOTTOM), anyFloat());
    verify(map).getFloat("marginBottom", YogaConstants.UNDEFINED);

    // marginLeft
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("marginLeft", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setMargin(eq(Spacing.START), anyFloat());
    verify(map).getFloat("marginLeft", YogaConstants.UNDEFINED);

    // marginRight
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("marginRight", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setMargin(eq(Spacing.END), anyFloat());
    verify(map).getFloat("marginRight", YogaConstants.UNDEFINED);

    // no margin
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles());

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode, never()).setMargin(anyInt(), anyFloat());
    verify(map, never()).getFloat("margin", YogaConstants.UNDEFINED);
  }

  @Test
  public void testPadding() {
    // padding
    LayoutShadowNode reactShadowNode = spy(new LayoutShadowNode());
    ReactStylesDiffMap map = spy(buildStyles("padding", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPadding(eq(Spacing.ALL), anyFloat());
    verify(map).getFloat("padding", YogaConstants.UNDEFINED);

    // paddingVertical
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("paddingVertical", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPadding(eq(Spacing.VERTICAL), anyFloat());
    verify(map).getFloat("paddingVertical", YogaConstants.UNDEFINED);

    // paddingHorizontal
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("paddingHorizontal", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPadding(eq(Spacing.HORIZONTAL), anyFloat());
    verify(map).getFloat("paddingHorizontal", YogaConstants.UNDEFINED);

    // paddingTop
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("paddingTop", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPadding(eq(Spacing.TOP), anyFloat());
    verify(map).getFloat("paddingTop", YogaConstants.UNDEFINED);

    // paddingBottom
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("paddingBottom", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPadding(eq(Spacing.BOTTOM), anyFloat());
    verify(map).getFloat("paddingBottom", YogaConstants.UNDEFINED);

    // paddingLeft
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("paddingLeft", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPadding(eq(Spacing.START), anyFloat());
    verify(map).getFloat("paddingLeft", YogaConstants.UNDEFINED);

    // paddingRight
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("paddingRight", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPadding(eq(Spacing.END), anyFloat());
    verify(map).getFloat("paddingRight", YogaConstants.UNDEFINED);

    // no padding
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles());

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode, never()).setPadding(anyInt(), anyFloat());
    verify(map, never()).getFloat("padding", YogaConstants.UNDEFINED);
  }

  @Test
  public void testEnumerations() {
    LayoutShadowNode reactShadowNode = spy(new LayoutShadowNode());
    ReactStylesDiffMap map =
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
            "relative");

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setFlexDirection(YogaFlexDirection.COLUMN);
    verify(reactShadowNode).setAlignSelf(YogaAlign.STRETCH);
    verify(reactShadowNode).setAlignItems(YogaAlign.CENTER);
    verify(reactShadowNode).setJustifyContent(YogaJustify.SPACE_BETWEEN);
    verify(reactShadowNode).setPositionType(YogaPositionType.RELATIVE);

    reactShadowNode = spy(new LayoutShadowNode());
    map = buildStyles();
    reactShadowNode.updateProperties(map);

    verify(reactShadowNode, never()).setFlexDirection(any(YogaFlexDirection.class));
    verify(reactShadowNode, never()).setAlignSelf(any(YogaAlign.class));
    verify(reactShadowNode, never()).setAlignItems(any(YogaAlign.class));
    verify(reactShadowNode, never()).setJustifyContent(any(YogaJustify.class));
    verify(reactShadowNode, never()).setPositionType(any(YogaPositionType.class));
  }

  @Test
  public void testPropertiesResetToDefault() {
    DisplayMetrics displayMetrics = new DisplayMetrics();
    displayMetrics.density = 1.0f;
    DisplayMetricsHolder.setWindowDisplayMetrics(displayMetrics);

    LayoutShadowNode reactShadowNode = spy(new LayoutShadowNode());
    ReactStylesDiffMap map =
        buildStyles(
            "width",
            10.0,
            "height",
            10.0,
            "left",
            10.0,
            "top",
            10.0,
            "flex",
            1.0,
            "padding",
            10.0,
            "marginLeft",
            10.0,
            "borderTopWidth",
            10.0,
            "flexDirection",
            "row",
            "alignSelf",
            "stretch",
            "alignItems",
            "center",
            "justifyContent",
            "space_between",
            "position",
            "absolute");

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setStyleWidth(10.f);
    verify(reactShadowNode).setStyleHeight(10.f);
    verify(reactShadowNode).setPosition(Spacing.START, 10.f);
    verify(reactShadowNode).setPosition(Spacing.TOP, 10.f);
    verify(reactShadowNode).setFlex(1.0f);
    verify(reactShadowNode).setPadding(Spacing.ALL, 10.f);
    verify(reactShadowNode).setMargin(Spacing.START, 10.f);
    verify(reactShadowNode).setBorder(Spacing.TOP, 10.f);
    verify(reactShadowNode).setFlexDirection(YogaFlexDirection.ROW);
    verify(reactShadowNode).setAlignSelf(YogaAlign.STRETCH);
    verify(reactShadowNode).setAlignItems(YogaAlign.CENTER);
    verify(reactShadowNode).setJustifyContent(YogaJustify.SPACE_BETWEEN);
    verify(reactShadowNode).setPositionType(YogaPositionType.ABSOLUTE);

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
            null);

    reset(reactShadowNode);
    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setStyleWidth(YogaConstants.UNDEFINED);
    verify(reactShadowNode).setStyleHeight(YogaConstants.UNDEFINED);
    verify(reactShadowNode).setPosition(Spacing.START, YogaConstants.UNDEFINED);
    verify(reactShadowNode).setPosition(Spacing.TOP, YogaConstants.UNDEFINED);
    verify(reactShadowNode).setFlex(0.f);
    verify(reactShadowNode).setPadding(Spacing.ALL, YogaConstants.UNDEFINED);
    verify(reactShadowNode).setMargin(Spacing.START, YogaConstants.UNDEFINED);
    verify(reactShadowNode).setBorder(Spacing.TOP, YogaConstants.UNDEFINED);
    verify(reactShadowNode).setFlexDirection(YogaFlexDirection.COLUMN);
    verify(reactShadowNode).setAlignSelf(YogaAlign.AUTO);
    verify(reactShadowNode).setAlignItems(YogaAlign.STRETCH);
    verify(reactShadowNode).setJustifyContent(YogaJustify.FLEX_START);
    verify(reactShadowNode).setPositionType(YogaPositionType.RELATIVE);
  }

  @Test
  public void testSettingDefaultStyleValues() {
    mockStatic(PixelUtil.class);
    when(PixelUtil.toPixelFromDIP(anyFloat()))
        .thenAnswer(
            new Answer() {
              @Override
              public Float answer(InvocationOnMock invocation) throws Throwable {
                Object[] args = invocation.getArguments();
                return (Float) args[0];
              }
            });

    LayoutShadowNode[] nodes = new LayoutShadowNode[7];
    for (int idx = 0; idx < nodes.length; idx++) {
      nodes[idx] = new LayoutShadowNode();
      nodes[idx].setDefaultPadding(Spacing.START, 15);
      nodes[idx].setDefaultPadding(Spacing.TOP, 25);
      nodes[idx].setDefaultPadding(Spacing.END, 35);
      nodes[idx].setDefaultPadding(Spacing.BOTTOM, 45);
    }

    ReactStylesDiffMap[] mapNodes = new ReactStylesDiffMap[7];
    mapNodes[0] = buildStyles("paddingLeft", 10.0, "paddingHorizontal", 5.0);
    mapNodes[1] = buildStyles("padding", 10.0, "paddingTop", 5.0);
    mapNodes[2] = buildStyles("paddingLeft", 10.0, "paddingVertical", 5.0);
    mapNodes[3] = buildStyles("paddingBottom", 10.0, "paddingHorizontal", 5.0);
    mapNodes[4] = buildStyles("padding", null, "paddingTop", 5.0);
    mapNodes[5] =
        buildStyles("paddingRight", 10.0, "paddingHorizontal", null, "paddingVertical", 7.0);
    mapNodes[6] = buildStyles("margin", 5.0);

    for (int idx = 0; idx < nodes.length; idx++) {
      nodes[idx].updateProperties(mapNodes[idx]);
    }

    assertEquals(10.0, nodes[0].getPadding(Spacing.START), .0001);
    assertEquals(25.0, nodes[0].getPadding(Spacing.TOP), .0001);
    assertEquals(5.0, nodes[0].getPadding(Spacing.END), .0001);
    assertEquals(45.0, nodes[0].getPadding(Spacing.BOTTOM), .0001);

    assertEquals(10.0, nodes[1].getPadding(Spacing.START), .0001);
    assertEquals(5.0, nodes[1].getPadding(Spacing.TOP), .0001);
    assertEquals(10.0, nodes[1].getPadding(Spacing.END), .0001);
    assertEquals(10.0, nodes[1].getPadding(Spacing.BOTTOM), .0001);

    assertEquals(10.0, nodes[2].getPadding(Spacing.START), .0001);
    assertEquals(5.0, nodes[2].getPadding(Spacing.TOP), .0001);
    assertEquals(35.0, nodes[2].getPadding(Spacing.END), .0001);
    assertEquals(5.0, nodes[2].getPadding(Spacing.BOTTOM), .0001);

    assertEquals(5.0, nodes[3].getPadding(Spacing.START), .0001);
    assertEquals(25.0, nodes[3].getPadding(Spacing.TOP), .0001);
    assertEquals(5.0, nodes[3].getPadding(Spacing.END), .0001);
    assertEquals(10.0, nodes[3].getPadding(Spacing.BOTTOM), .0001);

    assertEquals(15.0, nodes[4].getPadding(Spacing.START), .0001);
    assertEquals(5.0, nodes[4].getPadding(Spacing.TOP), .0001);
    assertEquals(35.0, nodes[4].getPadding(Spacing.END), .0001);
    assertEquals(45.0, nodes[4].getPadding(Spacing.BOTTOM), .0001);

    assertEquals(15.0, nodes[5].getPadding(Spacing.START), .0001);
    assertEquals(7.0, nodes[5].getPadding(Spacing.TOP), .0001);
    assertEquals(10.0, nodes[5].getPadding(Spacing.END), .0001);
    assertEquals(7.0, nodes[5].getPadding(Spacing.BOTTOM), .0001);

    assertEquals(15.0, nodes[6].getPadding(Spacing.START), .0001);
    assertEquals(25.0, nodes[6].getPadding(Spacing.TOP), .0001);
    assertEquals(35.0, nodes[6].getPadding(Spacing.END), .0001);
    assertEquals(45.0, nodes[6].getPadding(Spacing.BOTTOM), .0001);
  }
}
