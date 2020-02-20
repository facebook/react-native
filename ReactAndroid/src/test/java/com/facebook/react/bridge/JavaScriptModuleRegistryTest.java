/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import org.junit.Assert;
import org.junit.Test;

/** Tests for {@link JavaScriptModuleRegistry} */
public class JavaScriptModuleRegistryTest {

  private interface TestJavaScriptModule extends JavaScriptModule {
    void doSomething();
  }

  private interface OuterClass$NestedInnerClass extends JavaScriptModule {
    void doSomething();
  }

  @Test
  public void testGetJSModuleName() {
    String name = JavaScriptModuleRegistry.getJSModuleName(TestJavaScriptModule.class);
    Assert.assertEquals("TestJavaScriptModule", name);
  }

  @Test
  public void testGetJSModuleName_stripOuterClass() {
    String name = JavaScriptModuleRegistry.getJSModuleName(OuterClass$NestedInnerClass.class);
    Assert.assertEquals("NestedInnerClass", name);
  }
}
