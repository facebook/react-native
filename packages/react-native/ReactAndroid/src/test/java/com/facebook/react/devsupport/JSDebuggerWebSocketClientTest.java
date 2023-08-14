/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;

import com.facebook.react.common.JavascriptException;
import java.util.HashMap;
import okhttp3.WebSocket;
import okio.ByteString;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
@Ignore("Ignored due to unsupported mocking mechanism with JDK 18")
public class JSDebuggerWebSocketClientTest {

  @Test
  public void test_prepareJSRuntime_ShouldSendCorrectMessage() throws Exception {
    final JSDebuggerWebSocketClient.JSDebuggerCallback cb =
        mock(JSDebuggerWebSocketClient.JSDebuggerCallback.class);

    JSDebuggerWebSocketClient client = spy(new JSDebuggerWebSocketClient());
    client.prepareJSRuntime(cb);
    verify(client).sendMessage(0, "{\"id\":0,\"method\":\"prepareJSRuntime\"}");
  }

  @Test
  public void test_loadBundle_ShouldSendCorrectMessage() throws Exception {
    final JSDebuggerWebSocketClient.JSDebuggerCallback cb =
        mock(JSDebuggerWebSocketClient.JSDebuggerCallback.class);

    JSDebuggerWebSocketClient client = spy(new JSDebuggerWebSocketClient());
    HashMap<String, String> injectedObjects = new HashMap<>();
    injectedObjects.put("key1", "value1");
    injectedObjects.put("key2", "value2");

    client.loadBundle("http://localhost:8080/index.js", injectedObjects, cb);
    verify(client)
        .sendMessage(
            0,
            "{\"id\":0,\"method\":\"executeApplicationScript\",\"url\":\"http://localhost:8080/index.js\""
                + ",\"inject\":{\"key1\":\"value1\",\"key2\":\"value2\"}}");
  }

  @Test
  public void test_executeJSCall_ShouldSendCorrectMessage() throws Exception {
    final JSDebuggerWebSocketClient.JSDebuggerCallback cb =
        mock(JSDebuggerWebSocketClient.JSDebuggerCallback.class);

    JSDebuggerWebSocketClient client = spy(new JSDebuggerWebSocketClient());

    client.executeJSCall("foo", "[1,2,3]", cb);
    verify(client).sendMessage(0, "{\"id\":0,\"method\":\"foo\",\"arguments\":[1,2,3]}");
  }

  @Test
  public void test_onMessage_WithInvalidContentType_ShouldNotTriggerCallbacks() throws Exception {
    JSDebuggerWebSocketClient client = spy(new JSDebuggerWebSocketClient());

    client.onMessage(
        mock(WebSocket.class), ByteString.encodeUtf8("{\"replyID\":0, \"result\":\"OK\"}"));
    verify(client, never()).triggerRequestSuccess(anyInt(), nullable(String.class));
    verify(client, never()).triggerRequestFailure(anyInt(), any());
  }

  @Test
  public void test_onMessage_WithoutReplyId_ShouldNotTriggerCallbacks() throws Exception {
    JSDebuggerWebSocketClient client = spy(new JSDebuggerWebSocketClient());

    client.onMessage(null, "{\"result\":\"OK\"}");
    verify(client, never()).triggerRequestSuccess(anyInt(), nullable(String.class));
    verify(client, never()).triggerRequestFailure(anyInt(), any());
  }

  @Test
  public void test_onMessage_With_Null_ReplyId_ShouldNotTriggerCallbacks() throws Exception {
    JSDebuggerWebSocketClient client = spy(new JSDebuggerWebSocketClient());

    client.onMessage(null, "{\"replyID\":null, \"result\":\"OK\"}");
    verify(client, never()).triggerRequestSuccess(anyInt(), nullable(String.class));
    verify(client, never()).triggerRequestFailure(anyInt(), any());
  }

  @Test
  public void test_onMessage_WithResult_ShouldTriggerRequestSuccess() throws Exception {
    JSDebuggerWebSocketClient client = spy(new JSDebuggerWebSocketClient());

    client.onMessage(null, "{\"replyID\":0, \"result\":\"OK\"}");
    verify(client).triggerRequestSuccess(0, "OK");
    verify(client, never()).triggerRequestFailure(anyInt(), any());
  }

  @Test
  public void test_onMessage_With_Null_Result_ShouldTriggerRequestSuccess() throws Exception {
    JSDebuggerWebSocketClient client = spy(new JSDebuggerWebSocketClient());

    client.onMessage(null, "{\"replyID\":0, \"result\":null}");
    verify(client).triggerRequestSuccess(0, null);
    verify(client, never()).triggerRequestFailure(anyInt(), any());
  }

  @Test
  public void test_onMessage_WithError_ShouldCallAbort() throws Exception {
    JSDebuggerWebSocketClient client = spy(new JSDebuggerWebSocketClient());

    client.onMessage(null, "{\"replyID\":0, \"error\":\"BOOM\"}");
    verify(client).abort(eq("BOOM"), isA(JavascriptException.class));
  }

  @Test
  public void test_onMessage_With_Null_Error_ShouldTriggerRequestSuccess() throws Exception {
    JSDebuggerWebSocketClient client = spy(new JSDebuggerWebSocketClient());

    client.onMessage(null, "{\"replyID\":0, \"error\":null}");
    verify(client).triggerRequestSuccess(anyInt(), nullable(String.class));
  }
}
