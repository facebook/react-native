// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
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
