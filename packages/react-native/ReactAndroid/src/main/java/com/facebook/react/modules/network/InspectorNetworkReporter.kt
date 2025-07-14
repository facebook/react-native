/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import com.facebook.proguard.annotations.DoNotStripAny

/**
 * [Experimental] An interface for reporting network events to the modern debugger server and Web
 * Performance APIs.
 *
 * In a production (non dev or profiling) build, CDP reporting is disabled.
 *
 * This is a helper class wrapping `facebook::react::jsinspector_modern::NetworkReporter`.
 */
@DoNotStripAny
internal object InspectorNetworkReporter {
  /**
   * Report a network request that is about to be sent.
   * - Corresponds to `Network.requestWillBeSent` in CDP.
   * - Corresponds to `PerformanceResourceTiming.requestStart` (specifically, marking when the
   *   native request was initiated).
   */
  @JvmStatic
  external fun reportRequestStart(
      requestId: Int,
      requestUrl: String,
      requestMethod: String,
      requestHeaders: Map<String, String>,
      requestBody: String,
      encodedDataLength: Long
  )

  /**
   * Report detailed timing info, such as DNS lookup, when a request has started.
   * - Corresponds to `Network.requestWillBeSentExtraInfo` in CDP.
   * - Corresponds to `PerformanceResourceTiming.domainLookupStart`,
   *   `PerformanceResourceTiming.connectStart`.
   */
  @JvmStatic external fun reportConnectionTiming(requestId: Int, headers: Map<String, String>)

  /**
   * Report when HTTP response headers have been received, corresponding to when the first byte of
   * the response is available.
   * - Corresponds to `Network.responseReceived` in CDP.
   * - Corresponds to `PerformanceResourceTiming.responseStart`.
   */
  @JvmStatic
  external fun reportResponseStart(
      requestId: Int,
      requestUrl: String,
      responseStatus: Int,
      responseHeaders: Map<String, String>,
      expectedDataLength: Long
  )

  /**
   * Report when a network request is complete and we are no longer receiving response data.
   * - Corresponds to `Network.loadingFinished` in CDP.
   * - Corresponds to `PerformanceResourceTiming.responseEnd`.
   */
  @JvmStatic external fun reportResponseEnd(requestId: Int, encodedDataLength: Long)

  /**
   * Store response body preview. This is an optional reporting method, and is a no-op if CDP
   * debugging is disabled.
   */
  @JvmStatic
  external fun maybeStoreResponseBody(requestId: Int, body: String, base64Encoded: Boolean)
}
