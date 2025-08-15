/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NetworkReporter.h"

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
#include "CdpNetwork.h"
#endif

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
#include <jsinspector-modern/cdp/CdpJson.h>
#endif
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/performance/timeline/PerformanceEntryReporter.h>

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
#include <chrono>
#endif
#include <glog/logging.h>
#include <stdexcept>

namespace facebook::react::jsinspector_modern {

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
namespace {

/**
 * Get the current Unix timestamp in seconds (µs precision, CDP format).
 */
double getCurrentUnixTimestampSeconds() {
  auto now = std::chrono::system_clock::now().time_since_epoch();
  auto seconds = std::chrono::duration_cast<std::chrono::seconds>(now).count();
  auto micros =
      std::chrono::duration_cast<std::chrono::microseconds>(now).count() %
      1000000;

  return static_cast<double>(seconds) +
      (static_cast<double>(micros) / 1000000.0);
}

} // namespace
#endif

NetworkReporter& NetworkReporter::getInstance() {
  static NetworkReporter instance;
  return instance;
}

void NetworkReporter::setFrontendChannel(FrontendChannel frontendChannel) {
  frontendChannel_ = std::move(frontendChannel);
}

bool NetworkReporter::enableDebugging() {
  if (debuggingEnabled_.load(std::memory_order_acquire)) {
    return false;
  }

  debuggingEnabled_.store(true, std::memory_order_release);
  return true;
}

bool NetworkReporter::disableDebugging() {
  if (!debuggingEnabled_.load(std::memory_order_acquire)) {
    return false;
  }

  debuggingEnabled_.store(false, std::memory_order_release);
  requestBodyBuffer_.clear();
  return true;
}

void NetworkReporter::reportRequestStart(
    const std::string& requestId,
    const RequestInfo& requestInfo,
    int encodedDataLength,
    const std::optional<ResponseInfo>& redirectResponse) {
  if (ReactNativeFeatureFlags::enableResourceTimingAPI()) {
    auto now = HighResTimeStamp::now();

    // All builds: Annotate PerformanceResourceTiming metadata
    {
      std::lock_guard<std::mutex> lock(perfTimingsMutex_);
      perfTimingsBuffer_.emplace(
          requestId,
          ResourceTimingData{
              .url = requestInfo.url,
              .fetchStart = now,
              .requestStart = now,
          });
    }
  }

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  if (!isDebuggingEnabledNoSync()) {
    return;
  }

  double timestamp = getCurrentUnixTimestampSeconds();
  auto request = cdp::network::Request::fromInputParams(requestInfo);
  auto params = cdp::network::RequestWillBeSentParams{
      .requestId = requestId,
      .loaderId = "",
      .documentURL = "mobile",
      .request = std::move(request),
      // NOTE: Both timestamp and wallTime use the same unit, however wallTime
      // is relative to an "arbitrary epoch". In our implementation, use the
      // Unix epoch for both.
      .timestamp = timestamp,
      .wallTime = timestamp,
      .initiator = folly::dynamic::object("type", "script"),
      .redirectHasExtraInfo = redirectResponse.has_value(),
  };

  if (redirectResponse.has_value()) {
    params.redirectResponse = cdp::network::Response::fromInputParams(
        redirectResponse.value(), encodedDataLength);
  }

  frontendChannel_(
      cdp::jsonNotification("Network.requestWillBeSent", params.toDynamic()));
#endif
}

void NetworkReporter::reportConnectionTiming(
    const std::string& requestId,
    const std::optional<Headers>& headers) {
  if (ReactNativeFeatureFlags::enableResourceTimingAPI()) {
    auto now = HighResTimeStamp::now();

    // All builds: Annotate PerformanceResourceTiming metadata
    {
      std::lock_guard<std::mutex> lock(perfTimingsMutex_);
      auto it = perfTimingsBuffer_.find(requestId);
      if (it != perfTimingsBuffer_.end()) {
        it->second.connectStart = now;
      }
    }
  }

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  if (!isDebuggingEnabledNoSync()) {
    return;
  }

  auto params = cdp::network::RequestWillBeSentExtraInfoParams{
      .requestId = requestId,
      .headers = headers.value_or(Headers{}),
      .connectTiming = {.requestTime = getCurrentUnixTimestampSeconds()},
  };

  frontendChannel_(cdp::jsonNotification(
      "Network.requestWillBeSentExtraInfo", params.toDynamic()));
#endif
}

void NetworkReporter::reportResponseStart(
    const std::string& requestId,
    const ResponseInfo& responseInfo,
    int encodedDataLength) {
  if (ReactNativeFeatureFlags::enableResourceTimingAPI()) {
    auto now = HighResTimeStamp::now();

    // All builds: Annotate PerformanceResourceTiming metadata
    {
      std::lock_guard<std::mutex> lock(perfTimingsMutex_);
      auto it = perfTimingsBuffer_.find(requestId);
      if (it != perfTimingsBuffer_.end()) {
        it->second.connectEnd = now;
        it->second.responseStart = now;
        it->second.responseStatus = responseInfo.statusCode;
      }
    }
  }

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  if (!isDebuggingEnabledNoSync()) {
    return;
  }

  auto response =
      cdp::network::Response::fromInputParams(responseInfo, encodedDataLength);
  auto resourceType = cdp::network::resourceTypeFromMimeType(response.mimeType);
  resourceTypeMap_.emplace(requestId, resourceType);

  auto params = cdp::network::ResponseReceivedParams{
      .requestId = requestId,
      .loaderId = "",
      .timestamp = getCurrentUnixTimestampSeconds(),
      .type = resourceType,
      .response = response,
      .hasExtraInfo = false,
  };

  frontendChannel_(
      cdp::jsonNotification("Network.responseReceived", params.toDynamic()));
#endif
}

void NetworkReporter::reportDataReceived(
    const std::string& requestId,
    int dataLength,
    const std::optional<int>& encodedDataLength) {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  if (!isDebuggingEnabledNoSync()) {
    return;
  }

  auto params = cdp::network::DataReceivedParams{
      .requestId = requestId,
      .timestamp = getCurrentUnixTimestampSeconds(),
      .dataLength = dataLength,
      .encodedDataLength = encodedDataLength.value_or(dataLength),
  };

  frontendChannel_(
      cdp::jsonNotification("Network.dataReceived", params.toDynamic()));
#endif
}

void NetworkReporter::reportResponseEnd(
    const std::string& requestId,
    int encodedDataLength) {
  if (ReactNativeFeatureFlags::enableResourceTimingAPI()) {
    auto now = HighResTimeStamp::now();

    // All builds: Report PerformanceResourceTiming event
    {
      std::lock_guard<std::mutex> lock(perfTimingsMutex_);
      auto it = perfTimingsBuffer_.find(requestId);
      if (it != perfTimingsBuffer_.end()) {
        auto& eventData = it->second;
        PerformanceEntryReporter::getInstance()->reportResourceTiming(
            eventData.url,
            eventData.fetchStart,
            eventData.requestStart,
            eventData.connectStart.value_or(now),
            eventData.connectEnd.value_or(now),
            eventData.responseStart.value_or(now),
            now,
            eventData.responseStatus);
        perfTimingsBuffer_.erase(requestId);
      }
    }
  }

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  if (!isDebuggingEnabledNoSync()) {
    return;
  }

  auto params = cdp::network::LoadingFinishedParams{
      .requestId = requestId,
      .timestamp = getCurrentUnixTimestampSeconds(),
      .encodedDataLength = encodedDataLength,
  };

  frontendChannel_(
      cdp::jsonNotification("Network.loadingFinished", params.toDynamic()));
#endif
}

void NetworkReporter::reportRequestFailed(
    const std::string& requestId,
    bool cancelled) const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  if (!isDebuggingEnabledNoSync()) {
    return;
  }

  auto params = cdp::network::LoadingFailedParams{
      .requestId = requestId,
      .timestamp = getCurrentUnixTimestampSeconds(),
      .type = resourceTypeMap_.find(requestId) != resourceTypeMap_.end()
          ? resourceTypeMap_.at(requestId)
          : "Other",
      .errorText = cancelled ? "net::ERR_ABORTED" : "net::ERR_FAILED",
      .canceled = cancelled,
  };

  frontendChannel_(
      cdp::jsonNotification("Network.loadingFailed", params.toDynamic()));
#endif
}

void NetworkReporter::storeResponseBody(
    const std::string& requestId,
    std::string_view body,
    bool base64Encoded) {
  std::lock_guard<std::mutex> lock(requestBodyMutex_);
  requestBodyBuffer_.put(requestId, body, base64Encoded);
}

std::optional<std::tuple<std::string, bool>> NetworkReporter::getResponseBody(
    const std::string& requestId) {
  std::lock_guard<std::mutex> lock(requestBodyMutex_);
  auto responseBody = requestBodyBuffer_.get(requestId);

  if (responseBody == nullptr) {
    return std::nullopt;
  }

  return std::make_optional<std::tuple<std::string, bool>>(
      responseBody->data, responseBody->base64Encoded);
}

} // namespace facebook::react::jsinspector_modern
