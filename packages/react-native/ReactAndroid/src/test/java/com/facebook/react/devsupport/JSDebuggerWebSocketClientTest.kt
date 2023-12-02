/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import com.facebook.react.common.JavascriptException
import com.facebook.react.devsupport.JSDebuggerWebSocketClient.JSDebuggerCallback
import okhttp3.WebSocket
import okio.ByteString
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.anyInt
import org.mockito.ArgumentMatchers.eq
import org.mockito.ArgumentMatchers.isA
import org.mockito.ArgumentMatchers.nullable
import org.mockito.Mockito.mock
import org.mockito.Mockito.never
import org.mockito.Mockito.spy
import org.mockito.Mockito.verify
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class JSDebuggerWebSocketClientTest {

  @Test
  fun test_prepareJSRuntime_ShouldSendCorrectMessage() {
    val cb = mock(JSDebuggerCallback::class.java)
    val client = spy(JSDebuggerWebSocketClient())
    client.prepareJSRuntime(cb)
    verify(client).sendMessage(0, "{\"id\":0,\"method\":\"prepareJSRuntime\"}")
  }

  @Test
  fun test_loadBundle_ShouldSendCorrectMessage() {
    val cb = mock(JSDebuggerCallback::class.java)
    val client = spy(JSDebuggerWebSocketClient())
    val injectedObjects = mapOf("key1" to "value1", "key2" to "value2")
    client.loadBundle(
        "http://localhost:8080/index.js", injectedObjects as HashMap<String, String>?, cb)
    verify(client)
        .sendMessage(
            0,
            "{\"id\":0,\"method\":\"executeApplicationScript\",\"url\":\"http://localhost:8080/index.js\"" +
                ",\"inject\":{\"key1\":\"value1\",\"key2\":\"value2\"}}")
  }

  @Test
  fun test_executeJSCall_ShouldSendCorrectMessage() {
    val cb = mock(JSDebuggerCallback::class.java)
    val client = spy(JSDebuggerWebSocketClient())
    client.executeJSCall("foo", "[1,2,3]", cb)
    verify(client).sendMessage(0, "{\"id\":0,\"method\":\"foo\",\"arguments\":[1,2,3]}")
  }

  @Test
  fun test_onMessage_WithInvalidContentType_ShouldNotTriggerCallbacks() {

    val client = spy(JSDebuggerWebSocketClient())
    client.onMessage(mock(WebSocket::class.java), encodeUtf8("{\"replyID\":0, \"result\":\"OK\"}"))
    verify(client, never()).triggerRequestSuccess(anyInt(), nullable(String::class.java))
    verify(client, never()).triggerRequestFailure(anyInt(), any())
  }

  @Test
  fun test_onMessage_WithoutReplyId_ShouldNotTriggerCallbacks() {
    val client = spy(JSDebuggerWebSocketClient())
    client.onMessage(null, "{\"result\":\"OK\"}")
    verify(client, never()).triggerRequestSuccess(anyInt(), nullable(String::class.java))
    verify(client, never()).triggerRequestFailure(anyInt(), any())
  }

  @Test
  fun test_onMessage_With_Null_ReplyId_ShouldNotTriggerCallbacks() {
    val client = spy(JSDebuggerWebSocketClient())
    client.onMessage(null, "{\"replyID\":null, \"result\":\"OK\"}")
    verify(client, never()).triggerRequestSuccess(anyInt(), nullable(String::class.java))
    verify(client, never()).triggerRequestFailure(anyInt(), any())
  }

  @Test
  fun test_onMessage_WithResult_ShouldTriggerRequestSuccess() {
    val client = spy(JSDebuggerWebSocketClient())
    client.onMessage(null, "{\"replyID\":0, \"result\":\"OK\"}")
    verify(client).triggerRequestSuccess(0, "OK")
    verify(client, never()).triggerRequestFailure(anyInt(), any())
  }

  @Test
  fun test_onMessage_With_Null_Result_ShouldTriggerRequestSuccess() {
    val client = spy(JSDebuggerWebSocketClient())
    client.onMessage(null, "{\"replyID\":0, \"result\":null}")
    verify(client).triggerRequestSuccess(0, null)
    verify(client, never()).triggerRequestFailure(anyInt(), any())
  }

  @Test
  fun test_onMessage_WithError_ShouldCallAbort() {
    val client = spy(JSDebuggerWebSocketClient())
    client.onMessage(null, "{\"replyID\":0, \"error\":\"BOOM\"}")
    verify(client).abort(eq("BOOM"), isA(JavascriptException::class.java))
  }

  @Test
  fun test_onMessage_With_Null_Error_ShouldTriggerRequestSuccess() {
    val client = spy(JSDebuggerWebSocketClient())
    client.onMessage(null, "{\"replyID\":0, \"error\":null}")
    verify(client).triggerRequestSuccess(anyInt(), nullable(String::class.java))
  }

  private fun encodeUtf8(input: String): ByteString =
      ByteString.of(*input.toByteArray(Charsets.UTF_8))
}
