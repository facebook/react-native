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
import okio.BufferedSink
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
      requestBuilder: Request.Builder = Request.Builder(),
  ) {
    checkNotNull(bundleURL)
    val request = requestBuilder.url(bundleURL).addHeader("Accept", "multipart/mixed").build()
    downloadBundleFromURLCall = client.newCall(request)
    checkNotNull(downloadBundleFromURLCall)
        .enqueue(
            object : Callback {
              override fun onFailure(call: Call, e: IOException) {
                // ignore callback if call was cancelled
                if (
                    downloadBundleFromURLCall == null ||
                        downloadBundleFromURLCall?.isCanceled() == true
                ) {
                  downloadBundleFromURLCall = null
                  return
                }
                downloadBundleFromURLCall = null
                val url = call.request().url().toString()
                callback.onFailure(
                    makeGeneric(url, "Could not connect to development server.", "URL: $url", e)
                )
              }

              @Throws(IOException::class)
              override fun onResponse(call: Call, response: Response) {
                response.use { resp ->
                  // ignore callback if call was cancelled
                  if (
                      downloadBundleFromURLCall == null ||
                          downloadBundleFromURLCall?.isCanceled() == true
                  ) {
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
                            callback,
                        )
                      }
                    }
                  }
                }
              }
            }
        )
  }

  @Throws(IOException::class)
  private fun processMultipartResponse(
      url: String,
      response: Response,
      boundary: String,
      outputFile: File,
      bundleInfo: BundleInfo?,
      callback: DevBundleDownloadListener,
  ) {
    if (response.body() == null) {
      callback.onFailure(
          DebugServerException(
              ("""
                    Error while reading multipart response.

                    Response body was empty: ${response.code()}

                    URL: $url


                    """
                  .trimIndent())
          )
      )
      return
    }
    val source = checkNotNull(response.body()?.source())
    val bodyReader = MultipartStreamReader(source, boundary)
    val tmpFile = File(outputFile.path + ".tmp")
    val streamingHandler =
        StreamingBundleChunkListener(
            url = url,
            outerStatus = response.code(),
            outputFile = outputFile,
            tmpFile = tmpFile,
            bundleInfo = bundleInfo,
            callback = callback,
        )
    val completed: Boolean =
        try {
          bodyReader.readAllParts(streamingHandler)
        } finally {
          streamingHandler.closeOpenSinkQuietly()
        }
    if (!completed) {
      // If we partially wrote a tmp file before the upstream died, scrap it so we don't leave
      // half-baked bundles on disk.
      if (tmpFile.exists()) {
        tmpFile.delete()
      }
      callback.onFailure(
          DebugServerException(
              ("""
                    Error while reading multipart response.

                    Response code: ${response.code()}

                    URL: $url


                    """
                  .trimIndent())
          )
      )
    }
  }

  /**
   * Routes multipart chunks for a bundle download. The JS bundle chunk (Content-Type
   * `application/javascript` with an effective HTTP status of 200) is streamed directly into
   * a temporary file via a [BufferedSink], so no copy of the body is held in heap. Progress
   * JSON chunks and error responses are buffered in memory because they're either tiny or
   * bounded, and the listener needs to parse them in full.
   */
  private inner class StreamingBundleChunkListener(
      private val url: String,
      private val outerStatus: Int,
      private val outputFile: File,
      private val tmpFile: File,
      private val bundleInfo: BundleInfo?,
      private val callback: DevBundleDownloadListener,
  ) : ChunkListener {

    private var bundleSink: BufferedSink? = null

    @Throws(IOException::class)
    override fun onChunkHeader(headers: Map<String, String>): BufferedSink? {
      if (!isJsBundleChunk(headers)) return null
      val effectiveStatus = effectiveStatus(headers)
      if (effectiveStatus != 200) return null
      // Stream the JS bundle straight to disk — never materialize in heap.
      val sink = Okio.buffer(Okio.sink(tmpFile))
      bundleSink = sink
      return sink
    }

    @Throws(IOException::class)
    override fun onChunkComplete(
        headers: Map<String, String>,
        body: Buffer?,
        isLastChunk: Boolean,
    ) {
      val sink = bundleSink
      if (sink != null) {
        bundleSink = null
        sink.close()
        finalizeStreamedBundle(headers)
        return
      }
      when {
        isJsBundleChunk(headers) -> {
          // Bundle returned with an error status — it was buffered so we can surface a useful
          // diagnostic to the developer.
          val buffered = body ?: Buffer()
          processBundleResult(
              url,
              effectiveStatus(headers),
              Headers.of(headers),
              buffered,
              outputFile,
              bundleInfo,
              callback,
          )
        }
        isProgressChunk(headers) -> dispatchProgressJson(body)
        else -> {
          // Unknown chunk type. Log so a future Metro change is visible in logcat instead of
          // silently stranding the dev loading view at 99%.
          FLog.w(TAG, "Ignoring multipart chunk with unrecognized Content-Type: ${headers["Content-Type"]}")
        }
      }
    }

    override fun onChunkProgress(
        headers: Map<String, String>,
        loaded: Long,
        total: Long,
    ) {
      if ("application/javascript" == headers["Content-Type"]) {
        callback.onProgress(
            "Downloading",
            (loaded / 1024).toInt(),
            (total / 1024).toInt(),
            null,
        )
      }
    }

    /** Make sure we never leak the tmp-file sink if [readAllParts] throws mid-stream. */
    fun closeOpenSinkQuietly() {
      val sink = bundleSink ?: return
      bundleSink = null
      try {
        sink.close()
      } catch (e: IOException) {
        FLog.w(TAG, "Failed to close partial bundle sink", e)
      }
    }

    @Throws(IOException::class)
    private fun finalizeStreamedBundle(headers: Map<String, String>) {
      if (bundleInfo != null) {
        populateBundleInfo(url, Headers.of(headers), bundleInfo)
      }
      if (!tmpFile.renameTo(outputFile)) {
        throw IOException("Couldn't rename $tmpFile to $outputFile")
      }
      callback.onSuccess()
    }

    private fun dispatchProgressJson(body: Buffer?) {
      val payload = body ?: return
      try {
        val progress = JSONObject(payload.readUtf8())
        val status =
            if (progress.has("status")) progress.getString("status") else "Bundling"
        val done = if (progress.has("done")) progress.getInt("done") else null
        val total = if (progress.has("total")) progress.getInt("total") else null
        val percent = if (progress.has("percent")) progress.getInt("percent") else null
        callback.onProgress(status, done, total, percent)
      } catch (e: JSONException) {
        FLog.e(ReactConstants.TAG, "Error parsing progress JSON. $e")
      }
    }

    private fun effectiveStatus(headers: Map<String, String>): Int =
        headers["X-Http-Status"]?.toIntOrNull() ?: outerStatus

    /**
     * Extract the media type (the part before `;`) from a Content-Type header, lower-cased.
     * Metro sends e.g. `application/javascript; charset=UTF-8`, so a bare-string equality
     * check would miss the bundle chunk and leave the dev loading view stranded.
     */
    private fun mediaType(headers: Map<String, String>): String? =
        headers["Content-Type"]?.substringBefore(';')?.trim()?.lowercase()

    private fun isJsBundleChunk(headers: Map<String, String>): Boolean =
        mediaType(headers) == "application/javascript"

    private fun isProgressChunk(headers: Map<String, String>): Boolean =
        mediaType(headers) == "application/json"
  }

  @Throws(IOException::class)
  private fun processBundleResult(
      url: String,
      statusCode: Int,
      headers: Headers,
      body: BufferedSource,
      outputFile: File,
      bundleInfo: BundleInfo?,
      callback: DevBundleDownloadListener,
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
