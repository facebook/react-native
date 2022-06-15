/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.events;

import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.powermock.api.mockito.PowerMockito.doAnswer;
import static org.powermock.api.mockito.PowerMockito.mock;

import android.util.DisplayMetrics;
import android.view.MotionEvent;
import android.view.MotionEvent.PointerCoords;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.events.TouchEvent;
import com.facebook.react.uimanager.events.TouchEventCoalescingKeyHelper;
import com.facebook.react.uimanager.events.TouchEventType;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentMatchers;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.core.classloader.annotations.SuppressStaticInitializationFor;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

@PrepareForTest({Arguments.class, FabricUIManager.class})
@SuppressStaticInitializationFor("com.facebook.react.fabric.FabricUIManager")
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class TouchEventDispatchTest {

  private static final int SURFACE_ID = 121;
  private static final int TARGET_VIEW_ID = 42;
  private static final int GESTURE_START_TIME = 1;

  @Rule public PowerMockRule rule = new PowerMockRule();

  private final TouchEventCoalescingKeyHelper mTouchEventCoalescingKeyHelper =
      new TouchEventCoalescingKeyHelper();

  /** Events (1 pointer): START -> MOVE -> MOVE -> UP */
  private final TouchEvent[] mStartMoveEndSequence =
      new TouchEvent[] {
        createTouchEvent(
            GESTURE_START_TIME,
            MotionEvent.ACTION_DOWN,
            0,
            new int[] {0},
            new PointerCoords[] {pointerCoords(1f, 1f)}),
        createTouchEvent(
            GESTURE_START_TIME,
            MotionEvent.ACTION_MOVE,
            0,
            new int[] {0},
            new PointerCoords[] {pointerCoords(1f, 2f)}),
        createTouchEvent(
            GESTURE_START_TIME,
            MotionEvent.ACTION_MOVE,
            0,
            new int[] {0},
            new PointerCoords[] {pointerCoords(1f, 3f)}),
        createTouchEvent(
            GESTURE_START_TIME,
            MotionEvent.ACTION_UP,
            0,
            new int[] {0},
            new PointerCoords[] {pointerCoords(1f, 3f)})
      };

  /** Expected values for {@link #mStartMoveEndSequence} */
  private final List<ReadableMap> mStartMoveEndExpectedSequence =
      listOf(
          /*
           * START event for touch 1:
           * {
           *   touches: [touch1],
           *   changed: [touch1]
           * }
           */
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              1f,
              1f,
              GESTURE_START_TIME,
              0,
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 1f, GESTURE_START_TIME, 0)),
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 1f, GESTURE_START_TIME, 0))),
          /*
           * MOVE event for touch 1:
           * {
           *   touches: [touch1],
           *   changed: [touch1]
           * }
           */
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              1f,
              2f,
              GESTURE_START_TIME,
              0,
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 2f, GESTURE_START_TIME, 0)),
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 2f, GESTURE_START_TIME, 0))),
          /*
           * MOVE event for touch 1:
           * {
           *   touches: [touch1],
           *   changed: [touch1]
           * }
           */
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              1f,
              3f,
              GESTURE_START_TIME,
              0,
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 3f, GESTURE_START_TIME, 0)),
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 3f, GESTURE_START_TIME, 0))),
          /*
           * END event for touch 1:
           * {
           *   touches: [],
           *   changed: [touch1]
           * }
           */
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              1f,
              3f,
              GESTURE_START_TIME,
              0,
              Collections.<WritableMap>emptyList(),
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 3f, GESTURE_START_TIME, 0))));

  /** Events (2 pointer): START 1st -> START 2nd -> MOVE 1st -> UP 2st -> UP 1st */
  private final TouchEvent[] mStartPointerMoveUpSequence =
      new TouchEvent[] {
        createTouchEvent(
            GESTURE_START_TIME,
            MotionEvent.ACTION_DOWN,
            0,
            new int[] {0},
            new PointerCoords[] {pointerCoords(1f, 1f)}),
        createTouchEvent(
            GESTURE_START_TIME,
            MotionEvent.ACTION_POINTER_DOWN,
            1,
            new int[] {0, 1},
            new PointerCoords[] {pointerCoords(1f, 1f), pointerCoords(2f, 1f)}),
        createTouchEvent(
            GESTURE_START_TIME,
            MotionEvent.ACTION_MOVE,
            0,
            new int[] {0, 1},
            new PointerCoords[] {pointerCoords(1f, 2f), pointerCoords(2f, 1f)}),
        createTouchEvent(
            GESTURE_START_TIME,
            MotionEvent.ACTION_POINTER_UP,
            1,
            new int[] {0, 1},
            new PointerCoords[] {pointerCoords(1f, 2f), pointerCoords(2f, 1f)}),
        createTouchEvent(
            GESTURE_START_TIME,
            MotionEvent.ACTION_POINTER_UP,
            0,
            new int[] {0},
            new PointerCoords[] {pointerCoords(1f, 2f)})
      };

  /** Expected values for {@link #mStartPointerMoveUpSequence} */
  private final List<ReadableMap> mStartPointerMoveUpExpectedSequence =
      listOf(
          /*
           * START event for touch 1:
           * {
           *   touch: 0,
           *   touches: [touch1],
           *   changed: [touch1]
           * }
           */
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              1f,
              1f,
              GESTURE_START_TIME,
              0,
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 1f, GESTURE_START_TIME, 0)),
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 1f, GESTURE_START_TIME, 0))),
          /*
           * START event for touch 2:
           * {
           *   touch: 1,
           *   touches: [touch0, touch1],
           *   changed: [touch1]
           * }
           */
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              2f,
              1f,
              GESTURE_START_TIME,
              1,
              listOf(
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 1f, GESTURE_START_TIME, 0),
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1)),
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1))),
          /*
           * MOVE event for touch 1:
           * {
           *   touch: 0,
           *   touches: [touch0, touch1],
           *   changed: [touch0, touch1]
           * }
           * {
           *   touch: 1,
           *   touches: [touch0, touch1],
           *   changed: [touch0, touch1]
           * }
           */
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              1f,
              2f,
              GESTURE_START_TIME,
              0,
              listOf(
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 2f, GESTURE_START_TIME, 0),
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1)),
              listOf(
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 2f, GESTURE_START_TIME, 0),
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1))),
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              2f,
              1f,
              GESTURE_START_TIME,
              1,
              listOf(
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 2f, GESTURE_START_TIME, 0),
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1)),
              listOf(
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 2f, GESTURE_START_TIME, 0),
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1))),
          /*
           * UP event pointer 1:
           * {
           *   touch: 1,
           *   touches: [touch0],
           *   changed: [touch1]
           * }
           */
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              2f,
              1f,
              GESTURE_START_TIME,
              1,
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 2f, GESTURE_START_TIME, 0)),
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1))),
          /*
           * UP event pointer 0:
           * {
           *   touch: 0,
           *   touches: [],
           *   changed: [touch0]
           * }
           */
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              1f,
              2f,
              GESTURE_START_TIME,
              0,
              Collections.<WritableMap>emptyList(),
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 2f, GESTURE_START_TIME, 0))));

  /** Events (2 pointer): START 1st -> START 2nd -> MOVE 1st -> CANCEL */
  private final TouchEvent[] mStartMoveCancelSequence =
      new TouchEvent[] {
        createTouchEvent(
            GESTURE_START_TIME,
            MotionEvent.ACTION_DOWN,
            0,
            new int[] {0},
            new PointerCoords[] {pointerCoords(1f, 1f)}),
        createTouchEvent(
            GESTURE_START_TIME,
            MotionEvent.ACTION_POINTER_DOWN,
            1,
            new int[] {0, 1},
            new PointerCoords[] {pointerCoords(1f, 1f), pointerCoords(2f, 1f)}),
        createTouchEvent(
            GESTURE_START_TIME,
            MotionEvent.ACTION_MOVE,
            0,
            new int[] {0, 1},
            new PointerCoords[] {pointerCoords(1f, 2f), pointerCoords(2f, 1f)}),
        createTouchEvent(
            GESTURE_START_TIME,
            MotionEvent.ACTION_CANCEL,
            0,
            new int[] {0, 1},
            new PointerCoords[] {pointerCoords(1f, 3f), pointerCoords(2f, 1f)})
      };

  /** Expected values for {@link #mStartMoveCancelSequence} */
  private final List<ReadableMap> mStartMoveCancelExpectedSequence =
      listOf(
          /*
           * START event for touch 1:
           * {
           *   touch: 0,
           *   touches: [touch1],
           *   changed: [touch1]
           * }
           */
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              1f,
              1f,
              GESTURE_START_TIME,
              0,
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 1f, GESTURE_START_TIME, 0)),
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 1f, GESTURE_START_TIME, 0))),
          /*
           * START event for touch 2:
           * {
           *   touch: 1,
           *   touches: [touch0, touch1],
           *   changed: [touch1]
           * }
           */
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              2f,
              1f,
              GESTURE_START_TIME,
              1,
              listOf(
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 1f, GESTURE_START_TIME, 0),
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1)),
              listOf(buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1))),
          /*
           * MOVE event for touch 1:
           * {
           *   touch: 0,
           *   touches: [touch0, touch1],
           *   changed: [touch0, touch1]
           * }
           * {
           *   touch: 1,
           *   touches: [touch0, touch1],
           *   changed: [touch0, touch1]
           * }
           */
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              1f,
              2f,
              GESTURE_START_TIME,
              0,
              listOf(
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 2f, GESTURE_START_TIME, 0),
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1)),
              listOf(
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 2f, GESTURE_START_TIME, 0),
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1))),
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              2f,
              1f,
              GESTURE_START_TIME,
              1,
              listOf(
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 2f, GESTURE_START_TIME, 0),
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1)),
              listOf(
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 2f, GESTURE_START_TIME, 0),
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1))),
          /*
           * CANCEL event:
           * {
           *   touch: 0,
           *   touches: [],
           *   changed: [touch0, touch1]
           * }
           * {
           *   touch: 1,
           *   touches: [],
           *   changed: [touch0, touch1]
           * }
           */
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              1f,
              3f,
              GESTURE_START_TIME,
              0,
              Collections.<WritableMap>emptyList(),
              listOf(
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 3f, GESTURE_START_TIME, 0),
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1))),
          buildGestureEvent(
              SURFACE_ID,
              TARGET_VIEW_ID,
              2f,
              1f,
              GESTURE_START_TIME,
              1,
              Collections.<WritableMap>emptyList(),
              listOf(
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 1f, 3f, GESTURE_START_TIME, 0),
                  buildGesture(SURFACE_ID, TARGET_VIEW_ID, 2f, 1f, GESTURE_START_TIME, 1))));

  List<ReadableMap> mDispatchedEvents;
  FabricEventEmitter mEventEmitter;

  @Before
  public void setUp() {
    PowerMockito.mockStatic(Arguments.class);
    PowerMockito.mockStatic(FabricUIManager.class);
    PowerMockito.when(Arguments.createArray())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) {
                return new JavaOnlyArray();
              }
            });
    PowerMockito.when(Arguments.createMap())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) {
                return new JavaOnlyMap();
              }
            });

    DisplayMetrics metrics = new DisplayMetrics();
    metrics.xdpi = 1f;
    metrics.ydpi = 1f;
    metrics.density = 1f;
    DisplayMetricsHolder.setWindowDisplayMetrics(metrics);

    FabricUIManager fabricUIManager = mock(FabricUIManager.class);
    mDispatchedEvents = new ArrayList<>();
    doAnswer(
            new Answer<Void>() {
              @Override
              public Void answer(InvocationOnMock invocation) {
                mDispatchedEvents.add(invocation.<ReadableMap>getArgument(5));
                return null;
              }
            })
        .when(fabricUIManager)
        .receiveEvent(
            anyInt(),
            anyInt(),
            anyString(),
            anyBoolean(),
            anyInt(),
            ArgumentMatchers.<WritableMap>any(),
            anyInt());
    mEventEmitter = new FabricEventEmitter(fabricUIManager);
  }

  @Test
  public void testFabric_startMoveEnd() {
    for (TouchEvent event : mStartMoveEndSequence) {
      event.dispatchModern(mEventEmitter);
    }

    assertEquals(mStartMoveEndExpectedSequence, mDispatchedEvents);
  }

  @Test
  public void testFabric_startMoveCancel() {
    for (TouchEvent event : mStartMoveCancelSequence) {
      event.dispatchModern(mEventEmitter);
    }

    assertEquals(mStartMoveCancelExpectedSequence, mDispatchedEvents);
  }

  @Test
  public void testFabric_startPointerUpCancel() {
    for (TouchEvent event : mStartPointerMoveUpSequence) {
      event.dispatchModern(mEventEmitter);
    }

    assertEquals(mStartPointerMoveUpExpectedSequence, mDispatchedEvents);
  }

  private TouchEvent createTouchEvent(
      int gestureTime, int action, int pointerId, int[] pointerIds, PointerCoords[] pointerCoords) {
    mTouchEventCoalescingKeyHelper.addCoalescingKey(gestureTime);
    action |= pointerId << MotionEvent.ACTION_POINTER_INDEX_SHIFT;
    return TouchEvent.obtain(
        SURFACE_ID,
        TARGET_VIEW_ID,
        getType(action),
        MotionEvent.obtain(
            gestureTime,
            gestureTime,
            action,
            pointerIds.length,
            pointerIds,
            pointerCoords,
            0,
            0f,
            0f,
            0,
            0,
            0,
            0),
        gestureTime,
        pointerCoords[0].x,
        pointerCoords[0].y,
        mTouchEventCoalescingKeyHelper);
  }

  private static TouchEventType getType(int action) {
    action &= ~MotionEvent.ACTION_POINTER_INDEX_MASK;
    switch (action) {
      case MotionEvent.ACTION_DOWN:
      case MotionEvent.ACTION_POINTER_DOWN:
        return TouchEventType.START;
      case MotionEvent.ACTION_UP:
      case MotionEvent.ACTION_POINTER_UP:
        return TouchEventType.END;
      case MotionEvent.ACTION_MOVE:
        return TouchEventType.MOVE;
      case MotionEvent.ACTION_CANCEL:
        return TouchEventType.CANCEL;
    }

    return TouchEventType.START;
  }

  private static ReadableMap buildGestureEvent(
      int surfaceId,
      int viewTag,
      float locationX,
      float locationY,
      int time,
      int pointerId,
      List<WritableMap> touches,
      List<WritableMap> changedTouches) {
    WritableMap gesture = buildGesture(surfaceId, viewTag, locationX, locationY, time, pointerId);
    gesture.putArray("changedTouches", JavaOnlyArray.from(changedTouches));
    gesture.putArray("touches", JavaOnlyArray.from(touches));
    return gesture;
  }

  private static WritableMap buildGesture(
      int surfaceId, int viewTag, float locationX, float locationY, int time, int pointerId) {
    WritableMap map = new JavaOnlyMap();
    map.putInt("targetSurface", surfaceId);
    map.putInt("target", viewTag);
    map.putDouble("locationX", locationX);
    map.putDouble("locationY", locationY);
    map.putDouble("pageX", locationX);
    map.putDouble("pageY", locationY);
    map.putDouble("identifier", pointerId);
    map.putDouble("timestamp", time);
    return map;
  }

  @SafeVarargs
  private static <E> List<E> listOf(E... args) {
    return Arrays.asList(args);
  }

  private static PointerCoords pointerCoords(float x, float y) {
    PointerCoords pointerCoords = new PointerCoords();
    pointerCoords.x = x;
    pointerCoords.y = y;
    return pointerCoords;
  }
}
