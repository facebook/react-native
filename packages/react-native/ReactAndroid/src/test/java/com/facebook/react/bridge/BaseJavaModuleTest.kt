/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.internal.turbomodule.core.interfaces.TurboModule
import com.facebook.testutils.shadows.ShadowSoLoader
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when` as whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Tests for [BaseJavaModule] and [JavaModuleWrapper] */
@Config(shadows = [ShadowSoLoader::class])
@RunWith(RobolectricTestRunner::class)
class BaseJavaModuleTest {
  private lateinit var methods: List<JavaModuleWrapper.MethodDescriptor>
  private lateinit var moduleWrapper: JavaModuleWrapper
  private lateinit var generatedMethods: List<JavaModuleWrapper.MethodDescriptor>
  private lateinit var generatedModuleWrapper: JavaModuleWrapper
  private lateinit var arguments: ReadableNativeArray

  @Before
  fun setup() {
    val moduleHolder = ModuleHolder(MethodsModule())
    moduleWrapper = JavaModuleWrapper(null, moduleHolder)
    methods = moduleWrapper.methodDescriptors
    val generatedModuleHolder = ModuleHolder(GeneratedMethodsModule())
    generatedModuleWrapper = JavaModuleWrapper(null, generatedModuleHolder)
    generatedMethods = generatedModuleWrapper.methodDescriptors
    arguments = mock(ReadableNativeArray::class.java)
  }

  private fun findMethod(mname: String, methods: List<JavaModuleWrapper.MethodDescriptor>): Int =
      methods.indexOfFirst({ it.name === mname })

  @Test(expected = NativeArgumentsParseException::class)
  fun testCallMethodWithoutEnoughArgs() {
    val methodId = findMethod("regularMethod", methods)
    whenever(arguments.size()).thenReturn(1)
    moduleWrapper.invoke(methodId, arguments)
  }

  @Test
  fun testCallMethodWithEnoughArgs() {
    val methodId = findMethod("regularMethod", methods)
    whenever(arguments.size()).thenReturn(2)
    moduleWrapper.invoke(methodId, arguments)
  }

  @Test
  fun testCallAsyncMethodWithEnoughArgs() {
    // Promise block evaluates to 2 args needing to be passed from JS
    val methodId = findMethod("asyncMethod", methods)
    whenever(arguments.size()).thenReturn(3)
    moduleWrapper.invoke(methodId, arguments)
  }

  @Test
  fun testCallSyncMethod() {
    val methodId = findMethod("syncMethod", methods)
    whenever(arguments.size()).thenReturn(2)
    moduleWrapper.invoke(methodId, arguments)
  }

  @Test
  fun testCallGeneratedMethod() {
    val methodId = findMethod("generatedMethod", generatedMethods)
    whenever(arguments.size()).thenReturn(2)
    generatedModuleWrapper.invoke(methodId, arguments)
  }

  @Suppress("UNUSED_PARAMETER")
  private class MethodsModule : BaseJavaModule() {
    override fun getName(): String = "Methods"

    @ReactMethod fun regularMethod(a: String?, b: Int?) {}

    @ReactMethod fun asyncMethod(a: Int, p: Promise) {}

    @ReactMethod(isBlockingSynchronousMethod = true) fun syncMethod(a: Int, b: Int): Int = a + b
  }

  private abstract inner class NativeTestGeneratedModuleSpec : BaseJavaModule(), TurboModule {
    @ReactMethod abstract fun generatedMethod(a: String?, b: Int?)
  }

  private inner class GeneratedMethodsModule : NativeTestGeneratedModuleSpec() {
    override fun getName(): String = "GeneratedMethods"

    override fun generatedMethod(a: String?, b: Int?) {}
  }
}
