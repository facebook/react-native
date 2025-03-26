/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NetworkReporter.h"

#include <glog/logging.h>
#include <jsinspector-modern/cdp/CdpJson.h>

#include <stdexcept>

namespace facebook::react::jsinspector_modern {

namespace {

/**
 * Get the CDP `ResourceType` for a given MIME type.
 *
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-ResourceType
 */
std::string mimeTypeToResourceType(const std::string& mimeType) {
  if (mimeType.find("image/") == 0) {
    return "Image";
  }

  if (mimeType.find("video/") == 0 || mimeType.find("audio/") == 0) {
    return "Media";
  }

  if (mimeType == "application/javascript" || mimeType == "text/javascript" ||
      mimeType == "application/x-javascript") {
    return "Script";
  }

  if (mimeType == "application/json" || mimeType.find("application/xml") == 0 ||
      mimeType == "text/xml") {
    // Assume XHR for JSON/XML types
    return "XHR";
  }

  return "Other";
}

folly::dynamic headersToDynamic(const std::optional<Headers>& headers) {
  folly::dynamic result = folly::dynamic::object;

  if (headers) {
    for (const auto& [key, value] : *headers) {
      result[key] = value;
    }
  }

  return result;
}

folly::dynamic requestToCdpParams(const RequestInfo& request) {
  folly::dynamic result = folly::dynamic::object;
  result["url"] = request.url;
  result["method"] = request.httpMethod;
  result["headers"] = headersToDynamic(request.headers);
  result["postData"] = request.httpBody.value();

  return result;
}

folly::dynamic responseToCdpParams(
    const ResponseInfo& response,
    int encodedDataLength) {
  auto headers = response.headers.value_or(Headers());
  std::string mimeType = "Other";

  if (headers.find("Content-Type") != headers.end()) {
    mimeType = mimeTypeToResourceType(headers.at("Content-Type"));
  }

  folly::dynamic result = folly::dynamic::object;
  result["url"] = response.url;
  result["status"] = response.statusCode;
  result["statusText"] = "";
  result["headers"] = headersToDynamic(response.headers);
  result["mimeType"] = mimeType;
  result["encodedDataLength"] = encodedDataLength;

  return result;
}

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
  frontendChannel_ = std::move(frontendChannel);
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
    const std::optional<ResponseInfo>& redirectResponse) {
  if (!debuggingEnabled_.load(std::memory_order_relaxed)) {
    return;
  }

  double timestamp = getCurrentUnixTimestampSeconds();

  folly::dynamic params = folly::dynamic::object;
  params["requestId"] = requestId;
  params["loaderId"] = "";
  params["documentURL"] = "mobile";
  params["request"] = requestToCdpParams(requestInfo);
  // NOTE: timestamp and wallTime share the same time unit and precision,
  // except wallTime is from an arbitrary epoch - use the Unix epoch for both.
  params["timestamp"] = timestamp;
  params["wallTime"] = timestamp;
  params["initiator"] = folly::dynamic::object("type", "script");
  params["redirectHasExtraInfo"] = redirectResponse.has_value();
  if (redirectResponse.has_value()) {
    params["redirectResponse"] =
        responseToCdpParams(redirectResponse.value(), encodedDataLength);
  }

  frontendChannel_(cdp::jsonNotification("Network.requestWillBeSent", params));
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

  folly::dynamic responseParams =
      responseToCdpParams(responseInfo, encodedDataLength);

  folly::dynamic params = folly::dynamic::object;
  params["requestId"] = requestId;
  params["loaderId"] = "";
  params["timestamp"] = getCurrentUnixTimestampSeconds();
  params["type"] = responseParams["mimeType"];
  params["response"] = responseParams;
  params["hasExtraInfo"] = false;

  frontendChannel_(cdp::jsonNotification("Network.responseReceived", params));
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

  folly::dynamic params = folly::dynamic::object;
  params["requestId"] = requestId;
  params["timestamp"] = getCurrentUnixTimestampSeconds();
  params["encodedDataLength"] = encodedDataLength;

  frontendChannel_(cdp::jsonNotification("Network.loadingFinished", params));
}

} // namespace facebook::react::jsinspector_modern
