/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.packagerconnection;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import okhttp3.ResponseBody;
import okhttp3.ws.WebSocket;

import static org.mockito.Mockito.*;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class JSPackagerClientTest {
  private static Map<String, RequestHandler> createRH(
      String action, RequestHandler handler) {
    Map<String, RequestHandler> m =
      new HashMap<String, RequestHandler>();
    m.put(action, handler);
    return m;
  }

  private PackagerConnectionSettings mSettings;

  @Before
  public void setUp() {
    mSettings = mock(PackagerConnectionSettings.class);
    when(mSettings.getDebugServerHost()).thenReturn("ws://not_needed");
    when(mSettings.getPackageName()).thenReturn("my_test_package");
  }

  @Test
  public void test_onMessage_ShouldTriggerNotification() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage(
        ResponseBody.create(
          WebSocket.TEXT,
          "{\"version\": 2, \"method\": \"methodValue\", \"params\": \"paramsValue\"}"));
    verify(handler).onNotification(eq("paramsValue"));
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }

  @Test
  public void test_onMessage_ShouldTriggerRequest() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage(
        ResponseBody.create(
          WebSocket.TEXT,
          "{\"version\": 2, \"id\": \"idValue\", \"method\": \"methodValue\", \"params\": \"paramsValue\"}"));
    verify(handler, never()).onNotification(any());
    verify(handler).onRequest(eq("paramsValue"), any(Responder.class));
  }

  @Test
  public void test_onMessage_WithoutParams_ShouldTriggerNotification() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage(
        ResponseBody.create(
          WebSocket.TEXT,
          "{\"version\": 2, \"method\": \"methodValue\"}"));
    verify(handler).onNotification(eq(null));
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }

  @Test
  public void test_onMessage_WithInvalidContentType_ShouldNotTriggerCallback() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage(
        ResponseBody.create(
          WebSocket.BINARY,
          "{\"version\": 2, \"method\": \"methodValue\"}"));
    verify(handler, never()).onNotification(any());
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }

  @Test
  public void test_onMessage_WithoutMethod_ShouldNotTriggerCallback() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage(
        ResponseBody.create(
          WebSocket.TEXT,
          "{\"version\": 2}"));
    verify(handler, never()).onNotification(any());
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }

  @Test
  public void test_onMessage_With_Null_Action_ShouldNotTriggerCallback() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage(
        ResponseBody.create(
          WebSocket.TEXT,
          "{\"version\": 2, \"method\": null}"));
    verify(handler, never()).onNotification(any());
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }

  @Test
  public void test_onMessage_WithInvalidMethod_ShouldNotTriggerCallback() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage(
        ResponseBody.create(
          WebSocket.BINARY,
          "{\"version\": 2, \"method\": \"methodValue2\"}"));
    verify(handler, never()).onNotification(any());
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }

  @Test
  public void test_onMessage_WrongVersion_ShouldNotTriggerCallback() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage(
        ResponseBody.create(
          WebSocket.TEXT,
          "{\"version\": 1, \"method\": \"methodValue\"}"));
    verify(handler, never()).onNotification(any());
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }
}
