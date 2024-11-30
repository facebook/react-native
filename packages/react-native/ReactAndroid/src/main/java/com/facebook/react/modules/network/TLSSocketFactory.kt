/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import java.io.IOException
import java.net.InetAddress
import java.net.Socket
import java.net.UnknownHostException
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLSocket
import javax.net.ssl.SSLSocketFactory

/**
 * This class is needed for TLS 1.2 support on Android 4.x
 *
 * Source: http://blog.dev-area.net/2015/08/13/android-4-1-enable-tls-1-1-and-tls-1-2/
 */
public class TLSSocketFactory : SSLSocketFactory() {

  private val delegate: SSLSocketFactory

  init {
    val context = SSLContext.getInstance("TLS")
    context.init(null, null, null)
    delegate = context.socketFactory
  }

  override fun getDefaultCipherSuites(): Array<String> = delegate.defaultCipherSuites

  override fun getSupportedCipherSuites(): Array<String> = delegate.supportedCipherSuites

  @Throws(IOException::class)
  override fun createSocket(s: Socket, host: String, port: Int, autoClose: Boolean): Socket =
      enableTLSOnSocket(delegate.createSocket(s, host, port, autoClose))

  @Throws(IOException::class, UnknownHostException::class)
  override fun createSocket(host: String?, port: Int): Socket =
      enableTLSOnSocket(delegate.createSocket(host, port))

  @Throws(IOException::class, UnknownHostException::class)
  override fun createSocket(
      host: String?,
      port: Int,
      localHost: InetAddress,
      localPort: Int
  ): Socket = enableTLSOnSocket(delegate.createSocket(host, port, localHost, localPort))

  @Throws(IOException::class)
  override fun createSocket(host: InetAddress, port: Int): Socket =
      enableTLSOnSocket(delegate.createSocket(host, port))

  @Throws(IOException::class)
  override fun createSocket(
      address: InetAddress,
      port: Int,
      localAddress: InetAddress,
      localPort: Int
  ): Socket? = enableTLSOnSocket(delegate.createSocket(address, port, localAddress, localPort))

  private fun enableTLSOnSocket(socket: Socket): Socket {
    (socket as? SSLSocket)?.enabledProtocols = arrayOf("TLSv1", "TLSv1.1", "TLSv1.2")
    return socket
  }
}
