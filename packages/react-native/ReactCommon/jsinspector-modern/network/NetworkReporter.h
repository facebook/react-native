/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "BoundedRequestBuffer.h"
#include "NetworkTypes.h"

#include <folly/dynamic.h>
#include <react/timing/primitives.h>

#include <atomic>
#include <functional>
#include <mutex>
#include <string>
#include <tuple>
#include <unordered_map>

namespace facebook::react::jsinspector_modern {

/**
 * A callback that can be used to send debugger messages (method responses and
 * events) to the frontend. The message must be a JSON-encoded string.
 * The callback may be called from any thread.
 */
using FrontendChannel = std::function<void(std::string_view messageJson)>;

/**
 * Container for static network event metadata aligning with the
 * `PerformanceResourceTiming` interface.
 *
 * This is a lightweight type stored in `perfTimingsBuffer_` and used for
 * reporting complete events to the Web Performance subsystem. Not used for CDP
 * reporting.
 */
struct ResourceTimingData {
  std::string url;
  HighResTimeStamp fetchStart;
  HighResTimeStamp requestStart;
  std::optional<HighResTimeStamp> connectStart;
  std::optional<HighResTimeStamp> connectEnd;
  std::optional<HighResTimeStamp> responseStart;
  std::optional<int> responseStatus;
};

/**
 * [Experimental] An interface for reporting network events to the modern
 * debugger server and Web Performance APIs.
 *
 * In a production (non dev or profiling) build, CDP reporting is disabled.
 */
class NetworkReporter {
 public:
  static NetworkReporter& getInstance();

  /**
   * Set the channel used to send CDP events to the frontend. This should be
   * supplied before calling `enableDebugging`.
   */
  void setFrontendChannel(FrontendChannel frontendChannel);

  /**
   * Enable network tracking over CDP. Once enabled, network events will be
   * sent to the debugger client. Returns `false` if already enabled.
   *
   * Corresponds to `Network.enable` in CDP.
   */
  bool enableDebugging();

  /**
   * Disable network tracking over CDP, preventing network events from being
   * sent to the debugger client. Returns `false` if not initially enabled.
   *
   * Corresponds to `Network.disable` in CDP.
   */
  bool disableDebugging();

  /**
   * Returns whether network tracking over CDP is currently enabled.
   */
  inline bool isDebuggingEnabled() const {
    return debuggingEnabled_.load(std::memory_order_acquire);
  }

  /**
   * Report a network request that is about to be sent.
   *
   * - Corresponds to `Network.requestWillBeSent` in CDP.
   * - Corresponds to `PerformanceResourceTiming.requestStart` (specifically,
   *   marking when the native request was initiated).
   *
   * https://w3c.github.io/resource-timing/#dom-performanceresourcetiming-requeststart
   */
  void reportRequestStart(
      const std::string& requestId,
      const RequestInfo& requestInfo,
      int encodedDataLength,
      const std::optional<ResponseInfo>& redirectResponse);

  /**
   * Report timestamp for sending the network request, and (in a debug build)
   * provide final headers to be reported via CDP.
   *
   * - Corresponds to `Network.requestWillBeSentExtraInfo` in CDP.
   * - Corresponds to `PerformanceResourceTiming.domainLookupStart`,
   *   `PerformanceResourceTiming.connectStart`. Defined as "immediately before
   *   the browser starts to establish the connection to the server".
   *
   * https://w3c.github.io/resource-timing/#dom-performanceresourcetiming-connectstart
   */
  void reportConnectionTiming(
      const std::string& requestId,
      const std::optional<Headers>& headers);

  /**
   * Report when HTTP response headers have been received, corresponding to
   * when the first byte of the response is available.
   *
   * - Corresponds to `Network.responseReceived` in CDP.
   * - Corresponds to `PerformanceResourceTiming.responseStart`.
   *
   * https://w3c.github.io/resource-timing/#dom-performanceresourcetiming-responsestart
   */
  void reportResponseStart(
      const std::string& requestId,
      const ResponseInfo& responseInfo,
      int encodedDataLength);

  /**
   * Report when additional chunks of the response body have been received.
   *
   * Corresponds to `Network.dataReceived` in CDP (used for progress bar
   * rendering).
   */
  void reportDataReceived(
      const std::string& requestId,
      int dataLength,
      const std::optional<int>& encodedDataLength);

  /**
   * Report when a network request is complete and we are no longer receiving
   * response data.
   *
   * - Corresponds to `Network.loadingFinished` in CDP.
   * - Corresponds to `PerformanceResourceTiming.responseEnd`.
   *
   * https://w3c.github.io/resource-timing/#dom-performanceresourcetiming-responseend
   */
  void reportResponseEnd(const std::string& requestId, int encodedDataLength);

  /**
   * Report when a network request has failed.
   *
   * Corresponds to `Network.loadingFailed` in CDP.
   */
  void reportRequestFailed(const std::string& requestId, bool cancelled) const;

  /**
   * Store the fetched response body for a text or image network response.
   * These may be retrieved by CDP clients to to render a response preview via
   * `Network.getReponseBody`.
   *
   * Reponse bodies are stored in a bounded buffer with a fixed maximum memory
   * size, where oldest responses will be evicted if the buffer is exceeded.
   *
   * Should be called after checking \ref NetworkReporter::isDebuggingEnabled.
   */
  void storeResponseBody(
      const std::string& requestId,
      std::string_view body,
      bool base64Encoded);

  /**
   * Retrieve a stored response body for a given request ID.
   *
   * \returns An optional tuple of [responseBody, base64Encoded]. Returns
   * nullopt if no entry is found in the buffer.
   */
  std::optional<std::tuple<std::string, bool>> getResponseBody(
      const std::string& requestId);

 private:
  NetworkReporter() = default;
  NetworkReporter(const NetworkReporter&) = delete;
  NetworkReporter& operator=(const NetworkReporter&) = delete;
  ~NetworkReporter() = default;

  std::atomic<bool> debuggingEnabled_{false};

  inline bool isDebuggingEnabledNoSync() const {
    return debuggingEnabled_.load(std::memory_order_relaxed);
  }

  FrontendChannel frontendChannel_;

  std::unordered_map<std::string, ResourceTimingData> perfTimingsBuffer_{};
  std::mutex perfTimingsMutex_;

  // Only populated when CDP debugging is enabled.
  std::map<std::string, std::string> resourceTypeMap_{};

  // Only populated when CDP debugging is enabled.
  BoundedRequestBuffer requestBodyBuffer_{};
  std::mutex requestBodyMutex_;
};

} // namespace facebook::react::jsinspector_modern
