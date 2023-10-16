/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // Suppressing as we want to test RCTEventEmitter here
package com.facebook.react.animated

import android.annotation.SuppressLint
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JSIModuleType
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.RCTEventEmitter
import kotlin.collections.Map
import kotlin.math.abs
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentCaptor
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.anyInt
import org.mockito.ArgumentMatchers.eq
import org.mockito.MockedStatic
import org.mockito.Mockito.atMost
import org.mockito.Mockito.mock
import org.mockito.Mockito.mockStatic
import org.mockito.Mockito.reset
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when` as whenever
import org.robolectric.RobolectricTestRunner

/** Tests the animated nodes graph traversal algorithm from {@link NativeAnimatedNodesManager}. */
@RunWith(RobolectricTestRunner::class)
class NativeAnimatedNodeTraversalTest {

  private var frameTimeNanos: Long = 0L
  private lateinit var reactApplicationContextMock: ReactApplicationContext
  private lateinit var catalystInstanceMock: CatalystInstance
  private lateinit var uiManagerMock: UIManagerModule
  private lateinit var eventDispatcherMock: EventDispatcher
  private lateinit var nativeAnimatedNodesManager: NativeAnimatedNodesManager
  private lateinit var arguments: MockedStatic<Arguments>

  private fun nextFrameTime(): Long {
    frameTimeNanos += FRAME_LEN_NANOS
    return frameTimeNanos
  }

  @Before
  fun setUp() {
    arguments = mockStatic(Arguments::class.java)
    arguments.`when`<WritableArray> { Arguments.createArray() }.thenAnswer { JavaOnlyArray() }
    arguments.`when`<WritableMap> { Arguments.createMap() }.thenAnswer { JavaOnlyMap() }

    frameTimeNanos = INITIAL_FRAME_TIME_NANOS

    reactApplicationContextMock = mock(ReactApplicationContext::class.java)
    whenever(reactApplicationContextMock.hasActiveReactInstance()).thenAnswer { true }
    whenever(reactApplicationContextMock.hasCatalystInstance()).thenAnswer { true }
    whenever(reactApplicationContextMock.catalystInstance).thenAnswer { catalystInstanceMock }
    whenever(reactApplicationContextMock.getNativeModule(UIManagerModule::class.java)).thenAnswer {
      uiManagerMock
    }

    catalystInstanceMock = mock(CatalystInstance::class.java)
    whenever(catalystInstanceMock.getJSIModule(any(JSIModuleType::class.java))).thenAnswer {
      uiManagerMock
    }
    whenever(catalystInstanceMock.getNativeModule(UIManagerModule::class.java)).thenAnswer {
      uiManagerMock
    }

    uiManagerMock = mock(UIManagerModule::class.java)
    eventDispatcherMock = mock(EventDispatcher::class.java)
    whenever(uiManagerMock.eventDispatcher).thenAnswer { eventDispatcherMock }
    whenever(uiManagerMock.constants).thenAnswer {
      MapBuilder.of("customDirectEventTypes", MapBuilder.newHashMap<Any, Any>())
    }
    whenever(uiManagerMock.directEventNamesResolver).thenAnswer {
      object : UIManagerModule.CustomEventNamesResolver {
        override fun resolveCustomEventName(eventName: String): String {
          val constants: Map<String, Any?> = uiManagerMock.constants ?: emptyMap()
          val directEventTypes: Any? = constants["customDirectEventTypes"]
          if (directEventTypes != null && directEventTypes is Map<*, *>) {
            val customEventType = directEventTypes[eventName]
            if (customEventType != null && customEventType is Map<*, *>) {
              return customEventType["registrationName"] as? String ?: eventName
            }
          }
          return eventName
        }
      }
    }
    whenever(uiManagerMock.resolveCustomDirectEventName(any(String::class.java))).thenAnswer {
        invocation ->
      val arg = invocation.arguments[0].toString()
      "on${arg.substring(3)}"
    }
    nativeAnimatedNodesManager = NativeAnimatedNodesManager(reactApplicationContextMock)
  }

  @After
  fun tearDown() {
    arguments.close()
  }

  /**
   * Generates a simple animated nodes graph and attaches the props node to a given {@param viewTag}
   * Parameter {@param opacity} is used as a initial value for the "opacity" attribute.
   *
   * <p>Nodes are connected as follows (nodes IDs in parens): ValueNode(1) -> StyleNode(2) ->
   * PropNode(3)
   */
  private fun createSimpleAnimatedViewWithOpacity(viewTag: Int = 1000) {
    val opacity = 0.0
    nativeAnimatedNodesManager.createAnimatedNode(
        1, JavaOnlyMap.of("type", "value", "value", opacity, "offset", 0.0))
    nativeAnimatedNodesManager.createAnimatedNode(
        2, JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("opacity", 1)))
    nativeAnimatedNodesManager.createAnimatedNode(
        3, JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 2)))
    nativeAnimatedNodesManager.connectAnimatedNodes(1, 2)
    nativeAnimatedNodesManager.connectAnimatedNodes(2, 3)
    nativeAnimatedNodesManager.connectAnimatedNodeToView(3, viewTag)
  }

  @Test
  fun testFramesAnimation() {
    createSimpleAnimatedViewWithOpacity()

    val frames: JavaOnlyArray = JavaOnlyArray.of(0.0, 0.2, 0.4, 0.6, 0.8, 1.0)

    val animationCallback: Callback = mock(Callback::class.java)
    nativeAnimatedNodesManager.startAnimatingNode(
        1, 1, JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1.0), animationCallback)

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    for (i in 0 until frames.size()) {
      reset(uiManagerMock)
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
      verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture())
      assertThat(stylesCaptor.value.getDouble("opacity")).isEqualTo(frames.getDouble(i))
    }

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(uiManagerMock)
  }

  @Test
  fun testFramesAnimationLoopsFiveTimes() {
    createSimpleAnimatedViewWithOpacity()

    val frames: JavaOnlyArray = JavaOnlyArray.of(0.0, 0.2, 0.4, 0.6, 0.8, 1.0)
    val animationCallback: Callback = mock(Callback::class.java)
    nativeAnimatedNodesManager.startAnimatingNode(
        1,
        1,
        JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1.0, "iterations", 5),
        animationCallback)

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    for (iteration in 1..5) {
      for (i in 0 until frames.size()) {
        reset(uiManagerMock)
        nativeAnimatedNodesManager.runUpdates(nextFrameTime())
        verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture())
        assertThat(stylesCaptor.value.getDouble("opacity")).isEqualTo(frames.getDouble(i))
      }
    }

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(uiManagerMock)
  }

  @Test
  fun testNodeValueListenerIfNotListening() {
    val nodeId: Int = 1

    createSimpleAnimatedViewWithOpacity()
    val frames: JavaOnlyArray = JavaOnlyArray.of(0.0, 0.2, 0.4, 0.6, 0.8, 1.0)

    val animationCallback: Callback = mock(Callback::class.java)
    val valueListener: AnimatedNodeValueListener = mock(AnimatedNodeValueListener::class.java)

    nativeAnimatedNodesManager.startListeningToAnimatedNodeValue(nodeId, valueListener)
    nativeAnimatedNodesManager.startAnimatingNode(
        1,
        nodeId,
        JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1.0),
        animationCallback)

    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(valueListener).onValueUpdate(eq(0.0))

    nativeAnimatedNodesManager.stopListeningToAnimatedNodeValue(nodeId)

    reset(valueListener)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(valueListener)
  }

  @Test
  fun testNodeValueListenerIfListening() {
    val nodeId: Int = 1

    createSimpleAnimatedViewWithOpacity()
    val frames: JavaOnlyArray = JavaOnlyArray.of(0.0, 0.2, 0.4, 0.6, 0.8, 1.0)

    val animationCallback: Callback = mock(Callback::class.java)
    val valueListener: AnimatedNodeValueListener = mock(AnimatedNodeValueListener::class.java)

    nativeAnimatedNodesManager.startListeningToAnimatedNodeValue(nodeId, valueListener)
    nativeAnimatedNodesManager.startAnimatingNode(
        1,
        nodeId,
        JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1.0),
        animationCallback)

    for (i in 0 until frames.size()) {
      reset(valueListener)
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
      verify(valueListener).onValueUpdate(eq(frames.getDouble(i)))
    }

    reset(valueListener)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(valueListener)
  }

  private fun performSpringAnimationTestWithConfig(
      config: JavaOnlyMap?,
      testForCriticallyDamped: Boolean
  ) {
    createSimpleAnimatedViewWithOpacity()

    val animationCallback: Callback = mock(Callback::class.java)

    nativeAnimatedNodesManager.startAnimatingNode(1, 1, config, animationCallback)

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture())
    assertThat(stylesCaptor.value.getDouble("opacity")).isEqualTo(0.0)

    var previousValue: Double = 0.0
    var wasGreaterThanOne: Boolean = false

    /* run 3 secs of animation */
    for (i in 0 until 3 * 60) {
      reset(uiManagerMock)
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
      verify(uiManagerMock, atMost(1))
          .synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture())
      val currentValue: Double = stylesCaptor.value.getDouble("opacity")
      if (currentValue > 1.0) {
        wasGreaterThanOne = true
      }
      // verify that animation step is relatively small
      assertThat(abs(currentValue - previousValue)).isLessThan(0.12)
      previousValue = currentValue
    }
    // verify that we've reach the final value at the end of animation
    assertThat(previousValue).isEqualTo(1.0)
    // verify that value has reached some maximum value that is greater than the final value
    // (bounce)
    if (testForCriticallyDamped) {
      assertThat(!wasGreaterThanOne).isTrue
    } else {
      assertThat(wasGreaterThanOne).isTrue
    }
    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(uiManagerMock)
  }

  @Test
  fun testUnderdampedSpringAnimation() {
    performSpringAnimationTestWithConfig(
        JavaOnlyMap.of(
            "type",
            "spring",
            "stiffness",
            230.2,
            "damping",
            22.0,
            "mass",
            1.0,
            "initialVelocity",
            0.0,
            "toValue",
            1.0,
            "restSpeedThreshold",
            0.001,
            "restDisplacementThreshold",
            0.001,
            "overshootClamping",
            false),
        false)
  }

  @Test
  fun testCriticallyDampedSpringAnimation() {
    performSpringAnimationTestWithConfig(
        JavaOnlyMap.of(
            "type",
            "spring",
            "stiffness",
            1000.0,
            "damping",
            500.0,
            "mass",
            3.0,
            "initialVelocity",
            0.0,
            "toValue",
            1.0,
            "restSpeedThreshold",
            0.001,
            "restDisplacementThreshold",
            0.001,
            "overshootClamping",
            false),
        true)
  }

  @Test
  fun testSpringAnimationLoopsFiveTimes() {
    createSimpleAnimatedViewWithOpacity()

    val animationCallback: Callback = mock(Callback::class.java)
    nativeAnimatedNodesManager.startAnimatingNode(
        1,
        1,
        JavaOnlyMap.of(
            "type",
            "spring",
            "stiffness",
            230.2,
            "damping",
            22.0,
            "mass",
            1.0,
            "initialVelocity",
            0.0,
            "toValue",
            1.0,
            "restSpeedThreshold",
            0.001,
            "restDisplacementThreshold",
            0.001,
            "overshootClamping",
            false,
            "iterations",
            5),
        animationCallback)

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture())
    assertThat(stylesCaptor.value.getDouble("opacity")).isEqualTo(0.0)

    var previousValue: Double = 0.0
    var wasGreaterThanOne: Boolean = false
    var didComeToRest: Boolean = false
    var numberOfResets: Int = 0
    /* run 3 secs of animation, five times */
    for (i in 0 until 3 * 60 * 5) {
      reset(uiManagerMock)
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
      verify(uiManagerMock, atMost(1))
          .synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture())
      val currentValue: Double = stylesCaptor.value.getDouble("opacity")
      if (currentValue > 1.0) {
        wasGreaterThanOne = true
      }
      // Test to see if it reset after coming to rest
      if (didComeToRest &&
          currentValue == 0.0 &&
          abs(abs(currentValue - previousValue) - 1.0) < 0.001) {
        numberOfResets++
      }

      // verify that an animation step is relatively small, unless it has come to rest and
      // reset
      if (!didComeToRest) assertThat(abs(currentValue - previousValue)).isLessThan(0.12)

      // record that the animation did come to rest when it rests on toValue
      didComeToRest = abs(currentValue - 1.0) < 0.001 && abs(currentValue - previousValue) < 0.001
      previousValue = currentValue
    }
    // verify that we've reach the final value at the end of animation
    assertThat(previousValue).isEqualTo(1.0)
    // verify that value has reached some maximum value that is greater than the final value
    // (bounce)
    assertThat(wasGreaterThanOne).isTrue
    // verify that value reset 4 times after finishing a full animation
    assertThat(numberOfResets).isEqualTo(4)
    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(uiManagerMock)
  }

  @Test
  fun testDecayAnimation() {
    createSimpleAnimatedViewWithOpacity()

    val animationCallback: Callback = mock(Callback::class.java)
    nativeAnimatedNodesManager.startAnimatingNode(
        1,
        1,
        JavaOnlyMap.of("type", "decay", "velocity", 0.5, "deceleration", 0.998),
        animationCallback)

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock, atMost(1))
        .synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture())
    var previousValue: Double = stylesCaptor.value.getDouble("opacity")
    var previousDiff: Double = Double.POSITIVE_INFINITY
    /* run 3 secs of animation */
    for (i in 0 until 3 * 60) {
      reset(uiManagerMock)
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
      verify(uiManagerMock, atMost(1))
          .synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture())
      val currentValue: Double = stylesCaptor.value.getDouble("opacity")
      val currentDiff: Double = currentValue - previousValue
      // verify monotonicity
      // greater *or equal* because the animation stops during these 3 seconds
      assertThat(currentValue).describedAs("on frame $i").isGreaterThanOrEqualTo(previousValue)
      // verify decay
      if (i > 3) {
        // i > 3 because that's how long it takes to settle previousDiff
        if (i % 3 != 0) {
          // i % 3 != 0 because every 3 frames we go a tiny
          // bit faster, because frame length is 16.(6)ms
          assertThat(currentDiff).describedAs("on frame $i").isLessThanOrEqualTo(previousDiff)
        } else {
          assertThat(currentDiff).describedAs("on frame $i").isGreaterThanOrEqualTo(previousDiff)
        }
      }
      previousValue = currentValue
      previousDiff = currentDiff
    }
    // should be done in 3s
    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(uiManagerMock)
  }

  @Test
  fun testDecayAnimationLoopsFiveTimes() {
    createSimpleAnimatedViewWithOpacity()

    val animationCallback: Callback = mock(Callback::class.java)
    nativeAnimatedNodesManager.startAnimatingNode(
        1,
        1,
        JavaOnlyMap.of("type", "decay", "velocity", 0.5, "deceleration", 0.998, "iterations", 5),
        animationCallback)

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock, atMost(1))
        .synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture())
    var previousValue: Double = stylesCaptor.value.getDouble("opacity")
    val initialValue: Double = stylesCaptor.value.getDouble("opacity")
    var didComeToRest: Boolean = false
    var numberOfResets: Int = 0
    /* run 3 secs of animation, five times */
    for (i in 0 until 3 * 60 * 5) {
      reset(uiManagerMock)
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
      verify(uiManagerMock, atMost(1))
          .synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture())
      val currentValue: Double = stylesCaptor.value.getDouble("opacity")
      val currentDiff: Double = currentValue - previousValue
      // Test to see if it reset after coming to rest (i.e. dropped back to )
      if (didComeToRest && currentValue == initialValue) {
        numberOfResets++
      }

      // verify monotonicity, unless it has come to rest and reset
      // greater *or equal* because the animation stops during these 3 seconds
      if (!didComeToRest) {
        assertThat(currentValue).describedAs("on frame $i").isGreaterThanOrEqualTo(previousValue)
      }

      // Test if animation has come to rest using the 0.1 threshold from DecayAnimation.java
      didComeToRest = abs(currentDiff) < 0.1
      previousValue = currentValue
    }

    // verify that value reset (looped) 4 times after finishing a full animation
    assertThat(numberOfResets).isEqualTo(4)
    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(uiManagerMock)
  }

  @Test
  fun testAnimationCallbackFinish() {
    createSimpleAnimatedViewWithOpacity()

    val frames: JavaOnlyArray = JavaOnlyArray.of(0.0, 1.0)
    val animationCallback: Callback = mock(Callback::class.java)
    nativeAnimatedNodesManager.startAnimatingNode(
        1, 1, JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1.0), animationCallback)

    val callbackResponseCaptor: ArgumentCaptor<ReadableMap> =
        ArgumentCaptor.forClass(ReadableMap::class.java)

    reset(animationCallback)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(animationCallback)

    reset(animationCallback)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(animationCallback).invoke(callbackResponseCaptor.capture())

    assertThat(callbackResponseCaptor.value.hasKey("finished")).isTrue
    assertThat(callbackResponseCaptor.value.getBoolean("finished")).isTrue

    reset(animationCallback)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(animationCallback)
  }

  /**
   * Creates a following graph of nodes: Value(1, firstValue) ----> Add(3) ---> Style(4) --->
   * Props(5) ---> View(viewTag) | Value(2, secondValue) --+
   *
   * <p>Add(3) node maps to a "translateX" attribute of the Style(4) node.
   */
  private fun createAnimatedGraphWithAdditionNode(
      viewTag: Int = 50,
      firstValue: Double = 100.0,
      secondValue: Double = 1000.0
  ) {
    nativeAnimatedNodesManager.createAnimatedNode(
        1, JavaOnlyMap.of("type", "value", "value", firstValue, "offset", 0.0))
    nativeAnimatedNodesManager.createAnimatedNode(
        2, JavaOnlyMap.of("type", "value", "value", secondValue, "offset", 0.0))

    nativeAnimatedNodesManager.createAnimatedNode(
        3, JavaOnlyMap.of("type", "addition", "input", JavaOnlyArray.of(1, 2)))

    nativeAnimatedNodesManager.createAnimatedNode(
        4, JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("translateX", 3)))
    nativeAnimatedNodesManager.createAnimatedNode(
        5, JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 4)))
    nativeAnimatedNodesManager.connectAnimatedNodes(1, 3)
    nativeAnimatedNodesManager.connectAnimatedNodes(2, 3)
    nativeAnimatedNodesManager.connectAnimatedNodes(3, 4)
    nativeAnimatedNodesManager.connectAnimatedNodes(4, 5)
    nativeAnimatedNodesManager.connectAnimatedNodeToView(5, viewTag)
  }

  @Test
  fun testAdditionNode() {
    createAnimatedGraphWithAdditionNode()

    val animationCallback: Callback = mock(Callback::class.java)
    val frames: JavaOnlyArray = JavaOnlyArray.of(0.0, 1.0)
    nativeAnimatedNodesManager.startAnimatingNode(
        1,
        1,
        JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 101.0),
        animationCallback)

    nativeAnimatedNodesManager.startAnimatingNode(
        2,
        2,
        JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1010.0),
        animationCallback)

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture())
    assertThat(stylesCaptor.value.getDouble("translateX")).isEqualTo(1100.0)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture())
    assertThat(stylesCaptor.value.getDouble("translateX")).isEqualTo(1111.0)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(uiManagerMock)
  }

  /**
   * Verifies that {@link NativeAnimatedNodesManager#runUpdates} updates the view correctly in case
   * when one of the addition input nodes has started animating while the other one has not.
   *
   * <p>We expect that the output of the addition node will take the starting value of the second
   * input node even though the node hasn't been connected to an active animation driver.
   */
  @Test
  fun testViewReceiveUpdatesIfOneOfAnimationHasntStarted() {
    createAnimatedGraphWithAdditionNode()

    // Start animating only the first addition input node
    val animationCallback: Callback = mock(Callback::class.java)
    val frames: JavaOnlyArray = JavaOnlyArray.of(0.0, 1.0)
    nativeAnimatedNodesManager.startAnimatingNode(
        1,
        1,
        JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 101.0),
        animationCallback)

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture())
    assertThat(stylesCaptor.value.getDouble("translateX")).isEqualTo(1100.0)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture())
    assertThat(stylesCaptor.value.getDouble("translateX")).isEqualTo(1101.0)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(uiManagerMock)
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
  fun testViewReceiveUpdatesWhenOneOfAnimationHasFinished() {
    createAnimatedGraphWithAdditionNode()

    val animationCallback: Callback = mock(Callback::class.java)

    // Start animating for the first addition input node, will have 2 frames only
    val firstFrames: JavaOnlyArray = JavaOnlyArray.of(0.0, 1.0)
    nativeAnimatedNodesManager.startAnimatingNode(
        1,
        1,
        JavaOnlyMap.of("type", "frames", "frames", firstFrames, "toValue", 200.0),
        animationCallback)

    // Start animating for the first addition input node, will have 6 frames
    val secondFrames: JavaOnlyArray = JavaOnlyArray.of(0.0, 0.2, 0.4, 0.6, 0.8, 1.0)
    nativeAnimatedNodesManager.startAnimatingNode(
        2,
        2,
        JavaOnlyMap.of("type", "frames", "frames", secondFrames, "toValue", 1010.0),
        animationCallback)

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture())
    assertThat(stylesCaptor.value.getDouble("translateX")).isEqualTo(1100.0)

    for (i in 1 until secondFrames.size()) {
      reset(uiManagerMock)
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
      verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture())
      assertThat(stylesCaptor.value.getDouble("translateX"))
          .isEqualTo(1200.0 + secondFrames.getDouble(i) * 10.0)
    }

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(uiManagerMock)
  }

  @Test
  fun testMultiplicationNode() {
    nativeAnimatedNodesManager.createAnimatedNode(
        1, JavaOnlyMap.of("type", "value", "value", 1.0, "offset", 0.0))
    nativeAnimatedNodesManager.createAnimatedNode(
        2, JavaOnlyMap.of("type", "value", "value", 5.0, "offset", 0.0))

    nativeAnimatedNodesManager.createAnimatedNode(
        3, JavaOnlyMap.of("type", "multiplication", "input", JavaOnlyArray.of(1, 2)))

    nativeAnimatedNodesManager.createAnimatedNode(
        4, JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("translateX", 3)))
    nativeAnimatedNodesManager.createAnimatedNode(
        5, JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 4)))
    nativeAnimatedNodesManager.connectAnimatedNodes(1, 3)
    nativeAnimatedNodesManager.connectAnimatedNodes(2, 3)
    nativeAnimatedNodesManager.connectAnimatedNodes(3, 4)
    nativeAnimatedNodesManager.connectAnimatedNodes(4, 5)
    nativeAnimatedNodesManager.connectAnimatedNodeToView(5, 50)

    val animationCallback: Callback = mock(Callback::class.java)
    val frames: JavaOnlyArray = JavaOnlyArray.of(0.0, 1.0)
    nativeAnimatedNodesManager.startAnimatingNode(
        1, 1, JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 2.0), animationCallback)

    nativeAnimatedNodesManager.startAnimatingNode(
        2,
        2,
        JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 10.0),
        animationCallback)

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture())
    assertThat(stylesCaptor.value.getDouble("translateX")).isEqualTo(5.0)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture())
    assertThat(stylesCaptor.value.getDouble("translateX")).isEqualTo(20.0)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(uiManagerMock)
  }

  /**
   * This test verifies that when {@link NativeAnimatedModule#stopAnimation} is called the animation
   * will no longer be updating the nodes it has been previously attached to and that the animation
   * callback will be triggered with {@code {finished: false}}
   */
  @Test
  fun testHandleStoppingAnimation() {
    createSimpleAnimatedViewWithOpacity()

    val frames: JavaOnlyArray = JavaOnlyArray.of(0.0, 0.2, 0.4, 0.6, 0.8, 1.0)
    val animationCallback: Callback = mock(Callback::class.java)
    nativeAnimatedNodesManager.startAnimatingNode(
        404,
        1,
        JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 1.0),
        animationCallback)

    val callbackResponseCaptor: ArgumentCaptor<ReadableMap> =
        ArgumentCaptor.forClass(ReadableMap::class.java)

    reset(animationCallback)
    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock, times(2))
        .synchronouslyUpdateViewOnUIThread(anyInt(), any(ReadableMap::class.java))
    verifyNoMoreInteractions(animationCallback)

    reset(animationCallback)
    reset(uiManagerMock)
    nativeAnimatedNodesManager.stopAnimation(404)
    verify(animationCallback).invoke(callbackResponseCaptor.capture())
    verifyNoMoreInteractions(animationCallback)
    verifyNoMoreInteractions(uiManagerMock)

    assertThat(callbackResponseCaptor.value.hasKey("finished")).isTrue
    assertThat(callbackResponseCaptor.value.getBoolean("finished")).isFalse

    reset(animationCallback)
    reset(uiManagerMock)
    // Run "update" loop a few more times -> we expect no further updates nor callback calls to
    // be triggered
    for (i in 0 until 5) {
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    }

    verifyNoMoreInteractions(uiManagerMock)
    verifyNoMoreInteractions(animationCallback)
  }

  @Test
  fun testGetValue() {
    val tag: Int = 1
    nativeAnimatedNodesManager.createAnimatedNode(
        tag, JavaOnlyMap.of("type", "value", "value", 1.0, "offset", 0.0))

    val saveValueCallbackMock: Callback = mock(Callback::class.java)

    nativeAnimatedNodesManager.getValue(tag, saveValueCallbackMock)

    verify(saveValueCallbackMock, times(1)).invoke(1.0)
  }

  @Test
  fun testInterpolationNode() {
    nativeAnimatedNodesManager.createAnimatedNode(
        1, JavaOnlyMap.of("type", "value", "value", 10.0, "offset", 0.0))

    nativeAnimatedNodesManager.createAnimatedNode(
        2,
        JavaOnlyMap.of(
            "type",
            "interpolation",
            "inputRange",
            JavaOnlyArray.of(10.0, 20.0),
            "outputRange",
            JavaOnlyArray.of(0.0, 1.0),
            "extrapolateLeft",
            "extend",
            "extrapolateRight",
            "extend"))

    nativeAnimatedNodesManager.createAnimatedNode(
        3, JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("opacity", 2)))
    nativeAnimatedNodesManager.createAnimatedNode(
        4, JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 3)))
    nativeAnimatedNodesManager.connectAnimatedNodes(1, 2)
    nativeAnimatedNodesManager.connectAnimatedNodes(2, 3)
    nativeAnimatedNodesManager.connectAnimatedNodes(3, 4)
    nativeAnimatedNodesManager.connectAnimatedNodeToView(4, 50)

    val animationCallback: Callback = mock(Callback::class.java)
    val frames: JavaOnlyArray = JavaOnlyArray.of(0.0, 0.2, 0.4, 0.6, 0.8, 1.0)
    nativeAnimatedNodesManager.startAnimatingNode(
        1,
        1,
        JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 20.0),
        animationCallback)

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    for (i in 0 until frames.size()) {
      reset(uiManagerMock)
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
      verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(50), stylesCaptor.capture())
      assertThat(stylesCaptor.value.getDouble("opacity")).isEqualTo(frames.getDouble(i))
    }

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(uiManagerMock)
  }

  private fun createScrollEvent(tag: Int, value: Double): Event<Event<*>> {
    return object : Event<Event<*>>(tag) {

      override fun getEventName(): String {
        return "topScroll"
      }

      @Override
      @Deprecated("Deprecated in Java")
      override fun dispatch(rctEventEmitter: RCTEventEmitter) {
        rctEventEmitter.receiveEvent(
            tag, "topScroll", JavaOnlyMap.of("contentOffset", JavaOnlyMap.of("y", value)))
      }
    }
  }

  @Test
  fun testNativeAnimatedEventDoUpdate() {
    val viewTag = 1000

    createSimpleAnimatedViewWithOpacity(viewTag)

    nativeAnimatedNodesManager.addAnimatedEventToView(
        viewTag,
        "onScroll",
        JavaOnlyMap.of(
            "animatedValueTag", 1, "nativeEventPath", JavaOnlyArray.of("contentOffset", "y")))

    nativeAnimatedNodesManager.onEventDispatch(createScrollEvent(viewTag, 10.0))

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(viewTag), stylesCaptor.capture())
    assertThat(stylesCaptor.value.getDouble("opacity")).isEqualTo(10.0)
  }

  @Test
  fun testNativeAnimatedEventDoNotUpdate() {
    val viewTag = 1000

    createSimpleAnimatedViewWithOpacity()

    nativeAnimatedNodesManager.addAnimatedEventToView(
        viewTag,
        "otherEvent",
        JavaOnlyMap.of(
            "animatedValueTag", 1, "nativeEventPath", JavaOnlyArray.of("contentOffset", "y")))

    nativeAnimatedNodesManager.addAnimatedEventToView(
        999,
        "topScroll",
        JavaOnlyMap.of(
            "animatedValueTag", 1, "nativeEventPath", JavaOnlyArray.of("contentOffset", "y")))

    nativeAnimatedNodesManager.onEventDispatch(createScrollEvent(viewTag, 10.0))

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(viewTag), stylesCaptor.capture())
    assertThat(stylesCaptor.value.getDouble("opacity")).isEqualTo(0.0)
  }

  @Test
  fun testNativeAnimatedEventCustomMapping() {
    val viewTag: Int = 1000

    whenever(uiManagerMock.constants).thenAnswer {
      MapBuilder.of(
          "customDirectEventTypes",
          MapBuilder.of("onScroll", MapBuilder.of("registrationName", "onScroll")))
    }

    nativeAnimatedNodesManager = NativeAnimatedNodesManager(reactApplicationContextMock)

    createSimpleAnimatedViewWithOpacity()

    nativeAnimatedNodesManager.addAnimatedEventToView(
        viewTag,
        "onScroll",
        JavaOnlyMap.of(
            "animatedValueTag", 1, "nativeEventPath", JavaOnlyArray.of("contentOffset", "y")))

    nativeAnimatedNodesManager.onEventDispatch(createScrollEvent(viewTag, 10.0))

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(viewTag), stylesCaptor.capture())
    assertThat(stylesCaptor.value.getDouble("opacity")).isEqualTo(10.0)
  }

  @SuppressLint("CheckResult")
  @Test
  fun testRestoreDefaultProps() {
    val viewTag: Int = 1001
    // restoreDefaultProps not called in Fabric, make sure it's a non-Fabric tag
    val propsNodeTag: Int = 3
    nativeAnimatedNodesManager.createAnimatedNode(
        1, JavaOnlyMap.of("type", "value", "value", 1.0, "offset", 0.0))
    nativeAnimatedNodesManager.createAnimatedNode(
        2, JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("opacity", 1)))
    nativeAnimatedNodesManager.createAnimatedNode(
        propsNodeTag, JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 2)))
    nativeAnimatedNodesManager.connectAnimatedNodes(1, 2)
    nativeAnimatedNodesManager.connectAnimatedNodes(2, propsNodeTag)
    nativeAnimatedNodesManager.connectAnimatedNodeToView(propsNodeTag, viewTag)

    val frames: JavaOnlyArray = JavaOnlyArray.of(0.0, 0.5, 1.0)
    val animationCallback: Callback = mock(Callback::class.java)
    nativeAnimatedNodesManager.startAnimatingNode(
        1, 1, JavaOnlyMap.of("type", "frames", "frames", frames, "toValue", 0.0), animationCallback)

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    for (i in 0 until frames.size()) {
      reset(uiManagerMock)
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    }

    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(viewTag), stylesCaptor.capture())
    assertThat(stylesCaptor.value.getDouble("opacity")).isEqualTo(0.0)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.restoreDefaultValues(propsNodeTag)
    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(viewTag), stylesCaptor.capture())
    assertThat(stylesCaptor.value.isNull("opacity")).isTrue
  }

  /**
   * Creates a following graph of nodes: Value(3, initialValue) ----> Style(4) ---> Props(5) --->
   * View(viewTag)
   *
   * <p>Value(3) is set to track Value(1) via Tracking(2) node with the provided animation config
   */
  private fun createAnimatedGraphWithTrackingNode(
      animationConfig: JavaOnlyMap,
      viewTag: Int = 1000,
      initialValue: Double = 0.0,
  ) {
    nativeAnimatedNodesManager.createAnimatedNode(
        1, JavaOnlyMap.of("type", "value", "value", initialValue, "offset", 0.0))
    nativeAnimatedNodesManager.createAnimatedNode(
        3, JavaOnlyMap.of("type", "value", "value", initialValue, "offset", 0.0))

    nativeAnimatedNodesManager.createAnimatedNode(
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
            animationConfig))

    nativeAnimatedNodesManager.createAnimatedNode(
        4, JavaOnlyMap.of("type", "style", "style", JavaOnlyMap.of("translateX", 3)))
    nativeAnimatedNodesManager.createAnimatedNode(
        5, JavaOnlyMap.of("type", "props", "props", JavaOnlyMap.of("style", 4)))
    nativeAnimatedNodesManager.connectAnimatedNodes(1, 2)
    nativeAnimatedNodesManager.connectAnimatedNodes(3, 4)
    nativeAnimatedNodesManager.connectAnimatedNodes(4, 5)
    nativeAnimatedNodesManager.connectAnimatedNodeToView(5, viewTag)
  }

  /**
   * In this test we verify that when value is being tracked we can update destination value in the
   * middle of ongoing animation and the animation will update and animate to the new spot. This is
   * tested using simple 5 frame backed timing animation.
   */
  @Test
  fun testTracking() {
    val frames: JavaOnlyArray = JavaOnlyArray.of(0.0, 0.25, 0.5, 0.75, 1)
    val animationConfig: JavaOnlyMap = JavaOnlyMap.of("type", "frames", "frames", frames)

    createAnimatedGraphWithTrackingNode(animationConfig)

    val stylesCaptor: ArgumentCaptor<ReadableMap> = ArgumentCaptor.forClass(ReadableMap::class.java)

    reset(uiManagerMock)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture())
    assertThat(stylesCaptor.value.getDouble("translateX")).isEqualTo(0.0)

    // update "toValue" to 100, we expect tracking animation to animate now from 0 to 100 in 5
    // steps
    nativeAnimatedNodesManager.setAnimatedNodeValue(1, 100.0)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    // kick off the animation

    for (i in 0 until frames.size()) {
      reset(uiManagerMock)
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
      verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture())
      assertThat(stylesCaptor.value.getDouble("translateX")).isEqualTo(frames.getDouble(i) * 100.0)
    }

    // update "toValue" to 0 but run only two frames from the animation,
    // we expect tracking animation to animate now from 100 to 75
    nativeAnimatedNodesManager.setAnimatedNodeValue(1, 0.0)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    // kick off the animation

    for (i in 0 until 2) {
      reset(uiManagerMock)
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
      verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture())
      assertThat(stylesCaptor.value.getDouble("translateX"))
          .isEqualTo(100 * (1 - frames.getDouble(i)))
    }

    // at this point we expect tracking value to be at 75
    assertThat((nativeAnimatedNodesManager.getNodeById(3) as ValueAnimatedNode).value)
        .isEqualTo(75.0)

    // we update "toValue" again to 100 and expect the animation to restart from the current
    // place
    nativeAnimatedNodesManager.setAnimatedNodeValue(1, 100.0)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    // kick off the animation

    for (i in 0 until frames.size()) {
      reset(uiManagerMock)
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
      verify(uiManagerMock).synchronouslyUpdateViewOnUIThread(eq(1000), stylesCaptor.capture())
      assertThat(stylesCaptor.value.getDouble("translateX"))
          .isEqualTo(50.0 + 50.0 * frames.getDouble(i))
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
  fun testTrackingPausesWhenEndValueIsReached() {
    val frames: JavaOnlyArray = JavaOnlyArray.of(0.0, 0.5, 1.0)
    val animationConfig: JavaOnlyMap = JavaOnlyMap.of("type", "frames", "frames", frames)

    createAnimatedGraphWithTrackingNode(animationConfig)
    nativeAnimatedNodesManager.setAnimatedNodeValue(1, 100.0)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    // make sure animation starts

    reset(uiManagerMock)
    for (i in 0 until frames.size()) {
      assertThat(nativeAnimatedNodesManager.hasActiveAnimations()).isTrue
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    }
    verify(uiManagerMock, times(frames.size()))
        .synchronouslyUpdateViewOnUIThread(eq(1000), any(ReadableMap::class.java))

    // the animation has completed, we expect no updates to be done
    reset(uiManagerMock)
    assertThat(nativeAnimatedNodesManager.hasActiveAnimations()).isFalse
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(uiManagerMock)

    // we update end value and expect the animation to restart
    nativeAnimatedNodesManager.setAnimatedNodeValue(1, 200.0)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    // make sure animation starts

    reset(uiManagerMock)
    for (i in 0 until frames.size()) {
      assertThat(nativeAnimatedNodesManager.hasActiveAnimations()).isTrue
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    }
    verify(uiManagerMock, times(frames.size()))
        .synchronouslyUpdateViewOnUIThread(eq(1000), any(ReadableMap::class.java))

    // the animation has completed, we expect no updates to be done
    reset(uiManagerMock)
    assertThat(nativeAnimatedNodesManager.hasActiveAnimations()).isFalse
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    verifyNoMoreInteractions(uiManagerMock)
  }

  /**
   * In this test we verify that when tracking is configured to use spring animation and when the
   * destination value updates the current speed of the animated value will be taken into account
   * while updating the spring animation and it will smoothly transition to the new end value.
   */
  @Test
  fun testSpringTrackingRetainsSpeed() {
    // this spring config corresponds to tension 20 and friction 0.5 which makes the spring
    // settle
    // very slowly
    val springConfig: JavaOnlyMap =
        JavaOnlyMap.of(
            "type",
            "spring",
            "restSpeedThreshold",
            0.001,
            "mass",
            1.0,
            "restDisplacementThreshold",
            0.001,
            "initialVelocity",
            0.5,
            "damping",
            2.5,
            "stiffness",
            157.8,
            "overshootClamping",
            false)

    createAnimatedGraphWithTrackingNode(springConfig)

    // update "toValue" to 1, we expect tracking animation to animate now from 0 to 1
    nativeAnimatedNodesManager.setAnimatedNodeValue(1, 1.0)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())

    // we run several steps of animation until the value starts bouncing, has negative speed and
    // passes the final point (that is 1) while going backwards
    var isBoucingBack: Boolean = false
    var previousValue: Double =
        (nativeAnimatedNodesManager.getNodeById(3) as ValueAnimatedNode).value
    for (i in 500 downTo 0) {
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
      val currentValue: Double =
          (nativeAnimatedNodesManager.getNodeById(3) as ValueAnimatedNode).value
      if (previousValue >= 1.0 && currentValue < 1.0) {
        isBoucingBack = true
        break
      }
      previousValue = currentValue
    }
    assertThat(isBoucingBack).isTrue

    // we now update "toValue" to 1.5 but since the value have negative speed and has also
    // pretty
    // low friction we expect it to keep going in the opposite direction for a few more frames
    nativeAnimatedNodesManager.setAnimatedNodeValue(1, 1.5)
    nativeAnimatedNodesManager.runUpdates(nextFrameTime())
    var bounceBackInitialFrames: Int = 0
    var hasTurnedForward: Boolean = false

    // we run 8 seconds of animation
    for (i in 0 until 8 * 60) {
      nativeAnimatedNodesManager.runUpdates(nextFrameTime())
      val currentValue: Double =
          (nativeAnimatedNodesManager.getNodeById(3) as ValueAnimatedNode).value
      if (!hasTurnedForward) {
        if (currentValue <= previousValue) {
          bounceBackInitialFrames++
        } else {
          hasTurnedForward = true
        }
      }
      previousValue = currentValue
    }
    assertThat(hasTurnedForward).isEqualTo(true)
    assertThat(bounceBackInitialFrames).isGreaterThan(3)

    // we verify that the value settled at 2
    assertThat(previousValue).isEqualTo(1.5)
  }

  companion object {
    private const val FRAME_LEN_NANOS: Long = 1000000000L / 60L
    private const val INITIAL_FRAME_TIME_NANOS: Long = 14599233201256L /* random */
  }
}
