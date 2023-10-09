/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;

import android.view.Choreographer;
import android.widget.EditText;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewProps;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.MockedStatic;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

/** Tests for TextInput. */
@RunWith(RobolectricTestRunner.class)
@Ignore // TODO T110934492
public class TextInputTest {

  private ArrayList<Choreographer.FrameCallback> mPendingChoreographerCallbacks;

  private MockedStatic<Arguments> arguments;
  private MockedStatic<ReactChoreographer> reactCoreographer;

  @Before
  public void setUp() {
    arguments = mockStatic(Arguments.class);
    arguments.when(Arguments::createMap).thenAnswer(invocation -> new JavaOnlyMap());

    reactCoreographer = mockStatic(ReactChoreographer.class);
    ReactChoreographer choreographerMock = mock(ReactChoreographer.class);
    reactCoreographer
        .when(ReactChoreographer::getInstance)
        .thenAnswer(invocation -> choreographerMock);

    mPendingChoreographerCallbacks = new ArrayList<>();
    doAnswer(
            invocation -> {
              mPendingChoreographerCallbacks.add(
                  (Choreographer.FrameCallback) invocation.getArguments()[1]);
              return null;
            })
        .when(choreographerMock)
        .postFrameCallback(
            any(ReactChoreographer.CallbackType.class), any(Choreographer.FrameCallback.class));
  }

  @Test
  public void testPropsApplied() {
    UIManagerModule uiManager = getUIManagerModule();

    ReactRootView rootView = new ReactRootView(RuntimeEnvironment.getApplication());
    rootView.setLayoutParams(new ReactRootView.LayoutParams(100, 100));
    int rootTag = uiManager.addRootView(rootView);
    int textInputTag = rootTag + 1;
    final String hintStr = "placeholder text";

    uiManager.createView(
        textInputTag,
        ReactTextInputManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of(ViewProps.FONT_SIZE, 13.37, ViewProps.HEIGHT, 20.0, "placeholder", hintStr));

    uiManager.manageChildren(
        rootTag, null, null, JavaOnlyArray.of(textInputTag), JavaOnlyArray.of(0), null);

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

    ReactRootView rootView = new ReactRootView(RuntimeEnvironment.getApplication());
    rootView.setLayoutParams(new ReactRootView.LayoutParams(100, 100));
    int rootTag = uiManager.addRootView(rootView);
    int textInputTag = rootTag + 1;
    final String hintStr = "placeholder text";

    uiManager.createView(
        textInputTag,
        ReactTextInputManager.REACT_CLASS,
        rootTag,
        JavaOnlyMap.of(ViewProps.FONT_SIZE, 13.37, ViewProps.HEIGHT, 20.0, "placeholder", hintStr));

    uiManager.manageChildren(
        rootTag, null, null, JavaOnlyArray.of(textInputTag), JavaOnlyArray.of(0), null);
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
    ArrayList<Choreographer.FrameCallback> callbacks =
        new ArrayList<>(mPendingChoreographerCallbacks);
    mPendingChoreographerCallbacks.clear();
    for (Choreographer.FrameCallback frameCallback : callbacks) {
      frameCallback.doFrame(0);
    }
  }

  public UIManagerModule getUIManagerModule() {
    ReactApplicationContext reactContext = ReactTestHelper.createCatalystContextForTest();
    List<ViewManager> viewManagers =
        Arrays.asList(
            new ViewManager[] {
              new ReactTextInputManager(),
            });
    UIManagerModule uiManagerModule = new UIManagerModule(reactContext, viewManagers, 0);
    uiManagerModule.onHostResume();
    return uiManagerModule;
  }
}
