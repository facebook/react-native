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
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyInt;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
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

  /**
   * Creates a following graph of nodes:
   * Value(1, firstValue) ----> Add(3) ---> Style(4) ---> Props(5) ---> View(viewTag)
   *                         |
   * Value(2, secondValue) --+
   *
   * Add(3) node maps to a "translateX" attribute of the Style(4) node.
   */
  private void createAnimatedGraphWithAdditionNode(
      int viewTag,
      double firstValue,
      double secondValue) {
    mNativeAnimatedNodesManager.createAnimatedNode(
      1,
      JavaOnlyMap.of("type", "value", "value", 100d));
    mNativeAnimatedNodesManager.createAnimatedNode(
      2,
      JavaOnlyMap.of("type", "value", "value", 1000d));

    mNativeAnimatedNodesManager.createAnimatedNode(
      3,
      JavaOnlyMap.of("type", "addition", "input", JavaOnlyArray.of(1, 2)));

    mNativeAnimatedNodesManager.createAnimatedNode(
      4,
      JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("translateX", 3)));
    mNativeAnimatedNodesManager.createAnimatedNode(
      5,
      JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 4)));
    mNativeAnimatedNodesManager.connectAnimatedNodes(1, 3);
    mNativeAnimatedNodesManager.connectAnimatedNodes(2, 3);
    mNativeAnimatedNodesManager.connectAnimatedNodes(3, 4);
    mNativeAnimatedNodesManager.connectAnimatedNodes(4, 5);
    mNativeAnimatedNodesManager.connectAnimatedNodeToView(5, 50);
  }

  @Test
  public void testAdditionNode() {
    createAnimatedGraphWithAdditionNode(50, 100d, 1000d);

    Callback animationCallback = mock(Callback.class);
    JavaOnlyArray frames = JavaOnlyArray.of(0d, 1d);
    mNativeAnimatedNodesManager.startAnimatingNode(
      1,
      1,
      JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 101d),
      animationCallback);

    mNativeAnimatedNodesManager.startAnimatingNode(
      2,
      2,
      JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1010d),
      animationCallback);

    ArgumentCaptor<ReactStylesDiffMap> stylesCaptor =
      ArgumentCaptor.forClass(ReactStylesDiffMap.class);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIImplementationMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX", Double.NaN)).isEqualTo(1100d);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIImplementationMock)
      .synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX", Double.NaN)).isEqualTo(1100d);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIImplementationMock)
      .synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX", Double.NaN)).isEqualTo(1111d);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIImplementationMock);
  }

  /**
   * Verifies that {@link NativeAnimatedNodesManager#runUpdates} updates the view correctly in case
   * when one of the addition input nodes has started animating while the other one has not.
   *
   * We expect that the output of the addition node will take the starting value of the second input
   * node even though the node hasn't been connected to an active animation driver.
   */
  @Test
  public void testViewReceiveUpdatesIfOneOfAnimationHasntStarted() {
    createAnimatedGraphWithAdditionNode(50, 100d, 1000d);

    // Start animating only the first addition input node
    Callback animationCallback = mock(Callback.class);
    JavaOnlyArray frames = JavaOnlyArray.of(0d, 1d);
    mNativeAnimatedNodesManager.startAnimatingNode(
      1,
      1,
      JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 101d),
      animationCallback);

    ArgumentCaptor<ReactStylesDiffMap> stylesCaptor =
      ArgumentCaptor.forClass(ReactStylesDiffMap.class);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIImplementationMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX", Double.NaN)).isEqualTo(1100d);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIImplementationMock)
      .synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX", Double.NaN)).isEqualTo(1100d);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIImplementationMock)
      .synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX", Double.NaN)).isEqualTo(1101d);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIImplementationMock);
  }

  /**
   * Verifies that {@link NativeAnimatedNodesManager#runUpdates} updates the view correctly in case
   * when one of the addition input nodes animation finishes before the other.
   *
   * We expect that the output of the addition node after one of the animation has finished will
   * take the last value of the animated node and the view will receive updates up until the second
   * animation is over.
   */
  @Test
  public void testViewReceiveUpdatesWhenOneOfAnimationHasFinished() {
    createAnimatedGraphWithAdditionNode(50, 100d, 1000d);

    Callback animationCallback = mock(Callback.class);

    // Start animating for the first addition input node, will have 2 frames only
    JavaOnlyArray firstFrames = JavaOnlyArray.of(0d, 1d);
    mNativeAnimatedNodesManager.startAnimatingNode(
      1,
      1,
      JavaOnlyMap.of("type", "frames", "frames", firstFrames, "toValue", 200d),
      animationCallback);

    // Start animating for the first addition input node, will have 6 frames
    JavaOnlyArray secondFrames = JavaOnlyArray.of(0d, 0.2d, 0.4d, 0.6d, 0.8d, 1d);
    mNativeAnimatedNodesManager.startAnimatingNode(
      2,
      2,
      JavaOnlyMap.of("type", "frames", "frames", secondFrames, "toValue", 1010d),
      animationCallback);

    ArgumentCaptor<ReactStylesDiffMap> stylesCaptor =
      ArgumentCaptor.forClass(ReactStylesDiffMap.class);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIImplementationMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX", Double.NaN)).isEqualTo(1100d);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIImplementationMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX", Double.NaN)).isEqualTo(1100d);

    for (int i = 1; i < secondFrames.size(); i++) {
      reset(mUIImplementationMock);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      verify(mUIImplementationMock)
        .synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
      assertThat(stylesCaptor.getValue().getDouble("translateX", Double.NaN))
        .isEqualTo(1200d + secondFrames.getDouble(i) * 10d);
    }

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIImplementationMock);
  }

  @Test
  public void testMultiplicationNode() {
    mNativeAnimatedNodesManager.createAnimatedNode(
      1,
      JavaOnlyMap.of("type", "value", "value", 1d));
    mNativeAnimatedNodesManager.createAnimatedNode(
      2,
      JavaOnlyMap.of("type", "value", "value", 5d));

    mNativeAnimatedNodesManager.createAnimatedNode(
      3,
      JavaOnlyMap.of("type", "multiplication", "input", JavaOnlyArray.of(1, 2)));

    mNativeAnimatedNodesManager.createAnimatedNode(
      4,
      JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("translateX", 3)));
    mNativeAnimatedNodesManager.createAnimatedNode(
      5,
      JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 4)));
    mNativeAnimatedNodesManager.connectAnimatedNodes(1, 3);
    mNativeAnimatedNodesManager.connectAnimatedNodes(2, 3);
    mNativeAnimatedNodesManager.connectAnimatedNodes(3, 4);
    mNativeAnimatedNodesManager.connectAnimatedNodes(4, 5);
    mNativeAnimatedNodesManager.connectAnimatedNodeToView(5, 50);

    Callback animationCallback = mock(Callback.class);
    JavaOnlyArray frames = JavaOnlyArray.of(0d, 1d);
    mNativeAnimatedNodesManager.startAnimatingNode(
      1,
      1,
      JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 2d),
      animationCallback);

    mNativeAnimatedNodesManager.startAnimatingNode(
      2,
      2,
      JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 10d),
      animationCallback);

    ArgumentCaptor<ReactStylesDiffMap> stylesCaptor =
      ArgumentCaptor.forClass(ReactStylesDiffMap.class);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIImplementationMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX", Double.NaN)).isEqualTo(5d);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIImplementationMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX", Double.NaN)).isEqualTo(5d);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIImplementationMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX", Double.NaN)).isEqualTo(20d);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIImplementationMock);
  }

  /**
   * This test verifies that when {@link NativeAnimatedModule#stopAnimation} is called the animation
   * will no longer be updating the nodes it has been previously attached to and that the animation
   * callback will be triggered with {@code {finished: false}}
   */
  @Test
  public void testHandleStoppingAnimation() {
    createSimpleAnimatedViewWithOpacity(1000, 0d);

    JavaOnlyArray frames = JavaOnlyArray.of(0d, 0.2d, 0.4d, 0.6d, 0.8d, 1.0d);
    Callback animationCallback = mock(Callback.class);
    mNativeAnimatedNodesManager.startAnimatingNode(
      404,
      1,
      JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1d),
      animationCallback);

    ArgumentCaptor<ReadableMap> callbackResponseCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(animationCallback);
    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIImplementationMock, times(2))
      .synchronouslyUpdateViewOnUIThread(anyInt(), any(ReactStylesDiffMap.class));
    verifyNoMoreInteractions(animationCallback);

    reset(animationCallback);
    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.stopAnimation(404);
    verify(animationCallback).invoke(callbackResponseCaptor.capture());
    verifyNoMoreInteractions(animationCallback);
    verifyNoMoreInteractions(mUIImplementationMock);

    assertThat(callbackResponseCaptor.getValue().hasKey("finished")).isTrue();
    assertThat(callbackResponseCaptor.getValue().getBoolean("finished")).isFalse();

    reset(animationCallback);
    reset(mUIImplementationMock);
    // Run "update" loop a few more times -> we expect no further updates nor callback calls to be
    // triggered
    for (int i = 0; i < 5; i++) {
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    }

    verifyNoMoreInteractions(mUIImplementationMock);
    verifyNoMoreInteractions(animationCallback);
  }

  @Test
  public void testInterpolationNode() {
    mNativeAnimatedNodesManager.createAnimatedNode(
      1,
      JavaOnlyMap.of("type", "value", "value", 10d));

    mNativeAnimatedNodesManager.createAnimatedNode(
      2,
      JavaOnlyMap.of(
        "type",
        "interpolation",
        "inputRange",
        JavaOnlyArray.of(10d, 20d),
        "outputRange",
        JavaOnlyArray.of(0d, 1d)));

    mNativeAnimatedNodesManager.createAnimatedNode(
      3,
      JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("opacity", 2)));
    mNativeAnimatedNodesManager.createAnimatedNode(
      4,
      JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 3)));
    mNativeAnimatedNodesManager.connectAnimatedNodes(1, 2);
    mNativeAnimatedNodesManager.connectAnimatedNodes(2, 3);
    mNativeAnimatedNodesManager.connectAnimatedNodes(3, 4);
    mNativeAnimatedNodesManager.connectAnimatedNodeToView(4, 50);

    Callback animationCallback = mock(Callback.class);
    JavaOnlyArray frames = JavaOnlyArray.of(0d, 0.2d, 0.4d, 0.6d, 0.8d, 1d);
    mNativeAnimatedNodesManager.startAnimatingNode(
      1,
      1,
      JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 20d),
      animationCallback);

    ArgumentCaptor<ReactStylesDiffMap> stylesCaptor =
      ArgumentCaptor.forClass(ReactStylesDiffMap.class);

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIImplementationMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("opacity", Double.NaN)).isEqualTo(0d);

    for (int i = 0; i < frames.size(); i++) {
      reset(mUIImplementationMock);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      verify(mUIImplementationMock)
        .synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
      assertThat(stylesCaptor.getValue().getDouble("opacity", Double.NaN))
        .isEqualTo(frames.getDouble(i));
    }

    reset(mUIImplementationMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIImplementationMock);
  }
}
