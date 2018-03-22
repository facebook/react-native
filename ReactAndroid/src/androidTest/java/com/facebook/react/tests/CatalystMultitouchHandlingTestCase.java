/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.tests;

import java.util.List;

import android.view.MotionEvent;

import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.StringRecordingModule;

/**
 * Test case for verifying that multitouch events are directed to the React's view touch handlers
 * properly
 */
public class CatalystMultitouchHandlingTestCase extends ReactAppInstrumentationTestCase {

  private final StringRecordingModule mRecordingModule = new StringRecordingModule();

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "MultitouchHandlingTestAppModule";
  }

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    return new ReactInstanceSpecForTest()
        .addNativeModule(mRecordingModule);
  }

  /**
   * In this test case we send pre-recorded stream of pinch out gesture and verify that we have
   * recorded important touch events in JS module
   */
  public void testMultitouchEvents() throws InterruptedException {
    generateRecordedPinchTouchEvents();
    waitForBridgeAndUIIdle();

    // Expect to receive at least 5 events (DOWN for each pointer, UP for each pointer and at least
    // one MOVE event with both pointers down)
    List<String> calls = mRecordingModule.getCalls();

    int moveWithBothPointersEventIndex = -1;
    int startEventIndex = -1;
    int startExtraPointerEventIndex = -1;
    int endEventIndex = -1;
    int endExtraPointerEventIndex = -1;

    for (int i = 0; i < calls.size(); i++) {
      String call = calls.get(i);
      if (call.equals("start;ExtraPointer")) {
        assertEquals(-1, startExtraPointerEventIndex);
        startExtraPointerEventIndex = i;
      } else if (call.equals("end;ExtraPointer")) {
        assertEquals(-1, endExtraPointerEventIndex);
        endExtraPointerEventIndex = i;
      } else if (call.equals("start;1")) {
        assertEquals(-1, startEventIndex);
        startEventIndex = i;
      } else if (call.equals("end;0")) {
        assertEquals(-1, endEventIndex);
        endEventIndex = i;
      } else if (call.equals("move;2")) {
        // this will happen more than once, let's just capture the last occurrence
        moveWithBothPointersEventIndex = i;
      }
    }

    assertEquals(0, startEventIndex);
    assertTrue(-1 != startExtraPointerEventIndex);
    assertTrue(-1 != moveWithBothPointersEventIndex);
    assertTrue(-1 != endExtraPointerEventIndex);
    assertTrue(startExtraPointerEventIndex < moveWithBothPointersEventIndex);
    assertTrue(endExtraPointerEventIndex > moveWithBothPointersEventIndex);
    assertEquals(calls.size() - 1, endEventIndex);
  }

  private MotionEvent.PointerProperties createPointerProps(int id, int toolType) {
    MotionEvent.PointerProperties pointerProps = new MotionEvent.PointerProperties();
    pointerProps.id = id;
    pointerProps.toolType = toolType;
    return pointerProps;
  }

  private MotionEvent.PointerCoords createPointerCoords(float x, float y) {
    MotionEvent.PointerCoords pointerCoords = new MotionEvent.PointerCoords();
    pointerCoords.x = x;
    pointerCoords.y = y;
    return pointerCoords;
  }

  private void dispatchEvent(
      final int action,
      final long start,
      final long when,
      final int pointerCount,
      final MotionEvent.PointerProperties[] pointerProps,
      final MotionEvent.PointerCoords[] pointerCoords) {
    getRootView().post(
        new Runnable() {
          @Override
          public void run() {
            MotionEvent event =
                MotionEvent.obtain(start, when, action, pointerCount, pointerProps, pointerCoords, 0, 0, 1.0f, 1.0f, 0, 0, 0, 0);
            getRootView().dispatchTouchEvent(event);
            event.recycle();
          }
        });
    getInstrumentation().waitForIdleSync();
  }

  /**
   * This method "replay" multi-touch gesture recorded with modified TouchesHelper class that
   * generated this piece of code (see https://phabricator.fb.com/P19756940).
   * This is not intended to be copied/reused and once we need to have more multitouch gestures
   * in instrumentation tests we should either:
   *  - implement nice generator similar to {@link SingleTouchGestureGenerator}
   *  - implement gesture recorded that will record touch data using arbitrary format and then read
   *  this recorded touch sequence during tests instead of generating code like this
   */
  private void generateRecordedPinchTouchEvents() {
    // START OF GENERATED CODE
    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[1];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[1];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(268.0f, 347.0f);
      dispatchEvent(MotionEvent.ACTION_DOWN, 446560605, 446560605, 1, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[1];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[1];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(267.0f, 346.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560630, 1, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(267.0f, 346.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(225.0f, 542.0f);
      dispatchEvent(MotionEvent.ACTION_POINTER_DOWN | (1 << MotionEvent.ACTION_POINTER_INDEX_SHIFT), 446560605, 446560630, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(266.0f, 345.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(225.0f, 542.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560647, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(265.0f, 344.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(224.0f, 541.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560664, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(264.0f, 342.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(223.0f, 540.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560681, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(263.0f, 340.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(222.0f, 539.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560698, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(262.0f, 337.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(221.0f, 538.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560714, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(262.0f, 333.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(220.0f, 537.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560731, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(261.0f, 328.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(219.0f, 536.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560748, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(260.0f, 321.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(218.0f, 536.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560765, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(260.0f, 313.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(216.0f, 536.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560781, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(260.0f, 304.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(214.0f, 537.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560798, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(260.0f, 295.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(211.0f, 539.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560815, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(261.0f, 285.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(208.0f, 542.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560832, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(264.0f, 274.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(203.0f, 547.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560849, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(266.0f, 264.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(199.0f, 551.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560865, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(269.0f, 254.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(194.0f, 556.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560882, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(273.0f, 245.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(190.0f, 561.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560899, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(276.0f, 236.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(186.0f, 567.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560916, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(280.0f, 227.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(183.0f, 573.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560933, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(283.0f, 219.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(181.0f, 579.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560949, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(287.0f, 211.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(179.0f, 584.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560966, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(291.0f, 202.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(177.0f, 589.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446560983, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(296.0f, 193.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(175.0f, 593.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561000, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(301.0f, 184.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(174.0f, 598.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561016, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(307.0f, 176.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(173.0f, 603.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561033, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(313.0f, 168.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(172.0f, 608.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561050, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(317.0f, 160.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(171.0f, 613.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561067, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(320.0f, 154.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(170.0f, 619.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561084, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(323.0f, 149.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(169.0f, 624.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561100, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(325.0f, 145.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(168.0f, 628.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561117, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(328.0f, 141.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(167.0f, 632.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561134, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(331.0f, 137.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(166.0f, 636.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561151, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(334.0f, 134.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(165.0f, 639.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561167, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(337.0f, 131.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(164.0f, 643.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561184, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(338.0f, 128.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(164.0f, 646.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561201, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(340.0f, 126.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(164.0f, 649.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561218, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(341.0f, 124.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(163.0f, 652.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561234, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(342.0f, 122.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(163.0f, 655.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561251, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(343.0f, 120.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(162.0f, 659.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561268, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(344.0f, 118.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(161.0f, 664.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561285, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(345.0f, 116.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(160.0f, 667.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561302, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(346.0f, 115.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(158.0f, 670.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561318, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(347.0f, 114.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(157.0f, 673.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561335, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(348.0f, 113.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(156.0f, 676.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561352, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(348.0f, 112.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(155.0f, 677.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561369, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(349.0f, 111.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(154.0f, 678.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561386, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(349.0f, 110.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(153.0f, 679.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561402, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(349.0f, 109.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(152.0f, 680.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561419, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(349.0f, 110.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(151.0f, 680.0f);
      dispatchEvent(MotionEvent.ACTION_MOVE, 446560605, 446561435, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[2];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[2];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(349.0f, 110.0f);
      pointerProps[1] = createPointerProps(1, 1);
      pointerCoords[1] = createPointerCoords(151.0f, 680.0f);
      dispatchEvent(MotionEvent.ACTION_POINTER_UP | (0 << MotionEvent.ACTION_POINTER_INDEX_SHIFT), 446560605, 446561443, 2, pointerProps, pointerCoords);
    }

    {
      MotionEvent.PointerProperties[] pointerProps = new MotionEvent.PointerProperties[1];
      MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[1];
      pointerProps[0] = createPointerProps(0, 1);
      pointerCoords[0] = createPointerCoords(151.0f, 680.0f);
      dispatchEvent(MotionEvent.ACTION_UP, 446560605, 446561451, 1, pointerProps, pointerCoords);
    }
    // END OF GENERATED CODE
  }

}
