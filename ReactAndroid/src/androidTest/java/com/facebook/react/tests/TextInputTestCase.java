/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests;

import java.util.List;
import java.util.concurrent.FutureTask;
import java.util.concurrent.Callable;
import java.io.File;
import java.io.FileOutputStream;

import android.graphics.Color;
import android.text.style.ForegroundColorSpan;
import android.util.TypedValue;
import android.util.Base64;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.content.Context;
import android.content.ClipboardManager;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.provider.MediaStore;
import android.net.Uri;

import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.testing.StringRecordingModule;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.views.textinput.ReactEditText;

/**
 * Test to verify that TextInput renders correctly
 */
public class TextInputTestCase extends ReactAppInstrumentationTestCase {

  private final StringRecordingModule mRecordingModule = new StringRecordingModule();

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

  public void testOnSubmitEditing() throws Throwable {
    String testId = "onSubmitTextInput";
    ReactEditText reactEditText = getViewByTestId(testId);

    fireEditorActionAndCheckRecording(reactEditText, EditorInfo.IME_ACTION_GO);
    fireEditorActionAndCheckRecording(reactEditText, EditorInfo.IME_ACTION_DONE);
    fireEditorActionAndCheckRecording(reactEditText, EditorInfo.IME_ACTION_NEXT);
    fireEditorActionAndCheckRecording(reactEditText, EditorInfo.IME_ACTION_PREVIOUS);
    fireEditorActionAndCheckRecording(reactEditText, EditorInfo.IME_ACTION_SEARCH);
    fireEditorActionAndCheckRecording(reactEditText, EditorInfo.IME_ACTION_SEND);
    fireEditorActionAndCheckRecording(reactEditText, EditorInfo.IME_ACTION_UNSPECIFIED);
    fireEditorActionAndCheckRecording(reactEditText, EditorInfo.IME_ACTION_NONE);
  }

  public void testOnPasteText() throws Throwable {
    String testId = "onPasteTextInput";
    final ReactEditText reactEditText = getViewByTestId(testId);

    final String label = "Test Label";
    final String content = "Test Content";
    String mimeType = "text/plain";

    mRecordingModule.reset();

    runTestOnUiThread(
      new Runnable() {
        @Override
        public void run() {
          ClipboardManager clipboard = (ClipboardManager) reactEditText.getContext().getSystemService(Context.CLIPBOARD_SERVICE); 
          ClipData clip = ClipData.newPlainText(label, content);
          clipboard.setPrimaryClip(clip);

          reactEditText.onTextContextMenuItem(android.R.id.paste);
        }
      });
    waitForBridgeAndUIIdle();

    List<String> calls = mRecordingModule.getCalls();
    assertEquals(2, calls.size());
    assertEquals(content, calls.get(0));
    assertEquals(mimeType, calls.get(1));
  }

  public void testOnPasteImage() throws Throwable {
    String testId = "onPasteTextInput";
    final ReactEditText reactEditText = getViewByTestId(testId);

    String mimeType = "image/png";

    mRecordingModule.reset();

    FutureTask<Uri> pasteImage = new FutureTask<Uri>(new Callable<Uri>() {
      @Override
      public Uri call() throws Exception {
        Uri imageUri = createImageAndAddToClipboard(reactEditText.getContext());
        reactEditText.onTextContextMenuItem(android.R.id.paste);

        return imageUri;
      }
    });

    runTestOnUiThread(pasteImage);
    waitForBridgeAndUIIdle();

    List<String> calls = mRecordingModule.getCalls();
    assertEquals(2, calls.size());
    assertEquals(pasteImage.get().toString(), calls.get(0));
    assertEquals(mimeType, calls.get(1));
}

  private void fireEditorActionAndCheckRecording(final ReactEditText reactEditText,
                                                 final int actionId) throws Throwable {
    fireEditorActionAndCheckRecording(reactEditText, actionId, true);
    fireEditorActionAndCheckRecording(reactEditText, actionId, false);
  }

  private void fireEditorActionAndCheckRecording(final ReactEditText reactEditText,
                                                 final int actionId,
                                                 final boolean blurOnSubmit) throws Throwable {
    mRecordingModule.reset();

    runTestOnUiThread(
      new Runnable() {
        @Override
        public void run() {
          reactEditText.requestFocusFromJS();
          reactEditText.setBlurOnSubmit(blurOnSubmit);
          reactEditText.onEditorAction(actionId);
        }
      });
    waitForBridgeAndUIIdle();

    assertEquals(1, mRecordingModule.getCalls().size());
    assertEquals(!blurOnSubmit, reactEditText.isFocused());
  }

  private Uri createImageAndAddToClipboard(Context context) throws Exception {
    final String base64Image =
      "iVBORw0KGgoAAAANSUhEUgAAADMAAAAzCAYAAAA6oTAqAAAAEXRFWHRTb2Z0d2FyZQBwbmdjcnVzaEB1S" +
      "fMAAABQSURBVGje7dSxCQBACARB+2/ab8BEeQNhFi6WSYzYLYudDQYGBgYGBgYGBgYGBgYGBgZmcvDqYG" +
      "BgmhivGQYGBgYGBgYGBgYGBgYGBgbmQw+P/eMrC5UTVAAAAABJRU5ErkJggg==";

    File file = new File(context.getExternalFilesDir(null), System.currentTimeMillis() + "_image.png");
    FileOutputStream fileOut = new FileOutputStream(file);
    byte[] decodedString = Base64.decode(base64Image, Base64.DEFAULT);
    fileOut.write(decodedString);
    fileOut.flush();
    fileOut.close();

    ContentValues values = new ContentValues(2);
    values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
    values.put(MediaStore.Images.Media.DATA, file.getAbsolutePath());
    ContentResolver resolver = context.getContentResolver();
    Uri imageUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);

    ClipboardManager clipboard = (ClipboardManager) context.getSystemService(Context.CLIPBOARD_SERVICE);
    ClipData imageClip = ClipData.newUri(resolver, "image", imageUri);
    clipboard.setPrimaryClip(imageClip);

    return imageUri;
  }

  /**
   * Test that the mentions input has colors displayed correctly.
   * Removed for being flaky in open source, December 2016
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
  */

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    return super.createReactInstanceSpecForTest()
        .addNativeModule(mRecordingModule);
  }

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "TextInputTestApp";
  }
}
