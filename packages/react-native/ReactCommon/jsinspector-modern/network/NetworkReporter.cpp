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
#include <folly/dynamic.h>
#include <jsinspector-modern/cdp/CdpJson.h>
#endif

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
#include <chrono>
#endif
#include <stdexcept>

namespace facebook::react::jsinspector_modern {

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
namespace {

/**
 * Get the current Unix timestamp in seconds (µs precision).
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
  return true;
}

void NetworkReporter::reportRequestStart(
    const std::string& requestId,
    const RequestInfo& requestInfo,
    int encodedDataLength,
    const std::optional<ResponseInfo>& redirectResponse) const {
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
    const std::string& /*requestId*/) const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  if (!isDebuggingEnabledNoSync()) {
    return;
  }

  // TODO(T218236597)
  throw std::runtime_error("Not implemented");
#endif
}

void NetworkReporter::reportRequestFailed(
    const std::string& /*requestId*/) const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  if (!isDebuggingEnabledNoSync()) {
    return;
  }

  // TODO(T218236855)
  throw std::runtime_error("Not implemented");
#endif
}

void NetworkReporter::reportResponseStart(
    const std::string& requestId,
    const ResponseInfo& responseInfo,
    int encodedDataLength) const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  if (!isDebuggingEnabledNoSync()) {
    return;
  }

  auto response =
      cdp::network::Response::fromInputParams(responseInfo, encodedDataLength);
  auto params = cdp::network::ResponseReceivedParams{
      .requestId = requestId,
      .loaderId = "",
      .timestamp = getCurrentUnixTimestampSeconds(),
      .type = cdp::network::resourceTypeFromMimeType(response.mimeType),
      .response = response,
      .hasExtraInfo = false,
  };

  frontendChannel_(
      cdp::jsonNotification("Network.responseReceived", params.toDynamic()));
#endif
}

void NetworkReporter::reportDataReceived(
    const std::string& /*requestId*/) const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  // Debug build: CDP event handling
  if (!isDebuggingEnabledNoSync()) {
    return;
  }

  // TODO(T218236266)
  throw std::runtime_error("Not implemented");
#endif
}

void NetworkReporter::reportResponseEnd(
    const std::string& requestId,
    int encodedDataLength) const {
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

} // namespace facebook::react::jsinspector_modern
