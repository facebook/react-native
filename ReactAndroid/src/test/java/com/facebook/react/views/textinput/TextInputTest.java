/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;

import android.widget.EditText;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.modules.core.ChoreographerCompat;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewProps;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
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

/**
 * Tests for TextInput.
 */
@PrepareForTest({Arguments.class, ReactChoreographer.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class TextInputTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  private ArrayList<ChoreographerCompat.FrameCallback> mPendingChoreographerCallbacks;

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
            .add((ChoreographerCompat.FrameCallback) invocation.getArguments()[1]);
        return null;
      }
    }).when(choreographerMock).postFrameCallback(
        any(ReactChoreographer.CallbackType.class),
        any(ChoreographerCompat.FrameCallback.class));
  }

  @Test
  public void testPropsApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = new ReactRootView(RuntimeEnvironment.application);
    rootView.setLayoutParams(new ReactRootView.LayoutParams(100, 100));
    int rootTag = uiManager.addRootView(rootView);
    int textInputTag = rootTag + 1;
    final String hintStr = "placeholder text";

    uiManager.createView(
        textInputTag,
        ReactTextInputManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of(
            ViewProps.FONT_SIZE, 13.37, ViewProps.HEIGHT, 20.0, "placeholder", hintStr));

    uiManager.manageChildren(
        rootTag,
        null,
        null,
        JavaOnlyArray.of(textInputTag),
        JavaOnlyArray.of(0),
        null);

    uiManager.onBatchComplete();
    executePendingChoreographerCallbacks();

    EditText editText = (EditText) rootView.getChildAt(0);
    assertThat(editText.getHint()).isEqualTo(hintStr);
    assertThat(editText.getTextSize()).isEqualTo((float) Math.ceil(13.37));
    assertThat(editText.getHeight()).isEqualTo(20);
  }

  @Test
  public void testPropsUpdate() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = new ReactRootView(RuntimeEnvironment.application);
    rootView.setLayoutParams(new ReactRootView.LayoutParams(100, 100));
    int rootTag = uiManager.addRootView(rootView);
    int textInputTag = rootTag + 1;
    final String hintStr = "placeholder text";

    uiManager.createView(
        textInputTag,
        ReactTextInputManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of(
            ViewProps.FONT_SIZE, 13.37, ViewProps.HEIGHT, 20.0, "placeholder", hintStr));

    uiManager.manageChildren(
        rootTag,
        null,
        null,
        JavaOnlyArray.of(textInputTag),
        JavaOnlyArray.of(0),
        null);
    uiManager.onBatchComplete();
    executePendingChoreographerCallbacks();

    EditText editText = (EditText) rootView.getChildAt(0);
    assertThat(editText.getHint()).isEqualTo(hintStr);
    assertThat(editText.getTextSize()).isEqualTo((float) Math.ceil(13.37));
    assertThat(editText.getHeight()).isEqualTo(20);

    final String hintStr2 = "such hint";
    uiManager.updateView(
        textInputTag,
        ReactTextInputManager.REACT_CLASS,
        JavaOnlyMap.of(
            ViewProps.FONT_SIZE, 26.74, ViewProps.HEIGHT, 40.0, "placeholder", hintStr2));

    uiManager.onBatchComplete();
    executePendingChoreographerCallbacks();

    EditText updatedEditText = (EditText) rootView.getChildAt(0);
    assertThat(updatedEditText.getHint()).isEqualTo(hintStr2);
    assertThat(updatedEditText.getTextSize()).isEqualTo((float) Math.ceil(26.74f));
    assertThat(updatedEditText.getHeight()).isEqualTo(40);
  }

  private void executePendingChoreographerCallbacks() {
    ArrayList<ChoreographerCompat.FrameCallback> callbacks =
        new ArrayList<>(mPendingChoreographerCallbacks);
    mPendingChoreographerCallbacks.clear();
    for (ChoreographerCompat.FrameCallback frameCallback : callbacks) {
      frameCallback.doFrame(0);
    }
  }

  public UIManagerModule getUIManagerModule() {
    ReactApplicationContext reactContext = ReactTestHelper.createCatalystContextForTest();
    List<ViewManager> viewManagers = Arrays.asList(
        new ViewManager[] {
            new ReactTextInputManager(),
        });
    UIManagerModule uiManagerModule =
        new UIManagerModule(reactContext, viewManagers, 0);
    uiManagerModule.onHostResume();
    return uiManagerModule;
  }
}
