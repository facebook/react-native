/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <atomic>
#include <functional>
#include <map>
#include <optional>
#include <string>

namespace facebook::react::jsinspector_modern {

/**
 * A callback that can be used to send debugger messages (method responses and
 * events) to the frontend. The message must be a JSON-encoded string.
 * The callback may be called from any thread.
 */
using FrontendChannel = std::function<void(std::string_view messageJson)>;

using Headers = std::map<std::string, std::string>;

/**
 * Request info from the request caller.
 */
struct RequestInfo {
  std::string url;
  std::string httpMethod;
  std::optional<Headers> headers;
  std::optional<std::string> httpBody;
};

/**
 * Response info from the request caller.
 */
struct ResponseInfo {
  std::string url;
  uint16_t statusCode;
  std::optional<Headers> headers;
};

/**
 * [Experimental] An interface for reporting network events to the modern
 * debugger server and Web Performance APIs.
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
   * Report detailed timing info, such as DNS lookup, when a request has
   * started.
   *
   * - Corresponds to `Network.requestWillBeSentExtraInfo` in CDP.
   * - Corresponds to `PerformanceResourceTiming.domainLookupStart`,
   * `PerformanceResourceTiming.connectStart`.
   *
   * https://w3c.github.io/resource-timing/#dom-performanceresourcetiming-connectstart
   */
  void reportConnectionTiming(const std::string& requestId);

  /**
   * Report when a network request has failed.
   *
   * Corresponds to `Network.loadingFailed` in CDP.
   */
  void reportRequestFailed(const std::string& requestId);

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
   * Corresponds to `Network.dataReceived` in CDP.
   */
  void reportDataReceived(const std::string& requestId);

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

 private:
  FrontendChannel frontendChannel_;

  NetworkReporter() = default;
  NetworkReporter(const NetworkReporter&) = delete;
  NetworkReporter& operator=(const NetworkReporter&) = delete;
  ~NetworkReporter() = default;

  std::atomic<bool> debuggingEnabled_{false};
};

} // namespace facebook::react::jsinspector_modern
