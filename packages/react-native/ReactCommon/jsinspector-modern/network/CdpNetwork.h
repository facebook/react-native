/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "NetworkTypes.h"

#include <folly/dynamic.h>

#include <string>

// Data containers for CDP Network domain types, supporting serialization to
// folly::dynamic objects.

namespace facebook::react::jsinspector_modern::cdp::network {

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-Request
 */
struct Request {
  std::string url;
  std::string method;
  std::optional<Headers> headers;
  std::optional<std::string> postData;

  /**
   * Convenience function to construct a `Request` from the generic
   * `RequestInfo` input object.
   */
  static Request fromInputParams(const RequestInfo& requestInfo);

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-Response
 */
struct Response {
  std::string url;
  uint16_t status;
  std::string statusText;
  std::optional<Headers> headers;
  std::string mimeType;
  int encodedDataLength;

  /**
   * Convenience function to construct a `Response` from the generic
   * `ResponseInfo` input object.
   */
  static Response fromInputParams(
      const ResponseInfo& responseInfo,
      int encodedDataLength);

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-requestWillBeSent
 */
struct RequestWillBeSentParams {
  std::string requestId;
  std::string loaderId;
  std::string documentURL;
  Request request;
  double timestamp;
  double wallTime;
  folly::dynamic initiator;
  bool redirectHasExtraInfo;
  std::optional<Response> redirectResponse;

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-responseReceived
 */
struct ResponseReceivedParams {
  std::string requestId;
  std::string loaderId;
  double timestamp;
  std::string type;
  Response response;
  bool hasExtraInfo;

  folly::dynamic toDynamic() const;
};

/**
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-loadingFinished
 */
struct LoadingFinishedParams {
  std::string requestId;
  double timestamp;
  int encodedDataLength;

  folly::dynamic toDynamic() const;
};

/**
 * Get the CDP `ResourceType` for a given MIME type.
 *
 * https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-ResourceType
 */
std::string resourceTypeFromMimeType(const std::string& mimeType);

} // namespace facebook::react::jsinspector_modern::cdp::network
