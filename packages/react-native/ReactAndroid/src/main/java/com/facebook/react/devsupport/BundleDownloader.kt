/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.devsupport

import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.react.common.DebugServerException
import com.facebook.react.common.DebugServerException.Companion.makeGeneric
import com.facebook.react.common.DebugServerException.Companion.parse
import com.facebook.react.common.ReactConstants
import com.facebook.react.devsupport.MultipartStreamReader.ChunkListener
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import java.io.File
import java.io.IOException
import java.util.regex.Pattern
import okhttp3.Call
import okhttp3.Callback
import okhttp3.Headers
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okio.Buffer
import okio.BufferedSource
import okio.Okio
import org.json.JSONException
import org.json.JSONObject

public class BundleDownloader public constructor(private val client: OkHttpClient) {
  private var downloadBundleFromURLCall: Call? = null

  public class BundleInfo public constructor() {
    internal var _url: String? = null
    public val url: String
      get() = _url ?: "unknown"

    public var filesChangedCount: Int = 0
      internal set

    public fun toJSONString(): String? =
        try {
          JSONObject()
              .apply {
                put("url", _url)
                put("filesChangedCount", filesChangedCount)
              }
              .toString()
        } catch (e: JSONException) {
          FLog.e(TAG, "Can't serialize bundle info: ", e)
          null
        }

    public companion object {
      @JvmStatic
      public fun fromJSONString(jsonStr: String?): BundleInfo? {
        if (jsonStr == null) {
          return null
        }
        return try {
          val obj = JSONObject(jsonStr)
          BundleInfo().apply {
            _url = obj.getString("url")
            filesChangedCount = obj.getInt("filesChangedCount")
          }
        } catch (e: JSONException) {
          FLog.e(TAG, "Invalid bundle info: ", e)
          null
        }
      }
    }
  }

  @JvmOverloads
  public fun downloadBundleFromURL(
      callback: DevBundleDownloadListener,
      outputFile: File,
      bundleURL: String?,
      bundleInfo: BundleInfo?,
      requestBuilder: Request.Builder = Request.Builder()
  ) {
    checkNotNull(bundleURL)
    val request = requestBuilder.url(bundleURL).addHeader("Accept", "multipart/mixed").build()
    downloadBundleFromURLCall = client.newCall(request)
    checkNotNull(downloadBundleFromURLCall)
        .enqueue(
            object : Callback {
              override fun onFailure(call: Call, e: IOException) {
                // ignore callback if call was cancelled
                if (downloadBundleFromURLCall == null ||
                    downloadBundleFromURLCall?.isCanceled() == true) {
                  downloadBundleFromURLCall = null
                  return
                }
                downloadBundleFromURLCall = null
                val url = call.request().url().toString()
                callback.onFailure(
                    makeGeneric(url, "Could not connect to development server.", "URL: $url", e))
              }

              @Throws(IOException::class)
              override fun onResponse(call: Call, response: Response) {
                response.use { resp ->
                  // ignore callback if call was cancelled
                  if (downloadBundleFromURLCall == null ||
                      downloadBundleFromURLCall?.isCanceled() == true) {
                    downloadBundleFromURLCall = null
                    return
                  }
                  downloadBundleFromURLCall = null

                  val url = resp.request().url().toString()
                  // Make sure the result is a multipart response and parse the boundary.
                  var contentType = resp.header("content-type")
                  if (contentType == null) {
                    // fallback to empty string for nullability
                    contentType = ""
                  }
                  val regex = Pattern.compile("multipart/mixed;.*boundary=\"([^\"]+)\"")
                  val match = regex.matcher(contentType)
                  if (contentType.isNotEmpty() && match.find()) {
                    val boundary = Assertions.assertNotNull(match.group(1))
                    processMultipartResponse(url, resp, boundary, outputFile, bundleInfo, callback)
                  } else {
                    // In case the server doesn't support multipart/mixed responses, fallback to
                    // normal
                    // download.
                    resp.body().use { body ->
                      if (body != null) {
                        processBundleResult(
                            url,
                            resp.code(),
                            resp.headers(),
                            body.source(),
                            outputFile,
                            bundleInfo,
                            callback)
                      }
                    }
                  }
                }
              }
            })
  }

  @Throws(IOException::class)
  private fun processMultipartResponse(
      url: String,
      response: Response,
      boundary: String,
      outputFile: File,
      bundleInfo: BundleInfo?,
      callback: DevBundleDownloadListener
  ) {
    if (response.body() == null) {
      callback.onFailure(
          DebugServerException(
              ("""
                    Error while reading multipart response.
                    
                    Response body was empty: ${response.code()}
                    
                    URL: $url
                    
                    
                    """
                  .trimIndent())))
      return
    }
    val source = checkNotNull(response.body()?.source())
    val bodyReader = MultipartStreamReader(source, boundary)
    val completed =
        bodyReader.readAllParts(
            object : ChunkListener {
              @Throws(IOException::class)
              override fun onChunkComplete(
                  headers: Map<String, String>,
                  body: Buffer,
                  isLastChunk: Boolean
              ) {
                // This will get executed for every chunk of the multipart response. The last chunk
                // (isLastChunk = true) will be the JS bundle, the other ones will be progress
                // events
                // encoded as JSON.
                if (isLastChunk) {
                  // The http status code for each separate chunk is in the X-Http-Status header.
                  var status = response.code()
                  if (headers.containsKey("X-Http-Status")) {
                    status = headers.getOrDefault("X-Http-Status", "0").toInt()
                  }
                  processBundleResult(
                      url, status, Headers.of(headers), body, outputFile, bundleInfo, callback)
                } else {
                  if (!headers.containsKey("Content-Type") ||
                      headers["Content-Type"] != "application/json") {
                    return
                  }

                  try {
                    val progress = JSONObject(body.readUtf8())
                    val status =
                        if (progress.has("status")) progress.getString("status") else "Bundling"
                    var done: Int? = null
                    if (progress.has("done")) {
                      done = progress.getInt("done")
                    }
                    var total: Int? = null
                    if (progress.has("total")) {
                      total = progress.getInt("total")
                    }
                    callback.onProgress(status, done, total)
                  } catch (e: JSONException) {
                    FLog.e(ReactConstants.TAG, "Error parsing progress JSON. $e")
                  }
                }
              }

              override fun onChunkProgress(
                  headers: Map<String, String>,
                  loaded: Long,
                  total: Long
              ) {
                if ("application/javascript" == headers["Content-Type"]) {
                  callback.onProgress(
                      "Downloading", (loaded / 1024).toInt(), (total / 1024).toInt())
                }
              }
            })
    if (!completed) {
      callback.onFailure(
          DebugServerException(
              ("""
                    Error while reading multipart response.
                    
                    Response code: ${response.code()}
                    
                    URL: $url
                    
                    
                    """
                  .trimIndent())))
    }
  }

  @Throws(IOException::class)
  private fun processBundleResult(
      url: String,
      statusCode: Int,
      headers: Headers,
      body: BufferedSource,
      outputFile: File,
      bundleInfo: BundleInfo?,
      callback: DevBundleDownloadListener
  ) {
    // Check for server errors. If the server error has the expected form, fail with more info.
    if (statusCode != 200) {
      val bodyString = body.readUtf8()
      val debugServerException = parse(url, bodyString)
      if (debugServerException != null) {
        callback.onFailure(debugServerException)
      } else {
        val sb = StringBuilder()
        sb.append("The development server returned response error code: ")
            .append(statusCode)
            .append("\n\n")
            .append("URL: ")
            .append(url)
            .append("\n\n")
            .append("Body:\n")
            .append(bodyString)
        callback.onFailure(DebugServerException(sb.toString()))
      }
      return
    }

    if (bundleInfo != null) {
      populateBundleInfo(url, headers, bundleInfo)
    }

    val tmpFile = File(outputFile.path + ".tmp")

    if (storePlainJSInFile(body, tmpFile)) {
      // If we have received a new bundle from the server, move it to its final destination.
      if (!tmpFile.renameTo(outputFile)) {
        throw IOException("Couldn't rename $tmpFile to $outputFile")
      }
    }

    callback.onSuccess()
  }

  public companion object {
    private const val TAG = "BundleDownloader"

    // Should be kept in sync with constants in RCTJavaScriptLoader.h
    private const val FILES_CHANGED_COUNT_NOT_BUILT_BY_BUNDLER = -2

    @Throws(IOException::class)
    private fun storePlainJSInFile(body: BufferedSource, outputFile: File): Boolean {
      Okio.sink(outputFile).use { it -> body.readAll(it) }
      return true
    }

    private fun populateBundleInfo(url: String, headers: Headers, bundleInfo: BundleInfo) {
      bundleInfo._url = url

      val filesChangedCountStr = headers["X-Metro-Files-Changed-Count"]
      if (filesChangedCountStr != null) {
        try {
          bundleInfo.filesChangedCount = filesChangedCountStr.toInt()
        } catch (e: NumberFormatException) {
          bundleInfo.filesChangedCount = FILES_CHANGED_COUNT_NOT_BUILT_BY_BUNDLER
          FLog.e(TAG, "Can't populate bundle info: ", e)
        }
      }
    }
  }
}
