/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.devsupport

import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback
import java.io.IOException
import java.util.Locale
import java.util.concurrent.TimeUnit
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response

/** Use this class to check if the JavaScript packager is running on the provided host. */
internal class PackagerStatusCheck {

  private val client: OkHttpClient

  constructor() {
    client =
        OkHttpClient.Builder()
            .connectTimeout(HTTP_CONNECT_TIMEOUT_MS.toLong(), TimeUnit.MILLISECONDS)
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .writeTimeout(0, TimeUnit.MILLISECONDS)
            .build()
  }

  constructor(client: OkHttpClient) {
    this.client = client
  }

  fun run(host: String, callback: PackagerStatusCallback): Unit {
    val statusURL = createPackagerStatusURL(host)
    val request = Request.Builder().url(statusURL).build()

    client
        .newCall(request)
        .enqueue(
            object : Callback {
              override fun onFailure(call: Call, e: IOException) {
                FLog.w(
                    ReactConstants.TAG,
                    "The packager does not seem to be running as we got an IOException requesting its status: ${e.message}")
                callback.onPackagerStatusFetched(false)
              }

              override fun onResponse(call: Call, response: Response) {
                if (!response.isSuccessful) {
                  FLog.e(
                      ReactConstants.TAG,
                      "Got non-success http code from packager when requesting status: ${response.code()}")
                  callback.onPackagerStatusFetched(false)
                  return
                }
                val body = response.body()
                if (body == null) {
                  FLog.e(
                      ReactConstants.TAG,
                      "Got null body response from packager when requesting status")
                  callback.onPackagerStatusFetched(false)
                  return
                }
                val bodyString =
                    body.string() // cannot call body.string() twice, stored it into variable.
                // https://github.com/square/okhttp/issues/1240#issuecomment-68142603
                if (PACKAGER_OK_STATUS != bodyString) {
                  FLog.e(
                      ReactConstants.TAG,
                      "Got unexpected response from packager when requesting status: $bodyString")
                  callback.onPackagerStatusFetched(false)
                  return
                }
                callback.onPackagerStatusFetched(true)
              }
            })
  }

  private companion object {
    private const val PACKAGER_OK_STATUS = "packager-status:running"
    private const val HTTP_CONNECT_TIMEOUT_MS = 5_000
    private const val PACKAGER_STATUS_URL_TEMPLATE = "http://%s/status"

    private fun createPackagerStatusURL(host: String): String =
        String.format(Locale.US, PACKAGER_STATUS_URL_TEMPLATE, host)
  }
}
