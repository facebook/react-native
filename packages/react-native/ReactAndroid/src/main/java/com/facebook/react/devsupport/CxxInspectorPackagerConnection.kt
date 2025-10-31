/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.os.Handler
import android.os.Looper
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.soloader.SoLoader
import java.io.Closeable
import java.util.ArrayDeque
import java.util.Queue
import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener

/** Java wrapper around a C++ InspectorPackagerConnection. */
@DoNotStripAny
internal class CxxInspectorPackagerConnection(
    url: String,
    deviceName: String,
    packageName: String,
) : IInspectorPackagerConnection {
  @DoNotStrip private val mHybridData: HybridData

  init {
    mHybridData = initHybrid(url, deviceName, packageName, DelegateImpl())
  }

  external override fun connect()

  external override fun closeQuietly()

  external override fun sendEventToAllConnections(event: String?)

  /** Java wrapper around a C++ IWebSocketDelegate, allowing us to call the interface from Java. */
  @DoNotStrip
  private class WebSocketDelegate @DoNotStrip constructor(private val mHybridData: HybridData) :
      Closeable {
    external fun didFailWithError(posixCode: Int?, error: String?)

    external fun didReceiveMessage(message: String?)

    external fun didOpen()

    external fun didClose()

    /**
     * Release the C++ part of the hybrid WebSocketDelegate object. This should be called when the
     * delegate is not needed anymore ( = the socket will not send more events).
     */
    override fun close() {
      mHybridData.resetNative()
    }
  }

  /**
   * Java counterpart of the C++ IWebSocket interface, allowing us to implement the interface in
   * Java.
   */
  @DoNotStripAny
  private interface IWebSocket : Closeable {
    fun send(message: String)

    /**
     * Close the WebSocket connection. NOTE: There is no close() method in the C++ interface.
     * Instead, this method is called when the IWebSocket is destroyed on the C++ side.
     */
    override fun close()
  }

  /**
   * A simple WebSocket wrapper that prevents having more than 16MiB of messages queued
   * simultaneously. This is done to stop OkHttp from closing the WebSocket connection.
   *
   * https://github.com/facebook/react-native/issues/39651.
   * https://github.com/square/okhttp/blob/4e7dbec1ea6c9cf8d80422ac9d44b9b185c749a3/okhttp/src/commonJvmAndroid/kotlin/okhttp3/internal/ws/RealWebSocket.kt#L684.
   */
  private class WebSocketImpl(private val webSocket: WebSocket, private val handler: Handler) :
      IWebSocket {
    private val queueSizeThreshold = 16L * 1024 * 1024 // 16MiB
    private val messageQueue: Queue<String> = ArrayDeque()
    private val queueLock = Any()
    private val drainRunnable =
        object : Runnable {
          override fun run() {
            tryDrainQueue()
          }
        }

    override fun send(message: String) {
      synchronized(queueLock) {
        val messageSize = message.toByteArray(Charsets.UTF_8).size
        val currentQueueSize = webSocket.queueSize()

        if (currentQueueSize + messageSize > queueSizeThreshold) {
          messageQueue.offer(message)
          scheduleDrain()
        } else {
          webSocket.send(message)
          tryDrainQueue()
        }
      }
    }

    override fun close() {
      synchronized(queueLock) {
        handler.removeCallbacks(drainRunnable)
        messageQueue.clear()
        webSocket.close(1000, "End of session")
      }
    }

    private fun tryDrainQueue() {
      synchronized(queueLock) {
        while (messageQueue.isNotEmpty()) {
          val nextMessage = messageQueue.peek() ?: break
          val messageSize = nextMessage.toByteArray(Charsets.UTF_8).size
          val currentQueueSize = webSocket.queueSize()

          if (currentQueueSize + messageSize <= queueSizeThreshold) {
            messageQueue.poll()
            webSocket.send(nextMessage)
          } else {
            scheduleDrain()
            break
          }
        }
      }
    }

    private fun scheduleDrain() {
      handler.removeCallbacks(drainRunnable)
      handler.postDelayed(drainRunnable, 100)
    }
  }

  /** Java implementation of the C++ InspectorPackagerConnectionDelegate interface. */
  private class DelegateImpl {
    private val httpClient =
        OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .readTimeout(0, TimeUnit.MINUTES) // Disable timeouts for read
            .build()

    private val handler = Handler(Looper.getMainLooper())

    @Suppress("unused")
    @DoNotStrip
    fun connectWebSocket(urlParam: String?, delegate: WebSocketDelegate): IWebSocket {
      val url = requireNotNull(urlParam)
      val request = Request.Builder().url(url).build()
      val webSocket =
          httpClient.newWebSocket(
              request,
              object : WebSocketListener() {
                override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                  scheduleCallback(
                      {
                        val message = t.message
                        delegate.didFailWithError(null, message ?: "<Unknown error>")
                        // "No further calls to this listener will be made." -OkHttp docs for
                        // WebSocketListener.onFailure
                        delegate.close()
                      },
                      delayMs = 0,
                  )
                }

                override fun onMessage(webSocket: WebSocket, text: String) {
                  scheduleCallback({ delegate.didReceiveMessage(text) }, delayMs = 0)
                }

                override fun onOpen(webSocket: WebSocket, response: Response) {
                  scheduleCallback({ delegate.didOpen() }, delayMs = 0)
                }

                override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                  scheduleCallback(
                      {
                        delegate.didClose()
                        // "No further calls to this listener will be made." -OkHttp docs for
                        // WebSocketListener.onClosed
                        delegate.close()
                      },
                      delayMs = 0,
                  )
                }
              },
          )

      return WebSocketImpl(webSocket, handler)
    }

    @DoNotStrip
    fun scheduleCallback(runnable: Runnable, delayMs: Long) {
      handler.postDelayed(runnable, delayMs)
    }
  }

  companion object {
    init {
      SoLoader.loadLibrary("react_devsupportjni")
    }

    @JvmStatic
    private external fun initHybrid(
        url: String,
        deviceName: String,
        packageName: String,
        delegate: DelegateImpl,
    ): HybridData
  }
}
