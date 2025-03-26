/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CdpNetwork.h"

#include "HttpUtils.h"

namespace facebook::react::jsinspector_modern::cdp::network {

namespace {

folly::dynamic headersToDynamic(const std::optional<Headers>& headers) {
  folly::dynamic result = folly::dynamic::object;

  if (headers) {
    for (const auto& [key, value] : *headers) {
      result[key] = value;
    }
  }

  return result;
}

} // namespace

/* static */ Request Request::fromInputParams(const RequestInfo& requestInfo) {
  return {
      .url = requestInfo.url,
      .method = requestInfo.httpMethod,
      .headers = requestInfo.headers,
      .postData = requestInfo.httpBody,
  };
}

folly::dynamic Request::toDynamic() const {
  folly::dynamic result = folly::dynamic::object;

  result["url"] = url;
  result["method"] = method;
  result["headers"] = headersToDynamic(headers);
  result["postData"] = postData.value_or("");

  return result;
}

/* static */ Response Response::fromInputParams(
    const ResponseInfo& responseInfo,
    int encodedDataLength) {
  auto headers = responseInfo.headers.value_or(Headers());

  return {
      .url = responseInfo.url,
      .status = responseInfo.statusCode,
      .statusText = httpReasonPhrase(responseInfo.statusCode),
      .headers = headers,
      .mimeType = mimeTypeFromHeaders(headers),
      .encodedDataLength = encodedDataLength,
  };
}

folly::dynamic Response::toDynamic() const {
  folly::dynamic result = folly::dynamic::object;

  result["url"] = url;
  result["status"] = status;
  result["statusText"] = statusText;
  result["headers"] = headersToDynamic(headers);
  result["mimeType"] = mimeType;
  result["encodedDataLength"] = encodedDataLength;

  return result;
}

folly::dynamic RequestWillBeSentParams::toDynamic() const {
  folly::dynamic params = folly::dynamic::object;

  params["requestId"] = requestId;
  params["loaderId"] = loaderId;
  params["documentURL"] = documentURL;
  params["request"] = request.toDynamic();
  params["timestamp"] = timestamp;
  params["wallTime"] = wallTime;
  params["initiator"] = initiator;
  params["redirectHasExtraInfo"] = redirectResponse.has_value();

  if (redirectResponse.has_value()) {
    params["redirectResponse"] = redirectResponse->toDynamic();
  }

  return params;
}

folly::dynamic ResponseReceivedParams::toDynamic() const {
  folly::dynamic params = folly::dynamic::object;

  params["requestId"] = requestId;
  params["loaderId"] = loaderId;
  params["timestamp"] = timestamp;
  params["type"] = type;
  params["response"] = response.toDynamic();
  params["hasExtraInfo"] = hasExtraInfo;

  return params;
}

folly::dynamic LoadingFinishedParams::toDynamic() const {
  folly::dynamic params = folly::dynamic::object;

  params["requestId"] = requestId;
  params["timestamp"] = timestamp;
  params["encodedDataLength"] = encodedDataLength;

  return params;
}

std::string resourceTypeFromMimeType(const std::string& mimeType) {
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

} // namespace facebook::react::jsinspector_modern::cdp::network
