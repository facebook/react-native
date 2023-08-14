/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.devsupport

import com.facebook.react.common.JavascriptException
import com.facebook.react.devsupport.JSDebuggerWebSocketClient.JSDebuggerCallback
import java.util.HashMap
import okhttp3.WebSocket
import okio.ByteString.Companion.encodeUtf8
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers
import org.mockito.Mockito
import org.powermock.api.mockito.PowerMockito
import org.powermock.core.classloader.annotations.PowerMockIgnore
import org.powermock.core.classloader.annotations.PrepareForTest
import org.powermock.modules.junit4.rule.PowerMockRule
import org.robolectric.RobolectricTestRunner

@PrepareForTest(JSDebuggerWebSocketClient::class)
@RunWith(RobolectricTestRunner::class)
@PowerMockIgnore("org.mockito.*", "org.robolectric.*", "androidx.*", "android.*")
class JSDebuggerWebSocketClientTest {

  @get:Rule val rule = PowerMockRule()

  @Test
  fun test_prepareJSRuntime_ShouldSendCorrectMessage() {
    val cb = PowerMockito.mock(JSDebuggerCallback::class.java)
    val client = PowerMockito.spy(JSDebuggerWebSocketClient())
    client.prepareJSRuntime(cb)
    PowerMockito.verifyPrivate(client)
        .invoke("sendMessage", 0, "{\"id\":0,\"method\":\"prepareJSRuntime\"}")
  }

  @Test
  fun test_loadBundle_ShouldSendCorrectMessage() {
    val cb = PowerMockito.mock(JSDebuggerCallback::class.java)
    val client = PowerMockito.spy(JSDebuggerWebSocketClient())
    val injectedObjects = mapOf("key1" to "value1", "key2" to "value2")
    client.loadBundle(
        "http://localhost:8080/index.js", injectedObjects as HashMap<String, String>?, cb)
    PowerMockito.verifyPrivate(client)
        .invoke(
            "sendMessage",
            0,
            "{\"id\":0,\"method\":\"executeApplicationScript\",\"url\":\"http://localhost:8080/index.js\"" +
                ",\"inject\":{\"key1\":\"value1\",\"key2\":\"value2\"}}")
  }

  @Test
  fun test_executeJSCall_ShouldSendCorrectMessage() {
    val cb = PowerMockito.mock(JSDebuggerCallback::class.java)
    val client = PowerMockito.spy(JSDebuggerWebSocketClient())
    client.executeJSCall("foo", "[1,2,3]", cb)
    PowerMockito.verifyPrivate(client)
        .invoke("sendMessage", 0, "{\"id\":0,\"method\":\"foo\",\"arguments\":[1,2,3]}")
  }

  @Test
  fun test_onMessage_WithInvalidContentType_ShouldNotTriggerCallbacks() {

    val client = PowerMockito.spy(JSDebuggerWebSocketClient())
    client.onMessage(
        PowerMockito.mock(WebSocket::class.java), "{\"replyID\":0, \"result\":\"OK\"}".encodeUtf8())
    PowerMockito.verifyPrivate(client, Mockito.never())
        .invoke(
            "triggerRequestSuccess",
            ArgumentMatchers.anyInt(),
            ArgumentMatchers.nullable(String::class.java))
    PowerMockito.verifyPrivate(client, Mockito.never())
        .invoke("triggerRequestFailure", ArgumentMatchers.anyInt(), ArgumentMatchers.any())
  }

  @Test
  fun test_onMessage_WithoutReplyId_ShouldNotTriggerCallbacks() {
    val client = PowerMockito.spy(JSDebuggerWebSocketClient())
    client.onMessage(null, "{\"result\":\"OK\"}")
    PowerMockito.verifyPrivate(client, Mockito.never())
        .invoke(
            "triggerRequestSuccess",
            ArgumentMatchers.anyInt(),
            ArgumentMatchers.nullable(String::class.java))
    PowerMockito.verifyPrivate(client, Mockito.never())
        .invoke("triggerRequestFailure", ArgumentMatchers.anyInt(), ArgumentMatchers.any())
  }

  @Test
  fun test_onMessage_With_Null_ReplyId_ShouldNotTriggerCallbacks() {
    val client = PowerMockito.spy(JSDebuggerWebSocketClient())
    client.onMessage(null, "{\"replyID\":null, \"result\":\"OK\"}")
    PowerMockito.verifyPrivate(client, Mockito.never())
        .invoke(
            "triggerRequestSuccess",
            ArgumentMatchers.anyInt(),
            ArgumentMatchers.nullable(String::class.java))
    PowerMockito.verifyPrivate(client, Mockito.never())
        .invoke("triggerRequestFailure", ArgumentMatchers.anyInt(), ArgumentMatchers.any())
  }

  @Test
  fun test_onMessage_WithResult_ShouldTriggerRequestSuccess() {
    val client = PowerMockito.spy(JSDebuggerWebSocketClient())
    client.onMessage(null, "{\"replyID\":0, \"result\":\"OK\"}")
    PowerMockito.verifyPrivate(client).invoke("triggerRequestSuccess", 0, "OK")
    PowerMockito.verifyPrivate(client, Mockito.never())
        .invoke("triggerRequestFailure", ArgumentMatchers.anyInt(), ArgumentMatchers.any())
  }

  @Test
  fun test_onMessage_With_Null_Result_ShouldTriggerRequestSuccess() {
    val client = PowerMockito.spy(JSDebuggerWebSocketClient())
    client.onMessage(null, "{\"replyID\":0, \"result\":null}")
    PowerMockito.verifyPrivate(client).invoke("triggerRequestSuccess", 0, null)
    PowerMockito.verifyPrivate(client, Mockito.never())
        .invoke("triggerRequestFailure", ArgumentMatchers.anyInt(), ArgumentMatchers.any())
  }

  @Test
  fun test_onMessage_WithError_ShouldCallAbort() {
    val client = PowerMockito.spy(JSDebuggerWebSocketClient())
    client.onMessage(null, "{\"replyID\":0, \"error\":\"BOOM\"}")
    PowerMockito.verifyPrivate(client)
        .invoke(
            "abort",
            ArgumentMatchers.eq("BOOM"),
            ArgumentMatchers.isA(JavascriptException::class.java))
  }

  @Test
  fun test_onMessage_With_Null_Error_ShouldTriggerRequestSuccess() {
    val client = PowerMockito.spy(JSDebuggerWebSocketClient())
    client.onMessage(null, "{\"replyID\":0, \"error\":null}")
    PowerMockito.verifyPrivate(client)
        .invoke(
            "triggerRequestSuccess",
            ArgumentMatchers.anyInt(),
            ArgumentMatchers.nullable(String::class.java))
  }
}
