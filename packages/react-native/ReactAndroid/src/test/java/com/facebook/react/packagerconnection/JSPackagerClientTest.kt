package com.facebook.react.packagerconnection

import com.facebook.react.packagerconnection.ReconnectingWebSocket.ConnectionCallback
import java.io.IOException
import okio.ByteString
import okio.ByteString.Companion.encodeUtf8
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.`when` as whenever 
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class JSPackagerClientTest {
  private fun createRH(action: String, handler: RequestHandler): Map<String, RequestHandler> {
    val m: MutableMap<String, RequestHandler> = HashMap()
    m[action] = handler
    return m
  }

  private lateinit var settings: PackagerConnectionSettings

  @Before
  fun setup() {
    mSettings = mock(PackagerConnectionSettings::class.java)
    `when`(mSettings.debugServerHost).thenReturn("ws://not_needed")
    `when`(mSettings.packageName).thenReturn("my_test_package")
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_ShouldTriggerNotification() {
    val handler = mock(RequestHandler::class.java)
    val client = JSPackagerClient("test_client", mSettings, createRH("methodValue", handler))

    client.onMessage(
      """{"version": 2, "method": "methodValue", "params": "paramsValue"}"""
    )
    verify(handler).onNotification(eq("paramsValue"))
    verify(handler, never()).onRequest(any(), any(Responder::class.java))
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_ShouldTriggerRequest() {
    val handler = mock(RequestHandler::class.java)
    val client = JSPackagerClient("test_client", mSettings, createRH("methodValue", handler))

    client.onMessage(
      """{"version": 2, "id": "idValue", "method": "methodValue", "params": "paramsValue"}"""
    )
    verify(handler, never()).onNotification(any())
    verify(handler).onRequest(eq("paramsValue"), any(Responder::class.java))
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_WithoutParams_ShouldTriggerNotification() {
    val handler = mock(RequestHandler::class.java)
    val client = JSPackagerClient("test_client", mSettings, createRH("methodValue", handler))

    client.onMessage("""{"version": 2, "method": "methodValue"}""")
    verify(handler).onNotification(eq<Any?>(null))
    verify(handler, never()).onRequest(any(), any(Responder::class.java))
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_WithInvalidContentType_ShouldNotTriggerCallback() {
    val handler = mock(RequestHandler::class.java)
    val client = JSPackagerClient("test_client", mSettings, createRH("methodValue", handler))

    client.onMessage("""{"version": 2, "method": "methodValue"}""".encodeUtf8())
    verify(handler, never()).onNotification(any())
    verify(handler, never()).onRequest(any(), any(Responder::class.java))
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_WithoutMethod_ShouldNotTriggerCallback() {
    val handler = mock(RequestHandler::class.java)
    val client = JSPackagerClient("test_client", mSettings, createRH("methodValue", handler))

    client.onMessage("""{"version": 2}""")
    verify(handler, never()).onNotification(any())
    verify(handler, never()).onRequest(any(), any(Responder::class.java))
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_With_Null_Action_ShouldNotTriggerCallback() {
    val handler = mock(RequestHandler::class.java)
    val client = JSPackagerClient("test_client", mSettings, createRH("methodValue", handler))

    client.onMessage("""{"version": 2, "method": null}""")
    verify(handler, never()).onNotification(any())
    verify(handler, never()).onRequest(any(), any(Responder::class.java))
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_WithInvalidMethod_ShouldNotTriggerCallback() {
    val handler = mock(RequestHandler::class.java)
    val client = JSPackagerClient("test_client", mSettings, createRH("methodValue", handler))

    client.onMessage(ByteString.EMPTY)
    verify(handler, never()).onNotification(any())
    verify(handler, never()).onRequest(any(), any(Responder::class.java))
  }

  @Test
  @Throws(IOException::class)
  fun test_onMessage_WrongVersion_ShouldNotTriggerCallback() {
    val handler = mock(RequestHandler::class.java)
    val client = JSPackagerClient("test_client", mSettings, createRH("methodValue", handler))

    client.onMessage("""{"version": 1, "method": "methodValue"}""")
    verify(handler, never()).onNotification(any())
    verify(handler, never()).onRequest(any(), any(Responder::class.java))
  }

  @Test
  @Throws(IOException::class)
  fun test_onDisconnection_ShouldTriggerDisconnectionCallback() {
    val connectionHandler = mock(ConnectionCallback::class.java)
    val handler = mock(RequestHandler::class.java)
    val client = JSPackagerClient("test_client", mSettings, HashMap(), connectionHandler)

    client.close()

    verify(connectionHandler, never()).onConnected()
    verify(connectionHandler, times(1)).onDisconnected()

    verify(handler, never()).onNotification(any())
    verify(handler, never()).onRequest(any(), any(Responder::class.java))
  }
}
