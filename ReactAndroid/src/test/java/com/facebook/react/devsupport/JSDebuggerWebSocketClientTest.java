/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import com.facebook.react.common.JavascriptException;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

import java.util.HashMap;

import okio.ByteString;

import static org.mockito.Mockito.*;

@PrepareForTest({ JSDebuggerWebSocketClient.class })
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class JSDebuggerWebSocketClientTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  @Test
  public void test_prepareJSRuntime_ShouldSendCorrectMessage() throws Exception {
    final JSDebuggerWebSocketClient.JSDebuggerCallback cb =
      PowerMockito.mock(JSDebuggerWebSocketClient.JSDebuggerCallback.class);

    JSDebuggerWebSocketClient client = PowerMockito.spy(new JSDebuggerWebSocketClient());
    client.prepareJSRuntime(cb);
    PowerMockito.verifyPrivate(client).invoke("sendMessage", 0,
      "{\"id\":0,\"method\":\"prepareJSRuntime\"}");
  }

  @Test
  public void test_loadApplicationScript_ShouldSendCorrectMessage() throws Exception {
    final JSDebuggerWebSocketClient.JSDebuggerCallback cb =
      PowerMockito.mock(JSDebuggerWebSocketClient.JSDebuggerCallback.class);

    JSDebuggerWebSocketClient client = PowerMockito.spy(new JSDebuggerWebSocketClient());
    HashMap<String, String> injectedObjects = new HashMap<>();
    injectedObjects.put("key1", "value1");
    injectedObjects.put("key2", "value2");

    client.loadApplicationScript("http://localhost:8080/index.js", injectedObjects, cb);
    PowerMockito.verifyPrivate(client).invoke("sendMessage", 0,
      "{\"id\":0,\"method\":\"executeApplicationScript\",\"url\":\"http://localhost:8080/index.js\"" +
      ",\"inject\":{\"key1\":\"value1\",\"key2\":\"value2\"}}");
  }

  @Test
  public void test_executeJSCall_ShouldSendCorrectMessage() throws Exception {
    final JSDebuggerWebSocketClient.JSDebuggerCallback cb =
      PowerMockito.mock(JSDebuggerWebSocketClient.JSDebuggerCallback.class);

    JSDebuggerWebSocketClient client = PowerMockito.spy(new JSDebuggerWebSocketClient());

    client.executeJSCall("foo", "[1,2,3]", cb);
    PowerMockito.verifyPrivate(client).invoke("sendMessage", 0,
      "{\"id\":0,\"method\":\"foo\",\"arguments\":[1,2,3]}");
  }

  @Test
  public void test_onMessage_WithInvalidContentType_ShouldNotTriggerCallbacks() throws Exception {
    JSDebuggerWebSocketClient client = PowerMockito.spy(new JSDebuggerWebSocketClient());

    client.onMessage(null, ByteString.encodeUtf8("{\"replyID\":0, \"result\":\"OK\"}"));
    PowerMockito.verifyPrivate(client, never()).invoke("triggerRequestSuccess", anyInt(), anyString());
    PowerMockito.verifyPrivate(client, never()).invoke("triggerRequestFailure", anyInt(), any());
  }

  @Test
  public void test_onMessage_WithoutReplyId_ShouldNotTriggerCallbacks() throws Exception {
    JSDebuggerWebSocketClient client = PowerMockito.spy(new JSDebuggerWebSocketClient());

    client.onMessage(null, "{\"result\":\"OK\"}");
    PowerMockito.verifyPrivate(client, never()).invoke("triggerRequestSuccess", anyInt(), anyString());
    PowerMockito.verifyPrivate(client, never()).invoke("triggerRequestFailure", anyInt(), any());
  }

  @Test
  public void test_onMessage_With_Null_ReplyId_ShouldNotTriggerCallbacks() throws Exception {
    JSDebuggerWebSocketClient client = PowerMockito.spy(new JSDebuggerWebSocketClient());

    client.onMessage(null, "{\"replyID\":null, \"result\":\"OK\"}");
    PowerMockito.verifyPrivate(client, never()).invoke("triggerRequestSuccess", anyInt(), anyString());
    PowerMockito.verifyPrivate(client, never()).invoke("triggerRequestFailure", anyInt(), any());
  }

  @Test
  public void test_onMessage_WithResult_ShouldTriggerRequestSuccess() throws Exception {
    JSDebuggerWebSocketClient client = PowerMockito.spy(new JSDebuggerWebSocketClient());

    client.onMessage(null, "{\"replyID\":0, \"result\":\"OK\"}");
    PowerMockito.verifyPrivate(client).invoke("triggerRequestSuccess", 0, "OK");
    PowerMockito.verifyPrivate(client, never()).invoke("triggerRequestFailure", anyInt(), any());
  }

  @Test
  public void test_onMessage_With_Null_Result_ShouldTriggerRequestSuccess() throws Exception {
    JSDebuggerWebSocketClient client = PowerMockito.spy(new JSDebuggerWebSocketClient());

    client.onMessage(null, "{\"replyID\":0, \"result\":null}");
    PowerMockito.verifyPrivate(client).invoke("triggerRequestSuccess", 0, null);
    PowerMockito.verifyPrivate(client, never()).invoke("triggerRequestFailure", anyInt(), any());
  }

  @Test
  public void test_onMessage_WithError_ShouldCallAbort() throws Exception {
    JSDebuggerWebSocketClient client = PowerMockito.spy(new JSDebuggerWebSocketClient());

    client.onMessage(null, "{\"replyID\":0, \"error\":\"BOOM\"}");
    PowerMockito.verifyPrivate(client).invoke("abort", eq("BOOM"), isA(JavascriptException.class));
  }

  @Test
  public void test_onMessage_With_Null_Error_ShouldTriggerRequestSuccess() throws Exception {
    JSDebuggerWebSocketClient client = PowerMockito.spy(new JSDebuggerWebSocketClient());

    client.onMessage(null, "{\"replyID\":0, \"error\":null}");
    PowerMockito.verifyPrivate(client).invoke("triggerRequestSuccess", anyInt(), anyString());
  }
}
