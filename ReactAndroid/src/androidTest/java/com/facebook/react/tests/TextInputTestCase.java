/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.tests;

import android.graphics.Color;
import android.text.style.ForegroundColorSpan;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;

import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.textinput.ReactEditText;
import com.facebook.react.views.textinput.ReactTextChangedEvent;
import com.facebook.react.views.textinput.ReactTextInputEvent;

/**
 * Test to verify that TextInput renders correctly
 */
public class TextInputTestCase extends ReactAppInstrumentationTestCase {

  private interface TextInputTestModule extends JavaScriptModule {
    void setValueRef(String ref, String value);
  }

  /**
   * Test that the actual height of the text input is not dependant on the font size of the text
   * within.
   */
  public void testTextInputMeasurements() {
    View textInputViewHeightSet = getViewByTestId("textInput1");
    EditText textInputViewNoHeight = getViewByTestId("textInput2");

    int expectedHeight = Math.round(PixelUtil.toPixelFromDIP(30));
    assertEquals(expectedHeight, textInputViewHeightSet.getHeight());

    EditText editText = new EditText(textInputViewNoHeight.getContext());
    editText.setTextSize(
        TypedValue.COMPLEX_UNIT_PX,
        (float) Math.ceil(PixelUtil.toPixelFromSP(21.f)));
    editText.setPadding(0, 0, 0, 0);
    int measureSpec = View.MeasureSpec.makeMeasureSpec(
        ViewGroup.LayoutParams.WRAP_CONTENT,
        View.MeasureSpec.UNSPECIFIED);
    editText.measure(measureSpec, measureSpec);

    assertEquals(editText.getMeasuredHeight(), textInputViewNoHeight.getHeight());
  }

  /**
   * Test that the cursor moves to the end of the word.
   */
  public void testTextInputCursorPosition() throws Throwable {
    final EditText textInputWithText = getViewByTestId("textInput3");

    runTestOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            textInputWithText.setSelection(3);
          }
        });
    getReactContext().getJSModule(TextInputTestModule.class)
        .setValueRef("textInput3", "Some other value");
    waitForBridgeAndUIIdle();

    assertEquals(4, textInputWithText.getSelectionStart());
    assertEquals(4, textInputWithText.getSelectionEnd());
  }

  /**
   * Test that the colors are applied to new text
   */
  public void testTextInputColors() throws Throwable {
    String testIDs[] = new String[] {"textInput4", "textInput5", "textInput6"};

    for (String testID : testIDs) {
      getReactContext().getJSModule(TextInputTestModule.class).setValueRef(testID, "NewText");
    }
    waitForBridgeAndUIIdle();

    for (String testID : testIDs) {
      ReactEditText reactEditText = getViewByTestId(testID);
      assertEquals(
          Color.GREEN,
          reactEditText.getText().getSpans(0, 1, ForegroundColorSpan.class)[0]
              .getForegroundColor());
    }
  }

  /**
   * Test that the mentions input has colors displayed correctly.
   */
  public void testMetionsInputColors() throws Throwable {
    EventDispatcher eventDispatcher =
        getReactContext().getNativeModule(UIManagerModule.class).getEventDispatcher();
    ReactEditText reactEditText = getViewByTestId("tokenizedInput");
    String newText = "#Things and more #things";
    int contentWidth = reactEditText.getWidth();
    int contentHeight = reactEditText.getHeight();
    int start = 0;
    int count = newText.length();

    eventDispatcher.dispatchEvent(
        new ReactTextChangedEvent(
            reactEditText.getId(),
            newText.toString(),
            (int) PixelUtil.toDIPFromPixel(contentWidth),
            (int) PixelUtil.toDIPFromPixel(contentHeight),
            reactEditText.incrementAndGetEventCounter()));

    eventDispatcher.dispatchEvent(
        new ReactTextInputEvent(
            reactEditText.getId(),
            newText.toString(),
            "",
            start,
            start + count - 1));
    waitForBridgeAndUIIdle();

    ForegroundColorSpan[] spans = reactEditText
        .getText().getSpans(0, reactEditText.getText().length(), ForegroundColorSpan.class);
    assertEquals(2, spans.length);
    assertEquals(spans[0].getForegroundColor(), spans[1].getForegroundColor());
    assertEquals(0, reactEditText.getText().getSpanStart(spans[1]));
    assertEquals(7, reactEditText.getText().getSpanEnd(spans[1]));
    assertEquals(newText.length() - 7, reactEditText.getText().getSpanStart(spans[0]));
    assertEquals(newText.length(), reactEditText.getText().getSpanEnd(spans[0]));

    String moreText = "andsuch ";
    String previousText = newText;
    newText += moreText;
    count = moreText.length();
    start = previousText.length();

    eventDispatcher.dispatchEvent(
        new ReactTextChangedEvent(
            reactEditText.getId(),
            newText.toString(),
            (int) PixelUtil.toDIPFromPixel(contentWidth),
            (int) PixelUtil.toDIPFromPixel(contentHeight),
            reactEditText.incrementAndGetEventCounter()));

    eventDispatcher.dispatchEvent(
        new ReactTextInputEvent(
            reactEditText.getId(),
            moreText,
            "",
            start,
            start + count - 1));
    waitForBridgeAndUIIdle();

    spans = reactEditText.getText()
        .getSpans(0, reactEditText.getText().length(), ForegroundColorSpan.class);
    assertEquals(2, spans.length);
    assertEquals(spans[0].getForegroundColor(), spans[1].getForegroundColor());
    assertEquals(0, reactEditText.getText().getSpanStart(spans[1]));
    assertEquals(7, reactEditText.getText().getSpanEnd(spans[1]));
    assertEquals(newText.length() - 15, reactEditText.getText().getSpanStart(spans[0]));
    assertEquals(newText.length() - 1, reactEditText.getText().getSpanEnd(spans[0]));

    moreText = "morethings";
    previousText = newText;
    newText += moreText;
    count = moreText.length();
    start = previousText.length();

    eventDispatcher.dispatchEvent(
        new ReactTextChangedEvent(
            reactEditText.getId(),
            newText.toString(),
            (int) PixelUtil.toDIPFromPixel(contentWidth),
            (int) PixelUtil.toDIPFromPixel(contentHeight),
            reactEditText.incrementAndGetEventCounter()));

    eventDispatcher.dispatchEvent(
        new ReactTextInputEvent(
            reactEditText.getId(),
            moreText,
            "",
            start,
            start + count - 1));
    waitForBridgeAndUIIdle();

    spans = reactEditText.getText()
        .getSpans(0, reactEditText.getText().length(), ForegroundColorSpan.class);
    assertEquals(spans[0].getForegroundColor(), spans[1].getForegroundColor());
    assertEquals(2, spans.length);
    assertEquals(0, reactEditText.getText().getSpanStart(spans[1]));
    assertEquals(7, reactEditText.getText().getSpanEnd(spans[1]));
    assertEquals(newText.length() - 25, reactEditText.getText().getSpanStart(spans[0]));
    assertEquals(newText.length() - 11, reactEditText.getText().getSpanEnd(spans[0]));
  }

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    return super.createReactInstanceSpecForTest()
        .addJSModule(TextInputTestModule.class);
  }

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "TextInputTestApp";
  }
}
