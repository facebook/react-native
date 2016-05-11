/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.UIImplementation;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

/**
 * Tests the animated nodes graph traversal algorithm from {@link NativeAnimatedNodesManager}.
 */
@PrepareForTest({Arguments.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class NativeAnimatedNodeTraversalTest {

  private static long FRAME_LEN_NANOS = 1000000000L / 60L;
  private static long INITIAL_FRAME_TIME_NANOS = 14599233201256L; /* random */

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  private long mFrameTimeNanos;
  private UIImplementation mUIImplementationMock;
  private NativeAnimatedNodesManager mNativeAnimatedNodesManager;

  private long nextFrameTime() {
    return mFrameTimeNanos += FRAME_LEN_NANOS;
  }

  @Before
  public void setUp() {
    PowerMockito.mockStatic(Arguments.class);
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

    mFrameTimeNanos = INITIAL_FRAME_TIME_NANOS;
    mUIImplementationMock = mock(UIImplementation.class);
    mNativeAnimatedNodesManager = new NativeAnimatedNodesManager(mUIImplementationMock);
  }

  /**
   * Generates a simple animated nodes graph and attaches the props node to a given {@param viewTag}
   * Parameter {@param opacity} is used as a initial value for the "opacity" attribute.
   *
   * Nodes are connected as follows (nodes IDs in parens):
   * ValueNode(1) -> StyleNode(2) -> PropNode(3)
   */
  private void createSimpleAnimatedViewWithOpacity(int viewTag, double opacity) {
    mNativeAnimatedNodesManager.createAnimatedNode(
      1,
      JavaOnlyMap.of("type", "value", "value", opacity));
    mNativeAnimatedNodesManager.createAnimatedNode(
      2,
      JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("opacity", 1)));
    mNativeAnimatedNodesManager.createAnimatedNode(
      3,
      JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 2)));
    mNativeAnimatedNodesManager.connectAnimatedNodes(1, 2);
    mNativeAnimatedNodesManager.connectAnimatedNodes(2, 3);
    mNativeAnimatedNodesManager.connectAnimatedNodeToView(3, viewTag);
  }

  @Test
  public void testFramesAnimation() {
    createSimpleAnimatedViewWithOpacity(1000, 0d);

    JavaOnlyArray frames = JavaOnlyArray.of(0d, 0.2d, 0.4d, 0.6d, 0.8d, 1d);
    Callback animationCallback = mock(Callback.class);
    mNativeAnimatedNodesManager.startAnimatingNode(
      1,
      JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1d),
      animationCallback);

    ArgumentCaptor<ReactStylesDiffMap> stylesCaptor =
        ArgumentCaptor.forClass(ReactStylesDiffMap.class);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIImplementationMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("opacity", Double.NaN)).isEqualTo(0);

    for (int i = 0; i < frames.size(); i++) {
      reset(mUIImplementationMock);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      verify(mUIImplementationMock)
          .synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
      assertThat(stylesCaptor.getValue().getDouble("opacity", Double.NaN))
          .isEqualTo(frames.getDouble(i));
    }

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIImplementationMock);
  }

  @Test
  public void testAnimationCallbackFinish() {
    createSimpleAnimatedViewWithOpacity(1000, 0d);

    JavaOnlyArray frames = JavaOnlyArray.of(0d, 1d);
    Callback animationCallback = mock(Callback.class);
    mNativeAnimatedNodesManager.startAnimatingNode(
      1,
      JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1d),
      animationCallback);

    ArgumentCaptor<ReadableMap> callbackResponseCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(animationCallback);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(animationCallback);

    reset(animationCallback);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(animationCallback).invoke(callbackResponseCaptor.capture());

    assertThat(callbackResponseCaptor.getValue().hasKey("finished")).isTrue();
    assertThat(callbackResponseCaptor.getValue().getBoolean("finished")).isTrue();

    reset(animationCallback);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(animationCallback);
  }
}
