/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection;

import com.facebook.react.packagerconnection.ReconnectingWebSocket.ConnectionCallback;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import okio.ByteString;

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

    client.onMessage("{\"version\": 2, \"method\": \"methodValue\", \"params\": \"paramsValue\"}");
    verify(handler).onNotification(eq("paramsValue"));
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }

  @Test
  public void test_onMessage_ShouldTriggerRequest() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage("{\"version\": 2, \"id\": \"idValue\", \"method\": \"methodValue\", \"params\": \"paramsValue\"}");
    verify(handler, never()).onNotification(any());
    verify(handler).onRequest(eq("paramsValue"), any(Responder.class));
  }

  @Test
  public void test_onMessage_WithoutParams_ShouldTriggerNotification() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage("{\"version\": 2, \"method\": \"methodValue\"}");
    verify(handler).onNotification(eq(null));
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }

  @Test
  public void test_onMessage_WithInvalidContentType_ShouldNotTriggerCallback() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage(ByteString.encodeUtf8("{\"version\": 2, \"method\": \"methodValue\"}"));
    verify(handler, never()).onNotification(any());
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }

  @Test
  public void test_onMessage_WithoutMethod_ShouldNotTriggerCallback() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage("{\"version\": 2}");
    verify(handler, never()).onNotification(any());
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }

  @Test
  public void test_onMessage_With_Null_Action_ShouldNotTriggerCallback() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage("{\"version\": 2, \"method\": null}");
    verify(handler, never()).onNotification(any());
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }

  @Test
  public void test_onMessage_WithInvalidMethod_ShouldNotTriggerCallback() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage(ByteString.EMPTY);
    verify(handler, never()).onNotification(any());
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }

  @Test
  public void test_onMessage_WrongVersion_ShouldNotTriggerCallback() throws IOException {
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client = new JSPackagerClient("test_client", mSettings, createRH("methodValue", handler));

    client.onMessage("{\"version\": 1, \"method\": \"methodValue\"}");
    verify(handler, never()).onNotification(any());
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }

  @Test
  public void test_onDisconnection_ShouldTriggerDisconnectionCallback() throws IOException {
    ConnectionCallback connectionHandler = mock(ConnectionCallback.class);
    RequestHandler handler = mock(RequestHandler.class);
    final JSPackagerClient client =
      new JSPackagerClient("test_client", mSettings, new HashMap<String,RequestHandler>(), connectionHandler);

    client.close();

    verify(connectionHandler, never()).onConnected();
    verify(connectionHandler, times(1)).onDisconnected();

    verify(handler, never()).onNotification(any());
    verify(handler, never()).onRequest(any(), any(Responder.class));
  }
}
