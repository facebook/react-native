/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NetworkReporter.h"

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
#include <jsinspector-modern/network/CdpNetwork.h>
#include <jsinspector-modern/network/HttpUtils.h>
#include <jsinspector-modern/network/NetworkHandler.h>
#endif
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/performance/timeline/PerformanceEntryReporter.h>

namespace facebook::react {

NetworkReporter& NetworkReporter::getInstance() {
  static NetworkReporter instance;
  return instance;
}

bool NetworkReporter::isDebuggingEnabled() const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  return jsinspector_modern::NetworkHandler::getInstance().isEnabled();
#else
  return false;
#endif
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
              .requestMethod = requestInfo.httpMethod,
              .fetchStart = now,
              .requestStart = now,
          });
    }
  }

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance().onRequestWillBeSent(
      requestId,
      {
          .url = requestInfo.url,
          .method = requestInfo.httpMethod,
          .headers = requestInfo.headers,
          .postData = requestInfo.httpBody,
      },
      redirectResponse.has_value()
          ? std::optional<jsinspector_modern::cdp::network::Response>(
                jsinspector_modern::cdp::network::Response::fromInputParams(
                    redirectResponse->url,
                    redirectResponse->statusCode,
                    redirectResponse->headers,
                    encodedDataLength))
          : std::nullopt);
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
  jsinspector_modern::NetworkHandler::getInstance()
      .onRequestWillBeSentExtraInfo(requestId, headers.value_or(Headers{}));
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
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
        // Debug build: Compute additional fields to send in CDP trace events
        it->second.resourceType =
            jsinspector_modern::cdp::network::resourceTypeFromMimeType(
                jsinspector_modern::mimeTypeFromHeaders(
                    responseInfo.headers.value_or(Headers{})));
#endif
      }
    }
  }

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance().onResponseReceived(
      requestId,
      jsinspector_modern::cdp::network::Response::fromInputParams(
          responseInfo.url,
          responseInfo.statusCode,
          responseInfo.headers,
          encodedDataLength));
#endif
}

void NetworkReporter::reportDataReceived(
    const std::string& requestId,
    int dataLength,
    const std::optional<int>& encodedDataLength) {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance().onDataReceived(
      requestId, dataLength, encodedDataLength.value_or(dataLength));
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
            eventData.responseStatus,
            requestId,
            eventData.requestMethod,
            eventData.resourceType);
        perfTimingsBuffer_.erase(requestId);
      }
    }
  }

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance().onLoadingFinished(
      requestId, encodedDataLength);
#endif
}

void NetworkReporter::reportRequestFailed(
    const std::string& requestId,
    bool cancelled) const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  jsinspector_modern::NetworkHandler::getInstance().onLoadingFailed(
      requestId, cancelled);
#endif
}

void NetworkReporter::storeResponseBody(
    const std::string& requestId,
    std::string_view body,
    bool base64Encoded) {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: Store fetched response body for later CDP retrieval
  jsinspector_modern::NetworkHandler::getInstance().storeResponseBody(
      requestId, body, base64Encoded);
#endif
}

} // namespace facebook::react
