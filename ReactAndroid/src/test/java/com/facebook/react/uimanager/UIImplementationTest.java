/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.runner.RunWith;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.modules.core.ChoreographerCompat;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.views.text.ReactRawTextManager;
import com.facebook.react.views.text.ReactRawTextShadowNode;
import com.facebook.react.views.text.ReactTextViewManager;
import com.facebook.react.views.view.ReactViewManager;

import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

/**
 * Tests for {@link UIImplementation}
 */
@PrepareForTest ({Arguments.class, ReactChoreographer.class})
@RunWith (RobolectricTestRunner.class)
@PowerMockIgnore ({"org.mockito.*", "org.robolectric.*", "android.*"})
public class UIImplementationTest {

  /*************************************************************
   * Test Case: FixBug - the children of view should not be
   *            Blank, Number, String, Object(not a Component)
   *************************************************************
   * <View>
   *     123
   *     '456'
   *     <Text>{"setChildren/manageChildren"}</Text>
   * </View>
   *
   *************************************************************
   */
  @Rule
  public ExpectedException mException = ExpectedException.none();

  private ReactApplicationContext mReactContext;
  private CatalystInstance mCatalystInstanceMock;
  private ArrayList<ChoreographerCompat.FrameCallback> mPendingFrameCallbacks;

  @Before
  public void setUp() throws Exception {
    PowerMockito.mockStatic(Arguments.class, ReactChoreographer.class);

    ReactChoreographer choreographerMock = mock(ReactChoreographer.class);
    PowerMockito.when(Arguments.createArray()).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        return new JavaOnlyArray();
      }
    });
    PowerMockito.when(Arguments.createMap()).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        return new JavaOnlyMap();
      }
    });
    PowerMockito.when(ReactChoreographer.getInstance()).thenReturn(choreographerMock);

    mPendingFrameCallbacks = new ArrayList<>();
    doAnswer(new Answer() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        mPendingFrameCallbacks
          .add((ChoreographerCompat.FrameCallback) invocation.getArguments()[1]);
        return null;
      }
    }).when(choreographerMock).postFrameCallback(
      any(ReactChoreographer.CallbackType.class),
      any(ChoreographerCompat.FrameCallback.class));

    mCatalystInstanceMock = ReactTestHelper.createMockCatalystInstance();
    mReactContext = new ReactApplicationContext(RuntimeEnvironment.application);
    mReactContext.initializeWithInstance(mCatalystInstanceMock);

    UIManagerModule uiManagerModuleMock = mock(UIManagerModule.class);
    when(mCatalystInstanceMock.getNativeModule(UIManagerModule.class))
      .thenReturn(uiManagerModuleMock);
  }

  /**
   * execute pending frame callbacks.
   */
  private void executePendingFrameCallbacks() {
    ArrayList<ChoreographerCompat.FrameCallback> callbacks =
      new ArrayList<>(mPendingFrameCallbacks);
    mPendingFrameCallbacks.clear();
    for (ChoreographerCompat.FrameCallback frameCallback : callbacks) {
      frameCallback.doFrame(0);
    }
  }

  /**
   * create view hierarchy
   *
   * @param uiManager
   * @param method
   *
   * @return
   */
  private ViewGroup createSimpleViewHierarchy(UIManagerModule uiManager, Method method)
    throws InvocationTargetException, IllegalAccessException {
    /*************************************************************
     * Test Case: FixBug - the children of view should not be
     *            Blank, Number, String, Object(not a Component)
     *************************************************************
     * <View>
     *     123
     *     '456'
     *     <Text>{"setChildren/manageChildren"}</Text>
     * </View>
     *
     *************************************************************
     */
    ReactRootView rootView =
      new ReactRootView(RuntimeEnvironment.application.getApplicationContext());
    UIImplementation uiImplementation = uiManager.getUIImplementation();
    int rootTag = uiManager.addRootView(rootView);
    int strTag = rootTag + 1;
    int textTag = strTag + 1;
    int rawTextTag = textTag + 1;

    uiImplementation.createView(strTag, ReactRawTextManager.REACT_CLASS, rootTag,
      JavaOnlyMap.of(ReactRawTextShadowNode.PROP_TEXT, "123 '456'"));

    uiImplementation.createView(rawTextTag, ReactRawTextManager.REACT_CLASS, rootTag,
      JavaOnlyMap.of(ReactRawTextShadowNode.PROP_TEXT, "setChildren/manageChildren"));

    uiImplementation.createView(textTag, ReactTextViewManager.REACT_CLASS, rootTag,
      JavaOnlyMap.of("allowFontScaling", true, "ellipsizeMode", "tail", "accessible", true));

    if (method.getName().startsWith("setChildren")) {
      method.invoke(uiImplementation, textTag, JavaOnlyArray.of(rawTextTag));

      method.invoke(uiImplementation, rootTag, JavaOnlyArray.of(strTag, textTag));

    } else if (method.getName().startsWith("manageChildren")) {
      method.invoke(uiImplementation, textTag, null, null,
        JavaOnlyArray.of(rawTextTag), JavaOnlyArray.of(0), null);

      method.invoke(uiImplementation, rootTag, null, null,
        JavaOnlyArray.of(strTag, textTag), JavaOnlyArray.of(0, 1), null);
    }

    uiManager.onBatchComplete();
    executePendingFrameCallbacks();

    return rootView;
  }

  /**
   * get UIManagerModule
   *
   * @return
   */
  private UIManagerModule getUIManagerModule() {
    List<ViewManager> viewManagers = Arrays.<ViewManager>asList(
      new ReactViewManager(),
      new ReactTextViewManager(),
      new ReactRawTextManager());
    UIManagerModule uiManagerModule =
      new UIManagerModule(mReactContext, viewManagers, 0);
    uiManagerModule.onHostResume();
    return uiManagerModule;
  }

  @Test
  public void testManageChildren() throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
    UIManagerModule uiManager = getUIManagerModule();
    UIImplementation uiImplementation = uiManager.getUIImplementation();
    Method method = uiImplementation.getClass().getMethod("manageChildren", int.class, ReadableArray.class,
      ReadableArray.class, ReadableArray.class, ReadableArray.class, ReadableArray.class);
    ViewGroup rootView = createSimpleViewHierarchy(uiManager, method);

    assertThat(rootView.getChildCount()).isEqualTo(1);

    View firstChild = rootView.getChildAt(0);
    assertThat(firstChild).isInstanceOf(TextView.class);
    assertThat(((TextView) firstChild).getText().toString()).isEqualTo("setChildren/manageChildren");
  }

  @Test
  public void testManageChildrenDeprecated()
    throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
    UIManagerModule uiManager = getUIManagerModule();
    UIImplementation uiImplementation = uiManager.getUIImplementation();
    Method method = uiImplementation.getClass().getMethod("manageChildrenDeprecated", int.class,
      ReadableArray.class, ReadableArray.class, ReadableArray.class, ReadableArray.class, ReadableArray.class);
    ViewGroup rootView = createSimpleViewHierarchy(uiManager, method);

    mException.expect(IndexOutOfBoundsException.class);
    mException.expectMessage("index=" + 1 + " count=" + 0);
  }

  @Test
  public void setChildren() throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
    UIManagerModule uiManager = getUIManagerModule();
    UIImplementation uiImplementation = uiManager.getUIImplementation();
    Method method = uiImplementation.getClass().getMethod("setChildren", int.class, ReadableArray.class);
    ViewGroup rootView = createSimpleViewHierarchy(uiManager, method);

    assertThat(rootView.getChildCount()).isEqualTo(1);

    View firstChild = rootView.getChildAt(0);
    assertThat(firstChild).isInstanceOf(TextView.class);
    assertThat(((TextView) firstChild).getText().toString()).isEqualTo("setChildren/manageChildren");
  }

  @Test
  public void setChildrenDeprecated() throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
    UIManagerModule uiManager = getUIManagerModule();
    UIImplementation uiImplementation = uiManager.getUIImplementation();
    Method method = uiImplementation.getClass().getMethod("setChildrenDeprecated", int.class, ReadableArray.class);
    ViewGroup rootView = createSimpleViewHierarchy(uiManager, method);

    mException.expect(IndexOutOfBoundsException.class);
    mException.expectMessage("index=" + 1 + " count=" + 0);
  }
}
