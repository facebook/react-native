// Copyright 2004-present Facebook. All Rights Reserved.
package com.facebook.react.fabric;

import com.facebook.react.uimanager.ReactShadowNodeImpl;
import com.facebook.testing.robolectric.v3.WithTestDefaultsRunner;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Tests {@link ReactShadowNode} */
@RunWith(WithTestDefaultsRunner.class)
public class ReactShadowNodeTest {

  @Test(expected = AssertionError.class)
  public void testClonedInstance() {
    TestReactShadowNode node = new TestReactShadowNode();
    node.mutableCopy();
  }

  private static class TestReactShadowNode extends ReactShadowNodeImpl {}
}
