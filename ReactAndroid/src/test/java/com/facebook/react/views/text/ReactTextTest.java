/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import android.annotation.TargetApi;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.text.Spanned;
import android.text.TextUtils;
import android.text.style.AbsoluteSizeSpan;
import android.text.style.StrikethroughSpan;
import android.text.style.UnderlineSpan;
import android.view.Choreographer;
import android.widget.TextView;

import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.uimanager.ReactChoreographer;
import com.facebook.react.uimanager.UIImplementation;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewProps;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;

/**
 * Tests for {@link UIManagerModule} specifically for React Text/RawText.
 */
@PrepareForTest({Arguments.class, ReactChoreographer.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class ReactTextTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  private ArrayList<Choreographer.FrameCallback> mPendingChoreographerCallbacks;

  @Before
  public void setUp() {
    PowerMockito.mockStatic(Arguments.class, ReactChoreographer.class);

    ReactChoreographer choreographerMock = mock(ReactChoreographer.class);
    PowerMockito.when(Arguments.createMap()).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        return new JavaOnlyMap();
      }
    });
    PowerMockito.when(ReactChoreographer.getInstance()).thenReturn(choreographerMock);

    mPendingChoreographerCallbacks = new ArrayList<>();
    doAnswer(new Answer() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        mPendingChoreographerCallbacks
            .add((Choreographer.FrameCallback) invocation.getArguments()[1]);
        return null;
      }
    }).when(choreographerMock).postFrameCallback(
        any(ReactChoreographer.CallbackType.class),
        any(Choreographer.FrameCallback.class));
  }

  @Test
  public void testFontSizeApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.FONT_SIZE, 21.0),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    AbsoluteSizeSpan sizeSpan = getSingleSpan(
        (TextView) rootView.getChildAt(0), AbsoluteSizeSpan.class);
    assertThat(sizeSpan.getSize()).isEqualTo(21);
  }

  @Test
  public void testBoldFontApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.FONT_WEIGHT, "bold"),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    CustomStyleSpan customStyleSpan =
        getSingleSpan((TextView)rootView.getChildAt(0), CustomStyleSpan.class);
    assertThat(customStyleSpan.getWeight() & Typeface.BOLD).isNotZero();
    assertThat(customStyleSpan.getStyle() & Typeface.ITALIC).isZero();
  }

  @Test
  public void testNumericBoldFontApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.FONT_WEIGHT, "500"),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    CustomStyleSpan customStyleSpan =
        getSingleSpan((TextView) rootView.getChildAt(0), CustomStyleSpan.class);
    assertThat(customStyleSpan.getWeight() & Typeface.BOLD).isNotZero();
    assertThat(customStyleSpan.getStyle() & Typeface.ITALIC).isZero();
  }

  @Test
  public void testItalicFontApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.FONT_STYLE, "italic"),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    CustomStyleSpan customStyleSpan =
        getSingleSpan((TextView) rootView.getChildAt(0), CustomStyleSpan.class);
    assertThat(customStyleSpan.getStyle() & Typeface.ITALIC).isNotZero();
    assertThat(customStyleSpan.getWeight() & Typeface.BOLD).isZero();
  }

  @Test
  public void testBoldItalicFontApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.FONT_WEIGHT, "bold", ViewProps.FONT_STYLE, "italic"),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    CustomStyleSpan customStyleSpan =
        getSingleSpan((TextView) rootView.getChildAt(0), CustomStyleSpan.class);
    assertThat(customStyleSpan.getStyle() & Typeface.ITALIC).isNotZero();
    assertThat(customStyleSpan.getWeight() & Typeface.BOLD).isNotZero();
  }

  @Test
  public void testNormalFontWeightApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.FONT_WEIGHT, "normal"),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    CustomStyleSpan customStyleSpan =
        getSingleSpan((TextView) rootView.getChildAt(0), CustomStyleSpan.class);
    assertThat(customStyleSpan.getWeight() & Typeface.BOLD).isZero();
  }

  @Test
  public void testNumericNormalFontWeightApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.FONT_WEIGHT, "200"),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    CustomStyleSpan customStyleSpan =
        getSingleSpan((TextView) rootView.getChildAt(0), CustomStyleSpan.class);
    assertThat(customStyleSpan.getWeight() & Typeface.BOLD).isZero();
  }

  @Test
  public void testNormalFontStyleApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.FONT_STYLE, "normal"),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    CustomStyleSpan customStyleSpan =
        getSingleSpan((TextView) rootView.getChildAt(0), CustomStyleSpan.class);
    assertThat(customStyleSpan.getStyle() & Typeface.ITALIC).isZero();
  }

  @Test
  public void testFontFamilyStyleApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.FONT_FAMILY, "sans-serif"),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    CustomStyleSpan customStyleSpan =
        getSingleSpan((TextView) rootView.getChildAt(0), CustomStyleSpan.class);
    assertThat(customStyleSpan.getFontFamily()).isEqualTo("sans-serif");
    assertThat(customStyleSpan.getStyle() & Typeface.ITALIC).isZero();
    assertThat(customStyleSpan.getWeight() & Typeface.BOLD).isZero();
  }

  @Test
  public void testFontFamilyBoldStyleApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.FONT_FAMILY, "sans-serif", ViewProps.FONT_WEIGHT, "bold"),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    CustomStyleSpan customStyleSpan =
        getSingleSpan((TextView) rootView.getChildAt(0), CustomStyleSpan.class);
    assertThat(customStyleSpan.getFontFamily()).isEqualTo("sans-serif");
    assertThat(customStyleSpan.getStyle() & Typeface.ITALIC).isZero();
    assertThat(customStyleSpan.getWeight() & Typeface.BOLD).isNotZero();
  }

  @Test
  public void testFontFamilyItalicStyleApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.FONT_FAMILY, "sans-serif", ViewProps.FONT_STYLE, "italic"),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    CustomStyleSpan customStyleSpan =
        getSingleSpan((TextView) rootView.getChildAt(0), CustomStyleSpan.class);
    assertThat(customStyleSpan.getFontFamily()).isEqualTo("sans-serif");
    assertThat(customStyleSpan.getStyle() & Typeface.ITALIC).isNotZero();
    assertThat(customStyleSpan.getWeight() & Typeface.BOLD).isZero();
  }

  @Test
  public void testFontFamilyBoldItalicStyleApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(
            ViewProps.FONT_FAMILY, "sans-serif",
            ViewProps.FONT_WEIGHT, "500",
            ViewProps.FONT_STYLE, "italic"),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    CustomStyleSpan customStyleSpan =
        getSingleSpan((TextView) rootView.getChildAt(0), CustomStyleSpan.class);
    assertThat(customStyleSpan.getFontFamily()).isEqualTo("sans-serif");
    assertThat(customStyleSpan.getStyle() & Typeface.ITALIC).isNotZero();
    assertThat(customStyleSpan.getWeight() & Typeface.BOLD).isNotZero();
  }

  @Test
  public void testTextDecorationLineUnderlineApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.TEXT_DECORATION_LINE, "underline"),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    TextView textView = (TextView) rootView.getChildAt(0);
    Spanned text = (Spanned) textView.getText();
    UnderlineSpan underlineSpan = getSingleSpan(textView, UnderlineSpan.class);
    StrikethroughSpan[] strikeThroughSpans =
        text.getSpans(0, text.length(), StrikethroughSpan.class);
    assertThat(underlineSpan instanceof UnderlineSpan).isTrue();
    assertThat(strikeThroughSpans).hasSize(0);
  }

  @Test
  public void testTextDecorationLineLineThroughApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.TEXT_DECORATION_LINE, "line-through"),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    TextView textView = (TextView) rootView.getChildAt(0);
    Spanned text = (Spanned) textView.getText();
    UnderlineSpan[] underlineSpans =
        text.getSpans(0, text.length(), UnderlineSpan.class);
    StrikethroughSpan strikeThroughSpan =
        getSingleSpan(textView, StrikethroughSpan.class);
    assertThat(underlineSpans).hasSize(0);
    assertThat(strikeThroughSpan instanceof StrikethroughSpan).isTrue();
  }

  @Test
  public void testTextDecorationLineUnderlineLineThroughApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.TEXT_DECORATION_LINE, "underline line-through"),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    UnderlineSpan underlineSpan =
        getSingleSpan((TextView) rootView.getChildAt(0), UnderlineSpan.class);
    StrikethroughSpan strikeThroughSpan =
        getSingleSpan((TextView) rootView.getChildAt(0), StrikethroughSpan.class);
    assertThat(underlineSpan instanceof UnderlineSpan).isTrue();
    assertThat(strikeThroughSpan instanceof StrikethroughSpan).isTrue();
  }

  @Test
  public void testBackgroundColorStyleApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.BACKGROUND_COLOR, Color.BLUE),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    Drawable backgroundDrawable = ((TextView) rootView.getChildAt(0)).getBackground();
    assertThat(((ColorDrawable) backgroundDrawable).getColor()).isEqualTo(Color.BLUE);
  }

  // JELLY_BEAN is needed for TextView#getMaxLines(), which is OK, because in the actual code we
  // only use TextView#setMaxLines() which exists since API Level 1.
  @TargetApi(Build.VERSION_CODES.JELLY_BEAN)
  @Test
  public void testMaxLinesApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = createText(
        uiManager,
        JavaOnlyMap.of(ViewProps.NUMBER_OF_LINES, 2),
        JavaOnlyMap.of(ReactTextShadowNode.PROP_TEXT, "test text"));

    TextView textView = (TextView) rootView.getChildAt(0);
    assertThat(textView.getText().toString()).isEqualTo("test text");
    assertThat(textView.getMaxLines()).isEqualTo(2);
    assertThat(textView.getEllipsize()).isEqualTo(TextUtils.TruncateAt.END);
  }

  /**
   * Make sure TextView has exactly one span and that span has given type.
   */
  private static <TSPAN> TSPAN getSingleSpan(TextView textView, Class<TSPAN> spanClass) {
    Spanned text = (Spanned) textView.getText();
    TSPAN[] spans = text.getSpans(0, text.length(), spanClass);
    assertThat(spans).hasSize(1);
    return spans[0];
  }

  private ReactRootView createText(
      UIManagerModule uiManager,
      JavaOnlyMap textProps,
      JavaOnlyMap rawTextProps) {
    ReactRootView rootView = new ReactRootView(RuntimeEnvironment.application);
    int rootTag = uiManager.addMeasuredRootView(rootView);
    int textTag = rootTag + 1;
    int rawTextTag = textTag + 1;

    uiManager.createView(
        textTag,
        ReactTextViewManager.REACT_CLASS,
        rootTag,
        textProps);
    uiManager.createView(
        rawTextTag,
        ReactRawTextManager.REACT_CLASS,
        rootTag,
        rawTextProps);

    uiManager.manageChildren(
        textTag,
        null,
        null,
        JavaOnlyArray.of(rawTextTag),
        JavaOnlyArray.of(0),
        null);

    uiManager.manageChildren(
        rootTag,
        null,
        null,
        JavaOnlyArray.of(textTag),
        JavaOnlyArray.of(0),
        null);

    uiManager.onBatchComplete();
    executePendingChoreographerCallbacks();
    return rootView;
  }

  private void executePendingChoreographerCallbacks() {
    ArrayList<Choreographer.FrameCallback> callbacks =
        new ArrayList<>(mPendingChoreographerCallbacks);
    mPendingChoreographerCallbacks.clear();
    for (Choreographer.FrameCallback frameCallback : callbacks) {
      frameCallback.doFrame(0);
    }
  }

  public UIManagerModule getUIManagerModule() {
    ReactApplicationContext reactContext = ReactTestHelper.createCatalystContextForTest();
    List<ViewManager> viewManagers = Arrays.asList(
        new ViewManager[] {
            new ReactTextViewManager(),
            new ReactRawTextManager(),
        });
    UIManagerModule uiManagerModule = new UIManagerModule(
        reactContext,
        viewManagers,
        new UIImplementation(reactContext, viewManagers));
    uiManagerModule.onHostResume();
    return uiManagerModule;
  }
}
