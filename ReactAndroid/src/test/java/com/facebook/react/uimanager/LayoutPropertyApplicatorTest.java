/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.util.DisplayMetrics;

import com.facebook.csslayout.CSSAlign;
import com.facebook.csslayout.CSSConstants;
import com.facebook.csslayout.CSSFlexDirection;
import com.facebook.csslayout.CSSJustify;
import com.facebook.csslayout.CSSPositionType;
import com.facebook.csslayout.Spacing;
import com.facebook.react.bridge.SimpleMap;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

import static junit.framework.Assert.assertEquals;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyFloat;
import static org.mockito.Matchers.anyInt;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.powermock.api.mockito.PowerMockito.mockStatic;

@PrepareForTest({PixelUtil.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class LayoutPropertyApplicatorTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

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
    return new ReactStylesDiffMap(SimpleMap.of(keysAndValues));
  }

  @Test
  public void testDimensions() {
    LayoutShadowNode reactShadowNode = spy(new LayoutShadowNode());
    ReactStylesDiffMap map = spy(
        buildStyles(
            "width", 10.0,
            "height", 10.0,
            "left", 10.0,
            "top", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setStyleWidth(anyFloat());
    verify(map).getFloat(eq("width"), anyFloat());
    verify(reactShadowNode).setStyleHeight(anyFloat());
    verify(map).getFloat(eq("height"), anyFloat());
    verify(reactShadowNode).setPositionLeft(anyFloat());
    verify(map).getFloat(eq("left"), anyFloat());
    verify(reactShadowNode).setPositionTop(anyFloat());
    verify(map).getFloat(eq("top"), anyFloat());

    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles());

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode, never()).setStyleWidth(anyFloat());
    verify(map, never()).getFloat(eq("width"), anyFloat());
    verify(reactShadowNode, never()).setStyleHeight(anyFloat());
    verify(map, never()).getFloat(eq("height"), anyFloat());
    verify(reactShadowNode, never()).setPositionLeft(anyFloat());
    verify(map, never()).getFloat(eq("left"), anyFloat());
    verify(reactShadowNode, never()).setPositionTop(anyFloat());
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
    ReactStylesDiffMap map = spy(buildStyles(
            "position", "absolute",
            "bottom", 10.0,
            "right", 5.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPositionBottom(anyFloat());
    verify(reactShadowNode).setPositionRight(anyFloat());
    verify(reactShadowNode).setPositionType(any(CSSPositionType.class));
    verify(map).getFloat("bottom", Float.NaN);
    verify(map).getFloat("right", Float.NaN);

    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles());

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode, never()).setPositionBottom(anyFloat());
    verify(reactShadowNode, never()).setPositionRight(anyFloat());
    verify(reactShadowNode, never()).setPositionType(any(CSSPositionType.class));
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
    verify(map).getFloat("margin", CSSConstants.UNDEFINED);

    // marginVertical
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("marginVertical", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setMargin(eq(Spacing.VERTICAL), anyFloat());
    verify(map).getFloat("marginVertical", CSSConstants.UNDEFINED);

    // marginHorizontal
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("marginHorizontal", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setMargin(eq(Spacing.HORIZONTAL), anyFloat());
    verify(map).getFloat("marginHorizontal", CSSConstants.UNDEFINED);

    // marginTop
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("marginTop", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setMargin(eq(Spacing.TOP), anyFloat());
    verify(map).getFloat("marginTop", CSSConstants.UNDEFINED);

    // marginBottom
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("marginBottom", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setMargin(eq(Spacing.BOTTOM), anyFloat());
    verify(map).getFloat("marginBottom", CSSConstants.UNDEFINED);

    // marginLeft
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("marginLeft", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setMargin(eq(Spacing.LEFT), anyFloat());
    verify(map).getFloat("marginLeft", CSSConstants.UNDEFINED);

    // marginRight
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("marginRight", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setMargin(eq(Spacing.RIGHT), anyFloat());
    verify(map).getFloat("marginRight", CSSConstants.UNDEFINED);

    // no margin
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles());

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode, never()).setMargin(anyInt(), anyFloat());
    verify(map, never()).getFloat("margin", CSSConstants.UNDEFINED);
  }

  @Test
  public void testPadding() {
    // padding
    LayoutShadowNode reactShadowNode = spy(new LayoutShadowNode());
    ReactStylesDiffMap map = spy(buildStyles("padding", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPadding(eq(Spacing.ALL), anyFloat());
    verify(map).getFloat("padding", CSSConstants.UNDEFINED);

    // paddingVertical
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("paddingVertical", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPadding(eq(Spacing.VERTICAL), anyFloat());
    verify(map).getFloat("paddingVertical", CSSConstants.UNDEFINED);

    // paddingHorizontal
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("paddingHorizontal", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPadding(eq(Spacing.HORIZONTAL), anyFloat());
    verify(map).getFloat("paddingHorizontal", CSSConstants.UNDEFINED);

    // paddingTop
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("paddingTop", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPadding(eq(Spacing.TOP), anyFloat());
    verify(map).getFloat("paddingTop", CSSConstants.UNDEFINED);

    // paddingBottom
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("paddingBottom", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPadding(eq(Spacing.BOTTOM), anyFloat());
    verify(map).getFloat("paddingBottom", CSSConstants.UNDEFINED);

    // paddingLeft
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("paddingLeft", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPadding(eq(Spacing.LEFT), anyFloat());
    verify(map).getFloat("paddingLeft", CSSConstants.UNDEFINED);

    // paddingRight
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles("paddingRight", 10.0));

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setPadding(eq(Spacing.RIGHT), anyFloat());
    verify(map).getFloat("paddingRight", CSSConstants.UNDEFINED);

    // no padding
    reactShadowNode = spy(new LayoutShadowNode());
    map = spy(buildStyles());

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode, never()).setPadding(anyInt(), anyFloat());
    verify(map, never()).getFloat("padding", CSSConstants.UNDEFINED);
  }

  @Test
  public void testEnumerations() {
    LayoutShadowNode reactShadowNode = spy(new LayoutShadowNode());
    ReactStylesDiffMap map = buildStyles(
        "flexDirection", "column",
        "alignSelf", "stretch",
        "alignItems", "center",
        "justifyContent", "space_between",
        "position", "relative");

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setFlexDirection(CSSFlexDirection.COLUMN);
    verify(reactShadowNode).setAlignSelf(CSSAlign.STRETCH);
    verify(reactShadowNode).setAlignItems(CSSAlign.CENTER);
    verify(reactShadowNode).setJustifyContent(CSSJustify.SPACE_BETWEEN);
    verify(reactShadowNode).setPositionType(CSSPositionType.RELATIVE);

    reactShadowNode = spy(new LayoutShadowNode());
    map = buildStyles();
    reactShadowNode.updateProperties(map);

    verify(reactShadowNode, never()).setFlexDirection(any(CSSFlexDirection.class));
    verify(reactShadowNode, never()).setAlignSelf(any(CSSAlign.class));
    verify(reactShadowNode, never()).setAlignItems(any(CSSAlign.class));
    verify(reactShadowNode, never()).setJustifyContent(any(CSSJustify.class));
    verify(reactShadowNode, never()).setPositionType(any(CSSPositionType.class));
  }

  @Test
  public void testPropertiesResetToDefault() {
    DisplayMetrics displayMetrics = new DisplayMetrics();
    displayMetrics.density = 1.0f;
    DisplayMetricsHolder.setWindowDisplayMetrics(displayMetrics);

    LayoutShadowNode reactShadowNode = spy(new LayoutShadowNode());
    ReactStylesDiffMap map = buildStyles(
        "width", 10.0,
        "height", 10.0,
        "left", 10.0,
        "top", 10.0,
        "flex", 1.0,
        "padding", 10.0,
        "marginLeft", 10.0,
        "borderTopWidth", 10.0,
        "flexDirection", "row",
        "alignSelf", "stretch",
        "alignItems", "center",
        "justifyContent", "space_between",
        "position", "absolute");

    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setStyleWidth(10.f);
    verify(reactShadowNode).setStyleHeight(10.f);
    verify(reactShadowNode).setPositionLeft(10.f);
    verify(reactShadowNode).setPositionTop(10.f);
    verify(reactShadowNode).setFlex(1.0f);
    verify(reactShadowNode).setPadding(Spacing.ALL, 10.f);
    verify(reactShadowNode).setMargin(Spacing.LEFT, 10.f);
    verify(reactShadowNode).setBorder(Spacing.TOP, 10.f);
    verify(reactShadowNode).setFlexDirection(CSSFlexDirection.ROW);
    verify(reactShadowNode).setAlignSelf(CSSAlign.STRETCH);
    verify(reactShadowNode).setAlignItems(CSSAlign.CENTER);
    verify(reactShadowNode).setJustifyContent(CSSJustify.SPACE_BETWEEN);
    verify(reactShadowNode).setPositionType(CSSPositionType.ABSOLUTE);

    map = buildStyles(
        "width", null,
        "height", null,
        "left", null,
        "top", null,
        "flex", null,
        "padding", null,
        "marginLeft", null,
        "borderTopWidth", null,
        "flexDirection", null,
        "alignSelf", null,
        "alignItems", null,
        "justifyContent", null,
        "position", null);

    reset(reactShadowNode);
    reactShadowNode.updateProperties(map);
    verify(reactShadowNode).setStyleWidth(CSSConstants.UNDEFINED);
    verify(reactShadowNode).setStyleHeight(CSSConstants.UNDEFINED);
    verify(reactShadowNode).setPositionLeft(CSSConstants.UNDEFINED);
    verify(reactShadowNode).setPositionTop(CSSConstants.UNDEFINED);
    verify(reactShadowNode).setFlex(0.f);
    verify(reactShadowNode).setPadding(Spacing.ALL, CSSConstants.UNDEFINED);
    verify(reactShadowNode).setMargin(Spacing.LEFT, CSSConstants.UNDEFINED);
    verify(reactShadowNode).setBorder(Spacing.TOP, CSSConstants.UNDEFINED);
    verify(reactShadowNode).setFlexDirection(CSSFlexDirection.COLUMN);
    verify(reactShadowNode).setAlignSelf(CSSAlign.AUTO);
    verify(reactShadowNode).setAlignItems(CSSAlign.STRETCH);
    verify(reactShadowNode).setJustifyContent(CSSJustify.FLEX_START);
    verify(reactShadowNode).setPositionType(CSSPositionType.RELATIVE);
  }

  @Test
  public void testSettingDefaultStyleValues() {
    mockStatic(PixelUtil.class);
    when(PixelUtil.toPixelFromDIP(anyFloat())).thenAnswer(
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
      nodes[idx].setDefaultPadding(Spacing.LEFT, 15);
      nodes[idx].setDefaultPadding(Spacing.TOP, 25);
      nodes[idx].setDefaultPadding(Spacing.RIGHT, 35);
      nodes[idx].setDefaultPadding(Spacing.BOTTOM, 45);
    }

    ReactStylesDiffMap[] mapNodes = new ReactStylesDiffMap[7];
    mapNodes[0] = buildStyles("paddingLeft", 10.0, "paddingHorizontal", 5.0);
    mapNodes[1] = buildStyles("padding", 10.0, "paddingTop", 5.0);
    mapNodes[2] = buildStyles("paddingLeft", 10.0, "paddingVertical", 5.0);
    mapNodes[3] = buildStyles("paddingBottom", 10.0, "paddingHorizontal", 5.0);
    mapNodes[4] = buildStyles("padding", null, "paddingTop", 5.0);
    mapNodes[5] = buildStyles(
        "paddingRight", 10.0,
        "paddingHorizontal", null,
        "paddingVertical", 7.0);
    mapNodes[6] = buildStyles("margin", 5.0);

    for (int idx = 0; idx < nodes.length; idx++) {
      nodes[idx].updateProperties(mapNodes[idx]);
    }

    assertEquals(10.0, nodes[0].getPadding().get(Spacing.LEFT), .0001);
    assertEquals(25.0, nodes[0].getPadding().get(Spacing.TOP), .0001);
    assertEquals(5.0, nodes[0].getPadding().get(Spacing.RIGHT), .0001);
    assertEquals(45.0, nodes[0].getPadding().get(Spacing.BOTTOM), .0001);

    assertEquals(10.0, nodes[1].getPadding().get(Spacing.LEFT), .0001);
    assertEquals(5.0, nodes[1].getPadding().get(Spacing.TOP), .0001);
    assertEquals(10.0, nodes[1].getPadding().get(Spacing.RIGHT), .0001);
    assertEquals(10.0, nodes[1].getPadding().get(Spacing.BOTTOM), .0001);

    assertEquals(10.0, nodes[2].getPadding().get(Spacing.LEFT), .0001);
    assertEquals(5.0, nodes[2].getPadding().get(Spacing.TOP), .0001);
    assertEquals(35.0, nodes[2].getPadding().get(Spacing.RIGHT), .0001);
    assertEquals(5.0, nodes[2].getPadding().get(Spacing.BOTTOM), .0001);

    assertEquals(5.0, nodes[3].getPadding().get(Spacing.LEFT), .0001);
    assertEquals(25.0, nodes[3].getPadding().get(Spacing.TOP), .0001);
    assertEquals(5.0, nodes[3].getPadding().get(Spacing.RIGHT), .0001);
    assertEquals(10.0, nodes[3].getPadding().get(Spacing.BOTTOM), .0001);

    assertEquals(15.0, nodes[4].getPadding().get(Spacing.LEFT), .0001);
    assertEquals(5.0, nodes[4].getPadding().get(Spacing.TOP), .0001);
    assertEquals(35.0, nodes[4].getPadding().get(Spacing.RIGHT), .0001);
    assertEquals(45.0, nodes[4].getPadding().get(Spacing.BOTTOM), .0001);

    assertEquals(15.0, nodes[5].getPadding().get(Spacing.LEFT), .0001);
    assertEquals(7.0, nodes[5].getPadding().get(Spacing.TOP), .0001);
    assertEquals(10.0, nodes[5].getPadding().get(Spacing.RIGHT), .0001);
    assertEquals(7.0, nodes[5].getPadding().get(Spacing.BOTTOM), .0001);

    assertEquals(15.0, nodes[6].getPadding().get(Spacing.LEFT), .0001);
    assertEquals(25.0, nodes[6].getPadding().get(Spacing.TOP), .0001);
    assertEquals(35.0, nodes[6].getPadding().get(Spacing.RIGHT), .0001);
    assertEquals(45.0, nodes[6].getPadding().get(Spacing.BOTTOM), .0001);
  }
}
