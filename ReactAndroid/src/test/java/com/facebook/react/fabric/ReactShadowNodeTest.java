// Copyright 2004-present Facebook. All Rights Reserved.
package com.facebook.react.fabric;

import com.facebook.react.uimanager.ReactShadowNodeImpl;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

/** Tests {@link ReactShadowNode} */
@RunWith(RobolectricTestRunner.class)
public class ReactShadowNodeTest {

  @Test(expected = AssertionError.class)
  public void testClonedInstance() {
    TestReactShadowNode node = new TestReactShadowNode();
    node.mutableCopy(node.getInstanceHandle());
  }

  private static class TestReactShadowNode extends ReactShadowNodeImpl {}
}
