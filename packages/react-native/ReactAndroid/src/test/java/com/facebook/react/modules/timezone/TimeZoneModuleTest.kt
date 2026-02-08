/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.modules.timezone

import android.content.BroadcastReceiver
import android.content.Intent
import android.content.IntentFilter
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.ReactApplicationContext
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.mock
import org.mockito.kotlin.spy
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class TimeZoneModuleTest {

  private lateinit var reactContext: ReactApplicationContext
  private lateinit var catalystInstance: CatalystInstance
  private lateinit var module: TestableTimeZoneModule

  // Test subclass to override the native method and avoid UnsatisfiedLinkError
  class TestableTimeZoneModule(context: ReactApplicationContext) : TimeZoneModule(context) {
    public override fun resetHermesTimeZoneCache(jsRuntimePtr: Long) {
      // Do nothing in JVM test
    }
  }

  @Before
  fun setup() {
    // Mock ReactApplicationContext and CatalystInstance
    reactContext = mock()
    catalystInstance = mock()
    whenever(reactContext.catalystInstance).thenReturn(catalystInstance)

    // Use the test subclass that overrides the native method
    module = spy(TestableTimeZoneModule(reactContext))
  }

  @Test
  fun testModuleName() {
    assertEquals(TimeZoneModule.NAME, module.name)
  }

  @Test
  fun testInitializeRegistersReceiver() {
    module.initialize()

    // Verify that the private receiver is not null
    val receiverField = TimeZoneModule::class.java.getDeclaredField("timeZoneChangeReceiver")
    receiverField.isAccessible = true
    val receiver = receiverField.get(module)
    assertNotNull(receiver)

    // Verify that the receiver was registered with the correct intent filter
    verify(reactContext).registerReceiver(any<BroadcastReceiver>(), any<IntentFilter>())
  }

  @Test
  fun testOnCatalystInstanceDestroyUnregistersReceiver() {
    module.initialize() // registers the receiver

    module.onCatalystInstanceDestroy()

    // Verify that the private receiver is cleared
    val receiverField = TimeZoneModule::class.java.getDeclaredField("timeZoneChangeReceiver")
    receiverField.isAccessible = true
    val receiver = receiverField.get(module)
    assertNull(receiver)

    // Verify that the receiver was unregistered
    verify(reactContext).unregisterReceiver(any<BroadcastReceiver>())
  }

  @Test
  fun testTimeZoneChangeTriggersHermesReset() {
    // 1. Mock JavaScriptContextHolder
    val jsContextHolder = mock<JavaScriptContextHolder>()
    whenever(catalystInstance.javaScriptContextHolder).thenReturn(jsContextHolder)
    whenever(jsContextHolder.get()).thenReturn(12345L)

    // 2. Mock runOnJSQueueThread to run synchronously
    doAnswer { invocation ->
          val runnable = invocation.arguments[0] as Runnable
          runnable.run()
          null
        }
        .whenever(reactContext)
        .runOnJSQueueThread(any<Runnable>())

    // 3. Initialize the module (registers the receiver)
    module.initialize()

    // 4. Access the private receiver via reflection
    val receiverField = TimeZoneModule::class.java.getDeclaredField("timeZoneChangeReceiver")
    receiverField.isAccessible = true
    val receiver = receiverField.get(module) as BroadcastReceiver

    // 5. Simulate timezone change broadcast
    receiver.onReceive(reactContext, Intent(Intent.ACTION_TIMEZONE_CHANGED))

    // 6. Verify that the JS context was accessed
    verify(catalystInstance).javaScriptContextHolder
    verify(jsContextHolder).get()

    // 7. Verify that resetHermesTimeZoneCache was called with correct JS context
    verify(module).resetHermesTimeZoneCache(12345L)
  }
}
