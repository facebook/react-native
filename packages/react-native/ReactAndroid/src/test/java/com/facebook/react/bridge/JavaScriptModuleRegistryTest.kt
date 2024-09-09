/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

/** Tests for [JavaScriptModuleRegistry] */
class JavaScriptModuleRegistryTest {
  private interface TestJavaScriptModule : JavaScriptModule {
    fun doSomething()
  }

  private interface `OuterClass$NestedInnerClass` : JavaScriptModule {
    fun doSomething()
  }

  @Test
  fun testGetJSModuleName() {
    val name = JavaScriptModuleRegistry.getJSModuleName(TestJavaScriptModule::class.java)
    assertThat(name).isEqualTo("TestJavaScriptModule")
  }

  @Test
  fun testGetJSModuleName_stripOuterClass() {
    val name = JavaScriptModuleRegistry.getJSModuleName(`OuterClass$NestedInnerClass`::class.java)
    assertThat(name).isEqualTo("NestedInnerClass")
  }
}
