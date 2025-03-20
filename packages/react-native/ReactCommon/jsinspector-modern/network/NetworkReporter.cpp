/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NetworkReporter.h"

#include "CdpNetwork.h"

#include <folly/dynamic.h>
#include <glog/logging.h>
#include <jsinspector-modern/cdp/CdpJson.h>

#include <stdexcept>

namespace facebook::react::jsinspector_modern {

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

NetworkReporter& NetworkReporter::getInstance() {
  static NetworkReporter tracer;
  return tracer;
}

void NetworkReporter::setFrontendChannel(FrontendChannel frontendChannel) {
  frontendChannel_ = frontendChannel;
}

bool NetworkReporter::enableDebugging() {
  if (debuggingEnabled_.load(std::memory_order_acquire)) {
    return false;
  }

  debuggingEnabled_.store(true, std::memory_order_release);
  LOG(INFO) << "Network debugging enabled" << std::endl;
  return true;
}

bool NetworkReporter::disableDebugging() {
  if (!debuggingEnabled_.load(std::memory_order_acquire)) {
    return false;
  }

  debuggingEnabled_.store(false, std::memory_order_release);
  LOG(INFO) << "Network debugging disabled" << std::endl;
  return true;
}

void NetworkReporter::reportRequestStart(
    const std::string& requestId,
    const RequestInfo& requestInfo,
    int encodedDataLength,
    const std::optional<ResponseInfo> redirectResponse) {
  if (!debuggingEnabled_.load(std::memory_order_relaxed)) {
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
}

void NetworkReporter::reportConnectionTiming(const std::string& /*requestId*/) {
  if (!debuggingEnabled_.load(std::memory_order_relaxed)) {
    return;
  }

  // TODO(T218236597)
  throw std::runtime_error("Not implemented");
}

void NetworkReporter::reportRequestFailed(const std::string& /*requestId*/) {
  if (!debuggingEnabled_.load(std::memory_order_relaxed)) {
    return;
  }

  // TODO(T218236855)
  throw std::runtime_error("Not implemented");
}

void NetworkReporter::reportResponseStart(
    const std::string& requestId,
    const ResponseInfo& responseInfo,
    int encodedDataLength) {
  if (!debuggingEnabled_.load(std::memory_order_relaxed)) {
    return;
  }

  auto response =
      cdp::network::Response::fromInputParams(responseInfo, encodedDataLength);
  auto params = cdp::network::ResponseReceivedParams{
      .requestId = requestId,
      .loaderId = "",
      .timestamp = getCurrentUnixTimestampSeconds(),
      .type = cdp::network::resourceTypeFromMimeType(response.mimeType),
      .response = std::move(response),
      .hasExtraInfo = false,
  };

  frontendChannel_(
      cdp::jsonNotification("Network.responseReceived", params.toDynamic()));
}

void NetworkReporter::reportDataReceived(const std::string& /*requestId*/) {
  if (!debuggingEnabled_.load(std::memory_order_relaxed)) {
    return;
  }

  // TODO(T218236266)
  throw std::runtime_error("Not implemented");
}

void NetworkReporter::reportResponseEnd(
    const std::string& requestId,
    int encodedDataLength) {
  if (!debuggingEnabled_.load(std::memory_order_relaxed)) {
    return;
  }

  auto params = cdp::network::LoadingFinishedParams{
      .requestId = requestId,
      .timestamp = getCurrentUnixTimestampSeconds(),
      .encodedDataLength = encodedDataLength,
  };

  frontendChannel_(
      cdp::jsonNotification("Network.loadingFinished", params.toDynamic()));
}

} // namespace facebook::react::jsinspector_modern
