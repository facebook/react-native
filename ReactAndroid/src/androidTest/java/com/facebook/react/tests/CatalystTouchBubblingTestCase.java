/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests;

import android.view.View;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.testing.SingleTouchGestureGenerator;
import com.facebook.react.testing.StringRecordingModule;

/**
 * This test is to verify that touch events bubbles up to the right handler. We emulate couple of
 * different gestures on top of the application reflecting following layout:
 *
 * <pre>
 * +---------------------------------------------------------------------------------------+
 * |                                                                                       |
 * | +----------------------------------------------------------------------------------+  |
 * | | +-------------+                                              +----------------+  |  |
 * | | | +---+       |                                              |                |  |  |
 * | | | | A |       |                                              |                |  |  |
 * | | | +---+       |                                              |        C       |  |  |
 * | | |     {B}     |                                              |                |  |  |
 * | | |             |                      {D}                     |                |  |  |
 * | | +-------------+                                              +----------------+  |  |
 * | |                                                                                  |  |
 * | |                                                                                  |  |
 * | +----------------------------------------------------------------------------------+  |
 * |
 * | +----------------------------------------------------------------------------------+  |
 * | |                                                                                  |  |
 * | |                                                                                  |  |
 * | |                                                                                  |  |
 * | |                                      {E}                                         |  |
 * | |                                                                                  |  |
 * | |                                                                                  |  |
 * | +----------------------------------------------------------------------------------+  |
 * +---------------------------------------------------------------------------------------+
 * </pre>
 *
 * <p>Then in each test case we either tap the center of a particular view (from A to E) or we start
 * a gesture in one view and end it with another. View with names in brackets (e.g. {D}) have touch
 * handlers set whereas all other views are not declared to handler touch events.
 */
public class CatalystTouchBubblingTestCase extends ReactAppInstrumentationTestCase {

  private final StringRecordingModule mRecordingModule = new StringRecordingModule();

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "TouchBubblingTestAppModule";
  }

  /**
   * 1) Simulate touch event at view A, expect {B} touch handler to fire 2) Simulate touch event at
   * view C, expect {D} touch handler to fire
   */
  public void testSimpleClickAtInnerElements() {
    mRecordingModule.reset();
    View innerButton = getViewByTestId("A");
    assertNotNull(innerButton);
    createGestureGenerator().startGesture(innerButton).endGesture();
    waitForBridgeAndUIIdle();
    assertEquals(1, mRecordingModule.getCalls().size());
    assertEquals("inner", mRecordingModule.getCalls().get(0));

    mRecordingModule.reset();
    innerButton = getViewByTestId("C");
    assertNotNull(innerButton);
    createGestureGenerator().startGesture(innerButton).endGesture();
    waitForBridgeAndUIIdle();
    assertEquals(1, mRecordingModule.getCalls().size());
    assertEquals("outer", mRecordingModule.getCalls().get(0));
  }

  /**
   * 1) Start touch at view A, then drag and release on view {B} (but outside of A), expect {B}'s
   * touch handler to fire 2) Do the same with view C and {D}
   */
  public void testDownOnInnerUpOnTouchableParent() {
    View innerButton = getViewByTestId("A");
    View touchableParent = getViewByTestId("B");

    SingleTouchGestureGenerator gestureGenerator = createGestureGenerator();
    gestureGenerator.startGesture(innerButton);
    // wait for tapped view measurements
    waitForBridgeAndUIIdle();

    gestureGenerator.dragTo(touchableParent, 15).endGesture();
    waitForBridgeAndUIIdle();
    assertEquals(1, mRecordingModule.getCalls().size());
    assertEquals("inner", mRecordingModule.getCalls().get(0));

    // Do same with second inner view
    mRecordingModule.reset();

    touchableParent = getViewByTestId("D");
    innerButton = getViewByTestId("C");

    gestureGenerator = createGestureGenerator();
    gestureGenerator.startGesture(innerButton);
    // wait for tapped view measurements
    waitForBridgeAndUIIdle();

    gestureGenerator.dragTo(touchableParent, 15).endGesture();
    waitForBridgeAndUIIdle();
    assertEquals(1, mRecordingModule.getCalls().size());
    assertEquals("outer", mRecordingModule.getCalls().get(0));
  }

  /**
   * Start gesture at view A, then drag and release on view {E}. Expect no touch handlers to fire
   */
  public void testDragOutOfTouchable() {
    View outsideView = getViewByTestId("E");
    View innerButton = getViewByTestId("A");

    SingleTouchGestureGenerator gestureGenerator = createGestureGenerator();
    gestureGenerator.startGesture(innerButton);
    // wait for tapped view measurements
    waitForBridgeAndUIIdle();

    gestureGenerator.dragTo(outsideView, 15).endGesture();
    waitForBridgeAndUIIdle();
    assertTrue(mRecordingModule.getCalls().isEmpty());
  }

  /**
   * In this scenario we start gesture at view A (has two touchable parents {B} and {D}) then we
   * drag and release gesture on view {D}, but outside of {B}. We expect no touch handler to fire
   */
  public void testNoEventWhenDragOutOfFirstTouchableParentToItsTouchableParent() {
    View topLevelTouchable = getViewByTestId("C");
    View innerButton = getViewByTestId("A");

    SingleTouchGestureGenerator gestureGenerator = createGestureGenerator();
    gestureGenerator.startGesture(innerButton);
    // wait for tapped view measurements
    waitForBridgeAndUIIdle();

    gestureGenerator.dragTo(topLevelTouchable, 15).endGesture();
    waitForBridgeAndUIIdle();
    assertTrue(mRecordingModule.getCalls().isEmpty());
  }

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    return new ReactInstanceSpecForTest().addNativeModule(mRecordingModule);
  }
}
