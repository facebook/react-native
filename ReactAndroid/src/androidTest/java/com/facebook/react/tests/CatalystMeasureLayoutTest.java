/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.tests;

import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.testing.AssertModule;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.uimanager.UIManagerModule;

/**
 * Tests for {@link UIManagerModule#measure}, {@link UIManagerModule#measureLayout}, and {@link
 * UIManagerModule#measureLayoutRelativeToParent}. Tests measurement for views in the following
 * hierarchy:
 *
 * <pre>
 * +---------------------------------------------+
 * | A                                           |
 * |                                             |
 * |      +-----------+        +---------+       |
 * |      | B         |        | D       |       |
 * |      |    +---+  |        |         |       |
 * |      |    | C |  |        |         |       |
 * |      |    |   |  |        +---------+       |
 * |      |    +---+  |                          |
 * |      +-----------+                          |
 * |                                             |
 * |                                             |
 * |                                             |
 * +---------------------------------------------+
 * </pre>
 *
 * <p>View locations and dimensions: A - (0,0) to (500, 500) (500x500) B - (50,80) to (250, 380)
 * (200x300) C - (150,150) to (200, 300) (50x150) D - (400,100) to (450, 300) (50x200)
 */
public class CatalystMeasureLayoutTest extends ReactAppInstrumentationTestCase {

  private static interface MeasureLayoutTestModule extends JavaScriptModule {
    public void verifyMeasureOnViewA();

    public void verifyMeasureOnViewC();

    public void verifyMeasureLayoutCRelativeToA();

    public void verifyMeasureLayoutCRelativeToB();

    public void verifyMeasureLayoutCRelativeToSelf();

    public void verifyMeasureLayoutRelativeToParentOnViewA();

    public void verifyMeasureLayoutRelativeToParentOnViewB();

    public void verifyMeasureLayoutRelativeToParentOnViewC();

    public void verifyMeasureLayoutDRelativeToB();

    public void verifyMeasureLayoutNonExistentTag();

    public void verifyMeasureLayoutNonExistentAncestor();

    public void verifyMeasureLayoutRelativeToParentNonExistentTag();
  }

  private MeasureLayoutTestModule mTestJSModule;
  private AssertModule mAssertModule;

  @Override
  protected void setUp() throws Exception {
    super.setUp();
    mTestJSModule = getReactContext().getJSModule(MeasureLayoutTestModule.class);
  }

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "MeasureLayoutTestApp";
  }

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    mAssertModule = new AssertModule();
    return super.createReactInstanceSpecForTest().addNativeModule(mAssertModule);
  }

  private void waitForBridgeIdleAndVerifyAsserts() {
    waitForBridgeAndUIIdle();
    mAssertModule.verifyAssertsAndReset();
  }

  public void testMeasure() {
    mTestJSModule.verifyMeasureOnViewA();
    waitForBridgeIdleAndVerifyAsserts();
    mTestJSModule.verifyMeasureOnViewC();
    waitForBridgeIdleAndVerifyAsserts();
  }

  public void testMeasureLayout() {
    mTestJSModule.verifyMeasureLayoutCRelativeToA();
    waitForBridgeIdleAndVerifyAsserts();
    mTestJSModule.verifyMeasureLayoutCRelativeToB();
    waitForBridgeIdleAndVerifyAsserts();
    mTestJSModule.verifyMeasureLayoutCRelativeToSelf();
    waitForBridgeIdleAndVerifyAsserts();
  }

  public void testMeasureLayoutRelativeToParent() {
    mTestJSModule.verifyMeasureLayoutRelativeToParentOnViewA();
    waitForBridgeIdleAndVerifyAsserts();
    mTestJSModule.verifyMeasureLayoutRelativeToParentOnViewB();
    waitForBridgeIdleAndVerifyAsserts();
    mTestJSModule.verifyMeasureLayoutRelativeToParentOnViewC();
    waitForBridgeIdleAndVerifyAsserts();
  }

  public void testMeasureLayoutCallsErrorCallbackWhenViewIsNotChildOfAncestor() {
    mTestJSModule.verifyMeasureLayoutDRelativeToB();
    waitForBridgeIdleAndVerifyAsserts();
  }

  public void testMeasureLayoutCallsErrorCallbackWhenViewDoesNotExist() {
    mTestJSModule.verifyMeasureLayoutNonExistentTag();
    waitForBridgeIdleAndVerifyAsserts();
  }

  public void testMeasureLayoutCallsErrorCallbackWhenAncestorDoesNotExist() {
    mTestJSModule.verifyMeasureLayoutNonExistentAncestor();
    waitForBridgeIdleAndVerifyAsserts();
  }

  public void testMeasureLayoutRelativeToParentCallsErrorCallbackWhenViewDoesNotExist() {
    mTestJSModule.verifyMeasureLayoutRelativeToParentNonExistentTag();
    waitForBridgeIdleAndVerifyAsserts();
  }
}
