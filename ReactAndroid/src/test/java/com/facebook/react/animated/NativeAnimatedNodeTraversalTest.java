/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyInt;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.atMost;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JSIModuleType;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import java.util.Map;
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

/** Tests the animated nodes graph traversal algorithm from {@link NativeAnimatedNodesManager}. */
@PrepareForTest({Arguments.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class NativeAnimatedNodeTraversalTest {

  private static long FRAME_LEN_NANOS = 1000000000L / 60L;
  private static long INITIAL_FRAME_TIME_NANOS = 14599233201256L; /* random */

  @Rule public PowerMockRule rule = new PowerMockRule();

  private long mFrameTimeNanos;
  private ReactApplicationContext mReactApplicationContextMock;
  private CatalystInstance mCatalystInstanceMock;
  private UIManagerModule mUIManagerMock;
  private EventDispatcher mEventDispatcherMock;
  private NativeAnimatedNodesManager mNativeAnimatedNodesManager;

  private long nextFrameTime() {
    return mFrameTimeNanos += FRAME_LEN_NANOS;
  }

  @Before
  public void setUp() {
    PowerMockito.mockStatic(Arguments.class);
    PowerMockito.when(Arguments.createArray())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return new JavaOnlyArray();
              }
            });
    PowerMockito.when(Arguments.createMap())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return new JavaOnlyMap();
              }
            });

    mFrameTimeNanos = INITIAL_FRAME_TIME_NANOS;

    mReactApplicationContextMock = mock(ReactApplicationContext.class);
    PowerMockito.when(mReactApplicationContextMock.hasActiveReactInstance())
        .thenAnswer(
            new Answer<Boolean>() {
              @Override
              public Boolean answer(InvocationOnMock invocationOnMock) throws Throwable {
                return true;
              }
            });
    PowerMockito.when(mReactApplicationContextMock.hasCatalystInstance())
        .thenAnswer(
            new Answer<Boolean>() {
              @Override
              public Boolean answer(InvocationOnMock invocationOnMock) throws Throwable {
                return true;
              }
            });
    PowerMockito.when(mReactApplicationContextMock.getCatalystInstance())
        .thenAnswer(
            new Answer<CatalystInstance>() {
              @Override
              public CatalystInstance answer(InvocationOnMock invocationOnMock) throws Throwable {
                return mCatalystInstanceMock;
              }
            });
    PowerMockito.when(mReactApplicationContextMock.getNativeModule(any(Class.class)))
        .thenAnswer(
            new Answer<UIManagerModule>() {
              @Override
              public UIManagerModule answer(InvocationOnMock invocationOnMock) throws Throwable {
                return mUIManagerMock;
              }
            });

    mCatalystInstanceMock = mock(CatalystInstance.class);
    PowerMockito.when(mCatalystInstanceMock.getJSIModule(any(JSIModuleType.class)))
        .thenAnswer(
            new Answer<UIManagerModule>() {
              @Override
              public UIManagerModule answer(InvocationOnMock invocationOnMock) throws Throwable {
                return mUIManagerMock;
              }
            });
    PowerMockito.when(mCatalystInstanceMock.getNativeModule(any(Class.class)))
        .thenAnswer(
            new Answer<UIManagerModule>() {
              @Override
              public UIManagerModule answer(InvocationOnMock invocationOnMock) throws Throwable {
                return mUIManagerMock;
              }
            });

    mUIManagerMock = mock(UIManagerModule.class);
    mEventDispatcherMock = mock(EventDispatcher.class);
    PowerMockito.when(mUIManagerMock.getEventDispatcher())
        .thenAnswer(
            new Answer<EventDispatcher>() {
              @Override
              public EventDispatcher answer(InvocationOnMock invocation) throws Throwable {
                return mEventDispatcherMock;
              }
            });
    PowerMockito.when(mUIManagerMock.getConstants())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return MapBuilder.of("customDirectEventTypes", MapBuilder.newHashMap());
              }
            });
    PowerMockito.when(mUIManagerMock.getDirectEventNamesResolver())
        .thenAnswer(
            new Answer<UIManagerModule.CustomEventNamesResolver>() {
              @Override
              public UIManagerModule.CustomEventNamesResolver answer(InvocationOnMock invocation)
                  throws Throwable {
                return new UIManagerModule.CustomEventNamesResolver() {
                  @Override
                  public String resolveCustomEventName(String eventName) {
                    Map<String, Map> directEventTypes =
                        (Map<String, Map>)
                            mUIManagerMock.getConstants().get("customDirectEventTypes");
                    if (directEventTypes != null) {
                      Map<String, String> customEventType =
                          (Map<String, String>) directEventTypes.get(eventName);
                      if (customEventType != null) {
                        return customEventType.get("registrationName");
                      }
                    }
                    return eventName;
                  }
                };
              }
            });
    PowerMockito.when(mUIManagerMock.resolveCustomDirectEventName(any(String.class)))
        .thenAnswer(
            new Answer<String>() {
              @Override
              public String answer(InvocationOnMock invocation) throws Throwable {
                String arg = invocation.getArguments()[0].toString();
                return "on" + arg.substring(3);
              }
            });
    mNativeAnimatedNodesManager = new NativeAnimatedNodesManager(mReactApplicationContextMock);
  }

  /**
   * Generates a simple animated nodes graph and attaches the props node to a given {@param viewTag}
   * Parameter {@param opacity} is used as a initial value for the "opacity" attribute.
   *
   * <p>Nodes are connected as follows (nodes IDs in parens): ValueNode(1) -> StyleNode(2) ->
   * PropNode(3)
   */
  private void createSimpleAnimatedViewWithOpacity(int viewTag, double opacity) {
    mNativeAnimatedNodesManager.createAnimatedNode(
        1, JavaOnlyMap.of("type", "value", "value", opacity, "offset", 0d));
    mNativeAnimatedNodesManager.createAnimatedNode(
        2, JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("opacity", 1)));
    mNativeAnimatedNodesManager.createAnimatedNode(
        3, JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 2)));
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
        1, 1, JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1d), animationCallback);

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    for (int i = 0; i < frames.size(); i++) {
      reset(mUIManagerMock);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
      assertThat(stylesCaptor.getValue().getDouble("opacity")).isEqualTo(frames.getDouble(i));
    }

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIManagerMock);
  }

  @Test
  public void testFramesAnimationLoopsFiveTimes() {
    createSimpleAnimatedViewWithOpacity(1000, 0d);

    JavaOnlyArray frames = JavaOnlyArray.of(0d, 0.2d, 0.4d, 0.6d, 0.8d, 1d);
    Callback animationCallback = mock(Callback.class);
    mNativeAnimatedNodesManager.startAnimatingNode(
        1,
        1,
        JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1d, "iterations", 5),
        animationCallback);

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    for (int iteration = 0; iteration < 5; iteration++) {
      for (int i = 0; i < frames.size(); i++) {
        reset(mUIManagerMock);
        mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
        verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
        assertThat(stylesCaptor.getValue().getDouble("opacity")).isEqualTo(frames.getDouble(i));
      }
    }

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIManagerMock);
  }

  @Test
  public void testNodeValueListenerIfNotListening() {
    int nodeId = 1;

    createSimpleAnimatedViewWithOpacity(1000, 0d);
    JavaOnlyArray frames = JavaOnlyArray.of(0d, 0.2d, 0.4d, 0.6d, 0.8d, 1d);

    Callback animationCallback = mock(Callback.class);
    AnimatedNodeValueListener valueListener = mock(AnimatedNodeValueListener.class);

    mNativeAnimatedNodesManager.startListeningToAnimatedNodeValue(nodeId, valueListener);
    mNativeAnimatedNodesManager.startAnimatingNode(
        1,
        nodeId,
        JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1d),
        animationCallback);

    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(valueListener).onValueUpdate(eq(0d));

    mNativeAnimatedNodesManager.stopListeningToAnimatedNodeValue(nodeId);

    reset(valueListener);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(valueListener);
  }

  @Test
  public void testNodeValueListenerIfListening() {
    int nodeId = 1;

    createSimpleAnimatedViewWithOpacity(1000, 0d);
    JavaOnlyArray frames = JavaOnlyArray.of(0d, 0.2d, 0.4d, 0.6d, 0.8d, 1d);

    Callback animationCallback = mock(Callback.class);
    AnimatedNodeValueListener valueListener = mock(AnimatedNodeValueListener.class);

    mNativeAnimatedNodesManager.startListeningToAnimatedNodeValue(nodeId, valueListener);
    mNativeAnimatedNodesManager.startAnimatingNode(
        1,
        nodeId,
        JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1d),
        animationCallback);

    for (int i = 0; i < frames.size(); i++) {
      reset(valueListener);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      verify(valueListener).onValueUpdate(eq(frames.getDouble(i)));
    }

    reset(valueListener);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(valueListener);
  }

  public void performSpringAnimationTestWithConfig(
      JavaOnlyMap config, boolean testForCriticallyDamped) {
    createSimpleAnimatedViewWithOpacity(1000, 0d);

    Callback animationCallback = mock(Callback.class);
    mNativeAnimatedNodesManager.startAnimatingNode(1, 1, config, animationCallback);

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("opacity")).isEqualTo(0);

    double previousValue = 0d;
    boolean wasGreaterThanOne = false;
    /* run 3 secs of animation */
    for (int i = 0; i < 3 * 60; i++) {
      reset(mUIManagerMock);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      verify(mUIManagerMock, atMost(1))
          .synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
      double currentValue = stylesCaptor.getValue().getDouble("opacity");
      if (currentValue > 1d) {
        wasGreaterThanOne = true;
      }
      // verify that animation step is relatively small
      assertThat(Math.abs(currentValue - previousValue)).isLessThan(0.12d);
      previousValue = currentValue;
    }
    // verify that we've reach the final value at the end of animation
    assertThat(previousValue).isEqualTo(1d);
    // verify that value has reached some maximum value that is greater than the final value
    // (bounce)
    if (testForCriticallyDamped) {
      assertThat(!wasGreaterThanOne);
    } else {
      assertThat(wasGreaterThanOne);
    }
    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIManagerMock);
  }

  @Test
  public void testUnderdampedSpringAnimation() {
    performSpringAnimationTestWithConfig(
        JavaOnlyMap.of(
            "type",
            "spring",
            "stiffness",
            230.2d,
            "damping",
            22d,
            "mass",
            1d,
            "initialVelocity",
            0d,
            "toValue",
            1d,
            "restSpeedThreshold",
            0.001d,
            "restDisplacementThreshold",
            0.001d,
            "overshootClamping",
            false),
        false);
  }

  @Test
  public void testCriticallyDampedSpringAnimation() {
    performSpringAnimationTestWithConfig(
        JavaOnlyMap.of(
            "type",
            "spring",
            "stiffness",
            1000d,
            "damping",
            500d,
            "mass",
            3.0d,
            "initialVelocity",
            0d,
            "toValue",
            1d,
            "restSpeedThreshold",
            0.001d,
            "restDisplacementThreshold",
            0.001d,
            "overshootClamping",
            false),
        true);
  }

  @Test
  public void testSpringAnimationLoopsFiveTimes() {
    createSimpleAnimatedViewWithOpacity(1000, 0d);

    Callback animationCallback = mock(Callback.class);
    mNativeAnimatedNodesManager.startAnimatingNode(
        1,
        1,
        JavaOnlyMap.of(
            "type",
            "spring",
            "stiffness",
            230.2d,
            "damping",
            22d,
            "mass",
            1d,
            "initialVelocity",
            0d,
            "toValue",
            1d,
            "restSpeedThreshold",
            0.001d,
            "restDisplacementThreshold",
            0.001d,
            "overshootClamping",
            false,
            "iterations",
            5),
        animationCallback);

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("opacity")).isEqualTo(0);

    double previousValue = 0d;
    boolean wasGreaterThanOne = false;
    boolean didComeToRest = false;
    int numberOfResets = 0;
    /* run 3 secs of animation, five times */
    for (int i = 0; i < 3 * 60 * 5; i++) {
      reset(mUIManagerMock);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      verify(mUIManagerMock, atMost(1))
          .synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
      double currentValue = stylesCaptor.getValue().getDouble("opacity");
      if (currentValue > 1d) {
        wasGreaterThanOne = true;
      }
      // Test to see if it reset after coming to rest
      if (didComeToRest
          && currentValue == 0d
          && Math.abs(Math.abs(currentValue - previousValue) - 1d) < 0.001d) {
        numberOfResets++;
      }

      // verify that an animation step is relatively small, unless it has come to rest and reset
      if (!didComeToRest) assertThat(Math.abs(currentValue - previousValue)).isLessThan(0.12d);

      // record that the animation did come to rest when it rests on toValue
      didComeToRest =
          Math.abs(currentValue - 1d) < 0.001d && Math.abs(currentValue - previousValue) < 0.001d;
      previousValue = currentValue;
    }
    // verify that we've reach the final value at the end of animation
    assertThat(previousValue).isEqualTo(1d);
    // verify that value has reached some maximum value that is greater than the final value
    // (bounce)
    assertThat(wasGreaterThanOne);
    // verify that value reset 4 times after finishing a full animation
    assertThat(numberOfResets).isEqualTo(4);
    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIManagerMock);
  }

  @Test
  public void testDecayAnimation() {
    createSimpleAnimatedViewWithOpacity(1000, 0d);

    Callback animationCallback = mock(Callback.class);
    mNativeAnimatedNodesManager.startAnimatingNode(
        1,
        1,
        JavaOnlyMap.of("type", "decay", "velocity", 0.5d, "deceleration", 0.998d),
        animationCallback);

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock, atMost(1))
        .synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
    double previousValue = stylesCaptor.getValue().getDouble("opacity");
    double previousDiff = Double.POSITIVE_INFINITY;
    /* run 3 secs of animation */
    for (int i = 0; i < 3 * 60; i++) {
      reset(mUIManagerMock);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      verify(mUIManagerMock, atMost(1))
          .synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
      double currentValue = stylesCaptor.getValue().getDouble("opacity");
      double currentDiff = currentValue - previousValue;
      // verify monotonicity
      // greater *or equal* because the animation stops during these 3 seconds
      assertThat(currentValue).as("on frame " + i).isGreaterThanOrEqualTo(previousValue);
      // verify decay
      if (i > 3) {
        // i > 3 because that's how long it takes to settle previousDiff
        if (i % 3 != 0) {
          // i % 3 != 0 because every 3 frames we go a tiny
          // bit faster, because frame length is 16.(6)ms
          assertThat(currentDiff).as("on frame " + i).isLessThanOrEqualTo(previousDiff);
        } else {
          assertThat(currentDiff).as("on frame " + i).isGreaterThanOrEqualTo(previousDiff);
        }
      }
      previousValue = currentValue;
      previousDiff = currentDiff;
    }
    // should be done in 3s
    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIManagerMock);
  }

  @Test
  public void testDecayAnimationLoopsFiveTimes() {
    createSimpleAnimatedViewWithOpacity(1000, 0d);

    Callback animationCallback = mock(Callback.class);
    mNativeAnimatedNodesManager.startAnimatingNode(
        1,
        1,
        JavaOnlyMap.of("type", "decay", "velocity", 0.5d, "deceleration", 0.998d, "iterations", 5),
        animationCallback);

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock, atMost(1))
        .synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
    double previousValue = stylesCaptor.getValue().getDouble("opacity");
    double previousDiff = Double.POSITIVE_INFINITY;
    double initialValue = stylesCaptor.getValue().getDouble("opacity");
    boolean didComeToRest = false;
    int numberOfResets = 0;
    /* run 3 secs of animation, five times */
    for (int i = 0; i < 3 * 60 * 5; i++) {
      reset(mUIManagerMock);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      verify(mUIManagerMock, atMost(1))
          .synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
      double currentValue = stylesCaptor.getValue().getDouble("opacity");
      double currentDiff = currentValue - previousValue;
      // Test to see if it reset after coming to rest (i.e. dropped back to )
      if (didComeToRest && currentValue == initialValue) {
        numberOfResets++;
      }

      // verify monotonicity, unless it has come to rest and reset
      // greater *or equal* because the animation stops during these 3 seconds
      if (!didComeToRest)
        assertThat(currentValue).as("on frame " + i).isGreaterThanOrEqualTo(previousValue);

      // Test if animation has come to rest using the 0.1 threshold from DecayAnimation.java
      didComeToRest = Math.abs(currentDiff) < 0.1d;
      previousValue = currentValue;
      previousDiff = currentDiff;
    }

    // verify that value reset (looped) 4 times after finishing a full animation
    assertThat(numberOfResets).isEqualTo(4);
    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIManagerMock);
  }

  @Test
  public void testAnimationCallbackFinish() {
    createSimpleAnimatedViewWithOpacity(1000, 0d);

    JavaOnlyArray frames = JavaOnlyArray.of(0d, 1d);
    Callback animationCallback = mock(Callback.class);
    mNativeAnimatedNodesManager.startAnimatingNode(
        1, 1, JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1d), animationCallback);

    ArgumentCaptor<ReadableMap> callbackResponseCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(animationCallback);
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
   * Creates a following graph of nodes: Value(1, firstValue) ----> Add(3) ---> Style(4) --->
   * Props(5) ---> View(viewTag) | Value(2, secondValue) --+
   *
   * <p>Add(3) node maps to a "translateX" attribute of the Style(4) node.
   */
  private void createAnimatedGraphWithAdditionNode(
      int viewTag, double firstValue, double secondValue) {
    mNativeAnimatedNodesManager.createAnimatedNode(
        1, JavaOnlyMap.of("type", "value", "value", firstValue, "offset", 0d));
    mNativeAnimatedNodesManager.createAnimatedNode(
        2, JavaOnlyMap.of("type", "value", "value", secondValue, "offset", 0d));

    mNativeAnimatedNodesManager.createAnimatedNode(
        3, JavaOnlyMap.of("type", "addition", "input", JavaOnlyArray.of(1, 2)));

    mNativeAnimatedNodesManager.createAnimatedNode(
        4, JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("translateX", 3)));
    mNativeAnimatedNodesManager.createAnimatedNode(
        5, JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 4)));
    mNativeAnimatedNodesManager.connectAnimatedNodes(1, 3);
    mNativeAnimatedNodesManager.connectAnimatedNodes(2, 3);
    mNativeAnimatedNodesManager.connectAnimatedNodes(3, 4);
    mNativeAnimatedNodesManager.connectAnimatedNodes(4, 5);
    mNativeAnimatedNodesManager.connectAnimatedNodeToView(5, viewTag);
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

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX")).isEqualTo(1100d);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX")).isEqualTo(1111d);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIManagerMock);
  }

  /**
   * Verifies that {@link NativeAnimatedNodesManager#runUpdates} updates the view correctly in case
   * when one of the addition input nodes has started animating while the other one has not.
   *
   * <p>We expect that the output of the addition node will take the starting value of the second
   * input node even though the node hasn't been connected to an active animation driver.
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

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX")).isEqualTo(1100d);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX")).isEqualTo(1101d);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIManagerMock);
  }

  /**
   * Verifies that {@link NativeAnimatedNodesManager#runUpdates} updates the view correctly in case
   * when one of the addition input nodes animation finishes before the other.
   *
   * <p>We expect that the output of the addition node after one of the animation has finished will
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

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX")).isEqualTo(1100d);

    for (int i = 1; i < secondFrames.size(); i++) {
      reset(mUIManagerMock);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
      assertThat(stylesCaptor.getValue().getDouble("translateX"))
          .isEqualTo(1200d + secondFrames.getDouble(i) * 10d);
    }

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIManagerMock);
  }

  @Test
  public void testMultiplicationNode() {
    mNativeAnimatedNodesManager.createAnimatedNode(
        1, JavaOnlyMap.of("type", "value", "value", 1d, "offset", 0d));
    mNativeAnimatedNodesManager.createAnimatedNode(
        2, JavaOnlyMap.of("type", "value", "value", 5d, "offset", 0d));

    mNativeAnimatedNodesManager.createAnimatedNode(
        3, JavaOnlyMap.of("type", "multiplication", "input", JavaOnlyArray.of(1, 2)));

    mNativeAnimatedNodesManager.createAnimatedNode(
        4, JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("translateX", 3)));
    mNativeAnimatedNodesManager.createAnimatedNode(
        5, JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 4)));
    mNativeAnimatedNodesManager.connectAnimatedNodes(1, 3);
    mNativeAnimatedNodesManager.connectAnimatedNodes(2, 3);
    mNativeAnimatedNodesManager.connectAnimatedNodes(3, 4);
    mNativeAnimatedNodesManager.connectAnimatedNodes(4, 5);
    mNativeAnimatedNodesManager.connectAnimatedNodeToView(5, 50);

    Callback animationCallback = mock(Callback.class);
    JavaOnlyArray frames = JavaOnlyArray.of(0d, 1d);
    mNativeAnimatedNodesManager.startAnimatingNode(
        1, 1, JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 2d), animationCallback);

    mNativeAnimatedNodesManager.startAnimatingNode(
        2,
        2,
        JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 10d),
        animationCallback);

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX")).isEqualTo(5d);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX")).isEqualTo(20d);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIManagerMock);
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
    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock, times(2))
        .synchronouslyUpdateViewOnUIThread(anyInt(), any(ReadableMap.class));
    verifyNoMoreInteractions(animationCallback);

    reset(animationCallback);
    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.stopAnimation(404);
    verify(animationCallback).invoke(callbackResponseCaptor.capture());
    verifyNoMoreInteractions(animationCallback);
    verifyNoMoreInteractions(mUIManagerMock);

    assertThat(callbackResponseCaptor.getValue().hasKey("finished")).isTrue();
    assertThat(callbackResponseCaptor.getValue().getBoolean("finished")).isFalse();

    reset(animationCallback);
    reset(mUIManagerMock);
    // Run "update" loop a few more times -> we expect no further updates nor callback calls to be
    // triggered
    for (int i = 0; i < 5; i++) {
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    }

    verifyNoMoreInteractions(mUIManagerMock);
    verifyNoMoreInteractions(animationCallback);
  }

  @Test
  public void testGetValue() {
    int tag = 1;
    mNativeAnimatedNodesManager.createAnimatedNode(
        tag, JavaOnlyMap.of("type", "value", "value", 1d, "offset", 0d));

    Callback saveValueCallbackMock = mock(Callback.class);

    mNativeAnimatedNodesManager.getValue(tag, saveValueCallbackMock);

    verify(saveValueCallbackMock, times(1)).invoke(1d);
  }

  @Test
  public void testInterpolationNode() {
    mNativeAnimatedNodesManager.createAnimatedNode(
        1, JavaOnlyMap.of("type", "value", "value", 10d, "offset", 0d));

    mNativeAnimatedNodesManager.createAnimatedNode(
        2,
        JavaOnlyMap.of(
            "type",
            "interpolation",
            "inputRange",
            JavaOnlyArray.of(10d, 20d),
            "outputRange",
            JavaOnlyArray.of(0d, 1d),
            "extrapolateLeft",
            "extend",
            "extrapolateRight",
            "extend"));

    mNativeAnimatedNodesManager.createAnimatedNode(
        3, JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("opacity", 2)));
    mNativeAnimatedNodesManager.createAnimatedNode(
        4, JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 3)));
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

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    for (int i = 0; i < frames.size(); i++) {
      reset(mUIManagerMock);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture());
      assertThat(stylesCaptor.getValue().getDouble("opacity")).isEqualTo(frames.getDouble(i));
    }

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIManagerMock);
  }

  private Event createScrollEvent(final int tag, final double value) {
    return new Event(tag) {
      @Override
      public String getEventName() {
        return "topScroll";
      }

      @Override
      public void dispatch(RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(
            tag, "topScroll", JavaOnlyMap.of("contentOffset", JavaOnlyMap.of("y", value)));
      }
    };
  }

  @Test
  public void testNativeAnimatedEventDoUpdate() {
    int viewTag = 1000;

    createSimpleAnimatedViewWithOpacity(viewTag, 0d);

    mNativeAnimatedNodesManager.addAnimatedEventToView(
        viewTag,
        "onScroll",
        JavaOnlyMap.of(
            "animatedValueTag", 1, "nativeEventPath", JavaOnlyArray.of("contentOffset", "y")));

    mNativeAnimatedNodesManager.onEventDispatch(createScrollEvent(viewTag, 10));

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(viewTag), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("opacity")).isEqualTo(10);
  }

  @Test
  public void testNativeAnimatedEventDoNotUpdate() {
    int viewTag = 1000;

    createSimpleAnimatedViewWithOpacity(viewTag, 0d);

    mNativeAnimatedNodesManager.addAnimatedEventToView(
        viewTag,
        "otherEvent",
        JavaOnlyMap.of(
            "animatedValueTag", 1, "nativeEventPath", JavaOnlyArray.of("contentOffset", "y")));

    mNativeAnimatedNodesManager.addAnimatedEventToView(
        999,
        "topScroll",
        JavaOnlyMap.of(
            "animatedValueTag", 1, "nativeEventPath", JavaOnlyArray.of("contentOffset", "y")));

    mNativeAnimatedNodesManager.onEventDispatch(createScrollEvent(viewTag, 10));

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(viewTag), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("opacity")).isEqualTo(0);
  }

  @Test
  public void testNativeAnimatedEventCustomMapping() {
    int viewTag = 1000;

    PowerMockito.when(mUIManagerMock.getConstants())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return MapBuilder.of(
                    "customDirectEventTypes",
                    MapBuilder.of("onScroll", MapBuilder.of("registrationName", "onScroll")));
              }
            });
    mNativeAnimatedNodesManager = new NativeAnimatedNodesManager(mReactApplicationContextMock);

    createSimpleAnimatedViewWithOpacity(viewTag, 0d);

    mNativeAnimatedNodesManager.addAnimatedEventToView(
        viewTag,
        "onScroll",
        JavaOnlyMap.of(
            "animatedValueTag", 1, "nativeEventPath", JavaOnlyArray.of("contentOffset", "y")));

    mNativeAnimatedNodesManager.onEventDispatch(createScrollEvent(viewTag, 10));

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(viewTag), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("opacity")).isEqualTo(10);
  }

  @Test
  public void testRestoreDefaultProps() {
    int viewTag = 1001; // restoreDefaultProps not called in Fabric, make sure it's a non-Fabric tag
    int propsNodeTag = 3;
    mNativeAnimatedNodesManager.createAnimatedNode(
        1, JavaOnlyMap.of("type", "value", "value", 1d, "offset", 0d));
    mNativeAnimatedNodesManager.createAnimatedNode(
        2, JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("opacity", 1)));
    mNativeAnimatedNodesManager.createAnimatedNode(
        propsNodeTag, JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 2)));
    mNativeAnimatedNodesManager.connectAnimatedNodes(1, 2);
    mNativeAnimatedNodesManager.connectAnimatedNodes(2, propsNodeTag);
    mNativeAnimatedNodesManager.connectAnimatedNodeToView(propsNodeTag, viewTag);

    JavaOnlyArray frames = JavaOnlyArray.of(0d, 0.5d, 1d);
    Callback animationCallback = mock(Callback.class);
    mNativeAnimatedNodesManager.startAnimatingNode(
        1, 1, JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 0d), animationCallback);

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    for (int i = 0; i < frames.size(); i++) {
      reset(mUIManagerMock);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    }

    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(viewTag), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("opacity")).isEqualTo(0);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.restoreDefaultValues(propsNodeTag);
    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(viewTag), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().isNull("opacity"));
  }

  /**
   * Creates a following graph of nodes: Value(3, initialValue) ----> Style(4) ---> Props(5) --->
   * View(viewTag)
   *
   * <p>Value(3) is set to track Value(1) via Tracking(2) node with the provided animation config
   */
  private void createAnimatedGraphWithTrackingNode(
      int viewTag, double initialValue, JavaOnlyMap animationConfig) {
    mNativeAnimatedNodesManager.createAnimatedNode(
        1, JavaOnlyMap.of("type", "value", "value", initialValue, "offset", 0d));
    mNativeAnimatedNodesManager.createAnimatedNode(
        3, JavaOnlyMap.of("type", "value", "value", initialValue, "offset", 0d));

    mNativeAnimatedNodesManager.createAnimatedNode(
        2,
        JavaOnlyMap.of(
            "type",
            "tracking",
            "animationId",
            70,
            "value",
            3,
            "toValue",
            1,
            "animationConfig",
            animationConfig));

    mNativeAnimatedNodesManager.createAnimatedNode(
        4, JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("translateX", 3)));
    mNativeAnimatedNodesManager.createAnimatedNode(
        5, JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 4)));
    mNativeAnimatedNodesManager.connectAnimatedNodes(1, 2);
    mNativeAnimatedNodesManager.connectAnimatedNodes(3, 4);
    mNativeAnimatedNodesManager.connectAnimatedNodes(4, 5);
    mNativeAnimatedNodesManager.connectAnimatedNodeToView(5, viewTag);
  }

  /**
   * In this test we verify that when value is being tracked we can update destination value in the
   * middle of ongoing animation and the animation will update and animate to the new spot. This is
   * tested using simple 5 frame backed timing animation.
   */
  @Test
  public void testTracking() {
    JavaOnlyArray frames = JavaOnlyArray.of(0d, 0.25d, 0.5d, 0.75d, 1d);
    JavaOnlyMap animationConfig = JavaOnlyMap.of("type", "frames", "frames", frames);

    createAnimatedGraphWithTrackingNode(1000, 0d, animationConfig);

    ArgumentCaptor<ReadableMap> stylesCaptor = ArgumentCaptor.forClass(ReadableMap.class);

    reset(mUIManagerMock);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
    assertThat(stylesCaptor.getValue().getDouble("translateX")).isEqualTo(0d);

    // update "toValue" to 100, we expect tracking animation to animate now from 0 to 100 in 5 steps
    mNativeAnimatedNodesManager.setAnimatedNodeValue(1, 100d);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime()); // kick off the animation

    for (int i = 0; i < frames.size(); i++) {
      reset(mUIManagerMock);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
      assertThat(stylesCaptor.getValue().getDouble("translateX"))
          .isEqualTo(frames.getDouble(i) * 100d);
    }

    // update "toValue" to 0 but run only two frames from the animation,
    // we expect tracking animation to animate now from 100 to 75
    mNativeAnimatedNodesManager.setAnimatedNodeValue(1, 0d);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime()); // kick off the animation

    for (int i = 0; i < 2; i++) {
      reset(mUIManagerMock);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
      assertThat(stylesCaptor.getValue().getDouble("translateX"))
          .isEqualTo(100d * (1d - frames.getDouble(i)));
    }

    // at this point we expect tracking value to be at 75
    assertThat(((ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(3)).getValue())
        .isEqualTo(75d);

    // we update "toValue" again to 100 and expect the animation to restart from the current place
    mNativeAnimatedNodesManager.setAnimatedNodeValue(1, 100d);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime()); // kick off the animation

    for (int i = 0; i < frames.size(); i++) {
      reset(mUIManagerMock);
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      verify(mUIManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture());
      assertThat(stylesCaptor.getValue().getDouble("translateX"))
          .isEqualTo(50d + 50d * frames.getDouble(i));
    }
  }

  /**
   * In this test we verify that when tracking is set up for a given animated node and when the
   * animation settles it will not be registered as an active animation and therefore will not
   * consume resources on running the animation that has already completed. Then we verify that when
   * the value updates the animation will resume as expected and the complete again when reaches the
   * end.
   */
  @Test
  public void testTrackingPausesWhenEndValueIsReached() {
    JavaOnlyArray frames = JavaOnlyArray.of(0d, 0.5d, 1d);
    JavaOnlyMap animationConfig = JavaOnlyMap.of("type", "frames", "frames", frames);

    createAnimatedGraphWithTrackingNode(1000, 0d, animationConfig);
    mNativeAnimatedNodesManager.setAnimatedNodeValue(1, 100d);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime()); // make sure animation starts

    reset(mUIManagerMock);
    for (int i = 0; i < frames.size(); i++) {
      assertThat(mNativeAnimatedNodesManager.hasActiveAnimations()).isTrue();
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    }
    verify(mUIManagerMock, times(frames.size()))
        .synchronouslyUpdateViewOnUIThread(eq(1000), any(ReadableMap.class));

    // the animation has completed, we expect no updates to be done
    reset(mUIManagerMock);
    assertThat(mNativeAnimatedNodesManager.hasActiveAnimations()).isFalse();
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIManagerMock);

    // we update end value and expect the animation to restart
    mNativeAnimatedNodesManager.setAnimatedNodeValue(1, 200d);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime()); // make sure animation starts

    reset(mUIManagerMock);
    for (int i = 0; i < frames.size(); i++) {
      assertThat(mNativeAnimatedNodesManager.hasActiveAnimations()).isTrue();
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    }
    verify(mUIManagerMock, times(frames.size()))
        .synchronouslyUpdateViewOnUIThread(eq(1000), any(ReadableMap.class));

    // the animation has completed, we expect no updates to be done
    reset(mUIManagerMock);
    assertThat(mNativeAnimatedNodesManager.hasActiveAnimations()).isFalse();
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    verifyNoMoreInteractions(mUIManagerMock);
  }

  /**
   * In this test we verify that when tracking is configured to use spring animation and when the
   * destination value updates the current speed of the animated value will be taken into account
   * while updating the spring animation and it will smoothly transition to the new end value.
   */
  @Test
  public void testSpringTrackingRetainsSpeed() {
    // this spring config corresponds to tension 20 and friction 0.5 which makes the spring settle
    // very slowly
    JavaOnlyMap springConfig =
        JavaOnlyMap.of(
            "type",
            "spring",
            "restSpeedThreshold",
            0.001,
            "mass",
            1d,
            "restDisplacementThreshold",
            0.001,
            "initialVelocity",
            0.5d,
            "damping",
            2.5,
            "stiffness",
            157.8,
            "overshootClamping",
            false);

    createAnimatedGraphWithTrackingNode(1000, 0d, springConfig);

    // update "toValue" to 1, we expect tracking animation to animate now from 0 to 1
    mNativeAnimatedNodesManager.setAnimatedNodeValue(1, 1d);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());

    // we run several steps of animation until the value starts bouncing, has negative speed and
    // passes the final point (that is 1) while going backwards
    boolean isBoucingBack = false;
    double previousValue =
        ((ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(3)).getValue();
    for (int maxFrames = 500; maxFrames > 0; maxFrames--) {
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      double currentValue =
          ((ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(3)).getValue();
      if (previousValue >= 1d && currentValue < 1d) {
        isBoucingBack = true;
        break;
      }
      previousValue = currentValue;
    }
    assertThat(isBoucingBack).isTrue();

    // we now update "toValue" to 1.5 but since the value have negative speed and has also pretty
    // low friction we expect it to keep going in the opposite direction for a few more frames
    mNativeAnimatedNodesManager.setAnimatedNodeValue(1, 1.5d);
    mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
    int bounceBackInitialFrames = 0;
    boolean hasTurnedForward = false;

    // we run 8 seconds of animation
    for (int i = 0; i < 8 * 60; i++) {
      mNativeAnimatedNodesManager.runUpdates(nextFrameTime());
      double currentValue =
          ((ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(3)).getValue();
      if (!hasTurnedForward) {
        if (currentValue <= previousValue) {
          bounceBackInitialFrames++;
        } else {
          hasTurnedForward = true;
        }
      }
      previousValue = currentValue;
    }
    assertThat(hasTurnedForward).isEqualTo(true);
    assertThat(bounceBackInitialFrames).isGreaterThan(3);

    // we verify that the value settled at 2
    assertThat(previousValue).isEqualTo(1.5d);
  }
}
